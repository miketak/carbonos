---
owner: miketak
last_reviewed: 2026-09-26
---

# Assume support access

**Role needed:** platform Admin.

An organization is private to its members. To look inside one for a
support case, an administrator assumes access with a reason: "it gives
you an owner's rights for 24 hours, and the organization's owners see
who took it and why. It never carries deleting the organization,
changing its membership, or adopting a factor pack edition."

<!-- sources: AdminOrganizationsPage.tsx; SupportAccessBanner.tsx; OrganizationSettingsPage.tsx history; specs 01.3, 01.5; verified 2026-09-24; spec 01.8 (account numbers, verified 2026-09-26) -->

## Steps

1. Open **Organizations** in the console. Each row shows the
   organization, its owners' email addresses, its member count and its
   support-access state.
2. Click **Assume access** on the organization.
3. Read the dialog: "You get an owner's rights in *organization* for 24
   hours, or until you end the access. The owners see who took it and
   why, and every act you record is attributed to you and marked as
   taken under support access."
4. Fill **Reason**: "At least 10 characters; the owners read it. For
   example: ticket 4512, preparer cannot open the run." The button
   stays disabled until the reason is long enough.
5. Click **Assume access**.

## What you see

"Support access to *organization* assumed." The row now reads "Until
*moment*: *reason*" with **Open** and **End access**. The organization
appears under your **GHG accounting**, and every page inside it carries
the banner "You are in *organization* (ORG-*NNNN*) under support access until
*moment*. Every act is recorded in this organization's history."

Under support access the sidebar has no **Settings** entry; the page it
would lead to reads "Settings are the owner's" and "Administering
*organization*, its members and its details needs the Owner role in
the organization. Support access does not carry it." Accepting or
declining a factor pack update is refused: "Support access cannot adopt
an edition for an organization."

## End the access

Click **End access** on **Organizations**. The row returns to "None".
Otherwise the grant expires at the moment shown.

## What the owner sees

The organization's history at the foot of **Settings** reads "Support
access assumed" with your email, the moment and your reason, then
"Support access ended … support access ended by the administrator" or
"Support access expired". The console's dashboard lists the grants
live now and those taken in the last 30 days.
