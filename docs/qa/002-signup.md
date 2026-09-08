# QA procedure — Signup (access request → account)

Manual test script for the self-service registration flow of
[spec 01.1](../../specs/01.1-access-requests.md), exercised on **staging**. Run
it top to bottom; each case has steps, an expected result, and a verdict box.
18 cases, estimated 45–60 min.

**When to run:** before tagging a production release, and after any change to
the `user`/`mail` modules, the access/admin frontend features, or mail/session
configuration.

## Prerequisites

- **App:** https://frontend-staging-2e61.up.railway.app
- **Admin account:** `pkemekpor@gmail.com` (password held by the tester;
  assumed already set up as an ADMIN on staging).
- **Test inbox:** a Gmail (or other plus-addressing) inbox you control.
  Use a fresh alias per request — `you+qa<date><n>@gmail.com`
  (e.g. `pkemekpor+qa0831a@gmail.com`) — mail arrives in the base inbox.
  Every case that files a request needs a never-used address.
- **Two browser contexts:** a normal window for the visitor, a private window
  (or second browser) for the admin, so sessions don't collide.

> Token expiry (the 7-day limit on setup links) cannot be exercised on staging
> — it needs direct database access. It is covered by the development team's
> checks; do not attempt it here.

---

## A. Request access (public form)

### A1 — Happy path
1. Open the landing page signed out. Click **Request access**.
2. Fill name, a fresh test email, and a company. Submit.

**Expect:** confirmation state ("we'll be in touch" wording); no error; form
does not allow double-submit of the same content.
Verdict: ☐ pass ☐ fail — notes:

### A2 — Duplicate pending request
1. Submit the form again with the *same* email as A1.

**Expect:** a clear rejection (duplicate request), not a success message and
not a raw error dump.
Verdict: ☐ pass ☐ fail — notes:

### A3 — Email already has an account
1. Submit the form with `pkemekpor@gmail.com` (the admin's address).

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
1. In the admin context, sign in as `pkemekpor@gmail.com` and open the
   access-requests admin area.

**Expect:** A1's request listed PENDING with name, email, company, and
requested date; newest first.
Verdict: ☐ pass ☐ fail — notes:

### B2 — Deny (do this first, with a second fresh request)
1. File one more request with a *second* fresh alias (repeat A1).
2. In the queue, **Deny** it.

**Expect:** status flips to DENIED; a polite decline email arrives in your
inbox for that alias.
Verdict: ☐ pass ☐ fail — notes:

### B3 — Re-request after denial
1. Submit the public form again with the denied alias.

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
1. Open your inbox and find the mail sent to A1's alias.

**Expect:** the approval email arrived; **From** is the configured sender
(`noreply@ecoriv.land` — not the underlying Gmail account); it addresses the
requester by name; the link is
`https://frontend-staging-2e61.up.railway.app/set-password?token=<64 hex chars>`
— the staging app itself, never localhost or production.
Verdict: ☐ pass ☐ fail — notes:

---

## D. Set password

### D1 — Link opens addressed to the requester
1. Open the emailed link in the visitor context.

**Expect:** a password form that displays A1's alias address.
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
2. Sign out, sign back in with the alias + the password set in D3.

**Expect:** both work; after login the user lands in the app.
Verdict: ☐ pass ☐ fail — notes:

---

## F. Security spot-checks (terminal, optional)

Skip this section if you don't have a terminal with `curl`.

### F1 — CSRF is enforced on the public form
```
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://frontend-staging-2e61.up.railway.app/api/access-requests \
  -H "Content-Type: application/json" \
  -d '{"email":"csrf@test.dev","displayName":"CSRF"}'
```
**Expect:** `403` (no XSRF token) — the SPA sends the token, raw posts fail.
Verdict: ☐ pass ☐ fail — notes:

### F2 — Admin API is closed to non-admins
```
curl -s -o /dev/null -w "%{http_code}\n" \
  https://frontend-staging-2e61.up.railway.app/api/admin/access-requests
```
**Expect:** `401` signed out (and `403` as a signed-in MEMBER, if checked from
the browser dev-tools of the E1 session).
Verdict: ☐ pass ☐ fail — notes:

---

## Sign-off

| Field | Value |
| --- | --- |
| App version / date deployed | |
| Tester / date | |
| Cases failed | |
| Follow-up issues filed | |

**Known non-goals** (do not report as bugs — see spec 01.1): no rate limiting /
CAPTCHA on the public form, plain-text emails, no admin notification on new
requests, no password reset for existing users. Token expiry is not testable
on staging (see prerequisites).
