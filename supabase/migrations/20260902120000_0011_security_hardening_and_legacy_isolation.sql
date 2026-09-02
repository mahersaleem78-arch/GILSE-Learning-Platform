/* Post-deployment hardening for production and fresh environments. */

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.get_current_user_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION private.get_current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_current_user_role() TO authenticated;

-- Keep the authorization helper out of the exposed public API schema.
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM anon, authenticated, public;

-- Replace policy references with the private helper.
DROP POLICY IF EXISTS select_own_or_admin ON public.profiles;
CREATE POLICY select_own_or_admin ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR private.get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS update_own_or_admin ON public.profiles;
CREATE POLICY update_own_or_admin ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR private.get_current_user_role() IN ('admin','developer'))
  WITH CHECK (id = auth.uid() OR private.get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS delete_admin_only ON public.profiles;
CREATE POLICY delete_admin_only ON public.profiles FOR DELETE TO authenticated
  USING (private.get_current_user_role() IN ('admin','developer'));

DROP POLICY IF EXISTS select_courses_public ON public.courses;
CREATE POLICY select_courses_public ON public.courses FOR SELECT TO anon,authenticated
  USING (status = 'published' OR private.get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS insert_courses_admin ON public.courses;
CREATE POLICY insert_courses_admin ON public.courses FOR INSERT TO authenticated
  WITH CHECK (private.get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS update_courses_admin ON public.courses;
CREATE POLICY update_courses_admin ON public.courses FOR UPDATE TO authenticated
  USING (private.get_current_user_role() IN ('admin','developer'))
  WITH CHECK (private.get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS delete_courses_admin ON public.courses;
CREATE POLICY delete_courses_admin ON public.courses FOR DELETE TO authenticated
  USING (private.get_current_user_role() IN ('admin','developer'));

DROP POLICY IF EXISTS select_modules_public ON public.modules;
CREATE POLICY select_modules_public ON public.modules FOR SELECT TO anon,authenticated
  USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = modules.course_id AND courses.status = 'published')
         OR private.get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS insert_modules_admin ON public.modules;
CREATE POLICY insert_modules_admin ON public.modules FOR INSERT TO authenticated
  WITH CHECK (private.get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS update_modules_admin ON public.modules;
CREATE POLICY update_modules_admin ON public.modules FOR UPDATE TO authenticated
  USING (private.get_current_user_role() IN ('admin','developer'))
  WITH CHECK (private.get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS delete_modules_admin ON public.modules;
CREATE POLICY delete_modules_admin ON public.modules FOR DELETE TO authenticated
  USING (private.get_current_user_role() IN ('admin','developer'));

DROP POLICY IF EXISTS select_lessons_public ON public.lessons;
CREATE POLICY select_lessons_public ON public.lessons FOR SELECT TO anon,authenticated
  USING (EXISTS (
    SELECT 1 FROM public.modules
    JOIN public.courses ON courses.id = modules.course_id
    WHERE modules.id = lessons.module_id AND courses.status = 'published'
  ) OR private.get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS insert_lessons_admin ON public.lessons;
CREATE POLICY insert_lessons_admin ON public.lessons FOR INSERT TO authenticated
  WITH CHECK (private.get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS update_lessons_admin ON public.lessons;
CREATE POLICY update_lessons_admin ON public.lessons FOR UPDATE TO authenticated
  USING (private.get_current_user_role() IN ('admin','developer'))
  WITH CHECK (private.get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS delete_lessons_admin ON public.lessons;
CREATE POLICY delete_lessons_admin ON public.lessons FOR DELETE TO authenticated
  USING (private.get_current_user_role() IN ('admin','developer'));

DROP POLICY IF EXISTS payment_config_read ON public.payment_config;
CREATE POLICY payment_config_read ON public.payment_config FOR SELECT TO authenticated
  USING (active OR private.get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS payment_config_admin_write ON public.payment_config;
CREATE POLICY payment_config_admin_write ON public.payment_config FOR ALL TO authenticated
  USING (private.get_current_user_role() IN ('admin','developer'))
  WITH CHECK (private.get_current_user_role() IN ('admin','developer'));

DROP POLICY IF EXISTS payments_student_read ON public.payments;
CREATE POLICY payments_student_read ON public.payments FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR private.get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS payments_student_insert ON public.payments;
CREATE POLICY payments_student_insert ON public.payments FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS payments_admin_update ON public.payments;
CREATE POLICY payments_admin_update ON public.payments FOR UPDATE TO authenticated
  USING (private.get_current_user_role() IN ('admin','developer'))
  WITH CHECK (private.get_current_user_role() IN ('admin','developer'));

DROP POLICY IF EXISTS rewards_read ON public.referral_rewards;
CREATE POLICY rewards_read ON public.referral_rewards FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_student_id = auth.uid() OR private.get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS rewards_admin_update ON public.referral_rewards;
CREATE POLICY rewards_admin_update ON public.referral_rewards FOR UPDATE TO authenticated
  USING (private.get_current_user_role() IN ('admin','developer'))
  WITH CHECK (private.get_current_user_role() IN ('admin','developer'));

DROP POLICY IF EXISTS audit_admin_read ON public.audit_log;
CREATE POLICY audit_admin_read ON public.audit_log FOR SELECT TO authenticated
  USING (private.get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS audit_admin_insert ON public.audit_log;
CREATE POLICY audit_admin_insert ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (private.get_current_user_role() IN ('admin','developer'));

DROP POLICY IF EXISTS enrollment_student_read ON public.enrollments;
CREATE POLICY enrollment_student_read ON public.enrollments FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR private.get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS enrollment_admin_write ON public.enrollments;
CREATE POLICY enrollment_admin_write ON public.enrollments FOR ALL TO authenticated
  USING (private.get_current_user_role() IN ('admin','developer'))
  WITH CHECK (private.get_current_user_role() IN ('admin','developer'));

-- Pin search paths for public functions that are retained for triggers.
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION public.generate_referral_code(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.update_payment_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.prevent_student_payment_mutation() SET search_path = public, pg_temp;
ALTER FUNCTION public.prevent_referral_attribution_change() SET search_path = public, pg_temp;
ALTER FUNCTION public.prevent_self_referral() SET search_path = public, pg_temp;
ALTER FUNCTION public.prevent_payment_referral_mutation() SET search_path = public, pg_temp;
ALTER FUNCTION public.enforce_paid_course_enrollment() SET search_path = public, pg_temp;
ALTER FUNCTION public.prevent_self_referral_reward() SET search_path = public, pg_temp;

-- Legacy student data is preserved but isolated from the API surface.
CREATE SCHEMA IF NOT EXISTS legacy;
ALTER TABLE IF EXISTS public.students SET SCHEMA legacy;
ALTER TABLE IF EXISTS public.students_legacy_backup_20260902 SET SCHEMA legacy;
ALTER TABLE IF EXISTS legacy.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS legacy.students_legacy_backup_20260902 DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA legacy FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA legacy FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA legacy FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, public;
