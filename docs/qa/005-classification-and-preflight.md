# Procedure 5: Classification and pre-flight

**Objective.** Confirm that every record is classified as an explicit
accounting decision, that departures from the default need a justification,
that mass and volume reconcile through a density, and that the pre-flight
gates block a run that would misstate the inventory.

**Covers** [spec 04](../../specs/04-operational-boundary-and-classification.md),
[spec 04.1](../../specs/04.1-scope-as-accounting-decision.md),
[spec 04.2](../../specs/04.2-activity-periods-and-pro-rating.md),
[spec 04.3](../../specs/04.3-source-streams-and-scope-choice.md),
[spec 04.4](../../specs/04.4-activity-data-quality-evidence-and-corrections.md)
(exclusions), [spec 02.2](../../specs/02.2-units-densities-and-custom-units.md),
[spec 03.4](../../specs/03.4-entity-dates-facility-attributes-and-boundary-prefill.md)
(suggestions and leases), [spec 05](../../specs/05-inventories-and-calculation.md)
(gates) and [spec 07.6](../../specs/07.6-scope2-instrument-criteria-and-scope3-crosscheck.md)
(the declaration cross-check).

**Estimated time:** 90 minutes.

**Run this procedure** before a release, and after any change to
classification, streams, densities, the gates or the coverage matrix.

## Prerequisites

- Sankofa Gold plc as procedures 2 to 4 leave it, with **2025 Operational**
  reopened as a draft.
- Record these facts first, under **Activity data**:

| Ref | Site | Stream | Activity | Quantity | Unit | Period | Quality |
| --- | --- | --- | --- | --- | --- | --- | --- |
| R2 | S2 | Mill grid supply | Mill grid electricity | 48500 | MWh | 2025-07-01 to 2025-07-31 | Measured |
| R3 | S1 | (none) | Light vehicle fleet petrol | 120000 | litre | 2025-05-31 | Measured |
| R6 | S2 | (none) | Chiller refrigerant top-up | 45 | kg | 2025-09-15 | Measured |
| R8 | S1 | (none) | Domestic waste to landfill | 640 | short-ton | 2025-11-30 | Estimated |
| R10 | S3 | (none) | Shiploader diesel | 310000 | litre | 2025-09-30 | Measured |
| R12 | S1 | (none) | Haul fleet diesel (Q1 2026) | 300000 | litre | 2026-02-28 | Measured |
| R13 | S1 | Contract mining fleet | Contractor mining fleet diesel | 2100000 | litre | 2025-06-30 | Measured |
| R17 | S2 | (none) | Diesel by tanker | 12 | tonne | 2025-03-15 | Measured |
| R18 | S6 | (none) | Warehouse grid electricity | 5000 | kWh | 2025-08-31 | Measured |
| R19 | S1 | (none) | Straddling diesel | 10000 | litre | 2025-12-01 to 2026-01-31 | Measured |

## A. Review and the view

### A1. Review pulls every record in and decides the obvious ones

1. In 2025 Operational, click **Review activity data**.

**Expected result:** the toast counts the records pulled in. R10 (S3, an
associate's facility, outside the boundary) and R12 (2026) are excluded
automatically with the reason in words. The status filter shows the
counts by status.

Verdict: ☐ pass ☐ fail. Notes:

### A2. The removed duplicate is excluded on review

1. Find the camp LPG duplicate removed in procedure 3 (it is in the view
   only if the inventory reviewed it before the removal; if not, remove a
   reviewed record now and review again).

**Expected result:** the record shows **Excluded · Record removed** with
the removal detail.

Verdict: ☐ pass ☐ fail. Notes:

### A3. Search and filters in the view

1. Search for `diesel`; filter by facility S2; filter by status
   Unclassified.

**Expected result:** each narrows the list; the counts in the status filter
do not change.

Verdict: ☐ pass ☐ fail. Notes:

## B. Classification as a decision

### B1. A stream sets the default and a contractor lands in scope 3

1. Classify R1 (haul fleet diesel, stream Haul fleet) with **Diesel**.
2. Classify R13 (contract mining fleet) with **Diesel**.

**Expected result:** R1 is scope 1 mobile combustion. R13 defaults to
**scope 3 purchased goods and services** with no warning, because the
stream is operated by a contractor.

Verdict: ☐ pass ☐ fail. Notes:

### B2. A departure needs a justification

1. Classify R3 (petrol, no stream) with **Petrol** and change the scope to
   scope 3, category purchased goods and services.
2. Open the pre-flight.

**Expected result:** the CLASSIFICATION gate blocks until a justification
of at least 10 characters is recorded; after "Fleet operated by a
contractor from May" it is silent.

Verdict: ☐ pass ☐ fail. Notes:

### B3. A proxy factor is flagged

1. Classify R11 (ANFO in `tonne ANFO`) with **ANFO explosives**, tick
   **proxy** and give the justification "emulsion explosive: no published
   factor".

**Expected result:** the picker offers only factors in the identical unit;
the proxy flag and justification are saved and the line will print them.

Verdict: ☐ pass ☐ fail. Notes:

### B4. Mass meets volume through a density

1. Classify R17 (12 tonne of diesel) with **Diesel** (per litre).
2. Choose the **typical** Diesel density, read the pre-flight, then choose
   **Diesel (GOIL, 2025 CoA)**.

**Expected result:** the factor is offered because densities exist. Without
a density the gate blocks; with the typical one it warns to replace it
with the supplier's specification; with the GOIL density it is silent. The
preview reads 12 tonne → 14,414.4144 litre with the density named.

Verdict: ☐ pass ☐ fail. Notes:

### B5. A custom unit converts

1. Classify the drums record with **Diesel**.

**Expected result:** the preview reads 5 drum → 1,000 litre; the gate is
silent.

Verdict: ☐ pass ☐ fail. Notes:

### B6. The grid factor is suggested and a lease is inherited

1. Find R18 (warehouse electricity).

**Expected result:** the view suggests the Ghana grid factor for the
facility's grid region and says "Leased facility: operating lease (leased
in) inherited". Clicking the suggestion classifies the record; under
operational control the lease keeps it in scope 2. Choosing **Not a leased
asset** sets the lease aside for this record.

Verdict: ☐ pass ☐ fail. Notes:

### B7. An unapproved factor blocks

1. Classify R6 (refrigerant) with the unapproved supplier factor from
   procedure 2 (F3), read the gate, then approve the factor under
   **Emission factors** and read the gate again.

**Expected result:** EMISSION_FACTOR blocks with "not approved"; after
approval it passes. Re-classify R6 with the imported R-407C factor for
procedure 7.

Verdict: ☐ pass ☐ fail. Notes:

### B8. A leased asset takes Appendix F

1. Classify R2 (mill electricity) with the Ghana grid factor and set the
   lease type **Operating lease (leased in)**.

**Expected result:** under operational control it stays scope 2; the view
names Appendix F. Clear the lease afterwards.

Verdict: ☐ pass ☐ fail. Notes:

## C. Exclusions with a reason

### C1. A manual exclusion needs a justification and a magnitude

1. On R8 (waste), click **Exclude…** and choose **Methodology exclusion**.
2. Submit with a 5-character justification; then with "no published factor
   for this waste stream; supplier study pending" and 8400 kg CO2e.

**Expected result:** the form refuses the short justification and an empty
magnitude; the record shows the justification and "about 8.4 t CO2e left
out".

Verdict: ☐ pass ☐ fail. Notes:

### C2. An automatic reason keeps its computed detail

1. Re-include R12 (2026), then exclude it again with **Outside reporting
   period**.

**Expected result:** no justification is asked; the detail reads the
reporting period.

Verdict: ☐ pass ☐ fail. Notes:

## D. Periods and coverage

### D1. A straddling record is pro-rated or blocked

1. Classify R19 (December to January) with Diesel and read the gate.
2. Change the inventory's straddle treatment to **Block** and read again.

**Expected result:** with pro-rating, a warning says 31 of 62 days fall
inside and the run pro-rates to 50%; with blocking, the gate errors. Set
it back to pro-rate.

Verdict: ☐ pass ☐ fail. Notes:

### D2. The coverage matrix is per stream

1. Scroll to **Period coverage**.

**Expected result:** one row per stream of each facility in the boundary,
including Camp LPG at S5 if S5 is in, with a red "no data" badge on a
stream with nothing; the mill grid supply shows only July filled.

Verdict: ☐ pass ☐ fail. Notes:

### D3. Twelve-month expectation

1. Read the BOUNDARY gate.

**Expected result:** no twelve-month warning for a calendar-year period;
the 18-month inventory of procedure 4 (if kept) warns.

Verdict: ☐ pass ☐ fail. Notes:

## E. The declaration cross-check

### E1. A declared category without lines warns

1. In the declaration card, declare **15. Investments** and save.
2. Read the CLASSIFICATION gate.

**Expected result:** a warning that investments is declared but no record
is classified into it, and another that purchased goods and services has
records but is not declared.

Verdict: ☐ pass ☐ fail. Notes:

### E2. A reason silences the warning

1. Declare purchased goods and services too, and for investments enter
   "the associate reports its own inventory; equity share quantified from
   its 2025 report". Save.

**Expected result:** both warnings are gone. A reason shorter than 10
characters is refused.

Verdict: ☐ pass ☐ fail. Notes:

## F. Ready to launch

### F1. Every gate passes or warns

1. Classify every remaining included record (grid factor for R2 and R4,
   landfill for waste if it is re-included, LPG for the camp).
2. Read the pre-flight.

**Expected result:** no gate blocks; the warnings are those this procedure
expects (typical density if still chosen, the residual-mix disclosure of
procedure 6, evidence references missing where you left them). Freeze the
inventory: procedure 7 runs it.

Verdict: ☐ pass ☐ fail. Notes:

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** inferring the stream from the activity text; a
materiality threshold that excuses a category automatically.
