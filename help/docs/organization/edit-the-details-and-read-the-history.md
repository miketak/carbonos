---
owner: miketak
last_reviewed: 2026-09-28
description: Change the organization's name, address or contact on Settings, read the history of what has been done to the organization itself, and delete an organization with a reason.
role: Owner
minutes: 4
---

# Edit the organization's details and read its history

**Settings** holds the organization's details, members, history and deletion. Come here to change what the report header prints, to read who did what to the organization, or to delete it.

<!-- sources: specs 01.3, 01.8, 07.4; QA governance 002 A3; old page tasks/organization/edit-details-and-read-the-history.md (verified 2026-09-26); OrganizationSettingsPage.tsx, DeleteOrganizationDialog.tsx, format.ts (actionLabels), GhgAuditEvent.java (Action), GhgService.java (updateOrganization, deleteOrganization); the History entry format from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt), "7 runs tab" -->

## Before you start

- You are an owner. The page says so: "Only an owner sees this page."

## Edit the details

1. Open **Settings** in the organization's sidebar.
2. Under **Details**, change **Name**, **Address** or **Contact**.
3. Click **Save details**.
4. If another organization already carries the new name, the card says so: "An organization named '*name*' already exists: *other* (ORG-*NNNN*). Confirm to use the name anyway." Click **Save anyway**, or change the name.

What you see: "*Name* (ORG-*NNNN*) saved." A run launched afterwards prints the new address and contact; runs already launched keep what they printed. Renaming also renames the reporting company's row under **Legal entities**, if the two still matched.

## Read the history

The **History** card at the foot of the page lists every act that touched the organization itself, newest first: **Action**, **Who**, **When** and **Reason**. Before anything has happened it reads "Nothing has happened to the organization itself yet."

| Action | Reason column |
| --- | --- |
| Organization created | "created by a platform administrator for *the owner's email*", recorded only when an administrator created it for somebody else |
| Organization renamed | "renamed from '*old*' to '*new*'", plus "; shares the name with ORG-*NNNN*" when **Save anyway** was needed |
| Member added | "*email* added as REVIEWER" |
| Member role changed | "*email*: PREPARER → REVIEWER" |
| Member removed | "*email* removed" |
| Factor pack adopted, Factor pack declined | The edition and the note you gave |
| Support access assumed | The administrator's reason |
| Support access ended, Support access expired | How the grant ended |

The card does not refresh after **Add member**; reload the page to see the row. An inventory's own acts are in the **History** card on its **Runs** tab, and a record's in that record's **History**.

## Delete the organization

Under **Danger zone**, **Delete this organization** warns: "Everything under it goes: facilities, activity data, inventories and runs."

1. Click **Delete organization**.
2. Check the account number in the dialog: two organizations may share a name.
3. Fill **Type *Name* to confirm** with the name exactly as it is.
4. Fill **Reason** with at least 10 characters; "it is kept with the organization."
5. Click **Delete**.

What you see: "*Name* (ORG-*NNNN*) deleted." The organization leaves every list; who removed it, when and why is kept. One with a final or published inventory cannot be deleted: "Publish records are kept: withdraw the final designation or supersede the published inventory first."
