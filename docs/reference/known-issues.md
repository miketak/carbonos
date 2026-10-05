---
owner: miketak
last_reviewed: 2026-09-29
---

# Known issues

Product behaviour we know about, have decided not to change yet, and mean
to come back to. An entry here is a deliberate deferral, not a forgotten
bug: each one says what a user sees, why it is deferred, and what closing
it would take. Open defects that are being worked on belong in a pull
request or the Linear backlog (team Ecoriv), not here.

## How to use this page

- Add an entry when a finding is triaged and the owner defers it. Give it
  the next number; numbers are never reused.
- Close an entry by moving it to **Closed** with the pull request that
  closed it and the date. Do not delete it.
- When the help describes the behaviour, say so under **Help**, so the
  help changes in the same pull request as the fix.

## Open

### KI-1: Members other than an owner cannot see anyone else's role

- **Raised**: 2026-09-28, the help centre review (finding 12 in
  [the IA review](../reviews/2026-09-28-help-ia.md)).
- **What a user sees**: the organization sidebar shows the reader's own
  role ("Your role: Preparer", or "Support access" under a grant). Only an
  owner sees every member's role, on the **Members** card of **Settings**,
  which only an owner can open. A preparer, reviewer or verifier cannot
  tell who else is a reviewer, and so cannot tell whom to ask for a check.
- **Why deferred**: whether every member should see every role is a design
  decision (confidentiality of the membership list against the
  convenience of knowing whom to ask). The owner deferred it on
  2026-09-29.
- **What closing it takes**: a decision, then a read-only member list for
  non-owners. The members endpoint is already readable by any member, so
  it is a frontend change plus a spec 01.2 or 01.7 amendment.
- **Help**: `help/docs/access/check-what-your-role-may-do.md` and
  `help/docs/organization/add-members-and-assign-roles.md` say only an
  owner sees the member list.

### KI-2: The run page lists the reporting company as "Subsidiary"

- **Raised**: 2026-09-29, while fixing finding 9 of the help centre review
  (pull request #119).
- **What a user sees**: **Legal entities** and the facility form now call
  the reporting company "Reporting company", but section 01 of a run's
  report, the boundary version listing, still prints "Subsidiary · member
  from …" for it.
- **Why deferred**: the boundary version entry the run page reads carries
  no reporting-company flag, so the frontend cannot tell the entities
  apart; a frozen boundary version is a record and the flag must be
  derived, not rewritten.
- **What closing it takes**: add `reportingCompany` to the boundary version
  entry response (derived from the entity at read time), then print
  "Reporting company" in `BoundaryVersionEntries.tsx`; update
  `RunDetailPage.test.tsx`.
- **Help**: none quotes the listing.

## Closed

None yet.
