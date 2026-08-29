# 001 — Admin user management

- **Status**: Implemented
- **Owner**: Michael Takrama
- **Created**: 2026-08-28
- **Backend module(s)**: `user`
- **Frontend feature(s)**: `src/features/auth`, `src/features/admin`

## Problem / Motivation

CarbonOS has no concept of identity: there are no user accounts, nothing gates
access to the API or the SPA, and no future module has anything to authenticate
against. Before any customer-facing capability ships, ECORIV operators need a
way to control who can access the system. This spec introduces the user model,
session-based authentication, and an admin panel where an administrator can
add, update, disable, and remove users.

## Behavior

Roles: `ADMIN` (full access to the admin panel) and `MEMBER` (authenticated,
no admin access). Statuses: `ACTIVE` and `DISABLED`.

- **Login**: Given a user with valid credentials, when they POST email +
  password to the login endpoint, they receive their profile and a session
  cookie. Invalid email, wrong password, and a `DISABLED` account all produce
  the same 401 ("Invalid credentials") so accounts cannot be enumerated.
- **Guarding**: Visiting `/admin/users` unauthenticated redirects to `/login`
  (and returns to the original page after login). An authenticated `MEMBER`
  calling any `/api/admin/**` endpoint receives 403; the SPA shows an
  access-denied panel.
- **List**: An admin sees all users (name, email, role, status, created date),
  sorted by creation time. No pagination (non-goal until data warrants it).
- **Create**: An admin creates a user with email, display name, role, and a
  temporary password they communicate out of band. Duplicate email → 409.
  Emails are normalized to lowercase.
- **Update**: An admin edits display name, role, and status. Email and
  password changes are non-goals.
- **Delete**: An admin hard-deletes a user after confirmation. Disable is the
  preferred reversible action; hard delete is acceptable while nothing else
  references user ids.
- **Self-protection**: An admin cannot delete, disable, or demote themselves,
  and no operation may leave the system with zero users that are both `ADMIN`
  and `ACTIVE`. Violations → 409 with a human-readable detail.
- **Sessions**: Logout invalidates the server session. Disabled users cannot
  log in.
- **Bootstrap**: The initial admin is created either by the idempotent
  startup seeder (env vars `CARBONOS_ADMIN_EMAIL` / `CARBONOS_ADMIN_PASSWORD`;
  no-op when unset or when the email already exists) or locally via
  `make admin EMAIL=.. PASSWORD=..` (upserts through Postgres, doubling as a
  password reset).

## API contract

All errors are RFC 9457 problem details. Validation failures return 422 with a
`properties.errors` map of `field → message`.

| Method | Path                    | Access | Success                | Errors |
| ------ | ----------------------- | ------ | ---------------------- | ------ |
| POST   | `/api/auth/login`       | public | 200 user + session     | 401, 422 |
| POST   | `/api/auth/logout`      | authed | 204                    | 401 |
| GET    | `/api/auth/me`          | authed | 200 user (fresh read)  | 401 |
| GET    | `/api/admin/users`      | ADMIN  | 200 user list          | 401, 403 |
| POST   | `/api/admin/users`      | ADMIN  | 201 + Location         | 409 duplicate email, 422 |
| GET    | `/api/admin/users/{id}` | ADMIN  | 200                    | 404 |
| PUT    | `/api/admin/users/{id}` | ADMIN  | 200                    | 404, 409 rule violation, 422 |
| DELETE | `/api/admin/users/{id}` | ADMIN  | 204                    | 404, 409 rule violation |

User shape: `{ id, email, displayName, role, status, createdAt }` — the
password hash is never serialized.

Security: session cookie (`HttpOnly`, `SameSite=Lax`), CSRF double-submit
cookie (`XSRF-TOKEN` echoed as `X-XSRF-TOKEN` header by the SPA), 401/403
rendered as `application/problem+json`. `/actuator/health/**` stays public
(Railway healthcheck); other actuator endpoints now require authentication.

## Data

`V2__users.sql` — table `users`: `id uuid PK`, `email varchar(320) unique`
(stored lowercase), `display_name varchar(100)`, `role` (`ADMIN`/`MEMBER`),
`status` (`ACTIVE`/`DISABLED`), `password_hash` (BCrypt), `created_at`,
`updated_at`. Hard delete removes the row; no retention obligations yet.

## Events

- `UserCreated(id, email)` — published on user creation. No consumers today;
  establishes the cross-module event pattern (e.g. future onboarding module).

## Non-goals

- Password reset / change-own-password flows and forced rotation on first login.
- Email delivery of any kind (invites, notifications).
- Self-service signup.
- Pagination, search, or filtering of the user list.
- Audit logging.
- Production cross-origin cookie setup: the deployed SPA calls the backend
  via `VITE_API_URL` (cross-site), where session + CSRF cookies will not work.
  Planned fix when production auth is in scope: proxy `/api` in
  `frontend/nginx.conf` over Railway private networking and set
  `VITE_API_URL=''` so prod is same-origin like dev.

## Open questions

None blocking. Decisions recorded: CSRF stays enabled using the documented
SPA pattern; controller-based JSON login (no custom filter); hard delete kept
until another module references user ids.
