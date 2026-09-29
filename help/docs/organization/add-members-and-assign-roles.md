---
owner: miketak
last_reviewed: 2026-09-29
description: Add an existing CarbonOS account to the organization as an owner, reviewer, preparer or verifier, change a member's role, remove a member, and read what each role allows.
role: Owner
minutes: 3
---

# Add members and assign roles

A member is an existing CarbonOS account with one role in the organization, and the role decides what the member may do. You add members after creating the organization, and again whenever somebody joins the inventory work.

<!-- sources: specs 01.2, 01.3, 01.4; old page tasks/organization/add-members-and-assign-roles.md (verified 2026-09-24); OrganizationSettingsPage.tsx, MembersCard.tsx, roles.ts, format.ts (actionLabels), EmissionFactorsPage.tsx (the self-approved note), GhgService.java (addMember, changeMemberRole, removeMember); the History entry format from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt), "7 runs tab" -->

## Before you start

- You are an owner. Only an owner sees **Settings**, and support access never reaches the members.
- The person has a CarbonOS account, created by a platform administrator under **Users** in the administration console or by an approved request from the landing page.

## Add a member

1. Open **Settings** in the organization's sidebar.
2. Under **Members**, fill **Email of an existing account**.
3. Choose **Role**: "Owner", "Reviewer (approves and publishes)", "Preparer (records, classifies, runs)" or "Verifier (read-only)".
4. Click **Add member**.

What you see: "*Name* added as reviewer." and a row for the member. An email with no account is refused with "No account with that email. Add the user under Manage users first." The **History** card at the foot of the page records "Member added" with the reason "*email* added as REVIEWER".

## Change a role or remove a member

1. In the member's row, choose another **Role**. The history records "Member role changed".
2. To remove the member, click **Remove** in the row. The history records "Member removed".

The organization keeps at least one owner: demoting or removing the last one is refused with "'*Organization*' needs at least one owner."

## What the roles allow

| Role | May |
| --- | --- |
| Verifier | Read everything: records, evidence, inventories, runs, reports, exports and history. Change nothing. |
| Preparer | Everything a verifier may, plus record and correct activity data, import packs, add and approve factors, create inventories, draw boundaries, classify, add rules and instruments, freeze and reopen, launch and void runs, designate the base year, and fill the report header. |
| Reviewer | Everything a preparer may, plus designate a final run and withdraw the designation, publish, create a correction, and accept or decline a factor pack update. |
| Owner | Everything a reviewer may, plus **Settings**: the organization's details, its members and its deletion. |

An external auditor gets the Verifier role. A button that needs a higher role is disabled with a tooltip: "Needs the Preparer, Reviewer or Owner role.", "Needs the Reviewer or Owner role." or "Needs the Owner role." The matrix, act by act, is in [Check what your role may do](../access/check-what-your-role-may-do.md).

!!! note "Adding a reviewer ends self-approval"
    A factor entered by hand is approved by someone other than the person who entered it. A single-member organization can still approve, recorded as "(self-approved: nobody else could check it)" and printed in the report; adding a reviewer stops that.
