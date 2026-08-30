# 002 — Access requests (self-service registration)

- **Status**: Implemented
- **Owner**: Michael Takrama (workflow supplied 2026-08-29; this spec records it)
- **Created**: 2026-08-29
- **Backend module(s)**: `user` (requests, approval, account setup), `mail` (new — outbound email)
- **Frontend feature(s)**: `src/features/access` (public request + password setup), `src/features/admin` (approval queue), `src/features/home` (landing CTA)

## Problem / Motivation

Today accounts exist only if an admin creates them (spec 001) or the seed
variables do. Prospective users who land on the public page have no path in.
This spec adds a self-service loop: visitors request access, admins approve or
deny, approved users receive an email link to set their password and land in
the app.

## Behavior

1. **Request** — On the landing page, a visitor hits *Request access* and
   submits name, email, and (optionally) company. The system stores a PENDING
   access request and shows a confirmation ("we'll be in touch"). Submitting
   an email that already belongs to a user, or that already has a pending
   request, is rejected (409).
2. **Queue** — Admins see pending requests (name, email, company, requested
   date) in the admin area, with Approve / Deny actions.
3. **Approve** — The request becomes APPROVED, gets a single-use setup token
   valid for 7 days, and the system emails the requester a link:
   `{APP_BASE_URL}/set-password?token=…`.
4. **Set password** — Opening the link shows a password form addressed to the
   requester (their email is displayed). Submitting a valid password (8–72
   chars, entered twice) creates an ACTIVE MEMBER account, consumes the token
   (request → COMPLETED), signs the user in (session cookie), and navigates to
   the app home (`/app`). Invalid, already-used, or expired tokens show a
   "link invalid or expired" state (404) with a way back to the landing page.
5. **Deny** — The request becomes DENIED and the system emails a polite
   decline. Denied emails may submit a new request later.

Decisions taken while implementing (per rule 4):
- Approval emails are sent asynchronously via a Spring Modulith event listener
  (at-least-once; unsent emails are retried on restart via the event registry).
- If the approved email gains a user account before the link is used
  (e.g. admin created one manually), completing setup fails with 409.
- Setup completion signs the user in directly — no second trip through the
  login form.

## API contract

Public (permitAll; CSRF token still required on POSTs):

- `POST /api/access-requests` `{email, displayName, company?}` → **202**.
  409 `Duplicate request` when a user or pending request already exists;
  422 validation problem.
- `GET /api/access-requests/setup/{token}` → **200** `{email, displayName}`;
  404 `Invalid or expired link` (non-enumerating: unknown, used, and expired
  tokens are indistinguishable).
- `POST /api/access-requests/complete` `{token, password}` → **200**
  `UserResponse` + authenticated session. 404 as above; 409 if the email now
  belongs to an existing user; 422 validation problem.

Admin (session + ADMIN, under `/api/admin/**`):

- `GET /api/admin/access-requests` → all requests, newest first
  (`{id, email, displayName, company, status, createdAt, decidedAt}`).
- `POST /api/admin/access-requests/{id}/approve` → **200** updated request.
  409 `Operation not allowed` when not PENDING; 404 unknown id.
- `POST /api/admin/access-requests/{id}/deny` → same rules.

## Data

Migration `V5__access_requests.sql`:

```
access_requests(
  id uuid PK, email varchar(320) NOT NULL, display_name varchar(100) NOT NULL,
  company varchar(150), status varchar(20) CHECK IN (PENDING, APPROVED, DENIED, COMPLETED),
  setup_token varchar(64) UNIQUE, token_expires_at timestamptz,
  decided_at timestamptz, decided_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at/updated_at timestamptz DEFAULT now())
```

Partial unique index on `email WHERE status = 'PENDING'` enforces one open
request per address. Tokens are 64 hex chars from `SecureRandom`. Requests are
retained after decision (audit trail); no automatic purge yet.

## Events

Published by `user` (module root, consumed by the new `mail` module):

- `AccessRequestApproved(requestId, email, displayName, setupToken)`
- `AccessRequestDenied(requestId, email, displayName)`

`mail` renders plain-text emails and sends via SMTP (`spring.mail.*`; local
dev + tests use Mailpit — added to `compose.yaml` and
`TestcontainersConfiguration`). `carbonos.mail.from` and
`carbonos.app.base-url` configure sender and link base. **Deployment note:**
`MAIL_HOST/MAIL_PORT/…` and `APP_BASE_URL` must be set on Railway
staging/production before this ships there.

## Non-goals

- Password reset for existing users (natural follow-up reusing the token
  mechanism; not in this spec).
- Rate limiting / CAPTCHA on the public form.
- HTML email templates; notification preferences.
- Admin notification when a new request arrives.

## Open questions

None blocking. Retention/purge policy for old requests is deferred.
