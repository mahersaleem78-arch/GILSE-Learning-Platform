/* Bolt #6 hardening: lock referral attribution and enforce paid-course enrollment at DB level. */

-- Referral attribution is fixed when the student account is created.
-- Payment creation must never accept a referral code supplied by the browser.
CREATE OR REPLACE FUNCTION prepare_payment_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c record;
  cfg record;
  ref_code text;
BEGIN
  SELECT price, currency
    INTO c
    FROM courses
   WHERE id = NEW.course_id
     AND status = 'published';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course is not available for payment.';
  END IF;

  SELECT *
    INTO cfg
    FROM payment_config
   WHERE active = true
   ORDER BY updated_at DESC
   LIMIT 1;

  IF NOT FOUND OR cfg.wallet_address LIKE 'CONFIGURE_%' THEN
    RAISE EXCEPTION 'Payment wallet is not configured.';
  END IF;

  SELECT p.referral_code
    INTO ref_code
    FROM profiles p
   WHERE p.id = NEW.student_id;

  NEW.amount := c.price;
  NEW.currency := COALESCE(c.currency, 'USD');
  NEW.asset := cfg.asset;
  NEW.network := cfg.network;
  NEW.wallet_address := cfg.wallet_address;
  NEW.referral_code := ref_code;
  NEW.status := 'pending';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payments_prepare_insert ON payments;
CREATE TRIGGER payments_prepare_insert
BEFORE INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION prepare_payment_insert();

-- Referral attribution cannot be changed after account creation.
CREATE OR REPLACE FUNCTION prevent_referral_attribution_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
    RAISE EXCEPTION 'Referral attribution cannot be changed after signup.';
  END IF;

  IF NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
    RAISE EXCEPTION 'Referral code cannot be changed after signup.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_referral_change ON profiles;
CREATE TRIGGER profiles_prevent_referral_change
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_referral_attribution_change();

-- Explicit database-level self-referral guard.
CREATE OR REPLACE FUNCTION prevent_self_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL AND NEW.referred_by = NEW.id THEN
    RAISE EXCEPTION 'Self-referral is not allowed.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_self_referral ON profiles;
CREATE TRIGGER profiles_prevent_self_referral
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION prevent_self_referral();

-- A payment may only be verified for the same student/course and its referral
-- attribution must already be fixed on the payment record.
CREATE OR REPLACE FUNCTION prevent_payment_referral_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
    RAISE EXCEPTION 'Payment referral attribution cannot be changed.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payments_prevent_referral_mutation ON payments;
CREATE TRIGGER payments_prevent_referral_mutation
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION prevent_payment_referral_mutation();

-- Defense in depth: even privileged database paths cannot create an enrollment
-- for a paid course unless a verified payment exists. Free courses remain free.
CREATE OR REPLACE FUNCTION enforce_paid_course_enrollment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  course_price numeric;
  has_verified_payment boolean;
BEGIN
  SELECT price INTO course_price FROM courses WHERE id = NEW.course_id;

  IF course_price IS NULL THEN
    RAISE EXCEPTION 'Course not found.';
  END IF;

  IF course_price <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM payments p
     WHERE p.student_id = NEW.student_id
       AND p.course_id = NEW.course_id
       AND p.status = 'verified'
  ) INTO has_verified_payment;

  IF NOT has_verified_payment THEN
    RAISE EXCEPTION 'A verified payment is required before enrolling in this paid course.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enrollments_require_verified_payment ON enrollments;
CREATE TRIGGER enrollments_require_verified_payment
BEFORE INSERT OR UPDATE ON enrollments
FOR EACH ROW
EXECUTE FUNCTION enforce_paid_course_enrollment();

-- Helpful integrity index for the normal paid-course lookup path.
CREATE INDEX IF NOT EXISTS idx_payments_verified_student_course
  ON payments(student_id, course_id)
  WHERE status = 'verified';
