-- Published paid courses expose preview lessons publicly, but full lesson content only to enrolled students.
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
        OR (
          (SELECT auth.uid()) IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.student_id = (SELECT auth.uid())
              AND e.course_id = c.id
              AND e.status IN ('active','completed')
          )
        )
      )
  )
  OR (SELECT private.get_current_user_role()) = ANY (ARRAY['admin'::user_role,'developer'::user_role])
);
