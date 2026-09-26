---
owner: miketak
last_reviewed: 2026-09-26
---

# Edit the organization's details and read its history

**Role needed:** Owner. Only an owner sees **Settings**.

**Settings** holds the organization's details, its members, its
history and its deletion: "Riverside Bottling Ltd (ORG-0003): its
details, who works on it, and what has been done to it. Only an owner
sees this page." The number after the name is the organization's account
number; see [Glossary](../../glossary.md).

<!-- sources: OrganizationSettingsPage.tsx; DeleteOrganizationDialog.tsx; DeleteOrganizationRequest.java; specs 01.3, 01.8; QA governance 002 A3; verified 2026-09-26 -->

## Edit the details

1. Open **Settings** in the organization's sidebar.
2. Under **Details** change **Name**, **Address** ("Optional. Printed
   on the report header.") or **Contact** ("Optional. Who a reader of
   the report should write to."). The card says "The name and the account
   number ORG-*NNNN* identify the organization across the product" and
   that the account number never changes.
3. Click **Save details**.
4. If another organization already carries the new name, the card says
   so and names it with its account number: "An organization named
   '*name*' already exists: *Other* (ORG-0012). Confirm to use the name
   anyway." Click **Save anyway** to keep the name, or change it.

What you see: "*Name* (ORG-*NNNN*) saved." A run launched afterwards
prints the new address and contact in section 00 of its report; runs
already launched keep what they printed. A change of name is recorded in
the history as **Organization renamed**.

## Read the history

The **History** card at the foot of the page lists every act that
touched the organization itself, newest first, with **Action**,
**Who**, **When** and **Reason**: "Support access and deletion are
recorded here; what happens inside an inventory is in its own history."

| Action | Reason column |
| --- | --- |
| Organization renamed | "renamed from '*old*' to '*new*'", and "; shares the name with ORG-*NNNN*" when **Save anyway** was needed |
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
The dialog states the organization's account number, because two
organizations may share a name: check it before you type. It refuses a
name that does not match ("Type the organization's name exactly to
confirm.") and a reason shorter than 10 characters ("Give a reason of at
least 10 characters."). Support access never carries this act.
