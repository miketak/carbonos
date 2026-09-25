---
owner: miketak
last_reviewed: 2026-09-24
---

# Add members and assign roles

**Role needed:** Owner. Only an owner sees **Settings**, and support
access never reaches the members.

A member is an existing CarbonOS account with one role in the
organization. The role decides what the member can do; every act is
recorded under the member's own email.

<!-- sources: OrganizationSettingsPage.tsx; MembersCard.tsx; roles.ts; spec 01.2, 01.3; verified 2026-09-24 -->

## Before you start

The person needs an account. A platform administrator creates one
under **Users** in the administration console, or approves the request
the person makes with **Request access** on the landing page. The
**Members** card only accepts the "Email of an existing account".

## Steps

1. Open **Settings** in the organization's sidebar.
2. Under **Members**, fill **Email of an existing account**.
3. Choose **Role**: "Owner", "Reviewer (approves and publishes)",
   "Preparer (records, classifies, runs)" or "Verifier (read-only)". The
   card summarises them: "Preparers record, classify and run; reviewers
   also designate final runs, publish and create corrections; verifiers
   read only."
4. Click **Add member**.

To change a member's role, choose another role in their row. To remove
a member, click **Remove** in their row.

## What you see

"*Name* added as reviewer." and a row for the member with a role
selector and **Remove**.

The **History** card at the foot of the page records "Member added" with
your email, the moment and "*email* added as REVIEWER". The card does not
refresh on its own after the member is added; reload the page to see
the row.

## What the roles allow

| Role | Can |
| --- | --- |
| Verifier | Read everything: records, evidence, inventories, runs, reports, exports, history. Change nothing. |
| Preparer | Everything a verifier can, plus record and correct activity data, attach evidence, import packs and add factors, create inventories, draw boundaries, classify, add rules and instruments, freeze and reopen, launch and void runs, fill the report header. |
| Reviewer | Everything a preparer can, plus approve factors, mark a run as final, withdraw the designation, publish, create a correction, designate the base year and decide recalculation candidates, accept or decline a factor pack update. |
| Owner | Everything a reviewer can, plus **Settings**: the organization's details, its members, and its deletion. |

The buttons that need a higher role are disabled with a tooltip:
"Needs the Preparer, Reviewer or Owner role.", "Needs the Reviewer or
Owner role." or "Needs the Owner role." The full matrix is in
[Roles and permissions](../../reference/roles-and-permissions.md).

## One rule about approval

A factor entered by hand is approved by someone other than the person
who entered it. An organization with a single member can still approve,
and the approval is recorded as "(self-approved: nobody else could check
it)" and printed in the report. Adding a reviewer is how an organization
stops self-approving.
