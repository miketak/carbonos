---
owner: miketak
last_reviewed: 2026-09-29
description: The permissions matrix, act by act, for the Owner, Reviewer, Preparer and Verifier roles and for support access, with the tooltip or refusal each blocked act shows.
role: Anyone
---

# Check what your role may do

Who may do what, act by act. A control your role may not use is disabled with a tooltip naming the roles that may, and the server refuses the same act naming the role: "This action needs the REVIEWER or OWNER role in the organization."

<!-- sources: reference/roles-and-permissions.md (verified 2026-09-24 and 2026-09-26); specs 01.2, 01.3, 01.4, 01.5, 01.8, 02.7, 02.11; roles.ts (WRITE_ROLES, APPROVE_ROLES, OWNER_ROLES, mayManageMembership, the three tooltips); GhgAccess.java (checkWrite, checkApprove, checkTenantDecision, checkOwner, checkMemberOwner, RoleRequiredException); GhgService.java, InventoryService.java, BaseYearService.java, FactorPackAdoptionService.java, FactorPackImportService.java, ActivityImportService.java, EvidenceService.java (the check each act calls); BaseYearPage.tsx (every button uses mayWrite); MembersCard.tsx (labels); OrganizationSettingsPage.tsx ("Settings are the owner's"); ReadOnlyBanner.tsx; FactorPackPublication.java (the curator rule); UserService.java (the administrator's own account) -->

## The roles

| Role | Where it is set | Label on screen |
| --- | --- | --- |
| Owner | An organization's **Settings**, under **Members** | Owner |
| Reviewer | Same | Reviewer (approves and publishes) |
| Preparer | Same | Preparer (records, classifies, runs) |
| Verifier | Same | Verifier (read-only); the banner "Your role in this organization is Verifier (read-only)." |
| Support access | The administration console, **Organizations**, **Assume access** | The banner "You are in *organization* (ORG-*NNNN*) under support access until *time*." |
| Platform administrator | The administration console, **Users**, role Admin | Admin |

## What each role may do

The foot of the organization's sidebar shows your own role: "Your role: Preparer", or "Support access" under a grant. "Yes" means the control is offered and the server accepts the act. The last column is the tooltip on the disabled control.

| Act | Owner | Reviewer | Preparer | Verifier | Support access | Tooltip when refused |
| --- | --- | --- | --- | --- | --- | --- |
| Read every page of the organization | Yes | Yes | Yes | Yes | Yes | |
| Record and correct legal entities, facilities, source streams, units and densities | Yes | Yes | Yes | No | Yes | Needs the Preparer, Reviewer or Owner role. |
| Enter, import, correct, evidence and remove activity records | Yes | Yes | Yes | No | Yes | Needs the Preparer, Reviewer or Owner role. |
| Import a factor pack; add or edit a factor by hand | Yes | Yes | Yes | No | Yes | Needs the Preparer, Reviewer or Owner role. |
| Approve a factor | Yes, if someone else entered it | Yes, if someone else entered it | Yes, if someone else entered it | No | Yes, if someone else entered it | Needs the Preparer, Reviewer or Owner role. |
| Create an inventory; edit its boundary, declaration, instruments and rules | Yes | Yes | Yes | No | Yes | Needs the Preparer, Reviewer or Owner role. |
| Review, classify and exclude records | Yes | Yes | Yes | No | Yes | Needs the Preparer, Reviewer or Owner role. |
| Freeze, reopen, launch a run, void a run | Yes | Yes | Yes | No | Yes | Needs the Preparer, Reviewer or Owner role. |
| Designate the base year, withdraw it, decide a recalculation candidate | Yes | Yes | Yes | No | Yes | Needs the Preparer, Reviewer or Owner role. |
| Mark a run as final; withdraw the designation | Yes | Yes | No | No | Yes | Needs the Reviewer or Owner role. |
| Publish; create a correction | Yes | Yes | No | No | Yes | Needs the Reviewer or Owner role. |
| Accept or decline a factor pack update | Yes | Yes | No | No | No: refused with "Support access cannot adopt an edition for an organization." | Needs the Reviewer or Owner role. |
| Add, change and remove members | Yes | No | No | No | No | Needs the Owner role. |
| Edit the organization's details; read its history on **Settings** | Yes | No | No | No | No: **Settings** is not offered, and the server refuses the edit | Settings are the owner's |
| Delete the organization | Yes | No | No | No | No | Needs the Owner role. |

A factor is checked by someone other than the person who entered it. Your own **Approve** is refused with "You entered '*factor*'. A factor is checked by someone other than the person who typed it (Corporate Standard chapter 7): ask *name* to approve it."

## What a platform administrator may do

A platform administrator works in the administration console, reached from the account menu as **Administration**. Without a support-access grant, an administrator is an outsider to every organization: the list under **GHG accounting** is empty, and an organization's address answers "Organization not found".

| Act | Platform administrator |
| --- | --- |
| Approve or deny access requests | Yes |
| Add a user with a temporary password; change a platform role; disable, enable or delete an account | Yes, except on their own account: "You cannot demote or disable your own account." and "You cannot delete your own account." |
| Change the support-access window and who may create organizations, with a reason | Yes |
| Assume support access to an organization, with a reason, for the window in force | Yes |
| Create, clone, edit and validate a factor pack edition | Yes |
| Publish an edition | Yes, if another administrator built it: "The approver must not be the curator." |
| Withdraw a published edition; delete a never-published draft | Yes |
| Read an organization's data without a grant | No |

## Two things a role does not settle

A role decides who may act, not whether the act is allowed right now: a preparer may classify records, but not while the inventory is frozen; a reviewer may publish, but not while a base-year candidate is undecided. The pre-flight gates name those holds; see [Clear the pre-flight findings](../inventories/clear-the-pre-flight-findings.md).

A role is not an audit trail either: every act is recorded under the email of the person who made it, and an act under support access carries the mark "under support access". When a screen refuses you and the role is the wrong one, see [Fix a sign-in or access problem](../fix/fix-a-sign-in-or-access-problem.md).
