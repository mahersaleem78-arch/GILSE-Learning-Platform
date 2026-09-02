# GILSE Database

## Database Platform

Supabase/PostgreSQL is the primary backend and database platform.

## Current Production Schema

The production database currently contains:

- `profiles` — server-controlled user profile and role data.
- `courses` — public course catalog and instructor-owned draft courses.
- `modules` / `lessons` — course structure and learning content.
- `enrollments` — student/course access, protected by paid-course verification.
- `payment_config` — administrator-controlled USDT/TRON receiving configuration.
- `payments` — verified course-payment records.
- `referral_rewards` — referral rewards created only from eligible verified payments.
- `audit_log` — security and administrative audit events.
- `certificates` — issued certificates and public verification metadata.
- `registration_orders` — short-lived paid-first registration intents; token hashes only.
- `registration_payments` — verified registration-payment records.
- `instructor_payouts` — instructor revenue records with a fixed 50% share.

## Paid-First Registration

A new account is not created through a normal client-side Auth signup flow.

1. Student selects a published paid course, or an instructor selects instructor registration.
2. `create_registration_order` creates a short-lived registration order.
3. Payment is verified server-side by `verify-registration-payment`.
4. Only a verified, unexpired order may create an Auth user.
5. The Auth trigger creates the corresponding `profiles` row.
6. Student registration then creates the course enrollment and related verified payment/payout/referral records atomically in the completion flow.
7. Instructor registration creates an instructor profile after the fixed $100 onboarding payment is verified.

The database trigger rejects Auth-user creation when the required verified registration order is absent or inconsistent.

## Payment Security

- Payment amount, asset, network, and receiving wallet come from trusted database configuration/course data.
- Students cannot mark payments as verified.
- Blockchain verification is server-side.
- Paid-course enrollment requires a verified payment for the same student/course.
- Transaction hashes are unique.
- Registration payment tokens are stored only as SHA-256 hashes in the database.
- Registration-order and registration-payment tables are not directly readable/writable through the public Data API.
- Instructor payout records are not exposed to anonymous clients; authenticated clients have only the privileges required by their policies.

## Referral Security

- Referral attribution is normalized at registration.
- Self-referrals and self-referral rewards are rejected at database level.
- Referral reward transitions are administrator-controlled.

## Learning Content Security

- Base lesson content is protected by RLS.
- Public users can receive only published lesson catalog metadata and eligible preview content.
- Full lesson content is available only to authorized administrators, course instructors, or enrolled students as permitted by policy.
- Public views used by the frontend are configured with `security_invoker=true` so underlying RLS remains effective.

## Certificates

Certificate verification uses a safe public verification view rather than an anonymously executable `SECURITY DEFINER` function. GILSE certificates should be described as GILSE-issued, digitally verifiable certificates unless a separate formal accreditation/affiliation agreement is documented.

## RLS and API Grants

All current tables in the exposed `public` schema have RLS enabled. API grants are deliberately limited and are used together with RLS policies. Security-sensitive helper functions use fixed search paths and restricted execution privileges.

## Migrations

All database changes are versioned in `supabase/migrations/` and must remain synchronized with the deployed Supabase project. Migration numbering is append-only; existing applied migration numbers must never be renumbered.

The current migration history includes the original course/payment/referral/enrollment hardening plus the paid-registration, lesson-content, certificate, RLS-performance, and API-grant hardening migrations added during the September 2026 audit.

## Validation

Database integrity checks repeatedly verify:

- no orphan profiles/enrollments/payments/rewards/certificates;
- no duplicate enrollments or verified transaction hashes;
- no verified registration without a registration payment;
- no registration payment without a verified registration order;
- no payout without its payment;
- correct instructor/platform payout arithmetic;
- no legacy `students` table in `public`;
- no public table without RLS.

The latest three consecutive integrity passes returned zero failures for all of these checks.
