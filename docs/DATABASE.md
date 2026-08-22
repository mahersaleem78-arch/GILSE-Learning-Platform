# GILSE Database

## Database Platform

Supabase is planned as the primary backend and database platform.

## Current Status

The production database schema has not yet been finalized.

## Planned Core Entities

- Users
- Profiles
- Courses
- Course registrations
- Instructors
- Learning-support programs
- Certificates
- Administrative records
- Payments, if enabled

## Database Rules

1. Never commit passwords or private database credentials.
2. Never commit Supabase service-role keys.
3. Never commit API secrets.
4. Production credentials must remain outside Git.
5. Database migrations must be documented.
6. Destructive migrations require explicit review.
7. Changes to production data structures must be tested before deployment.

## Future Requirements

The database architecture should support:

- Secure authentication
- Role-based access
- Students
- Instructors
- Administrators
- Course management
- Registration
- Progress tracking
- Certificates
- Multilingual content
- Future integrations
