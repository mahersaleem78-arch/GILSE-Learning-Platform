# GILSE Database

## Database Platform

Supabase/PostgreSQL is the primary backend and database platform.

## Current Status

The production database includes profiles, courses/modules/lessons, enrollments, payment configuration, payments, referral configuration/rewards, and audit logging. Payment verification is performed by the deployed `verify-tron-payment` Edge Function.

## Payment and Referral Entities

- `payment_config` — active USDT/TRON receiving configuration and referral reward amount.
- `payments` — student payment requests, course/amount snapshot, destination wallet, transaction hash, verification state and timestamps.
- `referral_rewards` — $40 referral rewards created only after verified payment and controlled through administrator approval/payout states.
- `audit_log` — security/audit events for payment verification and administrative activity.
- `profiles.referral_code` / `profiles.referred_by` — referral attribution.
- `enrollments` — course access; paid-course enrollment is guarded by verified payment.

## Security Rules

1. Never commit passwords, service-role keys, wallet private keys, or API secrets.
2. Payment amount, asset, network and receiving wallet are derived from trusted database configuration/course data.
3. Students cannot set a payment to `verified`; transaction verification is performed server-side by the Edge Function.
4. Paid-course enrollment requires an existing verified payment for the same student/course.
5. Transaction hashes are unique.
6. Referral attribution cannot be changed after signup by students.
7. Self-referrals and self-referral rewards are rejected at database level.
8. Referral reward transitions are limited to `pending_approval -> approved/rejected -> paid` and are administrator-only.
9. RLS and database triggers remain authoritative even if the frontend is bypassed.
10. Database migrations are committed to `supabase/migrations/` and must be applied before relying on the corresponding protections.

## Payment Flow

`CourseDetailPage` → payment request → USDT/TRON transfer → transaction hash → `verify-tron-payment` → recipient/token/amount/confirmation checks → payment `verified` → enrollment activation → referral reward creation → audit log.

## Migrations

Payment/referral work is represented by migrations `0003` through `0007`, with `0007` adding paid-enrollment and referral-integrity hardening.
