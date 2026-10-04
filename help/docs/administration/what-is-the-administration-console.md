---
owner: miketak
last_reviewed: 2026-10-04
description: What the administration console is, the seven pages it holds, why an administrator stands outside every organization, and what the help metrics page measures.
---

# What is the administration console?

The administration console is where the platform is run: accounts, access requests, organizations, the factor pack catalogue, help metrics and the deployment's settings. It shows nothing from inside an organization: "Client inventory data stays inside each organization."

<!-- sources: specs 01.3, 01.5, 01.6, 09; the old page tasks/administration/index.md (verified 2026-09-24); frontend/src/features/admin/AdminLayout.tsx and frontend/src/components/Sidebar.tsx (the rail and its sections; spec 10); AdminDashboardPage.tsx (headings and tiles); AdminHelpMetricsPage.tsx; AdminOrganizationsPage.tsx (what a grant never carries); frontend/src/features/home/LandingRedirect.tsx; frontend/src/components/AccountMenu.tsx -->

## Where is it?

An account with the Admin platform role lands on the console after signing in. The rail's **Area** block reads **Administration**, its sections run from **Dashboard** through **01 Access requests** to **06 Platform settings**, the foot link **GHG accounting** leads to the organizations you are a member of, and from an organization the account menu's **Administration** leads back.

## What are its pages?

| Page | What it holds |
| --- | --- |
| **Dashboard**, titled **Platform overview** | **Needs your attention**, the counts under **The platform**, the **Support access** grants of the last 30 days, **Recent platform activity**, and the settings in force. |
| **Access requests** | The requests **Waiting for a decision** and those **Already decided**. |
| **Users** | Every account with its role and status. |
| **Organizations** | Every organization with its owners, its member count and your support access. |
| **Factor packs** | The catalogue of families and editions, from draft to withdrawn. |
| **Help metrics** | How readers rate the help. |
| **Platform settings** | How long support access lasts and who may create an organization. |

## What is an administrator not?

An administrator is not a member of any organization by right; an owner adds one under **Settings**. To look inside an organization for a support case, an administrator assumes support access with a reason, for a limited window, and the owners see who took it and why. A grant "never carries deleting the organization, changing its membership, or adopting a factor pack edition."

## What does Help metrics show?

Each help article against the 80% helpful target, the comments readers left, and the searches that found nothing. **Platform overview** carries **Helpful votes, 30 days** and **Searches with no result, 30 days**, and flags any page under the target with at least five votes.

## Where next

- [Approve access requests and manage users](approve-access-requests-and-manage-users.md)
- [Assume support access](assume-support-access.md)
- [Author and publish a factor pack edition](author-and-publish-a-factor-pack-edition.md)
