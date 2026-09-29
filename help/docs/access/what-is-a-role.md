---
owner: miketak
last_reviewed: 2026-09-28
description: The four organization roles, who assigns them, why signing off is kept apart from preparing, and how a platform administrator differs from an owner.
---

# What is a role?

A role is what your membership in one organization lets you do there: Owner, Reviewer, Preparer, or Verifier. It says nothing about any other organization, and nothing about running the platform.

<!-- sources: concepts/roles-and-who-does-what.md (verified 2026-09-24); specs 01.2, 01.3, 01.4, 02.11; roles.ts (the role sets and tooltips); MembersCard.tsx (labels); GhgService.java (the last-owner rule, setFactorApproval); GhgAccess.java (the role checks); ReadOnlyBanner.tsx; OrganizationLayout.tsx ("Organization not found") -->

## What are the roles?

| Role, as the **Members** card labels it | What it adds |
| --- | --- |
| Preparer (records, classifies, runs) | Records and corrects facts, imports and approves factors, classifies records, freezes, launches runs, designates the base year. |
| Reviewer (approves and publishes) | Everything a preparer does, and signs: marks a run as final, publishes, creates a correction, accepts or declines an edition. |
| Owner | Everything a reviewer does, and administers the organization: members, details, deletion. |
| Verifier (read-only) | Reads every page and changes nothing. The banner reads "Your role in this organization is Verifier (read-only)." |

## Who assigns a role?

An owner, on the organization's **Settings** under **Members**, by the email of an existing account. Whoever creates an organization is its first owner, and the organization must keep one: demoting or removing the last owner is refused with "'*organization*' needs at least one owner."

## Why is the reviewer not the preparer?

The roles nest, so a reviewer could prepare as well, but CarbonOS keeps the sign-off apart. Marking a run as final, publishing and creating a correction are refused to a preparer with the tooltip "Needs the Reviewer or Owner role.", so approval takes a second role. A factor, too, is checked by someone other than the person who typed it, whatever the roles; only when nobody else could check it is the approval recorded as self-approved, and the report says so.

## How is a platform administrator different?

A platform role, Admin or Member, sits on every account, set under **Users** in the administration console. It grants no role in any organization: an administrator who is not a member reads "Organization not found" until they take [support access](what-is-support-access.md).

## Where next

- [Check what your role may do](check-what-your-role-may-do.md).
- [Add members and assign roles](../organization/add-members-and-assign-roles.md).
