# Procedure 8: Publication and corrections

**Objective.** Confirm that a final run is designated and withdrawn by the
right role, that a published report never changes, that what came after is
shown apart, and that a correction inherits the view with a reason and
reports what it changed.

**Covers** [spec 05.1](../../specs/05.1-inventory-lifecycle-and-run-snapshots.md),
[spec 05.2](../../specs/05.2-run-numbering-and-voiding.md),
[spec 05.3](../../specs/05.3-inheritance-and-the-published-record.md) and
[spec 01.2](../../specs/01.2-organization-membership-and-roles.md) (roles).

**Estimated time:** 45 minutes.

**Run this procedure** before a release, and after any change to
publication, corrections, the report snapshot or the audit events.

## Prerequisites

- **2025 Operational** with runs as procedure 7 leaves it.
- The Analyst (REVIEWER) and Auditor (VERIFIER) accounts of procedure 1.

## A. Final designation

### A1. Designating and withdrawing

1. As the Analyst, mark run 005 as final.
2. Try to reopen the inventory; then withdraw the designation with the
   reason "Run 006 will carry the approver"; reopen; freeze; launch run
   006; mark it final.

**Expected result:** while a run is final the page shows no **Reopen as
draft** (a direct request is refused with "A run is designated final.
Withdraw the designation before reopening the inventory."). The
withdrawal needs a reason and appears in the history with the Analyst's
email. The freeze after reopening cuts boundary version 5, so run 006
cites it. Run 006 is FINAL.

Verdict: ☐ pass ☐ fail. Notes:

### A2. Only an approver publishes

1. As the Auditor, try to publish. As the Analyst, publish.

**Expected result:** the Auditor's confirm dialog ends in "This action
needs the REVIEWER or OWNER role in the organization.". After the
Analyst publishes, the inventory is PUBLISHED, with the time and the
Analyst's email in the history ("Published · run #006") and in the report
header ("Published <time> by analyst...").

Verdict: ☐ pass ☐ fail. Notes:

## B. The published record

### B1. Nothing on a published inventory changes

1. Look for a way to reopen, to change the declaration, to void run 006,
   and to delete the inventory. If you can alter requests, send each to
   the API.

**Expected result:** the page offers only **Create correction**; every
control is disabled and the inventories list has no Delete for it. The
requests are refused (409): "A published inventory cannot change. Create
a correction that supersedes it.", "The inventory is published. Reopen it
as a draft to change it.", "A published inventory's runs are a record and
cannot be voided." and "A published inventory is a record and cannot be
deleted.".

Verdict: ☐ pass ☐ fail. Notes:

### B2. The published report is frozen

1. Under **Activity data**, correct R2 (mill electricity) to 50,000 MWh
   with a reason.
2. Under **Base year**, designate 2025 Operational as the base year (if
   not already) with a 5% threshold, the reason "First year with metered
   data across every site" and the transaction-date convention. Then
   create **2026 Corporate** under Inventories: 2026-01-01 to 2026-12-31,
   operational control, AR5, pre-populated. (Procedure 9 checks both.)
3. Open run 006's report.

**Expected result:** the report reads exactly as published (48,500 MWh;
its base-year section still says no base year is designated). A **Since
publication** block under the header lists the changed records ("Mill
grid electricity: quantity 48500 → 50000", and the camp LPG duplicate
removed in procedure 5) and "Later inventories: 2026 Corporate (2026)".

Verdict: ☐ pass ☐ fail. Notes:

### B3. The published view marks what changed

1. Open the inventory's activity view.

**Expected result:** R2's row still shows 48,500 MWh and carries the
badge "Changed since publication: quantity"; the published run's report
(procedure 7) is where the page says it reads exactly as published.

Verdict: ☐ pass ☐ fail. Notes:

## C. Corrections

### C1. A correction needs a reason and inherits the view

1. As the Analyst, scroll the page so the lifecycle bar sits just under
   the sticky page header, then click **Create correction** with the
   mouse (not the keyboard).
2. Name it "2025 Operational, correction 1". Try with an empty reason;
   then enter "Mill electricity understated by 1,500 MWh" and create.

**Expected result:** the first click opens the dialog; the header does not
swallow it. The button stays disabled without a name and a reason of at
least 10 characters. The correction opens as a draft: its boundary,
instruments, declaration and every classification and exclusion are
inherited (each marked "inherited"), and the header reads "Correction of
2025 Operational: 88 decisions inherited. Reason: Mill electricity
understated by 1,500 MWh".

Verdict: ☐ pass ☐ fail. Notes:

### C2. The correction's report says what changed

1. In the correction, review activity data (R2 is already corrected),
   freeze, launch a run and open its report.

**Expected result:** "Review activity data" says every record is already
reviewed. The report carries a **Correction of 2025 Operational** block
with the reason and "Against the published run: 0 lines added, 0 removed,
1 changed; +661.5 t CO₂e in total." (1,500,000 × 0.441 = 661,500 kg: the
inventory total uses the location-based scope 2 figure, as the report's
method disclosure says). The R2 line reads 22,050 t and market-based
15,600 t: 1,500,000 × 0.52 = 780,000 kg more, since the instrument still
covers 20,000 MWh and the balance grows. The header reads "Version 2,
supersedes 2025 Operational".

Verdict: ☐ pass ☐ fail. Notes:

### C3. The chain is visible

1. Open the published inventory and the correction.

**Expected result:** the published one is badged "PUBLISHED · SUPERSEDED",
links "Superseded by a correction" and its history says "Correction
created"; the correction's header shows version 2 and what it supersedes.
The published page no longer offers **Create correction**; a direct
request is refused with "This inventory has already been superseded.".

Verdict: ☐ pass ☐ fail. Notes:

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** re-syncing inherited decisions when the source changes
later; a diff of two PDFs.
