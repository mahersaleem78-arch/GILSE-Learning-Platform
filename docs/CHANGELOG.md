# GILSE Changelog

## 2026-08-22

### Added

- Created private GILSE GitHub repository.
- Created shared AI project context.
- Created architecture documentation.
- Created database planning documentation.
- Created project roadmap.
- Established initial AI collaboration principles.

### Status

The repository contains the initial project foundation.

The previous GILSE website code has intentionally not been imported yet.

## 2026-08-24

### Changed

- Rewrote `docs/ARCHITECTURE.md` as the production architecture document
  (Bolt Agent #1 — Task 01: Foundation & Architecture Audit).
- Updated "Current Architecture" section to note the empty
  `package-lock.json` scaffold (no `package.json`, no dependencies).

### Added

- Documented current architecture state: foundation only, no application
  code, empty Supabase database.
- Documented target architecture: full-stack LMS with Vite + React + TS +
  Tailwind frontend, Supabase backend, crypto/QR payments with blockchain
  verification.
- Documented frontend architecture: routing, components, state management,
  centralized i18n (20 languages), full RTL, responsive design.
- Documented backend architecture: Supabase Auth, PostgreSQL schema plan,
  RLS policy rules, Edge Functions for payment verification, enrollment,
  and certificate issuance.
- Documented data flow: general request flow, course catalog read, lesson
  progress write, and the critical payment → blockchain verification →
  enrollment path.
- Documented security architecture: auth, role-based authorization,
  RLS, secrets handling, payment verification, blockchain verification,
  input validation.
- Documented integration architecture: frontend ↔ Supabase, Supabase ↔
  blockchain, certificates, and i18n integration.
- Listed open items for subsequent agents (foundation scaffold, auth,
  courses, dashboard, assessments, certificates, i18n, payments, admin,
  tests).

### Status

Architecture documentation is complete. No application code or database
schema has been created — that work is assigned to subsequent agents per
the roadmap.

## 2026-08-24 — Bolt Agent #2 — Application Foundation completed

### Added

- Created the full Vite + React + TypeScript + Tailwind CSS application
  scaffold (`package.json`, `vite.config.ts`, `tsconfig.json`,
  `tailwind.config.js`, `postcss.config.js`, `index.html`).
- Created centralized Supabase client (`src/lib/supabase.ts`) using
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` — no secrets in frontend.
- Created `AuthContext` / `AuthProvider` with `session`, `user`, `loading`,
  `signIn`, `signUp`, `signOut` backed by Supabase Auth.
- Created `ProtectedRoute` and `RoleProtectedRoute` (roles: student,
  admin, developer, instructor) — structurally ready for Task 03.
- Created four layouts: `PublicLayout`, `AuthLayout`, `StudentLayout`,
  `AdminLayout`.
- Created nine pages: Home, Courses, CourseDetail, Login, Signup,
  Dashboard, Admin, Certificate, NotFound.
- Created centralized TypeScript types for Profile, Course, Module,
  Lesson, Enrollment, LessonProgress, Assessment, AssessmentResult,
  Payment, PaymentVerification, Certificate.
- Created UI state components: `LoadingState`, `ErrorState`, `EmptyState`.
- Created `.env.example` with variable names only (no real values).
- Created test suite: Supabase client, routing, auth context, protected
  route — 10 tests, all passing.
- Created responsive design system with 6 color ramps (primary, secondary,
  accent, success, warning, error) plus neutral tones, 8px spacing,
  Inter + Plus Jakarta Sans fonts, and animation utilities.

### Routing

- `/` — public landing page
- `/courses` — public course catalog
- `/courses/:id` — course detail
- `/login` — auth login
- `/signup` — auth signup
- `/dashboard` — protected student dashboard
- `/admin` — role-protected admin dashboard
- `/certificates/:id` — public certificate view

### Build result

- `npm install` — success
- `npm run build` — success (tsc + vite build, 0 errors)
- `npm test` — 10/10 tests pass

### Remaining for next agent

- Create `profiles` table + RLS policies (Task 03).
- Wire `RoleProtectedRoute` to real profile role from database.
- Implement course/module/lesson schema and management UI.
- Implement centralized i18n (20 languages) + RTL.
- Implement payment + blockchain verification.
- Implement certificates, assessments, progress, analytics.

## 2026-08-24 — Bolt Agent #3 — Profiles, Roles and RLS completed

### Added

- Created Supabase migration `0001_create_profiles_table` (applied via
  Supabase MCP `apply_migration`).
- Created `user_role` enum: `student`, `instructor`, `admin`, `developer`.
- Created `user_status` enum: `active`, `suspended`.
- Created `profiles` table:
  - `id` UUID PK → `auth.users(id)` ON DELETE CASCADE
  - `full_name` text (nullable)
  - `email` text NOT NULL
  - `avatar_url` text (nullable)
  - `role` user_role NOT NULL DEFAULT 'student'
  - `status` user_status NOT NULL DEFAULT 'active'
  - `created_at`, `updated_at` timestamptz
- Created `handle_new_user()` SECURITY DEFINER function + trigger
  `on_auth_user_created` — automatically inserts a profile row when a
  new user signs up via Supabase Auth. No frontend profile creation needed.
- Created `get_current_user_role()` SECURITY DEFINER function — returns
  the caller's role from `profiles`, bypassing RLS. Granted EXECUTE to
  `authenticated`.
- Created `update_updated_at_column()` trigger function for auto-updating
  `updated_at` on UPDATE.
- Created `prevent_role_status_change()` SECURITY DEFINER trigger —
  blocks non-admin/developer users from changing `role` or `status`
  columns. Raises an exception if they attempt it.

### RLS Policies

- RLS enabled on `profiles`.
- **SELECT** (`select_own_or_admin`): users can read their own profile;
  admin/developer can read all profiles.
- **INSERT**: no INSERT policy (deny-by-default). Profiles are created
  exclusively by the SECURITY DEFINER trigger — users cannot insert
  directly.
- **UPDATE** (`update_own_or_admin`): users can update their own profile;
  admin/developer can update any profile. The `prevent_role_status_change`
  trigger additionally blocks non-admins from modifying `role` or `status`.
- **DELETE** (`delete_admin_only`): admin/developer only.

### Frontend integration

- Updated `AuthContext` to fetch the user's profile from the `profiles`
  table on session establish / auth state change. Exposes `profile` and
  `role` in the auth context value.
- Used the `onAuthStateChange` deadlock-guard pattern (async work wrapped
  in an IIFE) as required by the bolt-database skill.
- Replaced the placeholder `const currentRole = null` in
  `RoleProtectedRoute` with the real `role` from `useAuth()`. The route
  guard now redirects based on the actual database role.
- Updated `DashboardPage` to display `full_name` (falling back to email)
  from the profile.
- Updated `AuthContextValue` type to include `profile: Profile | null`
  and `role: UserRole | null`.
- Updated `Profile` type to match the actual schema: `full_name` (was
  `display_name`), `status` (new), removed `locale` (not in schema yet).

### Tests

- Updated `auth-context.test.tsx` to verify `profile` and `role` fields
  are exposed (null when no session).
- Created `role-protected-route.test.tsx` — 4 tests covering:
  - Redirect to /login when no user
  - Redirect to /dashboard when role is not allowed (student → admin route)
  - Render children when role is allowed (admin)
  - Show loading state while loading
- All existing tests continue to pass.

### Build result

- `npm run build` — success (tsc + vite build, 0 errors)
- `npm test` — 15/15 tests pass (5 test files)

### Security notes

- No secrets in frontend code. No service-role key in `.env` or anywhere
  in the repo.
- Role is read from the database via `get_current_user_role()` / profile
  query — never from localStorage or client-side state.
- Users cannot change their own role or status — enforced at the database
  level by trigger, not just in the UI.
- RLS is enabled and no `USING (true)` blanket policies are used.
- Profile creation is server-side only (SECURITY DEFINER trigger); no
  client INSERT path exists.

### Remaining for next agent

- Implement course/module/lesson schema and management UI.
- Implement centralized i18n (20 languages) + RTL.
- Implement payment + blockchain verification.
- Implement certificates, assessments, progress, analytics.
- Admin UI for managing user roles and statuses.

## 2026-08-25 — Bolt Agent #5 — Enrollment + Student Dashboard completed

### Added

- Created Supabase migration `0003_create_enrollments_table` (applied via
  Supabase MCP `apply_migration`).
- Created `enrollment_status` enum: `active`, `completed`, `cancelled`.
- Created `enrollments` table:
  - `id` UUID PK → default gen_random_uuid()
  - `student_id` UUID NOT NULL → profiles(id) ON DELETE CASCADE, default auth.uid()
  - `course_id` UUID NOT NULL → courses(id) ON DELETE CASCADE
  - `status` enrollment_status NOT NULL DEFAULT 'active'
  - `enrolled_at` timestamptz NOT NULL DEFAULT now()
  - `completed_at` timestamptz (nullable)
  - `created_at`, `updated_at` timestamptz
- Created UNIQUE index on (student_id, course_id) — prevents duplicate
  enrollment for the same student/course combination.
- Created `prevent_enrollment_owner_change()` SECURITY DEFINER trigger —
  blocks non-admin/developer users from changing `student_id` or `course_id`
  on UPDATE. Raises an exception if they attempt it.
- Created enrollment service layer (`src/services/enrollments.ts`):
  - `enrollStudent()` — checks for existing enrollment, then inserts;
    handles unique constraint violation (23505) gracefully.
  - `getStudentEnrollments()` — fetches enrollments with joined course data.
  - `getEnrollmentByCourse()` — checks enrollment for a specific course.
  - `isStudentEnrolled()` — boolean check.
  - `updateEnrollmentStatus()` — updates status and completed_at.
- Updated `CourseDetailPage` with full enrollment flow:
  - Shows "Enroll now" button for authenticated, non-enrolled students.
  - Shows enrolled state with enrollment date and "Go to dashboard" link.
  - Shows sign-in prompt for unauthenticated users.
  - Handles loading and error states during enrollment.
  - Prevents duplicate enrollment (service + DB constraint).
- Upgraded `DashboardPage` with real Supabase data:
  - Student profile summary with avatar initial, name, and email.
  - Enrolled courses with course title, description, thumbnail, hours,
    enrollment date, enrollment status badge, and "Continue course" action.
  - Progress placeholder architecture (0% bar) ready for Bolt #7.
  - Loading, empty, and error states.

### RLS Policies

- RLS enabled on `enrollments`.
- **SELECT** (`select_own_or_admin`): students read their own enrollments;
  admin/developer read all.
- **INSERT** (`insert_own_or_admin`): students can self-enroll
  (student_id = auth.uid()); admin/developer can enroll anyone.
- **UPDATE** (`update_own_or_admin`): students update own enrollments;
  admin/developer update any. Ownership fields (student_id, course_id)
  protected by trigger.
- **DELETE** (`delete_admin_only`): admin/developer only.

### Tests

- Created `enrollments-service.test.ts` — 12 tests covering:
  - enrollStudent check-then-insert flow
  - duplicate enrollment detection (check + DB constraint)
  - DB error rethrowing
  - getStudentEnrollments, getEnrollmentByCourse, isStudentEnrolled
  - updateEnrollmentStatus with completed_at logic
- Created `dashboard-page.test.tsx` — 4 tests covering:
  - Loading state
  - Empty state with browse-courses action
  - Enrolled courses display with progress placeholder
  - Error state with retry
- Created `course-detail-enrollment.test.tsx` — 5 tests covering:
  - Sign-in prompt for unauthenticated users
  - Enroll button for authenticated non-enrolled users
  - Enrolled state for already-enrolled users
  - Successful enrollment flow
  - Enrollment error handling
- All existing tests continue to pass.

### Build result

- `npm run build` — success (tsc + vite build, 0 errors)
- `npm test` — 59/59 tests pass (12 test files)

### Security notes

- `student_id` defaults to `auth.uid()` so self-enrollment inserts that
  omit `student_id` satisfy the INSERT policy's WITH CHECK.
- Unique constraint is the database-level duplicate-enrollment guard.
- Ownership fields (student_id, course_id) cannot be changed by students —
  enforced at the database level by trigger.
- RLS is enabled and no `USING (true)` blanket policies are used.
- No secrets in frontend code.

### Remaining for next agent (Bolt #6+)

- Lesson player + lesson progress tracking (Bolt #7).
- Centralized i18n (20 languages) + RTL.
- Payment + blockchain verification.
- Certificates, assessments, analytics.
- Instructor dashboard.
- Admin UI for managing user roles and statuses.
- Production deployment.
