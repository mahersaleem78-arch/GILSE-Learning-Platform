/*
# Create profiles table with roles, statuses, and RLS

## Purpose
Creates the `profiles` table — one row per authenticated user — along with
enums for user roles and account statuses, an auto-creation trigger that
fires when a new user signs up via Supabase Auth, and Row Level Security
policies that enforce ownership and role-based access.

## New tables
- `profiles`
  - `id` (uuid, primary key, references `auth.users(id)` ON DELETE CASCADE)
  - `full_name` (text, nullable — user can set later)
  - `email` (text, not null — copied from auth.users at signup)
  - `avatar_url` (text, nullable)
  - `role` (enum: student, instructor, admin, developer; default 'student')
  - `status` (enum: active, suspended; default 'active')
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

## New types
- `user_role` enum: student, instructor, admin, developer
- `user_status` enum: active, suspended

## Auto-creation trigger
- `handle_new_user()` function: inserts a profile row whenever a new row
  is added to `auth.users`. Copies the email from the auth record and
  defaults role='student', status='active'.
- `on_auth_user_created` trigger: fires AFTER INSERT on `auth.users`.

## Security (RLS)
- RLS enabled on `profiles`.
- SELECT: users can read their own profile; admin/developer can read all.
- INSERT: only the system (trigger, SECURITY DEFINER) inserts. Users
  cannot insert directly — profiles are created server-side only.
- UPDATE: users can update only their own profile. Role and status are
  NOT user-updatable (enforced by trigger). Admin/developer can update
  any profile including role and status.
- DELETE: admin/developer only. Users cannot delete their own profile
  row directly (cascades from auth.users deletion instead).

## Role-reading helper
- `get_current_user_role()` SECURITY DEFINER function: returns the role
  of the currently authenticated user. Used by the frontend and RLS
  policies to determine privileges without trusting client-supplied data.

## Important notes
1. The `handle_new_user` function is SECURITY DEFINER so it can insert
   into `profiles` even though the calling user has no INSERT policy.
2. Role is NEVER set by the client — it defaults to 'student' and can
   only be changed by an admin/developer via the UPDATE policy.
3. The `get_current_user_role` function is SECURITY DEFINER and owned
   by the postgres role so it bypasses RLS to read the role column.
*/

-- ───────────────────────────────
-- Enums
-- ───────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin', 'developer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ───────────────────────────────
-- Profiles table
-- ───────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  email       text NOT NULL,
  avatar_url  text,
  role        user_role NOT NULL DEFAULT 'student',
  status      user_status NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ───────────────────────────────
-- Updated_at auto-maintenance
-- ───────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────
-- Auto-create profile on signup
-- ───────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    'student',
    'active'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ───────────────────────────────
-- Role-reading helper (SECURITY DEFINER)
-- ───────────────────────────────

CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;

-- ───────────────────────────────
-- Row Level Security
-- ───────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: own profile OR admin/developer
DROP POLICY IF EXISTS "select_own_or_admin" ON profiles;
CREATE POLICY "select_own_or_admin"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR get_current_user_role() IN ('admin', 'developer')
  );

-- No INSERT policy → regular users cannot insert (deny-by-default).
-- The SECURITY DEFINER trigger bypasses RLS to create profiles.

-- UPDATE: own profile OR admin/developer (full access)
DROP POLICY IF EXISTS "update_own_or_admin" ON profiles;
CREATE POLICY "update_own_or_admin"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR get_current_user_role() IN ('admin', 'developer')
  )
  WITH CHECK (
    id = auth.uid()
    OR get_current_user_role() IN ('admin', 'developer')
  );

-- DELETE: admin/developer only
DROP POLICY IF EXISTS "delete_admin_only" ON profiles;
CREATE POLICY "delete_admin_only"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    get_current_user_role() IN ('admin', 'developer')
  );

-- ───────────────────────────────
-- Prevent non-admins from changing role/status
-- ───────────────────────────────

CREATE OR REPLACE FUNCTION prevent_role_status_change()
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
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'You are not allowed to change your role';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'You are not allowed to change your status';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_role_status_guard ON profiles;
CREATE TRIGGER enforce_role_status_guard
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_status_change();
