# QA procedure — Signup (access request → account)

Manual test script for the self-service registration flow of
[spec 002](../../specs/002-access-requests.md). Run it top to bottom; each case
has steps, an expected result, and a verdict box. Estimated time: 45–60 min.

**When to run:** before tagging a production release, and after any change to
the `user`/`mail` modules, the access/admin frontend features, or mail/session
configuration.

## Environments & prerequisites

| | Local | Staging |
| --- | --- | --- |
| App | `make dev-up`, then http://localhost:5173 | https://frontend-staging-2e61.up.railway.app |
| Inbox | Mailpit UI at http://localhost:8025 (catches all mail) | A real inbox you control |
| Admin login | `dev@carbonos.local` / `devpass123` | `mtakrama@yahoo.com` / staging `CARBONOS_ADMIN_PASSWORD` |
| DB access (for F-cases) | `docker exec carbonos-postgres-1 psql -U carbonos -d carbonos` | skip DB-dependent cases |

**Test emails:** use plus-addressing so every run is fresh:
`you+qa<date><n>@yourdomain.com` (e.g. `ama+qa0831a@ecoriv.land`). Each case
that files a request needs an address never used before.

**Two browser contexts:** use a normal window for the visitor and a private
window (or second browser) for the admin, so sessions don't collide.

---

## A. Request access (public form)

### A1 — Happy path
1. Open the landing page signed out. Click **Request access**.
2. Fill name, the fresh test email, and a company. Submit.

**Expect:** confirmation state ("we'll be in touch" wording); no error; form
does not allow double-submit of the same content.
Verdict: ☐ pass ☐ fail — notes:

### A2 — Duplicate pending request
1. Submit the form again with the *same* email as A1.

**Expect:** a clear rejection (duplicate request), not a success message and
not a raw error dump.
Verdict: ☐ pass ☐ fail — notes:

### A3 — Email already has an account
1. Submit the form with the admin's email address.

**Expect:** same rejection style as A2. The message must not reveal whether
the address has an account vs a pending request (no user enumeration).
Verdict: ☐ pass ☐ fail — notes:

### A4 — Validation
1. Try: empty name; invalid email (`foo@`); both.

**Expect:** inline field errors; nothing submitted; no console errors.
Verdict: ☐ pass ☐ fail — notes:

---

## B. Admin queue

### B1 — Request appears
1. In the admin context, sign in and open the access-requests admin area.

**Expect:** A1's request listed PENDING with name, email, company, and
requested date; newest first.
Verdict: ☐ pass ☐ fail — notes:

### B2 — Deny (do this first, with a second fresh request)
1. File one more request with a *second* fresh email (repeat A1).
2. In the queue, **Deny** it.

**Expect:** status flips to DENIED; a polite decline email arrives at that
address (Mailpit locally / real inbox on staging).
Verdict: ☐ pass ☐ fail — notes:

### B3 — Re-request after denial
1. Submit the public form again with the denied email.

**Expect:** accepted (a denial does not blacklist the address); a new PENDING
row appears in the queue. Deny or leave it — not used again below.
Verdict: ☐ pass ☐ fail — notes:

### B4 — Approve
1. **Approve** A1's request.

**Expect:** status flips to APPROVED; Approve/Deny actions are no longer
offered on it (a decided request can't be re-decided).
Verdict: ☐ pass ☐ fail — notes:

---

## C. The email

### C1 — Approval email content
1. Open the inbox for A1's address.

**Expect:** the approval email arrived; **From** is the configured sender
(`MAIL_FROM`, e.g. `noreply@ecoriv.land` — not the underlying Gmail account);
it addresses the requester by name; the link is
`<APP_BASE_URL>/set-password?token=<64 hex chars>` and the host matches the
environment's own frontend (staging link → staging app, never localhost).
Verdict: ☐ pass ☐ fail — notes:

---

## D. Set password

### D1 — Link opens addressed to the requester
1. Open the emailed link in the visitor context.

**Expect:** a password form that displays A1's email address.
Verdict: ☐ pass ☐ fail — notes:

### D2 — Password validation
1. Try: 7 characters; two fields that don't match.

**Expect:** inline errors; nothing submitted. (Rule: 8–72 chars, entered twice.)
Verdict: ☐ pass ☐ fail — notes:

### D3 — Completion signs you in
1. Enter a valid password twice and submit.

**Expect:** lands in the app (`/app`) already signed in — no second trip
through the login form. The admin queue now shows the request COMPLETED.
Verdict: ☐ pass ☐ fail — notes:

### D4 — Link is single-use
1. Open the same emailed link again (fresh tab, signed out if needed).

**Expect:** "link invalid or expired" state with a way back to the landing
page — not the password form.
Verdict: ☐ pass ☐ fail — notes:

### D5 — Garbage token looks identical
1. Open `/set-password?token=0000000000000000000000000000000000000000000000000000000000000000`.

**Expect:** *exactly* the same invalid/expired state as D4 — unknown, used,
and expired tokens must be indistinguishable.
Verdict: ☐ pass ☐ fail — notes:

### D6 — Expired token (local only)
1. File + approve one more fresh request, then age its token in the DB:
   `UPDATE access_requests SET token_expires_at = now() - interval '1 day' WHERE email = '<that email>';`
2. Open its emailed link.

**Expect:** same invalid/expired state as D4/D5. (Nominal validity: 7 days.)
Verdict: ☐ pass ☐ fail — notes:

---

## E. The new account

### E1 — Fresh member state
1. Still signed in as the new user, look around `/app`.

**Expect:** role is MEMBER (no admin area visible); GHG area is empty — no
other tenant's organizations are visible; the user can create their own
organization.
Verdict: ☐ pass ☐ fail — notes:

### E2 — Session and re-login
1. Refresh the page — still signed in.
2. Sign out, sign back in with the email + the password set in D3.

**Expect:** both work; after login the user lands in the app.
Verdict: ☐ pass ☐ fail — notes:

---

## F. Security spot-checks (curl; local or staging)

### F1 — CSRF is enforced on the public form
```
curl -s -o /dev/null -w "%{http_code}\n" -X POST <BASE>/api/access-requests \
  -H "Content-Type: application/json" \
  -d '{"email":"csrf@test.dev","displayName":"CSRF"}'
```
**Expect:** `403` (no XSRF token) — the SPA sends the token, raw posts fail.
Verdict: ☐ pass ☐ fail — notes:

### F2 — Admin API is closed to non-admins
```
curl -s -o /dev/null -w "%{http_code}\n" <BASE>/api/admin/access-requests
```
**Expect:** `401` signed out (and `403` as a signed-in MEMBER, if checked from
the browser dev-tools of the E1 session).
Verdict: ☐ pass ☐ fail — notes:

---

## Sign-off

| Field | Value |
| --- | --- |
| Environment / app version | |
| Tester / date | |
| Cases failed | |
| Follow-up issues filed | |

**Known non-goals** (do not report as bugs — see spec 002): no rate limiting /
CAPTCHA on the public form, plain-text emails, no admin notification on new
requests, no password reset for existing users.
