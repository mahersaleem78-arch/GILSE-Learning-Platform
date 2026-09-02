-- Optimize certificate RLS: avoid per-row auth evaluation and overlapping SELECT policies.
DROP POLICY IF EXISTS certificates_admin_write ON public.certificates;
DROP POLICY IF EXISTS certificates_student_read ON public.certificates;
CREATE POLICY certificates_student_read ON public.certificates
FOR SELECT TO authenticated
USING (
  student_id = (SELECT auth.uid())
  OR (SELECT private.get_current_user_role()) = ANY (ARRAY['admin'::user_role,'developer'::user_role])
);
CREATE POLICY certificates_admin_insert ON public.certificates
FOR INSERT TO authenticated
WITH CHECK ((SELECT private.get_current_user_role()) = ANY (ARRAY['admin'::user_role,'developer'::user_role]));
CREATE POLICY certificates_admin_update ON public.certificates
FOR UPDATE TO authenticated
USING ((SELECT private.get_current_user_role()) = ANY (ARRAY['admin'::user_role,'developer'::user_role]))
WITH CHECK ((SELECT private.get_current_user_role()) = ANY (ARRAY['admin'::user_role,'developer'::user_role]));
CREATE POLICY certificates_admin_delete ON public.certificates
FOR DELETE TO authenticated
USING ((SELECT private.get_current_user_role()) = ANY (ARRAY['admin'::user_role,'developer'::user_role]));
