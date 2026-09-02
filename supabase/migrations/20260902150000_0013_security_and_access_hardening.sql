/* Security and access hardening. Idempotent for production and fresh environments. */

CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE RESTRICT,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  certificate_number text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON public.certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course ON public.certificates(course_id);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.audit_log, public.certificates, public.courses, public.enrollments, public.lessons, public.modules, public.payment_config, public.payments, public.profiles, public.referral_rewards FROM anon, authenticated;
GRANT SELECT ON public.courses, public.modules TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses, public.modules TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT SELECT, UPDATE ON public.referral_rewards TO authenticated;
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;

DROP POLICY IF EXISTS select_lessons_public ON public.lessons;
DROP POLICY IF EXISTS select_lessons_admin ON public.lessons;
CREATE POLICY select_lessons_admin ON public.lessons FOR SELECT TO authenticated USING (private.get_current_user_role() IN ('admin','developer'));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;

DROP VIEW IF EXISTS public.published_lesson_catalog;
CREATE VIEW public.published_lesson_catalog AS
SELECT l.id, l.module_id, l.title, l.description, l.duration_minutes, l.order_index, l.is_preview, l.created_at, l.updated_at
FROM public.lessons l
JOIN public.modules m ON m.id = l.module_id
JOIN public.courses c ON c.id = m.course_id
WHERE c.status = 'published';
GRANT SELECT ON public.published_lesson_catalog TO anon, authenticated;

DROP VIEW IF EXISTS public.enrolled_lesson_content;
CREATE VIEW public.enrolled_lesson_content AS
SELECT l.id, l.module_id, l.title, l.description, l.content, l.video_url, l.duration_minutes, l.order_index, l.is_preview, l.created_at, l.updated_at
FROM public.lessons l
JOIN public.modules m ON m.id = l.module_id
JOIN public.courses c ON c.id = m.course_id
WHERE c.status = 'published'
  AND (l.is_preview OR EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.student_id = auth.uid() AND e.course_id = c.id AND e.status IN ('active','completed')
  ) OR private.get_current_user_role() IN ('admin','developer'));
GRANT SELECT ON public.enrolled_lesson_content TO anon, authenticated;

REVOKE ALL ON FUNCTION private.get_current_user_role() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.get_current_user_role() TO authenticated;
REVOKE ALL ON FUNCTION private.is_current_user_enrolled(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_current_user_enrolled(uuid) TO authenticated;

DROP POLICY IF EXISTS enrollment_student_insert ON public.enrollments;
CREATE POLICY enrollment_student_insert ON public.enrollments FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid() AND status = 'active' AND completed_at IS NULL);

CREATE OR REPLACE FUNCTION public.normalize_student_enrollment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  jwt_role text := current_setting('request.jwt.claim.role', true);
  course_status public.course_status;
BEGIN
  IF auth.uid() IS NULL AND jwt_role IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Authentication required.'; END IF;
  IF jwt_role IS DISTINCT FROM 'service_role' AND auth.uid() IS NOT NULL AND NEW.student_id <> auth.uid() AND private.get_current_user_role() NOT IN ('admin','developer') THEN RAISE EXCEPTION 'Students may only create their own enrollments.'; END IF;
  SELECT status INTO course_status FROM public.courses WHERE id = NEW.course_id;
  IF course_status IS DISTINCT FROM 'published' THEN RAISE EXCEPTION 'Course is not available for enrollment.'; END IF;
  IF jwt_role IS DISTINCT FROM 'service_role' AND auth.uid() IS NOT NULL AND NEW.student_id = auth.uid() AND private.get_current_user_role() NOT IN ('admin','developer') THEN NEW.status := 'active'; NEW.completed_at := NULL; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS enrollments_normalize_student ON public.enrollments;
CREATE TRIGGER enrollments_normalize_student BEFORE INSERT ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.normalize_student_enrollment();

CREATE OR REPLACE FUNCTION public.enforce_paid_course_enrollment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE course_price numeric; course_status public.course_status; has_verified_payment boolean;
BEGIN
  SELECT price, status INTO course_price, course_status FROM public.courses WHERE id = NEW.course_id;
  IF course_price IS NULL THEN RAISE EXCEPTION 'Course not found.'; END IF;
  IF course_status IS DISTINCT FROM 'published' THEN RAISE EXCEPTION 'Course is not available for enrollment.'; END IF;
  IF course_price <= 0 THEN RETURN NEW; END IF;
  SELECT EXISTS (SELECT 1 FROM public.payments p WHERE p.student_id = NEW.student_id AND p.course_id = NEW.course_id AND p.status = 'verified') INTO has_verified_payment;
  IF NOT has_verified_payment THEN RAISE EXCEPTION 'A verified payment is required before enrolling in this paid course.'; END IF;
  RETURN NEW;
END;
$$;
ALTER FUNCTION public.normalize_student_enrollment() SET search_path = public, pg_temp;
ALTER FUNCTION public.enforce_paid_course_enrollment() SET search_path = public, pg_temp;

DROP FUNCTION IF EXISTS public.verify_certificate(text);
DROP VIEW IF EXISTS public.certificate_verification;
CREATE VIEW public.certificate_verification AS
SELECT c.certificate_number, p.full_name AS student_name, co.title AS course_title, c.issue_date
FROM public.certificates c
JOIN public.profiles p ON p.id = c.student_id
JOIN public.courses co ON co.id = c.course_id;
GRANT SELECT ON public.certificate_verification TO anon, authenticated;
REVOKE ALL ON TABLE public.certificate_verification FROM anon, authenticated;
GRANT SELECT ON public.certificate_verification TO anon, authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_tx_hash_lower_unique ON public.payments (lower(tx_hash)) WHERE tx_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_config_one_active ON public.payment_config ((active)) WHERE active = true;
ALTER TABLE public.payment_config DROP CONSTRAINT IF EXISTS payment_config_asset_check;
ALTER TABLE public.payment_config ADD CONSTRAINT payment_config_asset_check CHECK (upper(asset) = 'USDT');
ALTER TABLE public.payment_config DROP CONSTRAINT IF EXISTS payment_config_network_check;
ALTER TABLE public.payment_config ADD CONSTRAINT payment_config_network_check CHECK (upper(network) = 'TRON');
ALTER TABLE public.payment_config DROP CONSTRAINT IF EXISTS payment_config_reward_nonnegative;
ALTER TABLE public.payment_config ADD CONSTRAINT payment_config_reward_nonnegative CHECK (reward_amount >= 0);
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_price_nonnegative;
ALTER TABLE public.courses ADD CONSTRAINT courses_price_nonnegative CHECK (price >= 0);
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_total_hours_nonnegative;
ALTER TABLE public.courses ADD CONSTRAINT courses_total_hours_nonnegative CHECK (total_hours >= 0);
ALTER TABLE public.modules DROP CONSTRAINT IF EXISTS modules_order_nonnegative;
ALTER TABLE public.modules ADD CONSTRAINT modules_order_nonnegative CHECK (order_index >= 0);
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_order_nonnegative;
ALTER TABLE public.lessons ADD CONSTRAINT lessons_order_nonnegative CHECK (order_index >= 0);
ALTER TABLE public.lessons DROP CONSTRAINT IF EXISTS lessons_duration_nonnegative;
ALTER TABLE public.lessons ADD CONSTRAINT lessons_duration_nonnegative CHECK (duration_minutes IS NULL OR duration_minutes >= 0);
