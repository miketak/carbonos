---
owner: miketak
last_reviewed: 2026-09-24
---

# Roles and permissions

Who may do what, in one table. CarbonOS has two separate role systems: a
platform role on every account, and an organization role on every
membership. The platform role decides whether you may run the platform;
the organization role decides what you may do inside one organization.
Nobody holds an organization role by right of their platform role.

<!-- sources: specs 01.2, 01.3, 01.4, 01.5, 02.11; roles.ts (WRITE_ROLES, APPROVE_ROLES, OWNER_ROLES, mayManageMembership); MembersCard.tsx labels; BaseYearPage.tsx, EmissionFactorsPage.tsx, AdoptionDiffDrawer.tsx, OrganizationSettingsPage.tsx role checks; governance QA 001 to 008 verified 2026-09-24 -->

## The roles

| Role | Where it is set | Label on screen |
| --- | --- | --- |
| Owner | An organization's **Settings**, under **Members** | Owner |
| Reviewer | Same | Reviewer (approves and publishes) |
| Preparer | Same | Preparer (records, classifies, runs) |
| Verifier | Same | Verifier (read-only) |
| Support access | The administration console, **Organizations**, **Assume access** | The banner "You are in *organization* under support access until *time*" |
| Platform administrator | The administration console, **Users**, role Admin | Admin |

The person who creates an organization is its first owner. An owner adds
members by the email of an existing account and can change any member's
role, but an organization must always keep at least one owner: CarbonOS
refuses to demote or remove the last one.

## What each role may do

"Yes" means the control is offered and the server accepts the act. A role
that may not act sees the control disabled with the tooltip named in the
last column, so nothing is hidden from a reader.

| Act | Owner | Reviewer | Preparer | Verifier | Support access | Tooltip when refused |
| --- | --- | --- | --- | --- | --- | --- |
| Read every page of the organization | Yes | Yes | Yes | Yes | Yes | |
| Record and correct legal entities, facilities, source streams, units and densities | Yes | Yes | Yes | No | Yes | Needs the Preparer, Reviewer or Owner role. |
| Enter, import, correct, evidence and remove activity records | Yes | Yes | Yes | No | Yes | Needs the Preparer, Reviewer or Owner role. |
| Import a factor pack; add a factor by hand | Yes | Yes | Yes | No | Yes | Needs the Preparer, Reviewer or Owner role. |
| Approve a factor | Yes, if someone else entered it | Yes, if someone else entered it | Yes, if someone else entered it | No | Yes, if someone else entered it | Needs the Preparer, Reviewer or Owner role. |
| Create an inventory; edit its boundary, declaration, instruments and rules | Yes | Yes | Yes | No | Yes | Needs the Preparer, Reviewer or Owner role. |
| Review, classify and exclude records | Yes | Yes | Yes | No | Yes | Needs the Preparer, Reviewer or Owner role. |
| Freeze, reopen, launch a run, void a run | Yes | Yes | Yes | No | Yes | Needs the Preparer, Reviewer or Owner role. |
| Mark a run as final; withdraw the designation | Yes | Yes | No | No | Yes | Needs the Reviewer or Owner role. |
| Publish; create a correction | Yes | Yes | No | No | Yes | Needs the Reviewer or Owner role. |
| Designate the base year; decide a recalculation candidate | Yes | Yes | Yes | No | Yes | Needs the Preparer, Reviewer or Owner role. |
| Accept or decline a factor pack update | Yes | Yes | No | No | No: refused with "Support access cannot adopt an edition for an organization." | Needs the Reviewer or Owner role. |
| Add, change and remove members | Yes | No | No | No | No | Needs the Owner role. |
| Edit the organization's details; read its history on **Settings** | Yes | No | No | No | No: **Settings** is not offered | Settings are the owner's |
| Delete the organization | Yes | No | No | No | No | Needs the Owner role. |

A factor is approved by someone other than the person who entered it
(GHG Protocol chapter 7 asks for a check by a second person). When the
author is the only member of the organization, the approval is recorded as
self-approved and the report says so.

## What a platform administrator may do

A platform administrator works in the administration console, reached from
the account menu as **Administration**. Without a support-access grant, an
administrator is an outsider to every organization: the organization list
under **GHG accounting** is empty, and an organization's address answers
"Organization not found".

| Act | Platform administrator |
| --- | --- |
| Approve or deny access requests | Yes |
| Add a user with a temporary password; change a role; disable, enable or delete an account | Yes, except on their own account, and never the last active administrator |
| Change the support-access window and who may create organizations, with a reason | Yes |
| Assume support access to an organization, with a reason, for the window in force | Yes |
| Create, clone, edit and validate a factor pack edition | Yes |
| Publish an edition | Yes, if another administrator built it: the approver must not be the curator |
| Withdraw a published edition; delete a never-published draft | Yes |
| Read an organization's data without a grant | No |

## Two things a role does not settle

A role decides who may act; it does not decide whether the act is allowed
right now. A preparer may classify records, but not while the inventory is
frozen; a reviewer may publish, but not while the base year holds the final
designation. The lifecycle bar and the pre-flight gates name those holds.

A role is also not an audit trail. Every act is recorded under the email of
the person who made it, and a support-access act is marked as taken under
support access, whatever the role that allowed it.
