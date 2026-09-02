-- Optimize RLS helper calls and add missing foreign-key indexes.
-- Keep the authorization semantics unchanged while reducing per-row function evaluation.

CREATE INDEX IF NOT EXISTS idx_registration_orders_course_id ON public.registration_orders(course_id);
CREATE INDEX IF NOT EXISTS idx_instructor_payouts_course_id ON public.instructor_payouts(course_id);
CREATE INDEX IF NOT EXISTS idx_instructor_payouts_approved_by ON public.instructor_payouts(approved_by);

-- Courses: consolidate authenticated INSERT/UPDATE policies and cache the role helper.
DROP POLICY IF EXISTS insert_courses_admin ON public.courses;
DROP POLICY IF EXISTS insert_courses_instructor ON public.courses;
CREATE POLICY insert_courses_authenticated ON public.courses
  FOR INSERT TO authenticated
  WITH CHECK (
    (select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role)
    OR (
      (select private.get_current_user_role()) = 'instructor'::user_role
      AND instructor_id = (select auth.uid())
      AND status = 'draft'::course_status
      AND instructor_share_percent = 50
    )
  );

DROP POLICY IF EXISTS update_courses_admin ON public.courses;
DROP POLICY IF EXISTS update_courses_instructor ON public.courses;
CREATE POLICY update_courses_authenticated ON public.courses
  FOR UPDATE TO authenticated
  USING (
    (select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role)
    OR (
      (select private.get_current_user_role()) = 'instructor'::user_role
      AND instructor_id = (select auth.uid())
      AND status = 'draft'::course_status
    )
  )
  WITH CHECK (
    (select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role)
    OR (
      (select private.get_current_user_role()) = 'instructor'::user_role
      AND instructor_id = (select auth.uid())
      AND status = 'draft'::course_status
      AND instructor_share_percent = 50
    )
  );

DROP POLICY IF EXISTS select_courses_public ON public.courses;
CREATE POLICY select_courses_public ON public.courses
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'::course_status
    OR (select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role)
    OR (
      (select private.get_current_user_role()) = 'instructor'::user_role
      AND instructor_id = (select auth.uid())
    )
  );

-- Enrollments: consolidate authenticated INSERT policies.
DROP POLICY IF EXISTS enrollment_admin_insert ON public.enrollments;
DROP POLICY IF EXISTS enrollment_student_insert ON public.enrollments;
CREATE POLICY enrollment_authenticated_insert ON public.enrollments
  FOR INSERT TO authenticated
  WITH CHECK (
    (select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role)
    OR (
      student_id = (select auth.uid())
      AND status = 'active'
      AND completed_at IS NULL
    )
  );

-- Modules: consolidate INSERT/UPDATE/DELETE policies.
DROP POLICY IF EXISTS insert_modules_admin ON public.modules;
DROP POLICY IF EXISTS insert_modules_instructor ON public.modules;
CREATE POLICY insert_modules_authenticated ON public.modules
  FOR INSERT TO authenticated
  WITH CHECK (
    (select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role)
    OR (
      (select private.get_current_user_role()) = 'instructor'::user_role
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id AND c.instructor_id = (select auth.uid()) AND c.status = 'draft'::course_status
      )
    )
  );

DROP POLICY IF EXISTS update_modules_admin ON public.modules;
DROP POLICY IF EXISTS update_modules_instructor ON public.modules;
CREATE POLICY update_modules_authenticated ON public.modules
  FOR UPDATE TO authenticated
  USING (
    (select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role)
    OR (
      (select private.get_current_user_role()) = 'instructor'::user_role
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id AND c.instructor_id = (select auth.uid()) AND c.status = 'draft'::course_status
      )
    )
  )
  WITH CHECK (
    (select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role)
    OR (
      (select private.get_current_user_role()) = 'instructor'::user_role
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id AND c.instructor_id = (select auth.uid()) AND c.status = 'draft'::course_status
      )
    )
  );

DROP POLICY IF EXISTS delete_modules_admin ON public.modules;
DROP POLICY IF EXISTS delete_modules_instructor ON public.modules;
CREATE POLICY delete_modules_authenticated ON public.modules
  FOR DELETE TO authenticated
  USING (
    (select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role)
    OR (
      (select private.get_current_user_role()) = 'instructor'::user_role
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id AND c.instructor_id = (select auth.uid()) AND c.status = 'draft'::course_status
      )
    )
  );

DROP POLICY IF EXISTS select_modules_public ON public.modules;
CREATE POLICY select_modules_public ON public.modules
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.status = 'published'::course_status)
    OR (select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role)
    OR (
      (select private.get_current_user_role()) = 'instructor'::user_role
      AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = (select auth.uid()))
    )
  );

-- Lessons: consolidate authenticated INSERT/UPDATE/DELETE and SELECT policies.
DROP POLICY IF EXISTS insert_lessons_admin ON public.lessons;
DROP POLICY IF EXISTS insert_lessons_instructor ON public.lessons;
CREATE POLICY insert_lessons_authenticated ON public.lessons
  FOR INSERT TO authenticated
  WITH CHECK (
    (select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role)
    OR (
      (select private.get_current_user_role()) = 'instructor'::user_role
      AND EXISTS (
        SELECT 1
        FROM public.modules m
        JOIN public.courses c ON c.id = m.course_id
        WHERE m.id = module_id AND c.instructor_id = (select auth.uid()) AND c.status = 'draft'::course_status
      )
    )
  );

DROP POLICY IF EXISTS update_lessons_admin ON public.lessons;
DROP POLICY IF EXISTS update_lessons_instructor ON public.lessons;
CREATE POLICY update_lessons_authenticated ON public.lessons
  FOR UPDATE TO authenticated
  USING (
    (select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role)
    OR (
      (select private.get_current_user_role()) = 'instructor'::user_role
      AND EXISTS (
        SELECT 1
        FROM public.modules m
        JOIN public.courses c ON c.id = m.course_id
        WHERE m.id = module_id AND c.instructor_id = (select auth.uid()) AND c.status = 'draft'::course_status
      )
    )
  )
  WITH CHECK (
    (select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role)
    OR (
      (select private.get_current_user_role()) = 'instructor'::user_role
      AND EXISTS (
        SELECT 1
        FROM public.modules m
        JOIN public.courses c ON c.id = m.course_id
        WHERE m.id = module_id AND c.instructor_id = (select auth.uid()) AND c.status = 'draft'::course_status
      )
    )
  );

DROP POLICY IF EXISTS delete_lessons_admin ON public.lessons;
DROP POLICY IF EXISTS delete_lessons_instructor ON public.lessons;
CREATE POLICY delete_lessons_authenticated ON public.lessons
  FOR DELETE TO authenticated
  USING (
    (select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role)
    OR (
      (select private.get_current_user_role()) = 'instructor'::user_role
      AND EXISTS (
        SELECT 1
        FROM public.modules m
        JOIN public.courses c ON c.id = m.course_id
        WHERE m.id = module_id AND c.instructor_id = (select auth.uid()) AND c.status = 'draft'::course_status
      )
    )
  );

DROP POLICY IF EXISTS select_lessons_admin ON public.lessons;
DROP POLICY IF EXISTS select_lessons_public ON public.lessons;
CREATE POLICY select_lessons_public ON public.lessons
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.modules m
      JOIN public.courses c ON c.id = m.course_id
      WHERE m.id = module_id AND c.status = 'published'::course_status
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
  );

-- Instructor payouts: cache role and uid helper calls.
DROP POLICY IF EXISTS instructor_payouts_read ON public.instructor_payouts;
CREATE POLICY instructor_payouts_read ON public.instructor_payouts
  FOR SELECT TO authenticated
  USING (
    instructor_id = (select auth.uid())
    OR (select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role)
  );

DROP POLICY IF EXISTS instructor_payouts_admin_update ON public.instructor_payouts;
CREATE POLICY instructor_payouts_admin_update ON public.instructor_payouts
  FOR UPDATE TO authenticated
  USING ((select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role))
  WITH CHECK ((select private.get_current_user_role()) IN ('admin'::user_role, 'developer'::user_role));
