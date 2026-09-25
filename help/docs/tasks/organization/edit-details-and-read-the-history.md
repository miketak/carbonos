---
owner: miketak
last_reviewed: 2026-09-24
---

# Edit the organization's details and read its history

**Role needed:** Owner. Only an owner sees **Settings**.

**Settings** holds the organization's details, its members, its
history and its deletion: "Riverside Bottling Ltd: its details, who
works on it, and what has been done to it. Only an owner sees this
page."

<!-- sources: OrganizationSettingsPage.tsx; DeleteOrganizationDialog.tsx; DeleteOrganizationRequest.java; spec 01.3; verified 2026-09-24 -->

## Edit the details

1. Open **Settings** in the organization's sidebar.
2. Under **Details** change **Name** ("The name identifies the
   organization across the product"), **Address** ("Optional. Printed
   on the report header.") or **Contact** ("Optional. Who a reader of
   the report should write to.").
3. Click **Save details**.

What you see: "*Name* saved." A run launched afterwards prints the new
address and contact in section 00 of its report; runs already launched
keep what they printed.

## Read the history

The **History** card at the foot of the page lists every act that
touched the organization itself, newest first, with **Action**,
**Who**, **When** and **Reason**: "Support access and deletion are
recorded here; what happens inside an inventory is in its own history."

| Action | Reason column |
| --- | --- |
| Member added | "*email* added as REVIEWER" |
| Member removed | The member and role removed. |
| Factor pack adopted | "adopted '*edition*' from *date* as a vintage progression; no base-year candidate raised: *your note*" |
| Support access assumed | The administrator's reason, for example "Ticket 4821: owner reports the FY2026 run page will not open" |
| Support access ended | "support access ended by the administrator" |
| Support access expired | The grant ran out. |

The card does not refresh on its own after **Add member**; reload the
page to see the new row. What happens inside an inventory, from the
review to the publication, is in the **History** card on that
inventory's **Runs** tab; what happens to a record is in the record's
**History**.

## Delete the organization

Under **Danger zone**, **Delete organization** removes "Everything
under it: facilities, activity data, inventories and runs. An
organization with a published record cannot be deleted. You will be
asked to type the name and give a reason, and the deletion is kept."
The dialog refuses a name that does not match ("Type the
organization's name exactly to confirm.") and a reason shorter than 10
characters ("Give a reason of at least 10 characters."). Support access
never carries this act.
