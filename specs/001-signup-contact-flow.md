# 001 — Signup → Contact flow

- **Status**: Draft
- **Owner**: Michael Takrama
- **Created**: 2026-08-27
- **Backend module(s)**: `contact` (new)
- **Frontend feature(s)**: `src/features/contact` (new)

## Problem / Motivation

CarbonOS does not offer self-serve registration. Prospects who click "Sign up"
should instead reach a contact form; the company qualifies each request and
invites accepted prospects by email to complete their full account setup. This
keeps onboarding high-touch while the product is early.

## Behavior

1. Every "Sign up" call-to-action in the frontend routes to `/contact-us`.
   There is no registration form anywhere.
2. `/contact-us` shows a basic form:
   - Full name (required)
   - Company name (required)
   - Work email (required, validated format)
   - Message / what they need (optional, max 2000 chars)
3. On submit, the frontend calls the backend; on success the user sees a
   confirmation ("We'll get back to you by email"). Validation errors are
   shown inline; server errors show a generic retry message.
4. The backend stores the submission and notifies the company (mechanism TBD —
   see Open questions; likely an email to a company inbox).
5. A company operator reviews the request and, when accepted, triggers an
   invitation: the prospect receives an email containing a **single-use,
   expiring, tokenized setup link** where they complete full account setup
   (credentials, workspace details).
6. Submission lifecycle: `NEW → CONTACTED → CONVERTED | CLOSED`.
   - `NEW`: submitted, not yet reviewed
   - `CONTACTED`: invitation sent (token issued)
   - `CONVERTED`: prospect completed setup via the link
   - `CLOSED`: rejected or went stale (no conversion)

## API contract

`POST /api/contact-requests`

Request:

```json
{
  "fullName": "Ada Lovelace",
  "company": "Analytical Engines Ltd",
  "email": "ada@analyticalengines.example",
  "message": "We want to track supply-chain emissions."
}
```

Responses:

- `201 Created` — body `{ "id": "<uuid>" }`
- `400 Bad Request` — RFC 9457 problem details with per-field validation errors
- `429 Too Many Requests` — rate limit exceeded

Operator review/invite endpoints and the setup-completion endpoint are part of
a later spec (they depend on auth, which does not exist yet).

## Data

`contact_request` table (new Flyway migration):
id (uuid, pk), full_name, company, email, message, status, created_at,
updated_at. Invitation tokens are stored hashed, never in plaintext, with an
expiry timestamp and single-use semantics (design detail for the invite spec).

## Events

- `ContactRequestReceived` — published by the `contact` module when a
  submission is stored; future modules (e.g. notifications) subscribe to it.

## Abuse / robustness

- Rate limiting per IP on the submission endpoint.
- Honeypot field (hidden input; non-empty submissions silently discarded).
- No information leak: submitting the same email twice behaves identically.

## Non-goals

- No authentication/authorization (no user accounts exist yet).
- No email-sending implementation (notification mechanism decided later).
- No operator/admin UI for reviewing requests.
- No CAPTCHA (revisit if spam becomes real).

## Open questions

- How is the company notified of new requests (email? Slack? plain DB check)?
- What data does "full setup" collect? (Blocks the follow-up invite spec.)
