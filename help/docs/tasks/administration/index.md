---
owner: miketak
last_reviewed: 2026-09-24
---

# The administration console

**Role needed:** platform Admin. A member account does not see the
console.

The console is where the platform is run: accounts, access requests,
organizations, factor pack editions and platform settings. It shows
nothing from inside an organization: "Client inventory data stays
inside each organization."

<!-- sources: AdminLayout.tsx; AdminDashboardPage.tsx; specs 01.5, 01.6; verified 2026-09-24 -->

## Where it is

An administrator who is a member of no organization lands on the
console after signing in. From an organization, the account menu at the
top right leads back to it, and the console's sidebar entry **GHG
accounting** leads to the organizations the administrator is a member
of.

## What the dashboard shows

- **Needs your attention**: pending access requests, or "Nothing is
  waiting on you."
- **The platform**: **Users** (active and pending), **Organizations**
  (with how many are under support access), **Factor pack editions**
  (published, draft, withdrawn), and **Open adoption notices** ("each
  organization decides its own").
- **Support access**: the grants live now and those taken in the last
  30 days.
- **Recent platform activity**: editions published and withdrawn,
  users added, requests decided.
- The current settings in one line: "Support access lasts 24 hours, and
  everyone signed in may create an organization."

## The pages

| Page | Task |
| --- | --- |
| **Access requests** and **Users** | [Approve access requests and manage users](approve-access-requests-and-manage-users.md) |
| **Organizations** | [Assume support access](assume-support-access.md) |
| **Factor packs** | [Author and publish a factor pack edition](author-and-publish-a-factor-pack-edition.md) |
| **Platform settings** | [Set platform settings](set-platform-settings.md) |
