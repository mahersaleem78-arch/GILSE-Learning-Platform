/* Bolt #6 security hardening: trigger-only SECURITY DEFINER functions must not be directly executable by public roles. */

REVOKE EXECUTE ON FUNCTION generate_referral_code(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION prepare_payment_insert() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION prevent_student_payment_mutation() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION prevent_referral_attribution_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION prevent_self_referral() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION prevent_payment_referral_mutation() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION enforce_paid_course_enrollment() FROM anon, authenticated, public;

-- These functions are only invoked by triggers or trusted server-side paths.
-- Explicitly remove public execution where the function exists in this schema.
DO $$
BEGIN
  IF to_regprocedure('update_payment_updated_at()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION update_payment_updated_at() FROM anon, authenticated, public;
  END IF;
  IF to_regprocedure('payments_create_enrollment()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION payments_create_enrollment() FROM anon, authenticated, public;
  END IF;
  IF to_regprocedure('create_enrollment_on_payment_paid()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION create_enrollment_on_payment_paid() FROM anon, authenticated, public;
  END IF;
  IF to_regprocedure('create_referral_reward_on_payment_paid()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION create_referral_reward_on_payment_paid() FROM anon, authenticated, public;
  END IF;
  IF to_regprocedure('prevent_student_reward_modification()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION prevent_student_reward_modification() FROM anon, authenticated, public;
  END IF;
  IF to_regprocedure('enforce_reward_status_transition()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION enforce_reward_status_transition() FROM anon, authenticated, public;
  END IF;
  IF to_regprocedure('log_audit(uuid,text,text,uuid,jsonb)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION log_audit(uuid,text,text,uuid,jsonb) FROM anon, authenticated, public;
  END IF;
END $$;
