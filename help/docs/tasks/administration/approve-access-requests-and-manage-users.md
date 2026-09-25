---
owner: miketak
last_reviewed: 2026-09-24
---

# Approve access requests and manage users

**Role needed:** platform Admin.

Accounts are platform-wide; membership of an organization is given
separately by that organization's owner.

<!-- sources: AdminAccessRequestsPage.tsx; AdminUsersPage.tsx; UserFormModal.tsx; UserTable.tsx; spec 01.5; verified 2026-09-24 -->

## Decide an access request

1. Open **Access requests**. The dashboard's **Needs your attention**
   also counts them. The page reads: "Approving one creates the account
   at once in the pending state and sends a link to set a password.
   Nobody signs in until they have set it."
2. Under **Waiting for a decision**, read the name, company, email and
   date, and click **Approve** or **Deny**.

What you see: "*Name* approved; setup email sent." The request moves to
**Already decided** with the outcome "Approved, waiting for the
password to be set", and the account appears under **Users** as
"Member, Pending activation". Once the person sets their password the
status reads "Active". See
[Request access and set your password](../account/request-access-and-set-your-password.md)
for what they receive.

## Add a user directly

1. Open **Users** and click **Add user**.
2. Fill **Email** and **Display name**. Choose **Role**: "Member" or
   "Admin". Fill **Temporary password**: "Share it with the user out of
   band; they should change it later." **Show** reveals it while you
   type.
3. Click **Add user**.

What you see: "*Name* added." and a row reading the role, "Active" and
the date added.

## Change, disable or delete a user

Each row offers **Edit** (name and role), **Disable** or **Enable**,
and **Delete**. A disabled account cannot sign in and keeps its
history; your own row is marked "(you)".

## What changed elsewhere

- A new account is a member of no organization. An owner adds it under
  the organization's **Settings** by its email; see
  [Add members and assign roles](../organization/add-members-and-assign-roles.md).
- An **Admin** account sees the console and can assume support access.
  It sees nothing inside an organization it is not a member of.
