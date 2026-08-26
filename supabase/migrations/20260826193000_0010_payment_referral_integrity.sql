/* Bolt #6 hardening: prevent duplicate verified purchases and self-referral rewards. */

-- A course should have at most one successfully verified payment per student.
-- Enrollment is already unique, so allowing multiple verified payments would only
-- create duplicate payment/reward paths for the same course.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_one_verified_student_course
  ON payments(student_id, course_id)
  WHERE status = 'verified';

-- Defense in depth: referral rewards can never point to the same person as both
-- referrer and referred student, regardless of which trusted path creates them.
CREATE OR REPLACE FUNCTION prevent_self_referral_reward()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referrer_id = NEW.referred_student_id THEN
    RAISE EXCEPTION 'Self-referral rewards are not allowed.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referral_rewards_prevent_self_referral ON referral_rewards;
CREATE TRIGGER referral_rewards_prevent_self_referral
BEFORE INSERT OR UPDATE ON referral_rewards
FOR EACH ROW
EXECUTE FUNCTION prevent_self_referral_reward();

REVOKE EXECUTE ON FUNCTION prevent_self_referral_reward() FROM anon, authenticated, public;
