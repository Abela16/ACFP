# Anonymous Campus Feedback Portal

Production-oriented full-stack web app for anonymous student feedback and role-based stakeholder response management.

## Core Features

- Anonymous feedback submission (no student authentication)
- Public feedback feed with search, filtering, and sorting
- Like/upvote once per browser session using secure cookie session IDs
- Admin authentication with signed HTTP-only cookies
- Role-based access control (department-specific handling)
- Feedback moderation controls (flag/delete) and status workflow
- File attachments for feedback (image/document up to 5MB)
- Basic abuse controls:
  - rate limiting on submit/like endpoints
  - offensive language flagging

## Tech Stack

- `Next.js` App Router (frontend + API routes)
- TypeScript
- Tailwind CSS
- SQLite (via Node built-in `node:sqlite`)

## Data Model

- `feedback`
  - `public_id`, `title`, `description`, `category`, `other_category`
  - `status`, `likes_count`, `attachment_path`, `tags_json`
  - moderation fields (`flagged`, `deleted`)
- `feedback_responses`
  - ties stakeholder responses to feedback
- `feedback_likes`
  - deduplicates likes by session and feedback
- `admins`
  - username, hashed password, department role

## Department Mapping

- `Cafeteria` -> `Cafeteria Management`
- `Security` -> `Security Office`
- `Education` -> `Academic Office`
- `Facilities` -> `Administration`
- `Administration` -> `Administration`
- `Other` -> `Administration`

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for student portal.

Open [http://localhost:3000/admin](http://localhost:3000/admin) for admin portal.

## Seeded Admin Accounts

All accounts use initial password `ChangeMe123!` (change for production):

- `cafeteria_admin`
- `security_admin`
- `academic_admin`
- `super_admin`

## Security Notes

- Student anonymity is preserved (no account, no persistent identity table)
- IP address is used transiently for rate limiting only (not stored in DB)
- Admin sessions are signed and stored in HTTP-only cookies
- Passwords are hashed with `scrypt` + random salt
- Attachments are stored locally under `public/uploads`

## Production Hardening Checklist

- Set `ADMIN_SESSION_SECRET` to a long random value
- Enforce HTTPS and secure cookies
- Move storage from local SQLite/files to managed Postgres/object storage
- Integrate a CAPTCHA provider for higher spam resistance
- Add centralized logging and monitoring
