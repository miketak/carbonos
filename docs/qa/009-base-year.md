# Procedure 9: Base year and recalculation

**Objective.** Confirm that the base year is designated with its reason and
policy, that structural changes are detected at freeze and weighed
cumulatively, that manual candidates are raised and decided, and that the
report shows the profile over time.

**Covers** [spec 06](../../specs/06-tracking-emissions-over-time.md),
[spec 06.1](../../specs/06.1-recalculation-policy-conformance.md) and the
comparison run of [spec 03.4](../../specs/03.4-entity-dates-facility-attributes-and-boundary-prefill.md).

**Estimated time:** 45 minutes.

**Run this procedure** before a release, and after any change to the base
year, recalculations, structural-change detection or the report's base-year
section.

## Prerequisites

- 2025 Operational published as procedure 8 leaves it, and the 2026
  inventory created there.

## A. Designation

### A1. A base year needs its reason and policy

1. Open **Base year**. Designate 2025 Operational with a 5% threshold, the
   reason "First year with metered data across every site" and the
   transaction-date convention.

**Expected result:** the page shows the year, the reason, the threshold and
the convention; the base-year run is run 006.

Verdict: ☐ pass ☐ fail. Notes:

## B. Structural changes

### B1. A divestment flags a candidate at freeze

1. In 2026 Corporate, add S1 and S2 to the boundary, leave S4 out with the
   reason "Sold in January 2026", and freeze.
2. Return to **Base year**.

**Expected result:** a flagged candidate names the facility removed and
its share of base-year emissions, and says whether it is above the 5%
threshold. The 2026 inventory's BASE_YEAR gate warns until it is decided.

Verdict: ☐ pass ☐ fail. Notes:

### B2. Cumulative weighing

1. Reopen 2026, also leave S5 out with a reason, and freeze again.

**Expected result:** a second candidate states its own share and the share
together with the earlier change.

Verdict: ☐ pass ☐ fail. Notes:

### B3. Deciding

1. Decline the first candidate with the note "Below threshold; combined
   effect reviewed at year end". Recalculate the second by naming a run of
   the base-year inventory.

**Expected result:** the declined one shows the note and who decided; the
recalculated one shows the run; the gate no longer warns.

Verdict: ☐ pass ☐ fail. Notes:

## C. Manual candidates

### C1. A methodology change with a typed share

1. Raise a candidate: methodology change, "Supplier-specific grid factor
   replaces the national average", 3.2%.

**Expected result:** it is listed as flagged with your email and the share.

Verdict: ☐ pass ☐ fail. Notes:

### C2. An error correction weighed against a comparison run

1. Raise a candidate: error correction, "Mill meter under-read", leaving
   the share blank and naming a run of the base-year inventory (copy a run
   id from the inventory page).

**Expected result:** the share is computed from the difference between the
two totals. With neither a share nor a run, the form is refused with a
message on the share field.

Verdict: ☐ pass ☐ fail. Notes:

## D. The report

### D1. The profile over time

1. Open the report of a 2026 run (launch one if none exists).

**Expected result:** the base-year section states the year, the reason,
the threshold and the convention, lists the candidates with their
decisions, and shows the emissions profile from the base year to 2026
with the recalculated base beside the original.

Verdict: ☐ pass ☐ fail. Notes:

### D2. Different GWP sets are flagged

1. Change the 2026 inventory's GWP set to AR6 (reopen first) and read the
   gate.

**Expected result:** a warning that the base year uses AR5 and the
amendment recommends the same set. Set it back.

Verdict: ☐ pass ☐ fail. Notes:

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** automatic detection of methodology changes; targets
(Chapter 11 has no spec yet).
