---
owner: miketak
last_reviewed: 2026-09-26
---

# Statuses and transitions

Every status a screen prints, what it permits, and the act that moves it
on. Each table names who may perform the act and what CarbonOS asks for.
The concept pages explain why the rules are as they are; this page states
them.

<!-- sources: format.ts (statusLabels, exclusionLabels, activityIssueLabels, estimateStateLabels, actionLabels, tierLabels, categories, streamKindLabels, leaseLabels, relationshipLabels, approachLabels, conventionLabels); LifecycleBar.tsx stateCopy; badges.tsx; api.ts RecalculationStatus; admin/api.ts FactorPackStatus; AdminFactorPacksPage.tsx statusHints; FactorPackUpdatesPage.tsx statusLabels; AdminAccessRequestsPage.tsx; specs 04.4, 04.6, 04.8, 05.1, 05.2, 05.3, 05.5, 06, 02.5, 02.7, 01.1; governance QA verified 2026-09-24; spec 01.8 (account numbers, verified 2026-09-26) -->

## Inventories

The badge in the workbench header reads the status, and after the first
freeze the boundary version: `FROZEN · BOUNDARY v2`. A published
inventory that a correction replaced reads `PUBLISHED · SUPERSEDED`.

| Status | What it permits | The lifecycle bar says |
| --- | --- | --- |
| Draft | Edit the boundary, the declaration, the instruments and rules, and every classification and exclusion. Runs are blocked. | "Draft. The boundary and the activity view are editable; runs are blocked until the inventory is frozen, which records a boundary version a verifier can trace every run back to." |
| Frozen | Launch runs, void a run with a reason, read everything. Nothing the run reads can change. | "Frozen. The boundary and the activity view are read-only and runs are allowed. Reopen the inventory as a draft to change either." |
| Final | Publish, or withdraw the designation. Runs can still be launched; the designated run stays the result. | "Final. A run is designated the final result. Withdraw the designation to reopen the inventory, or publish it to issue the report." |
| Published | Read the report as issued, launch further runs for comparison, and create a correction. | "Published. The report was issued; nothing on this inventory can change. A correction is a new inventory that supersedes this one." |

| From | To | Act | Who | CarbonOS asks for |
| --- | --- | --- | --- | --- |
| (none) | Draft | **New inventory** | Preparer, Reviewer, Owner | Name, period, straddle treatment, consolidation approach, GWP set; optionally a view to copy from, and whether to start with every operation the approach includes |
| Draft | Frozen | **Freeze inventory** | Preparer, Reviewer, Owner | Confirmation. Refused while an included record is unclassified, departs from its default scope without a justification, or is a draft at a facility in the boundary; the dialog names the records |
| Frozen | Draft | **Reopen as draft** | Preparer, Reviewer, Owner | A reason of at least 10 characters. The boundary version stays on the record |
| Frozen | Final | **Mark as final** on a run | Reviewer, Owner | An optional review note of up to 500 characters. Refused while a line rests on a typical density, a blend on another GWP basis, or an unapproved factor, and while an above-threshold base-year candidate is undecided |
| Final | Frozen | **Withdraw final designation** | Reviewer, Owner | A reason |
| Final | Published | **Publish** | Reviewer, Owner | Confirmation. The report is stored as issued |
| Published | (a new draft) | **Create correction** | Reviewer, Owner | A name and a reason of at least 10 characters. The new inventory inherits the view and supersedes this one when it is published |

## Calculation runs

Runs are numbered per inventory, `Run 001` onward, and a number is never
reused.

| Marker | Meaning | Act | Who | CarbonOS asks for |
| --- | --- | --- | --- | --- |
| (none) | A completed run, readable and exportable | **Launch calculation run** | Preparer, Reviewer, Owner | A label; the pre-flight gates must not hold the launch |
| VOIDED | The run must not be relied on; its lines and totals stay on the record | **Void…** | Preparer, Reviewer, Owner | A reason. A published inventory's runs cannot be voided |
| FINAL | The designated result of the inventory | **Mark as final** | Reviewer, Owner | See the inventory table |

## Activity records

A record's readiness pill counts what is still missing before an
accountant reviews it. Readiness is about completeness, not about whether
the figure is right.

| Pill | Meaning |
| --- | --- |
| Draft | Saved without its figures; "A draft; not yet a fact". |
| Ready | "All completeness checks passed": figures, a stream, a source and evidence are present. |
| *First missing item* +N | The items still missing, from: Missing quantity, Missing unit, Missing period, No stream, Missing source, Needs evidence. "Reference only, nothing attached" is informational and does not change the pill. |

| From | To | Act | Who | CarbonOS asks for |
| --- | --- | --- | --- | --- |
| (none) | Draft | **Save draft** in the drawer | Preparer, Reviewer, Owner | An activity type and a facility |
| Draft | Fact | **Save** in the drawer | Preparer, Reviewer, Owner | A quantity, a unit and a period. A fact never goes back to a draft |
| (none) | Facts | **Import CSV**, **Add records** | Preparer, Reviewer, Owner | A file that passes the dry run whole: one rejected row imports nothing |
| Fact | Corrected fact | **Save** with a changed value | Preparer, Reviewer, Owner | A reason of at least 5 characters; the old and new values are kept in the record's history |
| Fact | Removed | **Remove** | Preparer, Reviewer, Owner | A reason. A record a run calculated is left in place |

## Records in an inventory

On the **Records** tab each record of the organization carries the
inventory's decision about it.

| Status | Meaning |
| --- | --- |
| Unclassified | Included, but no factor chosen yet. Blocks the freeze. |
| Included · Scope N | Classified with a factor, scope and category. "inherited" marks a decision copied from another inventory. |
| Excluded · *reason* | Left out, with a reason and, for a manual exclusion, an estimate state. |

Three reasons are computed by **Review activity data** and need no
justification: Outside reporting period, Outside boundary (the facility
is not in the boundary, or the record falls outside the entity's
membership window), and Record removed. The reasons you choose are
Non-GHG activity, Duplicate, Not applicable, Methodology exclusion, Other
documented reason, and Outside the scopes: Montreal Protocol gas. A
manual exclusion states one of three things about the emissions it leaves
out: Estimated (a magnitude in kg CO₂e), Emits nothing, or Not estimated.
The Montreal Protocol reason asks for the gas instead of a magnitude and
is offered only on a record whose unit is a mass.

## Base-year recalculation candidates

| Status | Meaning | Act that leads here | Who |
| --- | --- | --- | --- |
| FLAGGED | A change awaits a decision. The card states the affected share of base-year emissions and whether it is above the threshold. | A freeze whose boundary differs from the base year's; or **Raise a candidate** for a methodology change or a corrected error | Freeze: Preparer, Reviewer, Owner. Raise: the same |
| RECALCULATED | A run of the base-year inventory is recorded as the recalculated base. | **Record recalculated base**, naming the run | Preparer, Reviewer, Owner |
| DECLINED | The base year stands; the note says why. | **Decline**, with a note | Preparer, Reviewer, Owner |
| SUPERSEDED | A later freeze put the boundary back as the base year held it; the candidate no longer applies. | A freeze | Preparer, Reviewer, Owner |

An above-threshold candidate under the same consolidation approach as the
base year holds the final designation of every inventory that reports
against the base year until it is recalculated or declined. Runs stay
available.

## Factor pack editions

Editions are maintained in the administration console under **Factor
packs**.

| Status | Meaning | Act that leads here | Who |
| --- | --- | --- | --- |
| DRAFT | "Invisible to organizations, rows mutable." | **New edition** or **Clone** | Platform administrator |
| PUBLISHED | "Importable; its rows and values never change again." | **Publish**, with every rule passing, a source document on file, an applies-from date, and an approver who is not the curator | A second platform administrator |
| SUPERSEDED | "A successor was published: readable, not importable." | Publishing a later edition of the family that applies from a later date | |
| WITHDRAWN | "Withdrawn with a reason: readable, not importable." | **Withdraw**, with a reason of at least 10 characters | Platform administrator |

A draft that was never published can be deleted with **Delete draft**; no
other edition can.

## Factor pack update notices

An organization sees one notice per published edition it holds a
predecessor of, under **Updates**.

| Status on screen | Meaning | Act | Who |
| --- | --- | --- | --- |
| Waiting on you | The edition can be adopted. | | |
| Accepted | The edition's versions were cut into the organization's factors from its applies-from date. | **Accept**, after answering how chapter 5 treats the adoption | Reviewer, Owner |
| Declined | Nothing moved. | **Decline** | Reviewer, Owner |
| Withdrawn by the publisher | The publisher withdrew the edition; there is nothing to decide. | | |

## Access requests and accounts

| Access request | Meaning |
| --- | --- |
| Waiting for a decision | A visitor asked for access; no administrator has decided. |
| Approved, waiting for the password to be set | The account exists with the status Pending activation and the approval email was sent. |
| Approved, account active | The person set a password from the emailed link. |
| Denied | An administrator denied the request. |

| Account status | Meaning |
| --- | --- |
| Active | Can sign in. |
| Pending activation | Created by an approval; cannot sign in until the password is set. |
| Disabled | Cannot sign in until an administrator enables it again. |

## Lists the screens use

**Consolidation approaches:** Equity share, Financial control, Operational
control.

**Table 1 relationships:** Group company or subsidiary (financial control);
Joint venture, partnership or operation (joint financial control);
Associate or affiliate (significant influence, no control); Fixed-asset
investment (no significant influence); Franchise (consolidated only with
equity rights or control).

**Lease types:** Finance lease (leased in), Operating lease (leased in),
Finance lease (leased out), Operating lease (leased out).

**Source stream kinds:** Stationary combustion, Mobile combustion, Process,
Fugitive, Purchased electricity, Purchased heat, steam or cooling, Waste,
Transport, Business travel, Employee commuting, Purchased goods and
services, Other.

**Scope 1 categories:** Stationary combustion, Mobile combustion, Process
emissions, Fugitive emissions. **Scope 2:** Purchased electricity,
Purchased heat and steam, Purchased cooling. **Scope 3:** the fifteen
categories of the Scope 3 Standard, numbered 1 to 15 on screen, from
"1. Purchased goods and services" to "15. Investments".

**Mid-year structural change conventions:** From the transaction date
(membership windows); For the whole year, as the Standard recommends.

**Data quality tiers:** 1 Metered or invoiced primary data; 2 Primary data
with minor estimation; 3 Calculated from partial primary data; 4 Estimated
from secondary or proxy data; 5 Rough estimate or assumption.

**Recorded acts** (an inventory's and an organization's history): Activity
data reviewed, Record classified, Inventory frozen, Inventory reopened, Run
launched, Run voided, Final run designated, Final designation withdrawn,
Published, Correction created, Report header saved, Organization created,
Organization renamed, Organization removed, Member added, Member role
changed, Member removed,
Support access assumed, Support access ended, Support access expired,
Factor pack adopted, Factor pack declined.
