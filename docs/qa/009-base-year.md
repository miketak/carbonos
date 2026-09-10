# Procedure 9: Base year and recalculation

**Objective.** Confirm that the base year is designated with its reason and
policy, that structural changes are detected at freeze and weighed
cumulatively, that manual candidates are raised and decided, and that the
report shows the profile over time.

**Covers** [spec 06](../../specs/06-tracking-emissions-over-time.md),
[spec 06.1](../../specs/06.1-recalculation-policy-conformance.md) and the
comparison run of [spec 03.4](../../specs/03.4-entity-dates-facility-attributes-and-boundary-prefill.md).

**Estimated time:** 60 minutes.

**Run this procedure** before a release, and after any change to the base
year, recalculations, structural-change detection or the report's base-year
section.

## Prerequisites

- 2025 Operational published as procedure 8 leaves it, the base year
  designated there, and **2026 Corporate** (operational control, AR5,
  pre-populated) created there.
- Procedure 4 leaves an inventory named 2025 Equity; case B1a adds one
  for 2026, so read the names carefully.
- A calculator: the shares in section B are checked against run 006.

## A. Designation

### A1. A base year needs its reason and policy

1. Open **Base year**. If procedure 8 designated 2025 Operational, read
   the designation; otherwise designate it now with a 5% threshold, the
   reason "First year with metered data across every site" and the
   transaction-date convention.

**Expected result:** the page shows the year, the reason, the threshold and
the convention (Corporate Standard chapter 5 requires the reason and a
stated significance threshold), and under **Established by** the base-year
run: "Run 006 · 41,526.69 t CO₂e", the final run of the published
inventory.

Verdict: ☐ pass ☐ fail. Notes:

## B. Structural changes

### B1. A divestment flags a candidate at freeze

1. In 2026 Corporate (pre-populated with E0 and E1 and all their
   facilities; E2 is outside and, as in procedure 4, needs its reason
   before a run: **Methodology exclusion**, "Associate: no operational
   control"), untick S2, the Tarkwa plant. Unticking E1's only facility
   unticks E1, so the reason control is on E1's row: **Methodology
   exclusion**, "JV interest sold in January 2026". Freeze.
2. Return to **Base year**.

**Expected result:** a FLAGGED candidate reads "structural change: Tarkwa
Processing Plant removed; 51.77% of base-year emissions, above the 5%
threshold, recalculation required". The share is the plant's lines in run
006 (R2 21,388,500 kg, R17 38,342.34 kg and the R-407C top-up R6
73,089.45 kg: 21,499,931.79 kg together) over run 006's total of
41,526,692.97 kg, if every record was classified as procedure 5 lists.
The 2026 inventory's **Base year** gate blocks with the same sentence
until it is decided. (The office S4 alone would be 92,610 kg, 0.22%, far
below the threshold, which is why the plant is the divestment here.)

Verdict: ☐ pass ☐ fail. Notes:

### B1a. The hold applies only to inventories that report against the base year

1. Create **2026 Equity view**: equity share, 2026-01-01 to 2026-12-31.
2. Create **2024 Corporate**: operational control, 2024-01-01 to
   2024-12-31.
3. Read the **Base year** gate of each, and of 2026 Corporate.

**Expected result:** while a candidate above the threshold is undecided,
only 2026 Corporate (the base year's approach, a later period) is blocked.
The equity view's gate warns with the same sentence plus "This inventory
is not held because it is an equity share view and the base year is
operational control"; the 2024 draft's gate warns plus "... because its
period does not follow the 2025 base year".

Verdict: ☐ pass ☐ fail. Notes:

### B2. Cumulative weighing

1. Reopen 2026, also untick S4 with the reason "Sold in January 2026",
   and freeze again.

**Expected result:** a second candidate reads "Accra Head Office removed;
0.22% of base-year emissions on its own, 51.99% together with 1 earlier
change since the 2025 base year, above the 5% threshold, recalculation
required" (92,610 kg over the same total; chapter 5: the cumulative
effect of small changes counts).

Verdict: ☐ pass ☐ fail. Notes:

### B3. Deciding

1. On the first candidate click **Record recalculated base** and pick
   "Run 005 · 41,526.69 t CO₂e" from the list of the base-year
   inventory's runs (it stands in for a recalculated base; the arithmetic
   of a recalculation is a non-goal). On the second click **Decline** with
   the note "Office 0.2% on its own; the plant recalculation carries the
   cumulative effect".

**Expected result:** the first card reads RECALCULATED with who decided
and "recalculated base: Run 005"; the second reads DECLINED with the note
and who decided; the 2026 gate passes.

Verdict: ☐ pass ☐ fail. Notes:

## C. Manual candidates

### C1. A methodology change with a typed share

1. Raise a candidate: methodology change, "Supplier-specific grid factor
   replaces the national average", 3.2%.

**Expected result:** it is listed as FLAGGED, "3.2% of base-year
emissions, below the threshold · raised by <you>". From here on the 2026
gate warns (not blocks) about each undecided candidate below the
threshold.

Verdict: ☐ pass ☐ fail. Notes:

### C2. An error correction weighed against a comparison run

1. Raise a candidate: error correction, "Haul fleet diesel reconciled",
   leaving the share blank and naming run 001 of the base-year inventory
   (copy its id from the inventory page).

**Expected result:** the share is computed from the difference between the
two totals. Run 001 differs from run 006 only in R1 (1,200,000 against
1,250,000 US-gallon): 50,000 × 3.785411784 × 2.66 = 503,459.77 kg over
run 006's total, 1.21%, shown without a sign, and "4.41% together with 1
earlier change" (the methodology candidate of C1), below the threshold.
With neither a share nor a run, the form is refused with "Give the
affected share of base-year emissions, or name a comparison run of the
base-year inventory." under the share field.

Verdict: ☐ pass ☐ fail. Notes:

## D. The report

### D1. The profile over time

1. Reopen 2026 Corporate, click **Review activity data** ("88 new records
   under review"), classify R12 and R19 with **Diesel** (R19 straddles:
   31 of 62 days fall in 2026), and freeze. The boundary did not change,
   so no new candidate is flagged; the two candidates of section C keep
   the gate at a warning, which does not block.
2. Launch a run and open its report.

**Expected result:** the base-year section states the year, the reason,
the threshold ("applied to each change and to the cumulative effect") and
the convention, names "Base-year emissions (Run 006)", lists the four
candidates with their decisions ("Recalculated base (Run 005)" on the
first), and shows the emissions profile from the base year to 2026 with
the recalculated base (run 005) beside the original (run 006; equal here,
since run 005 stood in). 2026 Corporate and the 2025 correction of
procedure 8 are listed as not yet final. The profile lists only
inventories with the base year's approach and GWP set; 2026 Equity view,
and the 2025 Financial and 2025 Equity views of procedure 4 if kept,
appear under **Other views** with their approach and "AR5", not as years
of the series. The PDF prints the recalculation history and the same two
tables.

Verdict: ☐ pass ☐ fail. Notes:

### D2. Different GWP sets are flagged

1. Reopen the 2026 inventory, click **Edit inventory**, set the GWP set
   to AR6, save, and read the gate.

**Expected result:** the header badge reads "GWP AR6" and the **Base
year** gate warns "This inventory uses IPCC AR6 potentials; the 2025 base
year uses IPCC AR5. The required-gases amendment recommends the same set
for both." Set it back to AR5; the warning goes.

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
