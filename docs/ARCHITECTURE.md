# GILSE Architecture

## Project

Global Institute for Learning Support and Education (GILSE)

A full-stack Learning Management System (LMS) focused on learning-support
courses, learner support, instructors, certificates, multilingual content,
and crypto/QR payments with blockchain transaction verification.

---

## Repository Structure

```
GILSE-Learning-Platform/
├── docs/
│   ├── AI_CONTEXT.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── ROADMAP.md
│   └── CHANGELOG.md
├── tasks/
├── src/
├── supabase/
│   ├── migrations/
│   └── functions/
├── tests/
├── .gitignore
└── README.md
```

---

## A. Current Architecture

As of this audit (2026-08-24), the repository contains **only the project
foundation**. There is no application code yet.

### What exists

| Layer            | Status                                                                 |
|------------------|------------------------------------------------------------------------|
| Documentation    | Complete initial set (AI_CONTEXT, ARCHITECTURE, DATABASE, ROADMAP, CHANGELOG) |
| Source code      | None — `src/` is planned but empty                                     |
| Supabase project | Provisioned; URL and anon key present in `.env`                       |
| Database schema  | Empty — no tables, no migrations applied                              |
| Edge Functions   | None deployed                                                          |
| Auth             | Not configured                                                          |
| i18n             | Not implemented                                                         |
| Payments         | Not implemented                                                         |
| Tests            | None                                                                   |

### What does NOT exist

- No `package.json`, no framework, no build tooling.
- No routes, components, or styles.
- No authentication, no RLS policies, no database calls.
- No course, module, lesson, certificate, or payment systems.
- No internationalization (i18n) or RTL support.
- No state management.
- No API/backend functions beyond the provisioned (empty) Supabase project.

### Provisioned environment

The Supabase project is provisioned and ready. The following are available
in `.env` (and must never be committed):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The service-role key is available in the host environment but is **not**
stored in `.env` and must never appear in the repository.

---

## B. Target Architecture

GILSE will be a **real, full-stack LMS** — not a UI prototype. Every
feature must be connected to the backend and database where appropriate.

### High-level diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Clients                              │
│  Desktop · Tablet · Mobile (responsive PWA-ready)       │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────┐
│              Frontend (Vite + React + TS)                │
│  Routing · Components · State · i18n (20 langs) · RTL    │
└──────────────────────────┬──────────────────────────────┘
                           │ Supabase JS SDK (anon key)
┌──────────────────────────▼──────────────────────────────┐
│                    Supabase Platform                      │
│  ┌──────────┐  ┌────────────┐  ┌───────────────────────┐ │
│  │   Auth   │  │ PostgreSQL │  │    Edge Functions     │ │
│  │ (GoTrue) │  │  + RLS     │  │ (payment verification, │ │
│  │          │  │            │  │  enrollment, certs)   │ │
│  └──────────┘  └────────────┘  └───────────────────────┘ │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│        External Blockchain / Payment Network             │
│  (crypto transaction verification, QR payments)         │
└─────────────────────────────────────────────────────────┘
```

### Core entity hierarchy

```
Course
 ├── Modules
 │    ├── Lessons
 │    ├── Lessons
 │    └── ...
 └── ...

Student ──► Enrollment ──► Course
                          ├── Progress (per lesson)
                          ├── Assessment results
                          └── Certificate (on completion)

Developer/Admin ──► Manage: Courses, Modules, Lessons,
                    Users, Payments, Certificates, Analytics
```

### Design principles

- **Full-stack by default.** No feature is "done" because it renders in the
  UI. Every feature must persist to and read from the database.
- **Centralized i18n.** A single translation system drives all 20 languages
  and RTL layout. Content is multilingual and dynamic.
- **Secure by design.** Row Level Security on every table. Roles enforced
  server-side. Secrets never in the repo.
- **Separation of concerns.** UI, application logic, data access, and
  infrastructure stay in distinct layers.
- **Scalable without over-engineering.** Prefer simple, maintainable
  solutions. Add complexity only when a concrete requirement demands it.
- **Configurable course structure.** Courses default to 90 hours but the
  hour count is configurable per course.

---

## C. Frontend Architecture

### Framework

- **Vite** as the build tool and dev server.
- **React** with **TypeScript** for type safety.
- **Tailwind CSS** for styling (utility-first, theme-driven, responsive).

### Routing

- **React Router** (or equivalent) with nested, protected routes.
- Route guards based on auth state and role:
  - `/` — public landing page
  - `/courses` — public course catalog
  - `/login`, `/signup` — auth
  - `/dashboard` — student dashboard (role: student)
  - `/admin` — admin dashboard (role: admin/developer)
  - `/admin/courses`, `/admin/courses/:id/modules`,
    `/admin/courses/:id/modules/:id/lessons` — management
  - `/courses/:id` — course detail / enrollment
  - `/courses/:id/learn` — lesson player + progress
  - `/certificates/:id` — certificate view

### Components

- Organized by cohesion, not by type.
- Reusable UI primitives (Button, Card, Modal, Input, Table, etc.) in a
  shared `components/ui/` directory.
- Feature components (CourseCard, LessonPlayer, ProgressBar, Certificate)
  in their feature directories.
- Single Responsibility Principle per view: a view does one thing (view,
  edit, manage).

### State management

- **Server state**: Supabase queries via React hooks
  (`@supabase/auth-helpers` or direct client + custom hooks). Caching and
  invalidation through a lightweight layer (e.g., TanStack Query) when
  needed.
- **Client/UI state**: React `useState` / `useReducer` and Context for
  cross-cutting concerns (auth session, current language, theme).
- No global mutable singletons. State flows through explicit props and
  hooks.

### Internationalization (i18n)

- **Centralized** translation system — one source of truth for all strings.
- Target: **20 languages** (Arabic, English, Spanish, Turkish, Japanese,
  and 15 additional major languages).
- Translation files live in `src/locales/<lang>/`.
- Language switcher in the UI; preference persisted to user profile.
- **Dynamic multilingual content**: course titles, descriptions, lesson
  content stored per-language in the database (see Data Flow).

### RTL support

- Full **right-to-left** layout for Arabic and other RTL languages.
- Driven by the active language; `dir="rtl"` applied at the document level.
- Tailwind logical properties (e.g., `ps-`, `pe-`, `ms-`, `me-`) so layout
  flips automatically.
- Icons and directional UI elements adapt to writing direction.

### Responsive design

- Mobile-first, breakpoints from mobile → tablet → desktop.
- 8px spacing system.
- Touch-friendly targets on mobile; rich layouts on desktop.
- No feature is desktop-only; every flow works on all three form factors.

---

## D. Backend Architecture

### Supabase (primary backend)

Supabase provides auth, database, storage, and edge functions in one
platform. GILSE uses it as the single backend.

### Authentication

- **Supabase Auth (GoTrue)**, email/password by default.
- Email confirmation OFF during development (toggle for production).
- No magic links or social providers unless explicitly requested.
- Session managed via the Supabase JS client; `onAuthStateChange` used
  with a deadlock guard (see bolt-database skill).
- Roles stored in a `profiles` table, not in JWT `user_metadata` (which
  is user-editable and unsafe for authorization).

### Database

- **PostgreSQL** via Supabase.
- Schema defined through versioned migrations in `supabase/migrations/`.
- Core tables (planned, not yet created):

| Table                       | Purpose                                           |
|-----------------------------|---------------------------------------------------|
| `profiles`                  | One row per auth user; role, display name, locale |
| `courses`                   | Course metadata; configurable hours (default 90)  |
| `course_translations`       | Per-language title/description                    |
| `modules`                   | Modules within a course                           |
| `module_translations`       | Per-language module content                       |
| `lessons`                   | Lessons within a module                           |
| `lesson_translations`       | Per-language lesson content                       |
| `enrollments`               | Student ↔ course link; status                     |
| `lesson_progress`           | Per-lesson completion tracking                    |
| `assessments`               | Assessments tied to lessons/courses               |
| `assessment_results`        | Student assessment attempts and scores            |
| `certificates`             | Issued certificates on course completion         |
| `payments`                  | Payment records; status, tx hash, method          |
| `payment_verifications`     | Blockchain transaction verification records       |

### Row Level Security (RLS)

- **RLS enabled on every table.** No exceptions.
- Four policies per table (SELECT, INSERT, UPDATE, DELETE) — never
  `FOR ALL`.
- Ownership via `auth.uid()` for student-owned data.
- Admin/developer role checked via a `profiles.role` column (never
  `user_metadata`).
- Public/shared data (e.g., published course catalog) uses scoped
  `USING` predicates, never a blanket `true` unless the data is
  intentionally public.

### Edge Functions

Used for operations that must run with elevated privileges or that talk
to external services:

| Function (planned)                | Responsibility                                      |
|-----------------------------------|-----------------------------------------------------|
| `verify-blockchain-payment`       | Verify a crypto transaction on-chain before enrollment |
| `process-enrollment`              | Create enrollment after verified payment            |
| `issue-certificate`               | Generate and persist a certificate on completion    |
| `qr-payment-intent`               | Create a QR payment intent                          |

- Every function includes the mandatory CORS header set.
- Functions use the service-role key server-side only; never exposed to
  the client.
- `verify_jwt: true` for functions called by authenticated users;
  `false` only for webhooks.

---

## E. Data Flow

### General request flow

```
User action
  → Frontend (React) updates UI optimistically
  → Supabase JS client (anon key) sends request
  → Supabase Auth validates JWT
  → PostgreSQL evaluates RLS policy
  → Data returned (or denied)
  → Frontend updates UI from real result
  → Error state shown if request fails (never silent)
```

### Read example: course catalog

```
Student opens /courses
  → Client queries `courses` + `course_translations`
  → RLS SELECT policy allows published courses for all viewers
  → Client renders CourseCards in the student's locale
```

### Write example: lesson progress

```
Student completes a lesson
  → Client inserts into `lesson_progress` (user_id = auth.uid())
  → RLS INSERT policy checks auth.uid() = user_id
  → Progress persisted; course completion recalculated
  → If course complete → trigger certificate issuance (Edge Function)
```

### Payment → Enrollment flow (critical path)

```
1. Student selects a course and chooses a payment method
   (crypto or QR).

2. Frontend calls Edge Function `qr-payment-intent`
   (or initiates crypto transfer directly) → returns intent / address.

3. Student completes payment on the external network.

4. Frontend (or webhook) calls Edge Function
   `verify-blockchain-payment` with the transaction hash.

5. Edge Function (service-role, server-side):
   a. Queries the blockchain / payment network for the tx.
   b. Confirms: amount, recipient address, status = confirmed.
   c. Writes a `payment_verifications` record.
   d. Updates `payments.status` to `verified`.

6. Edge Function `process-enrollment`:
   a. Checks payment is verified and belongs to this user/course.
   b. Creates an `enrollments` row (status = active).
   c. Returns success.

7. Frontend redirects student to `/dashboard` with active enrollment.

   ┌──────┐   ┌─────────┐   ┌────────────┐   ┌──────────────┐   ┌────────────┐
   │Student│→ │ Frontend │→ │Edge Function│→ │ Blockchain   │→ │ Enrollment  │
   └──────┘   └─────────┘   │verify-pay  │   │ (on-chain tx)│   │ (DB row)    │
                            └────────────┘   └──────────────┘   └────────────┘
                                  │
                                  ▼
                            payments.status = verified
                            payment_verifications row
```

Key rule: **enrollment never happens before verified payment.** The
verification is server-side and atomic; the client cannot self-enroll.

### Certificate flow

```
Course completion detected (all lessons + assessments passed)
  → Edge Function `issue-certificate`
  → Generates certificate record (unique ID, issue date, course, student)
  → Certificate viewable at /certificates/:id
  → QR code on certificate links back to a verification endpoint
```

---

## F. Security Architecture

### Authentication

- Supabase Auth (email/password). JWT issued by GoTrue.
- Session stored and refreshed by the Supabase JS client.
- `onAuthStateChange` used with a guard to avoid deadlocks (see
  bolt-database skill).

### Authorization & Roles

Three roles, stored in `profiles.role` (server-controlled, never
client-editable):

| Role              | Capabilities                                              |
|-------------------|----------------------------------------------------------|
| `student`         | Browse catalog, enroll (after payment), view own progress & certificates |
| `instructor`      | Manage own courses/modules/lessons, view enrolled students |
| `admin`/`developer`| Full management: users, courses, payments, analytics    |

- Role checked via RLS policies and Edge Function logic — never trusted
  from the client.
- `user_metadata` is **not** used for authorization (it is user-editable).

### Row Level Security

- Enabled on every table.
- Per-verb policies (SELECT/INSERT/UPDATE/DELETE).
- `auth.uid()` ownership checks for student data.
- Admin policies check `profiles.role = 'admin'` via a join or
  SECURITY DEFINER function.
- No blanket `USING (true)` except for intentionally public data.

### Secrets

- `.env` is gitignored and never committed.
- Service-role key stays server-side (Edge Functions only); never shipped
  to the browser.
- No passwords, API keys, or tokens in the repository.
- `.env.example` may list variable names without values.

### Payment verification

- Crypto payments verified **on-chain** by an Edge Function using the
  service-role key.
- Verification checks: transaction exists, amount matches, recipient is
  the expected address, status is confirmed.
- Verification result persisted to `payment_verifications`.
- Enrollment is a **separate, dependent step** — only after verified
  payment.

### Blockchain verification

- The Edge Function queries the relevant blockchain network (via a public
  RPC or indexer API) for the supplied transaction hash.
- Only server-side code performs verification; the client supplies the
  hash but never decides validity.
- A `payment_verifications` row is the audit record: tx hash, chain, amount,
  verified-at, verifier function version.

### Input validation

- Client-side validation for UX; **server-side validation** for security.
- Edge Functions validate all inputs at the boundary.
- SQL injection mitigated by using the Supabase client and parameterized
  queries (no string-concatenated SQL).

---

## G. Integration Architecture

### How the pieces connect

```
┌──────────────────────────────────────────────────────────────┐
│                        Frontend (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Routing │  │  i18n    │  │  State   │  │  Components  │  │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └──────┬───────┘  │
│        │             │            │              │            │
│        └─────────────┴────────────┴──────────────┘            │
│                          │ Supabase Client (anon)              │
└──────────────────────────┼────────────────────────────────────┘
                           │
┌──────────────────────────▼────────────────────────────────────┐
│                      Supabase Platform                         │
│  ┌─────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Auth   │  │  PostgreSQL  │  │    Edge Functions        │  │
│  │ (GoTrue)│  │   + RLS      │  │  - verify-payment        │  │
│  │         │  │  (tables)    │  │  - process-enrollment    │  │
│  └─────────┘  └──────────────┘  │  - issue-certificate     │  │
│                                │  - qr-payment-intent      │  │
│                                └─────────────┬────────────┘  │
└──────────────────────────────────────────────┼────────────────┘
                                               │ service-role (server only)
                          ┌────────────────────▼──────────────────┐
                          │   Blockchain / Payment Network         │
                          │   (on-chain transaction verification) │
                          └───────────────────────────────────────┘
```

### Frontend ↔ Supabase

- The browser uses the **anon key** only. RLS enforces what each user can
  do.
- Auth state drives route guards and UI.
- Realtime (Supabase Realtime) may be used later for live progress or
  admin notifications, with membership-checked channels.

### Supabase ↔ Blockchain

- Edge Functions hold the service-role key and call blockchain RPC/indexer
  APIs.
- The allowlist of outbound endpoints is restricted to known blockchain
  providers.
- No client ever talks to the blockchain directly for verification
  purposes.

### Certificates

- Issued by an Edge Function after course completion is confirmed.
- Stored in `certificates` with a unique, shareable ID.
- A QR code on the certificate links to a public verification route that
  reads the certificate record (read-only, public SELECT policy).
- Certificate authenticity = the database record, not a client-side claim.

### i18n integration

- **UI strings**: centralized translation files in `src/locales/<lang>/`.
- **Dynamic content**: course/module/lesson text stored in
  `*_translations` tables, selected by the user's locale.
- The active language sets both the UI translation bundle and the
  database locale filter.
- RTL is driven by the active language, not a separate toggle.

---

## Change Policy

Major architectural changes must be documented in this file and recorded
in `CHANGELOG.md`.

No AI agent should independently replace the project's architecture.

When a significant decision changes, update this document in the same
change that implements it.

---

## Open Items for Subsequent Agents

The following are **not** implemented yet and are assigned to later tasks.
This document defines the target so each agent builds toward the same
architecture:

1. Application foundation (Vite + React + TS + Tailwind scaffold).
2. Authentication + `profiles` table + RLS.
3. Course/Module/Lesson schema and management UI.
4. Student dashboard + progress tracking.
5. Assessment system.
6. Certificate issuance.
7. Centralized i18n (20 languages) + RTL.
8. Crypto/QR payment integration + blockchain verification.
9. Admin dashboard + analytics.
10. Automated tests, security review, accessibility review.

Each of these must be full-stack (backend + database + UI) and must follow
the security and data-flow rules defined above.
