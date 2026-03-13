# Database Schema - Job Board Application

## Overview

This document describes the complete database schema for the job board application, including tables, columns, data types, constraints, and relationships.

---

## Enumerations

### `app_role`

| Value | Description |
|-------|-------------|
| `worker` | Worker/Job seeker role |
| `employer` | Employer/Job poster role |
| `admin` | Administrator role |

---

## Tables

### 1. `profiles`

User profile information linked to Supabase auth users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, REFERENCES `auth.users(id)` | User ID (foreign key to auth) |
| `full_name` | `TEXT` | | User's full name |
| `avatar_url` | `TEXT` | | URL to avatar image |
| `email` | `TEXT` | | User's email address |
| `phone` | `TEXT` | | User's phone number |
| `roles` | `TEXT[]` | DEFAULT `{}` | Array of roles user has |
| `categories` | `TEXT[]` | DEFAULT `{}` | Work categories |
| `availability_status` | `TEXT` | CHECK: `('open_for_work', 'open_for_visit', 'unavailable')` | Current availability |
| `gig_wage_daily` | `NUMERIC` | | Daily wage for gig work |
| `visiting_fee` | `NUMERIC` | | Fee for visiting clients |
| `is_verified` | `BOOLEAN` | DEFAULT `false` | Verification status |
| `bio` | `TEXT` | | User biography |
| `location_address` | `TEXT` | | Address string |
| `location_lat` | `DOUBLE PRECISION` | | Latitude coordinate |
| `location_lng` | `DOUBLE PRECISION` | | Longitude coordinate |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | Last update timestamp |

---

### 2. `user_roles`

Stores user roles in the application.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `user_id` | `UUID` | NOT NULL, REFERENCES `auth.users(id)` | Reference to auth user |
| `role` | `app_role` | NOT NULL | User role |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | Creation timestamp |

**Constraints:**
- UNIQUE (`user_id`, `role`)

---

### 3. `jobs`

Job postings created by employers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `employer_id` | `UUID` | NOT NULL, REFERENCES `auth.users(id)` | Employer who posted job |
| `title` | `TEXT` | NOT NULL | Job title |
| `description` | `TEXT` | | Job description |
| `category` | `TEXT` | NOT NULL | Job category |
| `location_address` | `TEXT` | | Job location address |
| `location_lat` | `DOUBLE PRECISION` | | Location latitude |
| `location_lng` | `DOUBLE PRECISION` | | Location longitude |
| `pay_min` | `NUMERIC` | | Minimum pay |
| `pay_max` | `NUMERIC` | | Maximum pay |
| `pay_type` | `TEXT` | CHECK: `('hourly', 'fixed', 'daily')` | Payment type |
| `status` | `TEXT` | CHECK: `('open', 'closed', 'filled')` | Job status |
| `job_type` | `TEXT` | CHECK: `('gig', 'part_time', 'full_time', 'contract')` | Type of employment |
| `skills_required` | `TEXT[]` | DEFAULT `{}` | Required skills |
| `roles_required` | `TEXT[]` | DEFAULT `{}` | Required roles |
| `vacancies` | `INTEGER` | DEFAULT `1` | Number of positions |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | Last update timestamp |

---

### 4. `worker_skills`

Skills listed by workers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `user_id` | `UUID` | NOT NULL, REFERENCES `auth.users(id)` | Worker user ID |
| `skill` | `TEXT` | NOT NULL | Skill name |
| `experience_years` | `INTEGER` | DEFAULT `0` | Years of experience |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | Creation timestamp |

---

### 5. `worker_availability`

Weekly availability schedule for workers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `user_id` | `UUID` | NOT NULL, REFERENCES `auth.users(id)` | Worker user ID |
| `day_of_week` | `INTEGER` | NOT NULL, CHECK: `0-6` | Day (0=Sunday, 6=Saturday) |
| `start_time` | `TIME` | | Start time of availability |
| `end_time` | `TIME` | | End time of availability |
| `is_available` | `BOOLEAN` | DEFAULT `true` | Whether available |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | Creation timestamp |

---

### 6. `worker_portfolio`

Portfolio items for workers to showcase their work.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `user_id` | `UUID` | NOT NULL, REFERENCES `auth.users(id)` | Worker user ID |
| `title` | `TEXT` | NOT NULL | Portfolio item title |
| `description` | `TEXT` | | Portfolio description |
| `image_url` | `TEXT` | | Image URL |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | Creation timestamp |

---

### 7. `job_applications`

Applications from workers to jobs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `job_id` | `UUID` | NOT NULL, REFERENCES `jobs(id)` | Job being applied to |
| `worker_id` | `UUID` | NOT NULL, REFERENCES `auth.users(id)` | Worker applying |
| `status` | `TEXT` | CHECK: `('pending', 'accepted', 'rejected')` | Application status |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | Application timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | Last update timestamp |

**Constraints:**
- UNIQUE (`job_id`, `worker_id`)

---

### 8. `saved_jobs`

Jobs saved/bookmarked by users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `user_id` | `UUID` | NOT NULL, REFERENCES `auth.users(id)` | User who saved |
| `job_id` | `UUID` | NOT NULL, REFERENCES `jobs(id)` | Saved job |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | Save timestamp |

**Constraints:**
- UNIQUE (`user_id`, `job_id`)

---

### 9. `worker_ratings`

Ratings given by employers to workers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `employer_id` | `UUID` | NOT NULL | Employer giving rating |
| `worker_id` | `UUID` | NOT NULL | Worker being rated |
| `job_id` | `UUID` | NOT NULL, REFERENCES `jobs(id)` | Related job |
| `rating` | `INTEGER` | NOT NULL, CHECK: `1-5` | Overall rating |
| `review` | `TEXT` | | Written review |
| `punctuality` | `INTEGER` | CHECK: `1-5` | Punctuality rating |
| `skill_performance` | `INTEGER` | CHECK: `1-5` | Skill rating |
| `behavior` | `INTEGER` | CHECK: `1-5` | Behavior rating |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | Rating timestamp |

**Constraints:**
- UNIQUE (`employer_id`, `worker_id`, `job_id`)

---

### 10. `employer_ratings`

Ratings given by workers to employers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `employer_id` | `UUID` | NOT NULL, REFERENCES `auth.users(id)` | Employer being rated |
| `worker_id` | `UUID` | NOT NULL, REFERENCES `auth.users(id)` | Worker giving rating |
| `job_id` | `UUID` | NOT NULL, REFERENCES `jobs(id)` | Related job |
| `rating` | `INTEGER` | NOT NULL, CHECK: `1-5` | Rating (1-5 stars) |
| `review` | `TEXT` | | Written review |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | Rating timestamp |

**Constraints:**
- UNIQUE (`worker_id`, `job_id`)

---

### 11. `job_reports`

Reports filed by users about inappropriate jobs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `job_id` | `UUID` | NOT NULL, REFERENCES `jobs(id)` | Reported job |
| `reporter_id` | `UUID` | NOT NULL, REFERENCES `auth.users(id)` | User filing report |
| `reason` | `TEXT` | NOT NULL | Reason for report |
| `description` | `TEXT` | | Additional details |
| `status` | `TEXT` | CHECK: `('pending', 'reviewed', 'resolved')` | Report status |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | Report timestamp |

---

### 12. `messages`

Direct messages between users.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `UUID` | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Unique identifier |
| `sender_id` | `UUID` | NOT NULL, REFERENCES `auth.users(id)` | Message sender |
| `receiver_id` | `UUID` | NOT NULL, REFERENCES `auth.users(id)` | Message receiver |
| `job_id` | `UUID` | REFERENCES `jobs(id)` | Related job (optional) |
| `content` | `TEXT` | NOT NULL | Message content |
| `is_read` | `BOOLEAN` | DEFAULT `false` | Read status |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | Message timestamp |

---

## Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              auth.users                                     │
│                              (Supabase Auth)                                │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ id
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              profiles                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ id (PK)      │◄─│ user_id      │  │ user_id      │◄─│ employer_id     │ │
│  │ full_name    │  │ role         │  │ skill        │  │ worker_id       │ │
│  │ avatar_url   │  └──────────────┘  │ experience   │  │ job_id          │ │
│  │ email        │                     └──────────────┘  │ rating          │ │
│  │ phone        │                     ┌──────────────┐  │ review          │ │
│  │ roles[]      │                     │ worker_      │  └──────────────────┘ │
│  │ categories[] │                     │ availability │       ▲               │
│  │ ...          │                     │ user_id (FK)│       │               │
│  └──────────────┘                     └──────────────┘       │               │
│        │                                    │               │               │
│        │                                    │               │               │
│        │ user_id                            │               │               │
│        ▼                                    ▼               │               │
│  ┌──────────────┐              ┌──────────────────────┐    │               │
│  │ user_roles   │              │ worker_portfolio     │    │               │
│  │ user_id (FK) │              │ user_id (FK)         │    │               │
│  │ role         │              │ title                │    │               │
│  └──────────────┘              │ image_url            │    │               │
│        │                       └──────────────────────┘    │               │
│        │                              │                     │               │
│        │                              │                     │               │
│        │              ┌───────────────┴───────────────┐     │               │
│        │              │             jobs               │     │               │
│        │              │  employer_id (FK) ────────────┼─────┘               │
│        │              │  title                         │                     │
│        │              │  description                   │                     │
│        │              │  category                      │                     │
│        │              │  status                        │                     │
│        │              └───────────────┬───────────────┘                     │
│        │                              │                                   │
│        │           ┌──────────────────┼──────────────────┐                  │
│        │           │                  │                  │                  │
│        ▼           ▼                  ▼                  ▼                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────────────┐    │
│  │ job_       │ │ saved_jobs │ │ job_reports│ │ messages             │    │
│  │ applications│ │ user_id   │ │ job_id     │ │ sender_id (FK)       │    │
│  │ job_id (FK)│ │ job_id    │ │ reporter_id│ │ receiver_id (FK)     │    │
│  │ worker_id  │ └────────────┘ └────────────┘ │ job_id (FK)          │    │
│  │ status     │                               └──────────────────────┘    │
│  └────────────┘                                                               │
│        │                                                                      │
│        │                                                                      │
│        ▼                                                                      │
│  ┌──────────────────────┐                                                    │
│  │ worker_ratings      │                                                    │
│  │ employer_id (FK) ───┼──────────────────────────────────────────┐       │
│  │ worker_id (FK) ─────┼──────────────────────────────────────────┤       │
│  │ job_id (FK)         │                                  │       │       │
│  │ rating              │                                  │       │       │
│  │ punctuality         │                                  │       │       │
│  │ skill_performance   │                                  │       │       │
│  │ behavior            │                                  ▼       ▼       │
│  └──────────────────────┘                              ┌──────────────┐      │
│                                                         │ employer_    │      │
│                                                         │ ratings      │      │
│                                                         │ employer_id  │      │
│                                                         │ worker_id    │      │
│                                                         │ job_id       │      │
│                                                         │ rating       │      │
│                                                         └──────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Relationship Summary

| From Table | To Table | Relationship Type | Description |
|------------|----------|-------------------|-------------|
| `profiles` | `auth.users` | One-to-One | Each profile belongs to one auth user |
| `user_roles` | `auth.users` | Many-to-One | Users can have multiple roles |
| `jobs` | `auth.users` | Many-to-One | Each job is posted by one employer |
| `worker_skills` | `auth.users` | Many-to-One | Workers can have multiple skills |
| `worker_availability` | `auth.users` | Many-to-One | Workers can have multiple availability slots |
| `worker_portfolio` | `auth.users` | Many-to-One | Workers can have multiple portfolio items |
| `job_applications` | `jobs` | Many-to-One | Each application is for one job |
| `job_applications` | `auth.users` | Many-to-One | Each application is from one worker |
| `saved_jobs` | `auth.users` | Many-to-One | Users can save multiple jobs |
| `saved_jobs` | `jobs` | Many-to-One | Each saved job is one job |
| `worker_ratings` | `jobs` | Many-to-One | Each rating is for one job |
| `worker_ratings` | `auth.users` | Many-to-One | Employers can rate workers |
| `employer_ratings` | `auth.users` | Many-to-One | Workers can rate employers |
| `employer_ratings` | `jobs` | Many-to-One | Each rating is for one job |
| `job_reports` | `jobs` | Many-to-One | Each report is for one job |
| `job_reports` | `auth.users` | Many-to-One | Users can report multiple jobs |
| `messages` | `auth.users` (sender) | Many-to-One | Messages have one sender |
| `messages` | `auth.users` (receiver) | Many-to-One | Messages have one receiver |
| `messages` | `jobs` | Many-to-One (nullable) | Messages can be about a job |

---

## Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| `user_roles` | `user_roles_user_id_idx` | `user_id` | Faster user role lookups |
| `jobs` | `jobs_employer_id_idx` | `employer_id` | Faster employer job queries |
| `jobs` | `jobs_status_idx` | `status` | Filter by job status |
| `jobs` | `jobs_category_idx` | `category` | Filter by category |
| `worker_skills` | `worker_skills_user_id_idx` | `user_id` | Faster worker skill lookups |
| `worker_availability` | `worker_availability_user_id_idx` | `user_id` | Faster availability queries |
| `worker_portfolio` | `worker_portfolio_user_id_idx` | `user_id` | Faster portfolio queries |
| `job_applications` | `job_applications_job_id_idx` | `job_id` | Faster application queries |
| `job_applications` | `job_applications_worker_id_idx` | `worker_id` | Faster worker application queries |
| `saved_jobs` | `saved_jobs_user_id_idx` | `user_id` | Faster saved jobs queries |
| `worker_ratings` | `worker_ratings_worker_id_idx` | `worker_id` | Faster worker rating lookups |
| `employer_ratings` | `employer_ratings_employer_id_idx` | `employer_id` | Faster employer rating lookups |
| `messages` | `messages_sender_id_idx` | `sender_id` | Faster sent message queries |
| `messages` | `messages_receiver_id_idx` | `receiver_id` | Faster received message queries |

---

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

| Table | Operations | Access Control |
|-------|------------|----------------|
| `profiles` | SELECT, INSERT, UPDATE | Users can manage own; Employers can view applicants; Admins have full access |
| `user_roles` | SELECT, INSERT | Users can manage own roles; Admins have full access |
| `jobs` | SELECT | Public can view open jobs |
| `jobs` | INSERT, UPDATE, DELETE | Employers manage own; Admins have full access |
| `worker_skills` | SELECT, INSERT, UPDATE, DELETE | Workers manage own; Employers can view applicants |
| `worker_availability` | SELECT, INSERT, UPDATE, DELETE | Workers manage own |
| `worker_portfolio` | SELECT, INSERT, UPDATE, DELETE | Workers manage own |
| `job_applications` | SELECT | Workers view own; Employers view applicants for their jobs |
| `job_applications` | INSERT, UPDATE | Workers can apply; Employers can update status |
| `saved_jobs` | SELECT, INSERT, DELETE | Users manage own saved jobs |
| `worker_ratings` | SELECT | Public (transparency) |
| `worker_ratings` | INSERT | Employers can rate hired workers |
| `employer_ratings` | SELECT | Public |
| `employer_ratings` | INSERT | Workers can rate employers |
| `job_reports` | INSERT, SELECT | Users can report and view own reports |
| `messages` | SELECT | Participants only |
| `messages` | INSERT | Authenticated users |
| `messages` | UPDATE | Receivers can mark as read |

---

## Storage

### Buckets

| Bucket ID | Name | Public | Purpose |
|-----------|------|--------|---------|
| `portfolio` | `portfolio` | Yes | Worker portfolio images |

**Storage Policies:**
- Users can upload portfolio images to their own folder
- Anyone can view portfolio images
- Users can delete their own portfolio images

---

## Triggers

| Trigger | Table | Event | Function |
|---------|-------|-------|----------|
| `on_auth_user_created` | `auth.users` | INSERT | `handle_new_user()` - Auto-creates profile |
| `on_auth_user_created_role` | `auth.users` | INSERT | `handle_new_user_role()` - Auto-assigns role from metadata |

---

## Functions

### `has_role(user_id UUID, role app_role) -> BOOLEAN`

Security function to check if a user has a specific role. Used in RLS policies for admin access.

---

## Future Considerations

Potential additions to the schema:
- Payment/transaction tables for gig payments
- Notifications table for in-app notifications
- Chat/conversation threading for messages
- Job categories lookup table
- Reviews with replies
- Verification documents table
