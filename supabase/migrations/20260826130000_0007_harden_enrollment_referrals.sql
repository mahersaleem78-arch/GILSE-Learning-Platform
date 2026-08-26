/* Bolt #6 hardening: paid enrollment and referral integrity must be enforced in the database. */

CREATE OR REPLACE FUNCTION prevent_self_referral_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.referred_by = NEW.id THEN
    RAISE EXCEPTION 'A student cannot refer themselves.';
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.referred_by IS DISTINCT FROM NEW.referred_by
     AND auth.uid() IS NOT NULL
     AND get_current_user_role() NOT IN ('admin','developer') THEN
    RAISE EXCEPTION 'Referral attribution cannot be changed after signup.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profiles_referral_integrity ON profiles;
CREATE TRIGGER profiles_referral_integrity
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION prevent_self_referral_profile();

CREATE OR REPLACE FUNCTION prevent_self_referral_reward() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.referrer_id = NEW.referred_student_id THEN
    RAISE EXCEPTION 'A student cannot receive a self-referral reward.';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS referral_reward_self_guard ON referral_rewards;
CREATE TRIGGER referral_reward_self_guard
BEFORE INSERT OR UPDATE ON referral_rewards
FOR EACH ROW EXECUTE FUNCTION prevent_self_referral_reward();

CREATE OR REPLACE FUNCTION enforce_reward_status_transition() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF get_current_user_role() NOT IN ('admin','developer') THEN
    RAISE EXCEPTION 'Only administrators can change referral reward status.';
  END IF;

  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF NOT (
    (OLD.status = 'pending_approval' AND NEW.status IN ('approved','rejected'))
    OR (OLD.status = 'approved' AND NEW.status = 'paid')
  ) THEN
    RAISE EXCEPTION 'Invalid referral reward status transition: % -> %', OLD.status, NEW.status;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS referral_reward_status_transition ON referral_rewards;
CREATE TRIGGER referral_reward_status_transition
BEFORE UPDATE ON referral_rewards
FOR EACH ROW EXECUTE FUNCTION enforce_reward_status_transition();

CREATE OR REPLACE FUNCTION enforce_paid_course_enrollment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE course_price numeric;
BEGIN
  SELECT price INTO course_price FROM courses WHERE id = NEW.course_id;
  IF course_price IS NULL THEN
    RAISE EXCEPTION 'Course not found.';
  END IF;

  IF course_price > 0 AND NOT EXISTS (
    SELECT 1 FROM payments
    WHERE student_id = NEW.student_id
      AND course_id = NEW.course_id
      AND status = 'verified'
  ) THEN
    RAISE EXCEPTION 'A verified payment is required before enrolling in a paid course.';
  END IF;

  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS enrollments_paid_course_guard ON enrollments;
CREATE TRIGGER enrollments_paid_course_guard
BEFORE INSERT ON enrollments
FOR EACH ROW EXECUTE FUNCTION enforce_paid_course_enrollment();

REVOKE EXECUTE ON FUNCTION generate_referral_code(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon, public;
REVOKE EXECUTE ON FUNCTION prepare_payment_insert() FROM anon, public;
REVOKE EXECUTE ON FUNCTION prevent_student_payment_mutation() FROM anon, public;
REVOKE EXECUTE ON FUNCTION prevent_self_referral_profile() FROM anon, public;
REVOKE EXECUTE ON FUNCTION prevent_self_referral_reward() FROM anon, public;
REVOKE EXECUTE ON FUNCTION enforce_reward_status_transition() FROM anon, public;
REVOKE EXECUTE ON FUNCTION enforce_paid_course_enrollment() FROM anon, public;
