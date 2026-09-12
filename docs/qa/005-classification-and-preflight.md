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
(the declaration cross-check), and
[spec 05.5](../../specs/05.5-review-at-scale-and-deliberate-lifecycle-acts.md)
(the filters, the factor as text, the freeze gate).

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

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In 2025 Operational, click **Review activity data**. | The toast counts the records pulled in ("88 new records under review"). R10 (S3, an associate's facility) reads "Excluded · Outside boundary (facility not in the boundary)"; R12 (2026) and the 72 rows imported in procedure 3 (all 2024) read "Excluded · Outside reporting period (reporting period 2025-01-01 to 2025-12-31)". The status filter shows the counts: All (88), Unclassified (14), Included and classified (0), Excluded (74). The view is paged at 50 rows; use **Search the view** to reach a record. | | |

### A2. The removed duplicate is excluded on review

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Find the camp LPG duplicate removed in procedure 3 (it is in the view only if the inventory reviewed it before the removal; if not, remove a reviewed record now and review again). | The record shows **Excluded · Record removed** with the removal detail ("removed <date> by <you>: Entered twice from the same log"), and the **Activity data completeness** gate does not call the exclusion stale. | | |

### A3. Search and filters in the view

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Search for `diesel`; filter by facility S2; filter by status Unclassified. | Each narrows the list; the counts in the status filter do not change (they describe the whole view, not the page). | | |
| 2 | Clear them, then set **Scope** to "Scope 2", **Stream** to "Tarkwa Processing Plant · Mill grid supply", **Lease** to "Operating lease (leased in)", and pick a **Category** (the list follows the chosen scope). | Each narrows the list the same way; with nothing classified yet the scope, category and lease filters return "No records match the search or the filters." Come back to them after section B. | | |
| 3 | Look at any row. | No factor list is rendered: an unclassified row offers **Choose factor…**; a classified row prints its factor as text. | | |

## B. Classification as a decision

To classify a record, click **Choose factor…** on its row (**Change
factor…** once a factor is chosen), narrow the list with the search box and
pick the factor. The row then prints the factor with its unit, its pack tag
when a pack delivered it and "not approved" when it is not, and the scope,
category and lease controls appear under it.

### B1. A stream sets the default and a contractor lands in scope 3

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Classify R1 (haul fleet diesel, stream Haul fleet) with **Diesel**. | R1 is scope 1 mobile combustion. | | |
| 2 | Classify R13 (contract mining fleet) with **Diesel**. | R13 defaults to **scope 3, 1. Purchased goods and services** with no warning and no justification field, because the stream is operated by a contractor. | | |

### B2. A departure needs a justification

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Classify R3 (petrol, no stream) with **Petrol** and change the scope to scope 3, category purchased goods and services. | Choosing scope 3 sets the category to purchased goods and services, the row says "'Petrol (100% mineral petrol)' suggests Scope 1." and shows a **scope justification** field. | | |
| 2 | Open the pre-flight. | The **Classification** gate blocks ("... is classified in scope 3; 'Petrol (100% mineral petrol)' defaults to scope 1. Record why (a justification of at least 10 characters), or classify it in scope 1."). | | |
| 3 | Type the justification "Fleet operated by a contractor from May" and let the field lose focus. | The gate is silent. | | |

### B3. A proxy factor is flagged

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open R11 (ANFO in `tonne ANFO`) for classification and read the picker. | The picker offers no factor and the row reads "No factor matches tonne ANFO: add a matching factor or record it in a compatible unit." | | |
| 2 | Under **Activity data**, correct R11's unit to **tonne** with the reason "Unit typed as tonne ANFO; the registered unit is tonne". | | | |
| 3 | Back in the view, classify R11 with **Explosives detonation (ANFO, emulsion)**, tick **proxy** and give the justification "national all-types default; supplier-specific factor pending approval". | The proxy flag and justification are saved (the justification saves when the field loses focus) and the line will print them. | | |

### B4. Mass meets volume through a density

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Classify R17 (12 tonne of diesel) with **Diesel** (per litre). | The factor is offered because densities exist. Picking it does not classify yet: the row says "tonne meets a factor per litre: choose the density that converts between them to finish classifying." and the gate still lists R17 as unclassified. | | |
| 2 | Choose the **typical** Diesel density, read the pre-flight. | With the typical density the preview reads "12 tonne → 14,285.7143 litre (density of Diesel, 0.84 kg/litre) × 2.66 kg CO₂e/litre" and the gate warns to replace it with the supplier's specification. | | |
| 3 | Then choose **Diesel (GOIL, 2025 CoA)**. | With the GOIL density the preview reads 12 tonne → 14,414.4144 litre and the gate is silent. | | |

### B5. A custom unit converts

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Classify the drums record with **Diesel**. | The preview reads "5 drum → 1,000 litre × 2.66 kg CO₂e/litre"; the gate is silent. | | |

### B6. The grid factor is suggested and a lease is inherited

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Find R18 (warehouse electricity). | The row offers the button "Suggested for this facility's grid: Grid electricity (Ghana, Ecoriv 2025)" and says "Leased facility: operating lease (leased in) inherited." | | |
| 2 | Click the suggestion. | Clicking the suggestion classifies the record; under operational control the lease keeps it in scope 2. | | |
| 3 | Choose **Not a leased asset** in the lease control. | "(set aside for this record)" is added. | | |
| 4 | Set it back to the operating lease. | | | |

### B7. An unapproved factor blocks

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Re-classify R11 (explosives, now in tonne) with the unapproved **Emulsion explosive (supplier)** factor from procedure 2 (F3), read the gate. | **Emission factors** blocks: "'ANFO explosives consumed' uses 'Emulsion explosive (supplier)', which is not approved. Approve it under Emission factors, or choose another." (it also warns: "'Emulsion explosive (supplier)' publishes CO2e only. Its emissions are counted in the scope totals and appear in the by-gas table on the row 'CO2e from factors without a gas split', not under CO2, CH4 or N2O."). | | |
| 2 | Then approve the factor under **Emission factors** and read the gate again. | After approval (no toast; the row now reads Approved) the gate no longer blocks. | | |
| 3 | Re-classify R11 as in B3 (the seeded factor, flagged as a proxy), and classify R6 (refrigerant, kg) with **Refrigerant R-407C leakage**. | | | |

Procedure 7 checks both lines.

### B8. A leased asset takes Appendix F

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Classify R2 (mill electricity) with the Ghana grid factor and set the lease type **Operating lease (leased in)**. | Under operational control it stays scope 2 with the lease recorded on the row and no scope note (Appendix F gives the lessee the same answer as the default, so nothing departs). | | |
| 2 | Clear the lease afterwards. | | | |

## C. Exclusions with a reason

### C1. A manual exclusion needs a justification and a magnitude

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On R8 (waste), click **Exclude…** and choose **Methodology exclusion**. | The exclusion form opens. | | |
| 2 | Submit with a 5-character justification. | The form's Exclude button stays disabled with the short justification, and again with an empty magnitude. | | |
| 3 | Then submit with "domestic waste; the library's commercial and industrial landfill factor does not fit; supplier study pending" and 259000 kg CO2e. | The record shows "Excluded · Methodology exclusion", the justification and "about 259 t CO₂e left out". | | |

The magnitude is the nearest library factor applied by hand: 640 short ton
× 0.907185 = 580.6 tonne × 446.2 kg CO2e per tonne = 259,063 kg, so the
estimate is of the right order.

### C2. An automatic reason keeps its computed detail

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Re-include R12 (2026), then exclude it again with **Outside reporting period**. | No justification is asked; the detail reads the reporting period. | | |

## D. Periods and coverage

### D1. A straddling record is pro-rated or blocked

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Classify R19 (December to January) with Diesel and read the gate. | With pro-rating, **Activity data completeness** warns that 31 of 62 days fall inside and the run pro-rates to 50%. | | |
| 2 | Click **Edit inventory** in the header, set **Records that straddle the period or a membership window** to **Block the run until the record is split**, save, and read again. | With blocking, the same gate errors. | | |
| 3 | Set it back to pro-rate. | | | |

### D2. The coverage matrix is per stream

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Scroll to **Period coverage**. | One row per stream of each facility in the boundary (a record without a stream gets a row of its own, named by its activity), including Camp LPG at S5 if S5 is in. The **Standby gensets** stream of procedure 2 has no record and carries a "no data" badge with every month empty; the mill grid supply shows only July filled. | | |

### D3. Twelve-month expectation

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Read the **Reporting boundary** gate. | No twelve-month warning for a calendar-year period; the 18-month inventory of procedure 4 (if kept) warns. | | |

## E. The declaration cross-check

### E1. A declared category without lines warns

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the declaration card, declare **15. Investments** and save. | | | |
| 2 | Read the **Classification** gate. | A warning "Scope 3 investments is declared as covered but no included record is classified into it ..." and another "Records are classified into scope 3 purchased goods services but the declaration does not list it as covered ...". | | |

### E2. A reason silences the warning

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Declare purchased goods and services too, and for investments enter "the associate reports its own inventory; equity share to be quantified from its 2025 report". Save. | Both warnings are gone. | | |
| 2 | Enter a reason shorter than 10 characters in **15. Investments: why not quantified this year**. | Refused with "Say why INVESTMENTS is not quantified (at least 10 characters).". | | |

## F. Ready to launch

### F1. The freeze waits for a clean classification

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Before classifying the remaining records, click **Freeze inventory**. | The dialog lists the five gates first (**Classification** with as many errors as records are still unclassified) and its **Freeze inventory** button is disabled with "<n> records are not classified; classify or exclude them first", naming up to five of them by record number ("ACT-00nn 'Mill grid electricity' at Tarkwa Processing Plant is not classified"). A direct request is refused (409) with the same records under `errors.records`. | | |
| 2 | Cancel. | | | |

### F2. Every gate passes or warns

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Classify every remaining included record: the grid factor for R2 and R4, **LPG** for both camp LPG records at S5 (S5 is in since procedure 4 C3), the landfill factor for R8 only if you re-included it, and R6 and R11 as B7 left them. | | | |
| 2 | Read the pre-flight. | Only the draft hold remains ("The inventory is a draft. Freeze it to enable a run."); the warnings are those this procedure expects (typical density if still chosen, the residual-mix disclosure of procedure 6, evidence references missing where you left them). | | |
| 3 | Click **Freeze inventory**. | The gate summary reads "passes" for **Classification** and the button is enabled. Confirm: this cuts boundary version 3 and the lifecycle bar reads "Boundary version 3". | | |
| 4 | Click **Reopen as draft**, give the reason "Instruments to add in procedure 6" and confirm. | The inventory is a draft for procedure 6; the **History** reads "reopened as a draft: Instruments to add in procedure 6" and version 3 in the version history carries the reopen line. | | |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** inferring the stream from the activity text; a
materiality threshold that excuses a category automatically.
