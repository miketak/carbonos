---
owner: miketak
last_reviewed: 2026-09-24
---

# Create an organization

**Role needed:** any signed-in account. Whoever creates an organization
becomes its owner, unless the form names somebody else.

An organization is the reporting company and everything under it:
legal entities, facilities, activity data, factors, inventories and
runs. It is private to its members.

<!-- sources: OrganizationsPage.tsx; OrganizationFormModal.tsx; spec 01.3; verified 2026-09-24 -->

## Steps

1. Open **GHG accounting**. It is the page a member of no organization
   lands on after signing in, and it is in the account menu at the top
   right.
2. Click **New organization**.
3. Fill **Name**. It identifies the organization across the product.
4. Fill **Address (optional)** if the report should carry it: it is
   "Printed in the report header as the reporting entity's address."
   Fill **Contact (optional)** with the address a reader of the report
   should write to.
5. Leave **Owner's email (optional)** empty to own the organization
   yourself. Naming another existing account makes that person the
   owner and leaves you outside: the form says "Naming somebody else
   means you are not a member, so you will need support access to open
   it."
6. Click **Create organization**.

## What you see

"*Name* created." and a card for the organization on **GHG accounting**
reading "0 facilities in the boundary", with **Open** and **Settings**.
**Open** leads to the organization's **Overview**, whose four numbered
steps are the order the rest of the work goes in.

## What changed elsewhere

- You are the organization's owner. Only an owner sees **Settings**,
  where the members are added.
- A platform administrator can see that the organization exists, its
  owners' email addresses and its member count, and nothing inside it.
  See [Can the platform team see my data?](../../concepts/support-access-and-confidentiality.md).
- The organization's history, at the foot of **Settings**, starts here.

To change the name, address or contact later, use **Save details** on
**Settings**.
