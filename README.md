# GILSE Learning Platform

## Global Institute for Learning Support and Education

**GILSE** is a learning-support and education platform designed to provide
educational courses, learner support, instructor tools, and related
educational services.

## Project Status

🚧 Initial project foundation.

The repository is currently being prepared before importing the existing
GILSE website.

## Repository Structure

- `docs/` — Project documentation and AI collaboration protocol
- `tasks/` — Assigned development tasks
- `src/` — Application source code
- `supabase/` — Backend and database configuration
- `tests/` — Automated and manual testing resources

## AI Collaboration

All AI agents working on GILSE must read:

1. `docs/AI_CONTEXT.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DATABASE.md` when relevant
4. `docs/ROADMAP.md`
5. `docs/CHANGELOG.md`

GitHub `main` is the canonical project state.

## Development Principle

No agent should remove or replace existing functionality without
understanding the current implementation and receiving authorization
for destructive changes.

## Security

Never commit:

- Passwords
- API keys
- Access tokens
- Private credentials
- Production secrets

## Validation

The `integration` branch is the active validation branch. Changes must pass
linting, type-checking/build, automated tests, dependency auditing, and the
relevant Supabase security/integrity checks before promotion to `main`.

Database security/RLS migrations are kept in `supabase/migrations/` and must remain synchronized with the deployed Supabase project.

Final validation marker: 2026-09-02.
