# GILSE Roadmap

## Current Baseline — September 2026

The `integration` branch is the active development and validation branch.
The application foundation, Supabase schema, authentication, course catalog,
paid-first registration, payment verification architecture, instructor draft
course management, certificates, referrals, RLS hardening, and automated CI
validation are implemented.

`main` remains the protected release branch and is not changed during this
validation cycle.

## Completed Foundation

- [x] GitHub repository and shared AI documentation
- [x] Vite + React + TypeScript + Tailwind application foundation
- [x] Supabase client and AuthContext
- [x] Profiles and server-controlled roles
- [x] RLS policies and database security hardening
- [x] Course/module/lesson schema and administration UI
- [x] Public published-course catalog
- [x] Student dashboard and enrollment model
- [x] Instructor registration and instructor draft-course management
- [x] Paid-first student registration
- [x] Paid-first instructor registration with $100 onboarding fee
- [x] Server-side TRON/USDT payment verification architecture
- [x] Paid-course enrollment protection at database level
- [x] Instructor 50% revenue-share records
- [x] Referral attribution and reward integrity controls
- [x] Certificate records and public verification view
- [x] Protected lesson content and preview/catalog views
- [x] Dependency audit, lint, build/type-check, and automated tests in CI
- [x] Repeated database integrity and RLS security validation

## Remaining Production Configuration

- [ ] Configure a real production receiving wallet through an authorized administrator
- [ ] Verify the final production payment configuration before accepting real payments
- [ ] Create and publish the first real paid course with complete modules/lessons
- [ ] Perform an end-to-end production payment test using a real authorized test transaction
- [ ] Enable Supabase leaked-password protection in Auth settings
- [ ] Complete accessibility and cross-browser review
- [ ] Configure production domain and deployment environment
- [ ] Establish operational monitoring and backup procedures appropriate to the deployment

## Education Features to Complete

- [ ] Full lesson player route and learning experience
- [ ] Lesson progress persistence and completion rules
- [ ] Assessments and assessment results
- [ ] Course completion calculation
- [ ] Automated certificate issuance on completion
- [ ] Instructor learner-management views
- [ ] Richer instructor course/module/lesson authoring workflow

## Internationalization

- [ ] Centralized i18n framework
- [ ] Arabic and English production translations
- [ ] Additional target languages
- [ ] Full RTL verification
- [ ] Language-aware course content model

## Quality Gates

A feature is not considered release-ready until:

1. Type-check/build passes.
2. Lint passes with zero warnings treated as errors.
3. Automated tests pass.
4. Dependency audit reports no high-severity vulnerabilities.
5. Relevant Supabase RLS/security/integrity checks pass.
6. No production secret is committed to the repository.
7. Critical payment and enrollment paths are tested for both allow and deny cases.

## Release Rule

Only changes that pass the integration quality gates and the final manual
production checklist may be promoted from `integration` to `main`.
