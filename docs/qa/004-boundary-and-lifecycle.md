# Procedure 4: Boundary and inventory lifecycle

**Objective.** Confirm that an inventory starts from the consolidation
approach, that every operation left out carries a reason, that freezing
cuts an immutable boundary version, and that the lifecycle refuses every
write it must.

**Covers** [spec 03](../../specs/03-organizational-boundary.md),
[spec 03.2](../../specs/03.2-effective-dated-membership.md),
[spec 03.4](../../specs/03.4-entity-dates-facility-attributes-and-boundary-prefill.md),
[spec 05.1](../../specs/05.1-inventory-lifecycle-and-run-snapshots.md)
and [spec 07.2](../../specs/07.2-required-disclosures.md) (exclusions).

**Estimated time:** 60 minutes.

**Run this procedure** before a release, and after any change to
inventories, boundaries, versions or the lifecycle.

## Prerequisites

- Sankofa Gold plc as procedures 2 and 3 leave it.

## A. Creating inventories

### A1. Pre-population from the approach

1. Open **Inventories** and create **2025 Operational**: 2025-01-01 to
   2025-12-31, operational control, with **Start with every operation the
   approach includes** ticked (the default).
2. Open its boundary.

**Expected result:** E0 and E1 are in the boundary with all their
facilities. E2 is shown as **outside the boundary under operational
control** with 0% from its Table 1 row, and its checkbox is disabled. E2's
row asks why it is left out.

Verdict: ☐ pass ☐ fail. Notes:

### A2. The membership window defaults from the entity's dates

1. Create **2025 Financial**: same period, financial control, pre-populated.
2. Open its boundary and find E2.

**Expected result:** E2 is in the boundary at **100%** ("by decision") with
the window "member from 2025-07-01" already set from its acquisition date.

Verdict: ☐ pass ☐ fail. Notes:

### A3. A twelve-month hint

1. Start a new inventory with the period 2025-01-01 to 2026-06-30.

**Expected result:** the form says the period is 18 months and names the
fiscal-year label; it can still be saved. Cancel.

Verdict: ☐ pass ☐ fail. Notes:

## B. Exclusions

### B1. Unticking is the exclusion flow

1. In 2025 Operational, untick S5 (the exploration camp).
2. Open the pre-flight (the launch section).

**Expected result:** S5's row shows the reason control. The BOUNDARY gate
blocks: S5 is neither in the boundary nor excluded with a reason.

Verdict: ☐ pass ☐ fail. Notes:

### B2. Recording the reasons

1. On S5, choose **Not applicable** with the detail "Exploration only; no
   fuel or power in 2025".
2. On E2, choose **Methodology exclusion** with the detail "Associate: no
   operational control".

**Expected result:** both rows show their reason. The BOUNDARY gate no
longer lists them.

Verdict: ☐ pass ☐ fail. Notes:

### B3. Ticking an operation back in retires its exclusion

1. Tick S5 back in, then untick it again.

**Expected result:** the reason is gone after ticking in; unticking asks
for it again.

Verdict: ☐ pass ☐ fail. Notes:

### B4. Entity overrides apply to the whole entity

1. On E1's row, set the economic interest to 45 for this inventory only.
2. Open **Legal entities**.

**Expected result:** the boundary shows 45% for E1 and the version will
record it; the entity record still says 40%, and the BOUNDARY gate warns
about the drift.

Verdict: ☐ pass ☐ fail. Notes:

## C. Freezing and versions

### C1. Freezing cuts a version and reads it back

1. Record the S5 exclusion again (B3 removed it), then click **Freeze
   inventory** and confirm.
2. Open the version panel.

**Expected result:** boundary version 1 lists E0 and E1 with their
facilities, shares and the 45% override, and records the S5 and E2
exclusions with their reasons. The freeze is attributed to you with the
time.

Verdict: ☐ pass ☐ fail. Notes:

### C2. A frozen inventory refuses writes

1. Try to change the boundary, the declaration, an instrument, and the
   inventory's period.

**Expected result:** each is refused with a message that the inventory is
frozen and must be reopened. Runs are allowed (procedure 7).

Verdict: ☐ pass ☐ fail. Notes:

### C3. Reopening keeps the version

1. Click **Reopen as draft**, tick S5 back in, and freeze again.

**Expected result:** version 2 is cut; version 1 stays readable and
unchanged.

Verdict: ☐ pass ☐ fail. Notes:

### C4. Renaming a facility does not rewrite a version

1. Rename S4 to "Accra Head Office" under **Facilities**.
2. Open version 1.

**Expected result:** version 1 still shows "Accra Corporate Office".

Verdict: ☐ pass ☐ fail. Notes:

### C5. An empty boundary cannot be frozen

1. Create **Empty test** without pre-population and try to freeze it.

**Expected result:** refused: the boundary is empty. Delete the inventory
afterwards.

Verdict: ☐ pass ☐ fail. Notes:

## D. Copying a view

### D1. A second inventory copies the first

1. Create **2025 Equity** with equity share and **Copy the view from**
   2025 Operational.

**Expected result:** the pre-population checkbox is disabled once a source
is chosen. The new inventory's boundary matches 2025 Operational
(including the E1 override and the S5 exclusion), and the page says how
many decisions it inherited.

Verdict: ☐ pass ☐ fail. Notes:

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** re-populating a draft when its approach changes;
per-facility Table 1 facts (they live on the entity).
