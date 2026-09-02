-- Split lesson SELECT authorization by API role so anonymous requests never evaluate enrollment joins.
DROP POLICY IF EXISTS select_lessons_public ON public.lessons;
DROP POLICY IF EXISTS select_lessons_anon ON public.lessons;
CREATE POLICY select_lessons_anon ON public.lessons
  FOR SELECT TO anon
  USING (
    is_preview
    AND EXISTS (
      SELECT 1
      FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = module_id AND c.status = 'published'::course_status
    )
  );

DROP POLICY IF EXISTS select_lessons_authenticated ON public.lessons;
CREATE POLICY select_lessons_authenticated ON public.lessons
  FOR SELECT TO authenticated
  USING (
    (
      is_preview
      AND EXISTS (
        SELECT 1
        FROM public.modules m
        JOIN public.courses c ON c.id = m.course_id
        WHERE m.id = module_id AND c.status = 'published'::course_status
      )
    )
    OR (select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role)
    OR (
      (select private.get_current_user_role()) = 'instructor'::user_role
      AND EXISTS (
        SELECT 1
        FROM public.modules m
        JOIN public.courses c ON c.id = m.course_id
        WHERE m.id = module_id AND c.instructor_id = (select auth.uid())
      )
    )
    OR EXISTS (
      SELECT 1
      FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      JOIN public.enrollments e ON e.course_id = c.id
      WHERE m.id = module_id
        AND e.student_id = (select auth.uid())
        AND e.status IN ('active','completed')
    )
  );
