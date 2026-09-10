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
| R4 | S4 | (none) | Office grid electricity | 210000 | kWh | 2025-08-31 | Measured |
| R6 | S2 | (none) | Chiller refrigerant top-up | 45 | kg | 2025-09-15 | Measured |
| R8 | S1 | (none) | Domestic waste to landfill | 640 | short-ton | 2025-11-30 | Estimated |
| R10 | S3 | (none) | Shiploader diesel | 310000 | litre | 2025-09-30 | Measured |
| R12 | S1 | (none) | Haul fleet diesel (Q1 2026) | 300000 | litre | 2026-02-28 | Measured |
| R13 | S1 | Contract mining fleet | Contractor mining fleet diesel | 2100000 | litre | 2025-06-30 | Measured |
| R17 | S2 | (none) | Diesel by tanker | 12 | tonne | 2025-03-15 | Measured |
| R18 | S6 | (none) | Warehouse grid electricity | 5000 | kWh | 2025-08-31 | Measured |
| R19 | S1 | (none) | Straddling diesel | 10000 | litre | 2025-12-01 to 2026-01-31 | Measured |

The refs the cases also use come from procedure 3: **R1** is the haul
fleet diesel record (1,250,000 US-gallon, corrected to 1,200,000), **R11**
the ANFO record (8400 `tonne ANFO`), and "the drums record" the 5-drum
record. The numbering skips refs the cases do not need.

The cases name factors in short. The library lists them as **Diesel (100%
mineral diesel)**, **Petrol (100% mineral petrol)**, **Grid electricity
(Ghana, Ecoriv 2025)**, **Explosives detonation (ANFO, emulsion)**,
**Commercial and industrial waste to landfill** and, from the pack
imported in procedure 2, **Refrigerant R-407C leakage**.

## A. Review and the view

### A1. Review pulls every record in and decides the obvious ones

1. In 2025 Operational, click **Review activity data**.

**Expected result:** the toast counts the records pulled in ("88 new
records under review"). R10 (S3, an associate's facility) reads
"Excluded · Outside boundary (facility not in the boundary)"; R12 (2026)
and the 72 rows imported in procedure 3 (all 2024) read "Excluded ·
Outside reporting period (reporting period 2025-01-01 to 2025-12-31)".
The status filter shows the counts: All (88), Unclassified (14), Included
and classified (0), Excluded (74). The view is paged at 50 rows; use
**Search the view** to reach a record.

Verdict: ☐ pass ☐ fail. Notes:

### A2. The removed duplicate is excluded on review

1. Find the camp LPG duplicate removed in procedure 3 (it is in the view
   only if the inventory reviewed it before the removal; if not, remove a
   reviewed record now and review again).

**Expected result:** the record shows **Excluded · Record removed** with
the removal detail ("removed <date> by <you>: Entered twice from the
same log"), and the **Activity data completeness** gate does not call the
exclusion stale.

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
**scope 3, 1. Purchased goods and services** with no warning and no
justification field, because the stream is operated by a contractor.

Verdict: ☐ pass ☐ fail. Notes:

### B2. A departure needs a justification

1. Classify R3 (petrol, no stream) with **Petrol** and change the scope to
   scope 3, category purchased goods and services.
2. Open the pre-flight.

**Expected result:** choosing scope 3 sets the category to purchased
goods and services, the row says "'Petrol (100% mineral petrol)'
suggests Scope 1." and shows a **scope justification** field. The
**Classification** gate blocks ("... is classified in scope 3; 'Petrol
(100% mineral petrol)' defaults to scope 1. Record why (a justification
of at least 10 characters), or classify it in scope 1.") until the
justification "Fleet operated by a contractor from May" is typed and the
field loses focus; then it is silent.

Verdict: ☐ pass ☐ fail. Notes:

### B3. A proxy factor is flagged

1. Open R11 (ANFO in `tonne ANFO`) for classification and read the
   picker.
2. Under **Activity data**, correct R11's unit to **tonne** with the
   reason "Unit typed as tonne ANFO; the registered unit is tonne".
3. Back in the view, classify R11 with **Explosives detonation (ANFO,
   emulsion)**, tick **proxy** and give the justification "national
   all-types default; supplier-specific factor pending approval".

**Expected result:** after step 1 the picker offers no factor and the row
reads "No factor matches tonne ANFO: add a matching factor or record it
in a compatible unit." After step 3 the proxy flag and justification are
saved (the justification saves when the field loses focus) and the line
will print them.

Verdict: ☐ pass ☐ fail. Notes:

### B4. Mass meets volume through a density

1. Classify R17 (12 tonne of diesel) with **Diesel** (per litre).
2. Choose the **typical** Diesel density, read the pre-flight, then choose
   **Diesel (GOIL, 2025 CoA)**.

**Expected result:** the factor is offered because densities exist.
Picking it does not classify yet: the row says "tonne meets a factor per
litre: choose the density that converts between them to finish
classifying." and the gate still lists R17 as unclassified. With the
typical density the preview reads "12 tonne → 14,285.7143 litre (density
of Diesel, 0.84 kg/litre) × 2.66 kg CO₂e/litre" and the gate warns to
replace it with the supplier's specification; with the GOIL density the
preview reads 12 tonne → 14,414.4144 litre and the gate is silent.

Verdict: ☐ pass ☐ fail. Notes:

### B5. A custom unit converts

1. Classify the drums record with **Diesel**.

**Expected result:** the preview reads "5 drum → 1,000 litre × 2.66 kg
CO₂e/litre"; the gate is silent.

Verdict: ☐ pass ☐ fail. Notes:

### B6. The grid factor is suggested and a lease is inherited

1. Find R18 (warehouse electricity).

**Expected result:** the row offers the button "Suggested for this
facility's grid: Grid electricity (Ghana, Ecoriv 2025)" and says "Leased
facility: operating lease (leased in) inherited." Clicking the suggestion
classifies the record; under operational control the lease keeps it in
scope 2. Choosing **Not a leased asset** in the lease control adds "(set
aside for this record)"; set it back to the operating lease.

Verdict: ☐ pass ☐ fail. Notes:

### B7. An unapproved factor blocks

1. Re-classify R11 (explosives, now in tonne) with the unapproved
   **Emulsion explosive (supplier)** factor from procedure 2 (F3), read
   the gate, then approve the factor under **Emission factors** and read
   the gate again.

**Expected result:** **Emission factors** blocks: "'ANFO explosives
consumed' uses 'Emulsion explosive (supplier)', which is not approved.
Approve it under Emission factors, or choose another." (it also warns
that the factor publishes CO2e only). After approval (no toast; the row
now reads Approved) the gate no longer blocks. Re-classify R11 as in B3
(the seeded factor, flagged as a proxy), and classify R6 (refrigerant,
kg) with **Refrigerant R-407C leakage**, so procedure 7 checks both
lines.

Verdict: ☐ pass ☐ fail. Notes:

### B8. A leased asset takes Appendix F

1. Classify R2 (mill electricity) with the Ghana grid factor and set the
   lease type **Operating lease (leased in)**.

**Expected result:** under operational control it stays scope 2 with the
lease recorded on the row and no scope note (Appendix F gives the lessee
the same answer as the default, so nothing departs). Clear the lease
afterwards.

Verdict: ☐ pass ☐ fail. Notes:

## C. Exclusions with a reason

### C1. A manual exclusion needs a justification and a magnitude

1. On R8 (waste), click **Exclude…** and choose **Methodology exclusion**.
2. Submit with a 5-character justification; then with "domestic waste;
   the library's commercial and industrial landfill factor does not fit;
   supplier study pending" and 259000 kg CO2e.

**Expected result:** the form's Exclude button stays disabled with the
short justification, and again with an empty magnitude; the record shows
"Excluded · Methodology exclusion", the justification and "about 259 t
CO₂e left out". (The magnitude is the nearest library factor applied by
hand: 640 short ton × 0.907185 = 580.6 tonne × 446.2 kg CO2e per tonne =
259,063 kg, so the estimate is of the right order.)

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
2. Click **Edit inventory** in the header, set **Records that straddle
   the period or a membership window** to **Block the run until the
   record is split**, save, and read again.

**Expected result:** with pro-rating, **Activity data completeness**
warns that 31 of 62 days fall inside and the run pro-rates to 50%; with
blocking, the same gate errors. Set it back to pro-rate.

Verdict: ☐ pass ☐ fail. Notes:

### D2. The coverage matrix is per stream

1. Scroll to **Period coverage**.

**Expected result:** one row per stream of each facility in the boundary
(a record without a stream gets a row of its own, named by its activity),
including Camp LPG at S5 if S5 is in. The **Standby gensets** stream of
procedure 2 has no record and carries a "no data" badge with every month
empty; the mill grid supply shows only July filled.

Verdict: ☐ pass ☐ fail. Notes:

### D3. Twelve-month expectation

1. Read the **Reporting boundary** gate.

**Expected result:** no twelve-month warning for a calendar-year period;
the 18-month inventory of procedure 4 (if kept) warns.

Verdict: ☐ pass ☐ fail. Notes:

## E. The declaration cross-check

### E1. A declared category without lines warns

1. In the declaration card, declare **15. Investments** and save.
2. Read the **Classification** gate.

**Expected result:** a warning "Scope 3 investments is declared as covered
but no included record is classified into it ..." and another "Records
are classified into scope 3 purchased goods services but the declaration
does not list it as covered ...".

Verdict: ☐ pass ☐ fail. Notes:

### E2. A reason silences the warning

1. Declare purchased goods and services too, and for investments enter
   "the associate reports its own inventory; equity share to be quantified
   from its 2025 report". Save.

**Expected result:** both warnings are gone. A reason shorter than 10
characters in **15. Investments: why not quantified this year** is refused
with "Say why INVESTMENTS is not quantified (at least 10 characters).".

Verdict: ☐ pass ☐ fail. Notes:

## F. Ready to launch

### F1. Every gate passes or warns

1. Classify every remaining included record: the grid factor for R2 and
   R4, **LPG** for both camp LPG records at S5 (S5 is in since procedure 4
   C3), the landfill factor for R8 only if you re-included it, and R6 and
   R11 as B7 left them.
2. Read the pre-flight.

**Expected result:** only the draft hold remains ("The inventory is a
draft. Freeze it to enable a run."); the warnings are those this
procedure expects (typical density if still chosen, the residual-mix
disclosure of procedure 6, evidence references missing where you left
them). Freeze the inventory (this cuts boundary version 3), then reopen
it as a draft for procedure 6.

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
