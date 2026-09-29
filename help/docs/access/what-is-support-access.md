---
owner: miketak
last_reviewed: 2026-09-28
description: The grant that lets a platform administrator enter an organization for a support case, what it records in the organization's history, and the acts it can never do.
---

# What is support access?

Support access is a grant a platform administrator takes to enter an organization they are not a member of, for a support case. Without it, an organization answers "Organization not found" to the platform's own staff.

<!-- sources: concepts/support-access-and-confidentiality.md (verified 2026-09-24 and 2026-09-26); specs 01.3, 01.5, 02.7; GhgAccess.java (roleIn, checkMemberOwner, checkTenantDecision, the "under support access" marker); PlatformSettings.java (1 to 72 hours, 24 by default); AdminOrganizationsPage.tsx (Assume access, the reason hint, End access); AdminSettingsPage.tsx ("Support access lasts"); SupportAccessBanner.tsx; SupportAccessCard.tsx; OrganizationSettingsPage.tsx ("Settings are the owner's"); format.ts (the history labels); AdminDashboardPage.tsx (the last 30 days) -->

## Who can take it, and for how long?

Only a platform administrator, on **Organizations** in the administration console, with **Assume access**, once the **Reason** has 10 characters: "At least 10 characters; the owners read it." The grant lasts the window the platform setting **Support access lasts** fixes, between 1 and 72 hours and 24 by default; **End access** closes it early.

## What does it show the organization?

| Where | What appears |
| --- | --- |
| Every page, while the grant is live | The banner "You are in *organization* under support access until *time*. Every act is recorded in this organization's history." |
| The organization's overview | The **Support access** card names the administrator, the start, the reason and "Until *time*." |
| The history on **Settings** | "Support access assumed", "Support access ended" or "Support access expired", each with the administrator's email, the moment and the reason. |
| Every act taken under the grant | The administrator's email, and the mark "under support access" on the entry. |

The console's dashboard keeps the platform side: every grant live or taken in the last 30 days.

## What can support access not do?

The grant gives an owner's rights, so support can record, classify, run, mark a run as final and publish for a client. Three acts stay with an owner by membership:

- Change members, or delete the organization. **Settings** is not in the sidebar, and its address answers "Settings are the owner's": "Administering *organization*, its members and its details needs the Owner role in the organization. Support access does not carry it."
- Accept or decline a factor pack update: "Support access cannot adopt an edition for an organization."

## Where next

- [Assume support access](../administration/assume-support-access.md).
- [Edit the organization's details and read its history](../organization/edit-the-details-and-read-the-history.md).
- [What is a role?](what-is-a-role.md).
