# GILSE Learning Platform

## Global Institute for Learning Support and Education

**GILSE** is a learning-support and education platform designed to provide
educational courses, learner support, instructor tools, certificates, and
related educational services.

## Project Status

🟢 **Active integration build under continuous validation.**

The `integration` branch contains the current application foundation,
Supabase-backed LMS flows, paid-first registration architecture, payment
verification, instructor revenue tracking, certificate verification, and
security/RLS hardening.

`main` remains protected as the canonical release branch and is not modified
as part of routine integration work.

## Core Flows

- Public course catalog with published-course visibility.
- Paid-first student registration: a student selects a paid course and the
  account is created only after the registration payment is verified.
- Paid-first instructor registration with a fixed $100 onboarding fee.
- Instructor draft course management with a fixed 50% instructor share.
- Server-side TRON/USDT transaction verification.
- Paid-course enrollment protected at database level.
- Protected lesson content with public preview/catalog metadata.
- Student certificate records and public certificate verification.
- Referral attribution and reward integrity controls.
- Administrator/developer management routes and payment/reward oversight.

## Repository Structure

- `docs/` — Project documentation and AI collaboration protocol
- `tasks/` — Assigned development tasks
- `src/` — React + TypeScript application source
- `supabase/` — Database migrations, Edge Functions, and configuration
- `tests/` — Automated testing resources

## AI Collaboration

All AI agents working on GILSE must read:

1. `docs/AI_CONTEXT.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DATABASE.md` when relevant
4. `docs/ROADMAP.md`
5. `docs/CHANGELOG.md`

## Security

Never commit:

- Passwords
- API keys
- Access tokens
- Private credentials
- Production payment secrets

Service-role/secret credentials remain server-side. Frontend access uses the
least-privilege Supabase client with RLS. Sensitive registration and payment
records are not directly exposed through the public Data API.

## Validation

The `integration` branch is the active validation branch. Every change is
checked by GitHub Actions for dependency vulnerabilities, linting,
build/type-checking, and automated tests. The CI workflow also performs
three consecutive local validation passes before a run can succeed.

Database migrations are versioned and must remain synchronized with the
deployed Supabase project. Database integrity and RLS checks are also run
during the development audit process.

## Important Configuration

A real production receiving wallet must be configured by an authorized
administrator before real payment collection is enabled. No wallet address
or private payment credential is hard-coded in the repository.

GILSE-issued certificates are described as digitally verifiable GILSE
certificates. Claims of Oxford accreditation/affiliation must only be added
when supported by formal documentation.
