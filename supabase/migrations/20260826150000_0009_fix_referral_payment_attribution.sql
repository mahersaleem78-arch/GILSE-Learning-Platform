/* Bolt #6 follow-up: payments must inherit the referrer's code from immutable signup attribution. */

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

  -- The student never supplies the referral code at payment time.
  -- Resolve it only from the immutable referred_by relationship created at signup.
  SELECT referrer.referral_code
    INTO ref_code
    FROM profiles AS student
    JOIN profiles AS referrer ON referrer.id = student.referred_by
   WHERE student.id = NEW.student_id;

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
