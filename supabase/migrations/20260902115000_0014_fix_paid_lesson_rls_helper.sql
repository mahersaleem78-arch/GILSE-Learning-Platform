-- RLS policies cannot directly read enrollments as anon. Use a narrowly scoped private helper.
CREATE OR REPLACE FUNCTION private.is_current_user_enrolled(p_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.student_id = auth.uid()
      AND e.course_id = p_course_id
      AND e.status IN ('active','completed')
  );
$$;
REVOKE EXECUTE ON FUNCTION private.is_current_user_enrolled(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_current_user_enrolled(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS select_lessons_public ON public.lessons;
CREATE POLICY select_lessons_public ON public.lessons
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = lessons.module_id
      AND c.status = 'published'
      AND (
        c.price <= 0
        OR lessons.is_preview = true
        OR private.is_current_user_enrolled(c.id)
      )
  )
  OR (SELECT private.get_current_user_role()) = ANY (ARRAY['admin'::user_role,'developer'::user_role])
);
