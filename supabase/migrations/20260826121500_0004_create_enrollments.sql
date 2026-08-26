CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(student_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS enrollment_student_read ON enrollments;
CREATE POLICY enrollment_student_read ON enrollments FOR SELECT TO authenticated USING (student_id=auth.uid() OR get_current_user_role() IN ('admin','developer'));
DROP POLICY IF EXISTS enrollment_admin_write ON enrollments;
CREATE POLICY enrollment_admin_write ON enrollments FOR ALL TO authenticated USING (get_current_user_role() IN ('admin','developer')) WITH CHECK (get_current_user_role() IN ('admin','developer'));
GRANT SELECT ON enrollments TO authenticated;
