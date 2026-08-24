/*
# Create courses, modules, and lessons tables with RLS

## Purpose
Builds the core LMS content hierarchy: courses → modules → lessons.
Each table has Row Level Security enforcing public read for published
content and admin/developer-only write access.

## New types
- `course_status` enum: draft, published, archived

## New tables

### courses
- `id` (uuid, primary key, default gen_random_uuid())
- `title` (text, not null)
- `slug` (text, not null, unique — URL-friendly identifier)
- `description` (text, nullable)
- `thumbnail_url` (text, nullable)
- `price` (numeric(10,2), not null, default 0)
- `currency` (text, not null, default 'USD')
- `total_hours` (integer, not null, default 90)
- `status` (course_status, not null, default 'draft')
- `created_by` (uuid, references profiles(id) ON DELETE SET NULL, default auth.uid())
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### modules
- `id` (uuid, primary key)
- `course_id` (uuid, references courses(id) ON DELETE CASCADE)
- `title` (text, not null)
- `description` (text, nullable)
- `order_index` (integer, not null, default 0)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### lessons
- `id` (uuid, primary key)
- `module_id` (uuid, references modules(id) ON DELETE CASCADE)
- `title` (text, not null)
- `description` (text, nullable)
- `content` (text, nullable)
- `video_url` (text, nullable)
- `duration_minutes` (integer, nullable)
- `order_index` (integer, not null, default 0)
- `is_preview` (boolean, not null, default false)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

## Security (RLS)

### courses
- SELECT (public): anon + authenticated can read published courses only.
- SELECT (admin): admin/developer can read all courses.
- INSERT: admin/developer only.
- UPDATE: admin/developer only.
- DELETE: admin/developer only.

### modules
- SELECT (public): anon + authenticated can read modules of published courses.
- SELECT (admin): admin/developer can read all modules.
- INSERT/UPDATE/DELETE: admin/developer only.

### lessons
- SELECT (public): anon + authenticated can read lessons of published courses.
- SELECT (admin): admin/developer can read all lessons.
- INSERT/UPDATE/DELETE: admin/developer only.

## Important notes
1. Public catalog is readable by anon (no sign-in required) for published
   courses, modules, and lessons.
2. All write operations require admin or developer role, enforced at the
   database level via RLS — never trusted from the client.
3. Instructor-level permissions are prepared in schema (created_by on
   courses) but not expanded in RLS yet — instructors currently have the
   same access as students (read-only for published content).
4. ON DELETE CASCADE on modules→courses and lessons→modules ensures
   clean hierarchy deletion.
5. updated_at auto-maintained via triggers reusing the existing
   update_updated_at_column() function.
*/

-- ───────────────────────────────
-- Enum
-- ───────────────────────────────

DO $$ BEGIN
  CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ───────────────────────────────
-- Courses table
-- ───────────────────────────────

CREATE TABLE IF NOT EXISTS courses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  slug          text NOT NULL UNIQUE,
  description   text,
  thumbnail_url text,
  price         numeric(10,2) NOT NULL DEFAULT 0,
  currency      text NOT NULL DEFAULT 'USD',
  total_hours   integer NOT NULL DEFAULT 90,
  status        course_status NOT NULL DEFAULT 'draft',
  created_by    uuid REFERENCES profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);

-- ───────────────────────────────
-- Modules table
-- ───────────────────────────────

CREATE TABLE IF NOT EXISTS modules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON modules(course_id, order_index);

-- ───────────────────────────────
-- Lessons table
-- ───────────────────────────────

CREATE TABLE IF NOT EXISTS lessons (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id        uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title            text NOT NULL,
  description      text,
  content          text,
  video_url        text,
  duration_minutes integer,
  order_index      integer NOT NULL DEFAULT 0,
  is_preview       boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons(module_id, order_index);

-- ───────────────────────────────
-- Updated_at triggers
-- ───────────────────────────────

DROP TRIGGER IF EXISTS courses_updated_at ON courses;
CREATE TRIGGER courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS modules_updated_at ON modules;
CREATE TRIGGER modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS lessons_updated_at ON lessons;
CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────
-- Row Level Security: courses
-- ───────────────────────────────

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Public can read published courses; admin/developer can read all
DROP POLICY IF EXISTS "select_courses_public" ON courses;
CREATE POLICY "select_courses_public"
  ON courses FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    OR get_current_user_role() IN ('admin', 'developer')
  );

-- Admin/developer can create courses
DROP POLICY IF EXISTS "insert_courses_admin" ON courses;
CREATE POLICY "insert_courses_admin"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() IN ('admin', 'developer')
  );

-- Admin/developer can update courses
DROP POLICY IF EXISTS "update_courses_admin" ON courses;
CREATE POLICY "update_courses_admin"
  ON courses FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'developer')
  )
  WITH CHECK (
    get_current_user_role() IN ('admin', 'developer')
  );

-- Admin/developer can delete courses
DROP POLICY IF EXISTS "delete_courses_admin" ON courses;
CREATE POLICY "delete_courses_admin"
  ON courses FOR DELETE
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'developer')
  );

-- ───────────────────────────────
-- Row Level Security: modules
-- ───────────────────────────────

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Public can read modules of published courses; admin/developer can read all
DROP POLICY IF EXISTS "select_modules_public" ON modules;
CREATE POLICY "select_modules_public"
  ON modules FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id
      AND courses.status = 'published'
    )
    OR get_current_user_role() IN ('admin', 'developer')
  );

-- Admin/developer can create modules
DROP POLICY IF EXISTS "insert_modules_admin" ON modules;
CREATE POLICY "insert_modules_admin"
  ON modules FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() IN ('admin', 'developer')
  );

-- Admin/developer can update modules
DROP POLICY IF EXISTS "update_modules_admin" ON modules;
CREATE POLICY "update_modules_admin"
  ON modules FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'developer')
  )
  WITH CHECK (
    get_current_user_role() IN ('admin', 'developer')
  );

-- Admin/developer can delete modules
DROP POLICY IF EXISTS "delete_modules_admin" ON modules;
CREATE POLICY "delete_modules_admin"
  ON modules FOR DELETE
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'developer')
  );

-- ───────────────────────────────
-- Row Level Security: lessons
-- ───────────────────────────────

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Public can read lessons of published courses; admin/developer can read all
DROP POLICY IF EXISTS "select_lessons_public" ON lessons;
CREATE POLICY "select_lessons_public"
  ON lessons FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules
      JOIN courses ON courses.id = modules.course_id
      WHERE modules.id = lessons.module_id
      AND courses.status = 'published'
    )
    OR get_current_user_role() IN ('admin', 'developer')
  );

-- Admin/developer can create lessons
DROP POLICY IF EXISTS "insert_lessons_admin" ON lessons;
CREATE POLICY "insert_lessons_admin"
  ON lessons FOR INSERT
  TO authenticated
  WITH CHECK (
    get_current_user_role() IN ('admin', 'developer')
  );

-- Admin/developer can update lessons
DROP POLICY IF EXISTS "update_lessons_admin" ON lessons;
CREATE POLICY "update_lessons_admin"
  ON lessons FOR UPDATE
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'developer')
  )
  WITH CHECK (
    get_current_user_role() IN ('admin', 'developer')
  );

-- Admin/developer can delete lessons
DROP POLICY IF EXISTS "delete_lessons_admin" ON lessons;
CREATE POLICY "delete_lessons_admin"
  ON lessons FOR DELETE
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'developer')
  );

-- ───────────────────────────────
-- Grant access to anon for public reads
-- ───────────────────────────────

GRANT SELECT ON courses TO anon, authenticated;
GRANT SELECT ON modules TO anon, authenticated;
GRANT SELECT ON lessons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON courses TO authenticated;
GRANT INSERT, UPDATE, DELETE ON modules TO authenticated;
GRANT INSERT, UPDATE, DELETE ON lessons TO authenticated;
