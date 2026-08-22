# GILSE AI Context

## Project

Global Institute for Learning Support and Education (GILSE)

## Purpose

GILSE is a global learning-support and education platform focused on
learning difficulties, educational courses, learner support, instructors,
and related educational services.

## Source of Truth

The GitHub repository is the shared source of truth for the project.

Before making changes, every AI agent must read:
- AI_CONTEXT.md
- ARCHITECTURE.md
- DATABASE.md when database-related work is involved
- ROADMAP.md when implementing planned features
- CHANGELOG.md for recent project history

## Core Rules

1. Do not delete existing functionality without explicit authorization.
2. Do not overwrite existing work without first understanding it.
3. Do not introduce secrets, passwords, API keys, or private credentials.
4. Do not make major architectural changes without documenting them.
5. Keep changes limited to the assigned task.
6. Preserve existing functionality unless the task explicitly requires a change.
7. Test changes before considering a task complete.
8. Update documentation when a significant architectural decision changes.
9. Do not assume a local copy is newer than the GitHub repository.
10. When uncertain, stop and request clarification rather than making destructive changes.

## AI Agent Registry

### ChatGPT
Role: Architecture, planning, code review, debugging, documentation.
Authority: High.

### Bolt
Role: Full-stack implementation.
Authority: Medium.

### Lovable
Role: UI/UX and application implementation.
Authority: Medium.

### v0
Role: UI and component prototyping.
Authority: Low.

### Replit
Role: Experimentation, testing, and implementation support.
Authority: Low.

## Collaboration Flow

IDEA
→ TASK
→ ASSIGNMENT
→ IMPLEMENTATION
→ TEST
→ REVIEW
→ PULL REQUEST
→ APPROVAL
→ MERGE
→ MAIN
→ DEPLOY

## Golden Rule

No AI agent may treat its own local version as the authoritative version
of the project.

GitHub main is the canonical project state.
