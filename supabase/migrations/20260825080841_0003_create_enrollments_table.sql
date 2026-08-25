/*
# Create enrollments table with RLS

## Purpose
Creates the `enrollments` table linking students to courses, with a
status lifecycle (active, completed, cancelled), a unique constraint to
prevent duplicate enrollment for the same student/course, and Row Level
Security enforcing ownership-based access.

## New types
- `enrollment_status` enum: active, completed, cancelled

## New tables

### enrollments
- `id` (uuid, primary key, default gen_random_uuid())
- `student_id` (uuid, not null, references profiles(id) ON DELETE CASCADE,
  default auth.uid())
- `course_id` (uuid, not null, references courses(id) ON DELETE CASCADE)
- `status` (enrollment_status, not null, default 'active')
- `enrolled_at` (timestamptz, not null, default now())
- `completed_at` (timestamptz, nullable)
- `created_at` (timestamptz, not null, default now())
- `updated_at` (timestamptz, not null, default now())

## Constraints
- UNIQUE (student_id, course_id) — prevents duplicate enrollment for the
  same student/course combination. A student can only have one enrollment
  record per course.

## Security (RLS)
- SELECT: students can read their own enrollments; admin/developer can
  read all enrollments.
- INSERT: students can create enrollments for themselves only
  (student_id = auth.uid()). Admin/developer can insert for anyone.
- UPDATE: students can update their own enrollments; admin/developer can
  update any. A trigger prevents changing the protected ownership fields
  (student_id, course_id) on update.
- DELETE: admin/developer only. Students cannot delete their own
  enrollment directly (they can cancel by setting status = 'cancelled').

## Ownership protection trigger
- `prevent_enrollment_owner_change()` SECURITY DEFINER trigger: blocks
  non-admin/developer users from changing `student_id` or `course_id`
  columns on UPDATE. Raises an exception if they attempt it.

## Important notes
1. `student_id` defaults to `auth.uid()` so self-enrollment inserts that
   omit `student_id` still satisfy the INSERT policy's WITH CHECK.
2. The unique constraint is the database-level duplicate-enrollment guard
   — the service layer also checks, but the constraint is the source of
   truth.
3. ON DELETE CASCADE on both foreign keys ensures enrollments are cleaned
   up when a student profile or course is deleted.
4. `completed_at` is nullable and set when status transitions to
   'completed' (handled by Bolt #7 progress tracking).
5. updated_at auto-maintained via the existing update_updated_at_column()
   function.
*/

-- ───────────────────────────────
-- Enum
-- ───────────────────────────────

DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ───────────────────────────────
-- Enrollments table
-- ───────────────────────────────

CREATE TABLE IF NOT EXISTS enrollments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  course_id   uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status      enrollment_status NOT NULL DEFAULT 'active',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate enrollment for the same student/course
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_student_course_unique
  ON enrollments(student_id, course_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- ───────────────────────────────
-- Updated_at trigger
-- ───────────────────────────────

DROP TRIGGER IF EXISTS enrollments_updated_at ON enrollments;
CREATE TRIGGER enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────
-- Ownership protection trigger
-- ───────────────────────────────

CREATE OR REPLACE FUNCTION prevent_enrollment_owner_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role user_role;
BEGIN
  caller_role := get_current_user_role();

  IF caller_role NOT IN ('admin', 'developer') THEN
    IF NEW.student_id IS DISTINCT FROM OLD.student_id THEN
      RAISE EXCEPTION 'You are not allowed to change the enrollment student';
    END IF;
    IF NEW.course_id IS DISTINCT FROM OLD.course_id THEN
      RAISE EXCEPTION 'You are not allowed to change the enrollment course';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_enrollment_owner_guard ON enrollments;
CREATE TRIGGER enforce_enrollment_owner_guard
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_enrollment_owner_change();

-- ───────────────────────────────
-- Row Level Security
-- ───────────────────────────────

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- SELECT: own enrollments OR admin/developer
DROP POLICY IF EXISTS "select_own_or_admin" ON enrollments;
CREATE POLICY "select_own_or_admin"
  ON enrollments FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR get_current_user_role() IN ('admin', 'developer')
  );

-- INSERT: students can self-enroll; admin/developer can enroll anyone
DROP POLICY IF EXISTS "insert_own_or_admin" ON enrollments;
CREATE POLICY "insert_own_or_admin"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid()
    OR get_current_user_role() IN ('admin', 'developer')
  );

-- UPDATE: own enrollment OR admin/developer
DROP POLICY IF EXISTS "update_own_or_admin" ON enrollments;
CREATE POLICY "update_own_or_admin"
  ON enrollments FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid()
    OR get_current_user_role() IN ('admin', 'developer')
  )
  WITH CHECK (
    student_id = auth.uid()
    OR get_current_user_role() IN ('admin', 'developer')
  );

-- DELETE: admin/developer only
DROP POLICY IF EXISTS "delete_admin_only" ON enrollments;
CREATE POLICY "delete_admin_only"
  ON enrollments FOR DELETE
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'developer')
  );

-- ───────────────────────────────
-- Grants
-- ───────────────────────────────

GRANT SELECT ON enrollments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON enrollments TO authenticated;
