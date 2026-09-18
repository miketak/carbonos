# Procedure 5: Classification and the gates

**Objective.** Confirm, one record per rule, that classification is an
accounting decision: the stream sets the default, the grid factor is
suggested, mass meets volume through a density, a departure needs a
justification, a proxy needs one too, an unapproved factor blocks, an
exclusion needs a reason and one of three answers, a Montreal Protocol gas
is reported outside the scopes, a straddling record is pro-rated or
blocked, an upstream rule quantifies category 3, an instrument is applied
only when the eight criteria are met, and the residual mix is stated either
way. Then the freeze cuts a version.

**Covers** [spec 04.1](../../../specs/04.1-scope-as-accounting-decision.md),
[spec 04.2](../../../specs/04.2-activity-periods-and-pro-rating.md),
[spec 04.3](../../../specs/04.3-source-streams-and-scope-choice.md),
[spec 04.7](../../../specs/04.7-derived-fuel-and-energy-related-lines.md),
[spec 04.8](../../../specs/04.8-exclusions-without-a-false-zero-and-gases-outside-the-scopes.md),
[spec 02.2](../../../specs/02.2-units-densities-and-custom-units.md),
[spec 03.2](../../../specs/03.2-effective-dated-membership.md),
[spec 05.5](../../../specs/05.5-review-at-scale-and-deliberate-lifecycle-acts.md),
[spec 05.6](../../../specs/05.6-the-inventory-workbench.md),
[spec 07.3](../../../specs/07.3-scope-2-instrument-coverage.md) and
[spec 07.6](../../../specs/07.6-scope2-instrument-criteria-and-scope3-crosscheck.md).

**Estimated time:** 45 minutes.

**Run this procedure** after procedure 4.

## Prerequisites

- FY2025 as procedure 4 leaves it: a draft, reviewed, Tema Depot in the
  boundary, Coldstore Ghana Ltd excluded on method, Investments declared
  and not quantified.
- Ama in the normal window; Kofi in the private window for case B7.

## A. Review

### A1. Review decides the obvious records

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Records**, read the status filter. | Ten records. ACT-0007 (Tema Depot, May 2025) reads "Excluded · Outside boundary" with the computed detail "member from 2025-07-01": E1 joined on 2025-07-01 and the record is earlier. ACT-0008 (Takoradi Cold Store) reads "Excluded · Outside boundary": the facility is not in the boundary. Eight are unclassified. | | |
| 2 | Open ACT-0007's drawer and read the **Exclude** tab. | The reason and its detail are the computed ones; no justification was asked. | | |

## B. Classification, one record per rule

### B1. A plain scope 1 line

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open ACT-0001 (Boiler LPG, 2,400 litre). Search the picker for "LPG" and choose **Gaseous fuels: LPG** per litre. | The picker offers the `defra-2025` version, the one live in the period. The record reads included, scope 1, stationary combustion, at 1.55713 kg CO₂e/litre; there is no arithmetic preview line, because the record's unit is the factor's own (the preview appears only where a unit converts, as cases B2 and B4 show). The stream's default scope is taken without a justification. | | |

### B2. The grid factor is suggested

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open ACT-0002 (plant grid electricity, 120 MWh). | The drawer offers "Suggested for this facility's grid: Grid electricity, Ghana (2024)", the Ghana pack's row for the data year. | | |
| 2 | Click it. | Classified in scope 2, purchased electricity, with "120 MWh → 120,000 kWh × 0.468809 kg CO₂e/kWh". | | |

### B3. A contractor's stream lands in scope 3, and the lease is inherited

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open ACT-0003 (delivery fleet diesel) and choose **Liquid fuels: Diesel (100% mineral diesel)** per litre. | Scope 3, **1. Purchased goods and services**, with no justification field: the stream is operated by a contractor. The drawer says the lease "operating lease (leased in)" is inherited from Tema Depot. | | |
| 2 | Read the **Classification** gate. | A warning that begins "Records are classified into scope 3 purchased goods services but the declaration does not list it as covered." and asks to declare it or reclassify the records. | | |
| 3 | On **Boundary**, in the declaration, tick **1. Purchased goods and services** and save. | The warning goes. | | |

### B4. Mass meets volume through a density

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open ACT-0004 (forklift diesel, 3 tonne) and choose the same Diesel factor per litre. | Nothing is sent yet. The drawer keeps the factor in view and reads "tonne meets a factor per litre: choose the density that converts between them". The gate still lists ACT-0004 as unclassified. | | |
| 2 | Choose "Diesel (typical value)". | Classified, with "3 tonne → 3,571.4286 litre (density of Diesel, 0.84 kg/litre) × 2.66155 kg CO₂e/litre". The **Emission factors** gate warns: "'Forklift diesel' converts through the typical density of Diesel (0.84 kg/litre), a planning value. A run may use it; a final run may not: record the supplier's density, or flag the classification as a proxy with a justification.". | | |
| 3 | Choose **Diesel (Adansi CoA)** instead. | "3 tonne → 3,603.6036 litre" and the gate is silent. Procedure 6 puts the typical value back to read the final-run hold. | | |

### B5. The DESNZ blend, and the hand-entered one

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open ACT-0005 (chiller refrigerant top-up, 20 kg) and search for "R407C". | **Blends: R407C, Emissions including only Kyoto products** per kg, 1,624 kg CO₂e/kg, is offered. | | |
| 2 | Choose it. | Scope 1, fugitive emissions, "20 kg × 1,624 kg CO₂e/kg". The factor publishes an HFC mass, so the by-gas table of a run carries 20 kg under HFCs. | | |

### B6. A departure needs a justification; a proxy needs one too

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On ACT-0001, change the scope to scope 3 and the category to **1. Purchased goods and services**. | The drawer says "The stream suggests Scope 1." and shows a **scope justification** field. The **Classification** gate blocks: the record is classified in scope 3 without a justification. | | |
| 2 | Set the scope back to 1. | The gate is silent again. | | |
| 3 | On ACT-0010 (staff flights), choose **Long-haul flights (supplier)** and tick **proxy factor**. | A justification field opens and nothing is sent until it is filled: the drawer never records a proxy without its justification, so the rule "A proxy factor needs a justification: say what the factor stands in for." is met before the API is reached. | | |
| 4 | Type "Travel agent's average; no per-flight data" and let the field lose focus. | Saved. Scope 3, **6. Business travel**. The gate warns that records are classified into scope 3 business travel but the declaration does not list it as covered. | | |
| 5 | On **Boundary**, in the declaration, tick **6. Business travel** and save. | The warning goes. | | |

### B7. An unapproved factor blocks until the reviewer approves it

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On ACT-0005, replace the DESNZ blend with **R-410A (composition)**, the unapproved factor of procedure 2. | The **Emission factors** gate errors: the message names 'R-410A (composition)', "which is not approved. Approve it under Emission factors, or choose another.". | | |
| 2 | As Kofi in the private window, open **Emission factors** and approve it. | Approved by Kofi. | | |
| 3 | As Ama, read the gate again. | The error is gone. | | |
| 4 | Put the DESNZ R407C blend back on ACT-0005. | The composition blend is now unused. Procedure 8 deletes it. | | |

## C. Exclusions with a reason

### C1. A methodology exclusion, not estimated

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open ACT-0009 (canteen waste), switch to **Exclude**, choose **Methodology exclusion** and read the form. | It asks for a justification, a magnitude in kg CO₂e, and offers the two statements "This record emits nothing" and "Not estimated: there is no basis to size this record". | | |
| 2 | Type "short" and try to exclude. | The button stays disabled while the justification is under 10 characters, and while no magnitude and no statement is given. | | |
| 3 | Type "Waste contractor's factor not available; supplier study pending", tick **Not estimated**, and exclude. | The record reads "Excluded · Methodology exclusion" with "; not estimated". It never reads "about 0 kg CO₂e". | | |

### C2. A Montreal Protocol gas is reported outside the scopes

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open ACT-0001 (litres) and read the reasons on **Exclude**. | **Outside the scopes: Montreal Protocol gas** is not offered: the block reports a mass of gas, so the reason needs a mass unit. | | |
| 2 | Open ACT-0005 (kg) and read the reasons. | The reason is offered. Choose it: the form asks for a justification and a **Gas**, and no magnitude. | | |
| 3 | Type "Scratch: reading the Montreal Protocol form", gas "HCFC-22", and exclude. | The record reads "Excluded · Outside the scopes: Montreal Protocol gas" with "; HCFC-22, outside the scopes". | | |
| 4 | Re-include ACT-0005 and restore its classification with the DESNZ R407C blend. | The record is included again, as case B5 left it. | | |

### C3. A page of records under one reason

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Tick ACT-0007 and ACT-0008 and read the footer. | "2 selected" with **Exclude 2 selected**. | | |
| 2 | Click it, choose **Not applicable**, type "Scratch: bulk exclusion", and confirm. | A toast counts two. The dialog asked for no magnitude: one number typed once cannot size two records. Each reads "not estimated" in its drawer. | | |
| 3 | Re-include both, then click **Review activity data**. | Review excludes both again with the computed reasons of case A1. Nothing the tester typed survives. | | |

## D. A straddling record

### D1. Pro-rated by days, or blocked

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open ACT-0006 (year-end boiler LPG, 2025-12-15 to 2026-01-15) and choose **Gaseous fuels: LPG** per litre. | Classified. **Activity data completeness** warns: "'Year-end boiler LPG' (Kumasi Plant) covers 2025-12-15 to 2026-01-15; 17 of 32 days fall inside the reporting period and the membership window: the run pro-rates it to 53.13%.". | | |
| 2 | Click **Edit inventory**, set the straddle treatment to **Block the run until the record is split**, save, and read the gate. | The same finding is an error. | | |
| 3 | Set it back to **Pro-rate by days (default)**. | A warning again. | | |

## E. Method

### E1. Category 3 is quantified by an upstream rule

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Boundary**, in the declaration, tick **3. Fuel- and energy-related activities** and save. | The gate warns that category 3 is declared but no upstream rule matches a scope 1 or scope 2 factor in this view. | | |
| 2 | On **Method**, in **Add an upstream rule**, type "LPG" in **Narrow the primary factors** and choose **Gaseous fuels: LPG (/litre)**. Read the **Upstream factor** list. | A group **Suggested: named after the primary factor** holds **Well-to-tank: Gaseous fuels: LPG (/litre)**, the `defra-2025` version: both lists offer only the versions live in the inventory's period. The suggestion is offered, never applied. | | |
| 3 | Choose it and add. | "Upstream rule added." The warning goes. Every LPG litre now carries a well-to-tank line at 0.18551 kg CO₂e/litre. | | |
| 4 | Add a second rule: primary **Gaseous fuels: LPG (/litre)**, upstream **Grid electricity, Ghana (2024)** (narrow to "Ghana"). | Refused: the upstream factor is per kWh, which does not convert from a factor per litre. | | |

### E2. An instrument is applied only when the eight criteria are met

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Under the instruments card, add for Kumasi Plant: instrument certificate, 0 kg CO₂e per kWh, source "I-REC(E) Ghana 2025", covered quantity 150 MWh, reference "IREC-GH-2025-0091", registry "I-TRACK", vintage 2025, and answer criteria 1, 2, 4, 5, 6, 7 and 8 **Met**, leaving 3 at **Not yet answered**. | "Instrument recorded for Kumasi Plant." The row reads "Not applied: 1 unanswered". | | |
| 2 | Read the **Emission factors** gate. | "The instrument for Kumasi Plant does not meet the Scope 2 Quality Criteria (1 of the eight criteria not yet answered): the market-based figure falls back to location-based.". | | |
| 3 | Edit the instrument and answer criterion 3 **Met** (the form's button still reads **Add instrument**; it saves the edit). | The row no longer reads "Not applied". The gate warns instead: "The instrument for Kumasi Plant covers 150,000 kWh but the facility's scope 2 electricity in its period is 120,000 kWh: the excess covers nothing.". | | |
| 4 | Edit the covered quantity to 120. | The warning goes. | | |

### E3. The residual mix is stated either way

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Read the gate before touching the residual mix. | A warning that the inventory does not say whether a residual mix is available for its markets. | | |
| 2 | Choose **Yes** with no factor and save. | Refused: "A residual mix that is available needs its factor in kg CO2e per kWh.". | | |
| 3 | Choose **No residual mix is available** and save. | The warning goes. The report will print the double-counting disclosure and price uncovered kWh at the grid average. | | |

## F. The freeze

### F1. A version is cut, and a frozen inventory refuses writes

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Read the pre-flight. | No error remains. The warnings are the ones this procedure left: the straddling record, and the partial-period membership. | | |
| 2 | Click **Freeze inventory** and confirm. | The header reads FROZEN and "Boundary version 1". The bar says the boundary and the view are read-only and runs are allowed. | | |
| 3 | Try to untick a facility on **Boundary**, and to change ACT-0001's factor. | Both are refused: the change is not allowed while the inventory is frozen; reopen it as a draft first. | | |
| 4 | Click **Reopen as draft**, type "short" and read the button. | Disabled until the reason has 10 characters. | | |
| 5 | Give "Checking that a reopen keeps the version" and confirm. | DRAFT again. The version history keeps version 1 with "Reopened by <the Ama alias> on <time>: Checking that a reopen keeps the version". | | |
| 6 | Freeze again. | "Boundary version 2". The history reads both versions. | | |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** a custom unit in a classification (the mining pack);
Appendix F for a leased asset in scope 1 or 2; the coverage matrix over
twelve months, which needs monthly records; a legacy magnitude entered
before the three exclusion states existed, which the UI cannot produce.
