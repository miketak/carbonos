# 01: Identity and access

- **Status**: Implemented
- **Protocol**: none directly; the reporting company's operators need
  controlled access before anything in Chapters 3 to 10 can be trusted
- **Owner**: Michael Takrama
- **Created**: 2026-08-28 (accounts), 2026-08-29 (tenant ownership); merged
  2026-09-02
- **Modules**: `user` (backend), `ghg` (ownership enforcement),
  `src/features/auth`, `src/features/admin`

## Problem

CarbonOS holds one client's emissions data per organization. Two things
follow: only people the operator has admitted may sign in, and no signed-in
person may see another client's organization. This spec covers accounts,
roles, sessions and the administrator's user management, and the rule that
ties every GHG object to the user who created its organization. Self-service
registration is its own branch, spec 01.1.

## Behaviour

### Accounts, roles, status

A user has an email (unique, stored lowercase), a display name, a role and a
status. Roles: `ADMIN` (full access to the admin area) and `MEMBER`
(authenticated, no admin access). Status: `ACTIVE` or `DISABLED`.

The first administrator comes from one of two places: the idempotent startup
seeder reads `CARBONOS_ADMIN_EMAIL` / `CARBONOS_ADMIN_PASSWORD` and creates the
account when set and absent (the canonical mechanism on Railway), or a
developer runs `make admin EMAIL=.. PASSWORD=.. [NAME=..]`, which upserts through
Postgres and doubles as a password reset.

### Sessions

Given a user with valid credentials, when they submit email and password, they
receive their profile and a session cookie (`HttpOnly`, `SameSite=Lax`) and land
on `/app`, or on the page they were originally headed for. Invalid email, wrong
password and a `DISABLED` account all produce the same 401 "Invalid email or
password." so accounts cannot be enumerated. Logout invalidates the server
session. Every mutating request carries the CSRF double-submit token
(`XSRF-TOKEN` cookie echoed as `X-XSRF-TOKEN`); raw posts without it are refused
with 403.

### Guarding

Visiting `/app` or `/admin/users` signed out redirects to `/login` and returns
afterwards. A `MEMBER` calling any `/api/admin/**` endpoint receives 403, and the
SPA shows an "Access denied" panel with a "Back to home" link. `/actuator/health`
stays public for the platform healthcheck; other actuator endpoints require a
session.

### Administrator user management

At `/admin/users` an administrator sees every account (name, email, role,
status, created date) sorted by creation time, and can:

- **Create** a user with email, display name, role and a temporary password of
  at least 8 characters, communicated out of band. No email is sent. Duplicate
  email is refused with 409.
- **Update** display name, role and status. Email and password changes are
  non-goals.
- **Delete** after confirmation. Disabling is the preferred, reversible action;
  hard delete is acceptable while nothing else references user ids.

Self-protection: an administrator cannot delete, disable or demote themselves,
and no operation may leave the system without at least one `ACTIVE` `ADMIN`.
Violations are 409 with a human-readable detail.

### Tenant ownership of GHG data

Every organization records the user who created it (`ownerUserId`). An
organization and everything nested under it (facilities, activity records,
inventories, boundaries, versions, assignments, runs) is reachable by exactly
two parties: its owner and platform administrators. Denials are **404, never
403**, so an outsider cannot confirm that an id exists. `GET /api/ghg/organizations`
lists only the caller's own organizations; administrators see all. The
emission-factor library and the unit registry are shared, read-only, and still
require a session.

Given an organization created by one member, when a different member requests
any of its URLs or API resources, then every response is 404, and their
organization list is empty; when an administrator does the same, they succeed.

The owner reference is loose (no foreign key): deleting a user leaves their
organizations administrator-only rather than blocking the deletion.

## API

All errors are RFC 9457 problem details; validation failures are 422 with a
`properties.errors` map.

| Method | Path | Access | Result |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | public | 200 user + session; 401, 422 |
| POST | `/api/auth/logout` | session | 204 |
| GET | `/api/auth/me` | session | 200 user (fresh read); also seeds the CSRF cookie |
| GET | `/api/admin/users` | ADMIN | 200 list |
| POST | `/api/admin/users` | ADMIN | 201 + Location; 409 duplicate, 422 |
| GET | `/api/admin/users/{id}` | ADMIN | 200; 404 |
| PUT | `/api/admin/users/{id}` | ADMIN | 200; 404, 409 rule violation, 422 |
| DELETE | `/api/admin/users/{id}` | ADMIN | 204; 404, 409 |
| GET | `/api/profile`, PUT | session | the user's own profile |

User shape: `{id, email, displayName, role, status, createdAt}`; the password
hash is never serialized. Tenant checks are applied inside the `ghg` module at
every entity resolution, so every GHG endpoint inherits them.

## Data

- `V2__users.sql`: `users(id, email unique, display_name, role CHECK, status
  CHECK, password_hash BCrypt, created_at, updated_at)`.
- `V3__user_media.sql`: avatar and resume object-store keys on `users`.
- `V7__organization_ownership.sql`: `ghg_organizations.owner_user_id` (no
  foreign key), backfilled to the oldest active administrator.

## Events

`UserCreated(id, email)` is published on creation. It has no consumer today;
it establishes the cross-module event pattern.

## Verification

- `AuthApiIntegrationTests`, `UserAdminApiIntegrationTests`,
  `ProfileApiIntegrationTests` (backend).
- `GhgApiIntegrationTests.organizationsAreInvisibleToNonOwners` and the
  boundary-version isolation test: outsider 404s across organizations,
  activities, inventories, runs and versions; administrator oversight.
- Manual: `docs/qa/003-inventory.md` section A (admin creates the accounts,
  member has no admin area) and section K (tenant isolation).

## Non-goals and open questions

- Password reset, change-own-password and forced rotation on first sign-in.
  A temporary password an administrator sets is the password until an
  administrator sets another.
- Multi-member organizations, transferable ownership and per-inventory roles.
  These are the prerequisite for any preparer/approver workflow (spec 05.1).
- Audit logging of administrative actions.
- Pagination, search and filtering of the user list.
