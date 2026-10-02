<!-- generated from qa/packs/governance/005-classification-and-the-gates.yaml by make qa-export; edit the YAML -->
# Procedure 5: Classification and the gates

**Objective.** Confirm, one record per rule, that classification is an accounting decision: the stream sets the default, the grid factor is suggested, mass meets volume through a density, a departure needs a justification, a proxy needs one too, an unapproved factor blocks, an exclusion needs a reason and one of three answers, a Montreal Protocol gas is reported outside the scopes, a straddling record is pro-rated or blocked, an upstream rule quantifies category 3, an instrument is applied only when the eight criteria are met, and the residual mix is stated either way. Then the freeze cuts a version.

**Covers** [spec 04.1](../../../specs/04.1-scope-as-accounting-decision.md), [spec 04.2](../../../specs/04.2-activity-periods-and-pro-rating.md), [spec 04.3](../../../specs/04.3-source-streams-and-scope-choice.md), [spec 04.7](../../../specs/04.7-derived-fuel-and-energy-related-lines.md), [spec 04.8](../../../specs/04.8-exclusions-without-a-false-zero-and-gases-outside-the-scopes.md), [spec 02.2](../../../specs/02.2-units-densities-and-custom-units.md), [spec 03.2](../../../specs/03.2-effective-dated-membership.md), [spec 05.5](../../../specs/05.5-review-at-scale-and-deliberate-lifecycle-acts.md), [spec 05.6](../../../specs/05.6-the-inventory-workbench.md), [spec 07.3](../../../specs/07.3-scope-2-instrument-coverage.md) and [spec 07.6](../../../specs/07.6-scope2-instrument-criteria-and-scope3-crosscheck.md).

**Estimated time:** 45 minutes.

**Procedure version:** 4 (2026-10-02). The change notes are at the foot.

**Run this procedure** after procedure 4.

## Prerequisites

- FY2025 as procedure 4 leaves it: a draft, reviewed, Tema Depot in the boundary, Coldstore Ghana Ltd excluded on method, Investments declared and not quantified.
- Ama in the normal window; Kofi in the private window for case B7.

## A. Review

### A1. Review decides the obvious records

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Ama Owusu in the private window, sign in as "Ama Owusu". | Ama Owusu is signed in. |  |  |
| 2 | On the inventory "FY2025", open **Records**. | 10 records; 8 are unclassified; 2 are excluded. ACT-0007 reads "Excluded · Outside boundary" with "member from 2025-07-01": E1 joined on 2025-07-01 and the record is earlier. ACT-0008 reads "Excluded · Outside boundary": the facility is not in the boundary. |  |  |
| 3 | Look. | Open ACT-0007's drawer: an excluded record's drawer has no tabs; the chip reads the computed reason and its detail, "Excluded · Outside boundary (Adansi Logistics Ltd: member from 2025-07-01)", and no justification was asked. |  |  |

## B. Classification, one record per rule

### B1. A plain scope 1 line

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open ACT-0001 and choose **Gaseous fuels: LPG (/litre)**. | ACT-0001 reads included, scope 1, **Stationary combustion**, uses **Gaseous fuels: LPG**: the stream's default scope is taken without a justification. The picker offered the defra-2025 version, the one live in the period, at 1.557 kg CO₂e per litre. There is no arithmetic preview line, because the record's unit is the factor's own (the preview appears only where a unit converts, as cases B2 and B4 show). |  |  |

### B2. The grid factor is suggested

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open ACT-0002. | The screen reads "Suggested for this facility's grid: Grid electricity, Ghana (2024)": ACT-0002 is the plant grid electricity, 120 MWh; the Ghana pack's row for the data year is offered. |  |  |
| 2 | Open ACT-0002 and click the suggestion "Suggested for this facility's grid". | The screen reads "120 MWh → 120,000 kWh × 0.468809 kg CO₂e/kWh". ACT-0002 reads included, scope 2, **Purchased electricity**, uses **Grid electricity, Ghana (2024)**. |  |  |

### B3. A contractor's stream lands in scope 3, and the lease is inherited

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open ACT-0003 and choose **Liquid fuels: Diesel (100% mineral diesel) (/litre)**. | ACT-0003 reads included, scope 3, **1. Purchased goods and services**: no justification field, the stream is operated by a contractor; the drawer says the lease "operating lease (leased in)" is inherited from Tema Depot. |  |  |
| 2 | Read the **Classification** gate on the pre-flight panel under **Records**. | A warning on the **Classification** gate: "Records are classified into scope 3 '1. Purchased goods and services' but the declaration does not list it as covered. Declare it, or reclassify the records.". |  |  |
| 3 | In the operational boundary declaration, tick **15. Investments**, **1. Purchased goods and services**, in the reason for not quantifying 15. Investments this year, type "Minority holding; no emissions data available this year", and click **Save declaration**. | The **Classification** gate no longer says "scope 3 '1. Purchased goods and services' but the declaration does not list it". |  |  |

### B4. Mass meets volume through a density

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open ACT-0004 and choose **Liquid fuels: Diesel (100% mineral diesel) (/litre)**. | The screen reads "tonne meets a factor per litre: choose the density that converts between them": nothing is sent yet; the drawer keeps the factor in view and the gate still lists ACT-0004 as unclassified. |  |  |
| 2 | Open ACT-0004 and choose **Liquid fuels: Diesel (100% mineral diesel) (/litre)**, choose the density "Diesel (typical value)". | The screen reads "3 tonne → 3,571.4286 litre (density of Diesel, 0.84 kg/litre) × 2.66155 kg CO₂e/litre". A warning on the **Emission factors** gate: "'Forklift diesel' converts through the typical density of Diesel (0.84 kg/litre), a planning value. A run may use it; a final run may not: record the supplier's density, or flag the classification as a proxy with a justification.". |  |  |
| 3 | Open ACT-0004 and choose **Liquid fuels: Diesel (100% mineral diesel) (/litre)**, choose the density "Diesel (Adansi CoA)". | The screen reads "3 tonne → 3,603.6036 litre". The **Emission factors** gate no longer says "typical density": procedure 6 puts the typical value back to read the final-run hold. |  |  |

### B5. The DESNZ blend, and the hand-entered one

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Look. | Open ACT-0005 (chiller refrigerant top-up, 20 kg) and search for "R407C": "Blends: R407C, Emissions including only Kyoto products" per kg, 1,624 kg CO₂e/kg, is offered. |  |  |
| 2 | Open ACT-0005 and choose **Blends: R407C, Emissions including only Kyoto products (/kg)**. | ACT-0005 reads included, scope 1, **Fugitive emissions**: no preview line, the record's unit is the factor's own; the factor publishes an HFC mass, so the by-gas table of a run carries 20 kg under HFCs. |  |  |

### B6. A departure needs a justification; a proxy needs one too

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open ACT-0001 and choose **Gaseous fuels: LPG (/litre)**, set the scope to Scope 3 and the category to **PURCHASED_GOODS_SERVICES**. | The screen reads "The stream suggests Scope 1.". An error on the **Classification** gate: "'Boiler LPG' is classified in scope 3; its stream 'Boiler LPG' defaults to scope 1. Record why (a justification of at least 10 characters), or classify it in scope 1.". |  |  |
| 2 | Open ACT-0001 and choose **Gaseous fuels: LPG (/litre)**, set the scope to Scope 1 and the category to **STATIONARY_COMBUSTION**. | The **Classification** gate no longer says "'Boiler LPG' is classified in scope 3". |  |  |
| 3 | Look. | On ACT-0010 (staff flights), choose "Long-haul flights (supplier)" and tick proxy factor: a justification field opens and nothing is sent until it is filled. The drawer never records a proxy without its justification, so the rule "A proxy factor needs a justification: say what the factor stands in for." is met before the API is reached. |  |  |
| 4 | Open ACT-0010 and choose **Long-haul flights (supplier)**, tick **proxy factor** and type "Travel agent's average; no per-flight data". | ACT-0010 reads included, scope 3, **6. Business travel**. A warning on the **Classification** gate: "Records are classified into scope 3 '6. Business travel' but the declaration does not list it as covered. Declare it, or reclassify the records.". |  |  |
| 5 | In the operational boundary declaration, tick **15. Investments**, **1. Purchased goods and services**, **6. Business travel**, in the reason for not quantifying 15. Investments this year, type "Minority holding; no emissions data available this year", and click **Save declaration**. | The **Classification** gate no longer says "scope 3 '6. Business travel' but the declaration does not list it". |  |  |

### B7. An unapproved factor blocks until the reviewer approves it

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open ACT-0005, tick **Show unapproved** and choose **R-410A (composition)**. | An error on the **Emission factors** gate: "'Chiller refrigerant top-up' uses 'R-410A (composition)', which is not approved. Approve it under Emission factors, or choose another.". |  |  |
| 2 | As Kofi Mensah in the private window, sign in as "Kofi Mensah". | Kofi Mensah is signed in. |  |  |
| 3 | Click **Approve** on "R-410A (composition)". | "R-410A (composition)" is listed as **Approved** "by the Kofi alias" with the date. |  |  |
| 4 | As Ama Owusu in the private window, read the **Emission factors** gate on the pre-flight panel under **Records**. | The **Emission factors** gate no longer says "which is not approved". |  |  |
| 5 | Open ACT-0005 and choose **Blends: R407C, Emissions including only Kyoto products (/kg)**. | ACT-0005 reads included, uses **Blends: R407C, Emissions including only Kyoto products**. The composition blend is now unused; procedure 8 deletes it. |  |  |

## C. Exclusions with a reason

### C1. A methodology exclusion, not estimated

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Look. | Open ACT-0009 (canteen waste), switch to Exclude and choose Methodology exclusion: the form asks for a justification, a magnitude in kg CO₂e, and offers the two statements "This record emits nothing" and "Not estimated: there is no basis to size this record". With "short" typed, the button stays disabled while the justification is under 10 characters, and while no magnitude and no statement is given. |  |  |
| 2 | Open ACT-0009, switch to **Exclude**, choose **Methodology exclusion**, type "Waste contractor's factor not available; supplier study pending", tick **Not estimated**, and exclude. | ACT-0009 reads "Excluded · Methodology exclusion", "; not estimated": it never reads "about 0 kg CO₂e". |  |  |

### C2. A Montreal Protocol gas is reported outside the scopes

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Look. | Open ACT-0001 (litres) and read the reasons on Exclude: "Outside the scopes: Montreal Protocol gas" is not offered; the block reports a mass of gas, so the reason needs a mass unit. On ACT-0005 (kg) the reason is offered, and choosing it asks for a justification and a Gas, and no magnitude. |  |  |
| 2 | Open ACT-0005, switch to **Exclude**, choose **Outside the scopes: Montreal Protocol gas**, type "Scratch: reading the Montreal Protocol form", gas "HCFC-22", and exclude. | ACT-0005 reads "Excluded · Outside the scopes: Montreal Protocol gas", "; HCFC-22, outside the scopes". |  |  |
| 3 | Re-include ACT-0005. | ACT-0005 is included again. |  |  |
| 4 | Open ACT-0005 and choose **Blends: R407C, Emissions including only Kyoto products (/kg)**. | ACT-0005 reads included, scope 1, uses **Blends: R407C, Emissions including only Kyoto products**: the record is included again, as case B5 left it. |  |  |

### C3. A page of records under one reason

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Look. | Tick ACT-0007 and ACT-0008 and read the footer: "2 selected" with Exclude 2 selected. |  |  |
| 2 | Tick ACT-0007 and ACT-0008, click **Exclude 2 selected**, choose **Not applicable**, type "Scratch: bulk exclusion", and confirm. | ACT-0007 reads "Excluded · Not applicable", with "Scratch: bulk exclusion", "; not estimated". ACT-0008 reads "Excluded · Not applicable", with "Scratch: bulk exclusion", "; not estimated". A toast counts two; the dialog asked for no magnitude: one number typed once cannot size two records, so each reads "not estimated" in its drawer. |  |  |
| 3 | Re-include ACT-0007. | ACT-0007 is included again. |  |  |
| 4 | Re-include ACT-0008. | ACT-0008 is included again. |  |  |
| 5 | Click **Review activity data**. | ACT-0007 reads "Excluded · Outside boundary" with "member from 2025-07-01". ACT-0008 reads "Excluded · Outside boundary": review excludes both again with the computed reasons of case A1; nothing the tester typed survives. |  |  |

## D. A straddling record

### D1. Pro-rated by days, or blocked

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open ACT-0006 and choose **Gaseous fuels: LPG (/litre)**. | A warning on the **Activity data completeness** gate: "'Year-end boiler LPG' (Kumasi Plant) covers 2025-12-15 to 2026-01-15; 17 of 32 days fall inside the reporting period and the membership window: the run pro-rates it to 53.13%.". |  |  |
| 2 | Click **Edit inventory**, set the straddle treatment to **Block the run until the record is split** and save. | An error on the **Activity data completeness** gate: "17 of 32 days fall inside the reporting period and the membership window. The inventory blocks straddling records: split the record at the cut-off or exclude it.": the same finding is an error. |  |  |
| 3 | Click **Edit inventory**, set the straddle treatment to **Pro-rate by days (default)** and save. | A warning on the **Activity data completeness** gate: "the run pro-rates it to 53.13%". |  |  |

## E. Method

### E1. Category 3 is quantified by an upstream rule

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the operational boundary declaration, tick **15. Investments**, **1. Purchased goods and services**, **6. Business travel**, **3. Fuel- and energy-related activities**, in the reason for not quantifying 15. Investments this year, type "Minority holding; no emissions data available this year", and click **Save declaration**. | A warning on the **Classification** gate: "Fuel- and energy-related activities is declared, but no upstream rule matches a scope 1 or scope 2 factor in this view; add a rule or say why category 3 is not quantified.". |  |  |
| 2 | Look. | On Method, in Add an upstream rule, type "LPG" in Narrow the primary factors and choose "Gaseous fuels: LPG (/litre)"; the Upstream factor list holds a group "Suggested: named after the primary factor" with "Well-to-tank: Gaseous fuels: LPG (/litre)", the defra-2025 version: both lists offer only the versions live in the inventory's period. The suggestion is offered, never applied. |  |  |
| 3 | On **Method**, in **Add an upstream rule**, choose the primary factor **Gaseous fuels: LPG (/litre)** and the upstream factor **Well-to-tank: Gaseous fuels: LPG (/litre)**, and add. | The **Classification** gate no longer says "no upstream rule matches": "Upstream rule added." Every LPG litre now carries a well-to-tank line at 0.18551 kg CO₂e/litre. |  |  |
| 4 | On **Method**, in **Add an upstream rule**, choose the primary factor **Gaseous fuels: LPG (/litre)** and the upstream factor **Grid electricity, Ghana (2024) (/kWh)**, and add. | Refused inline: "'Grid electricity, Ghana (2024)' is per kWh, which does not convert from 'Gaseous fuels: LPG' per litre. Choose an upstream factor in a unit the primary factor converts to.". |  |  |

### E2. An instrument is applied only when the eight criteria are met

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Under the instruments card, add for Kumasi Plant: energy attribute certificate, 0 kg CO₂e per kWh, source "I-REC(E) Ghana 2025", covered quantity 150 MWh, reference "IREC-GH-2025-0091", registry "I-TRACK", vintage 2025, and answer criteria 1, 2, 4, 5, 6, 7, 8 **Met**, leaving 3 at **Not yet answered**. | The row reads "Not applied: 1 unanswered": "Instrument recorded for Kumasi Plant.". |  |  |
| 2 | Read the **Emission factors** gate on the pre-flight panel under **Records**. | A warning on the **Emission factors** gate: "The instrument for Kumasi Plant does not meet the Scope 2 Quality Criteria (1 of the eight criteria not yet answered): the market-based figure falls back to location-based.". A warning on the **Emission factors** gate: "The instrument for Kumasi Plant covers 150,000 kWh but the facility's scope 2 electricity in its period is 120,000 kWh: the excess covers nothing.". |  |  |
| 3 | Click **Edit** on the instrument's row, answer the criteria (1 Met, 2 Met, 3 Met, 4 Met, 5 Met, 6 Met, 7 Met, 8 Met) and click **Save instrument**. | The row no longer reads "Not applied". The **Emission factors** gate no longer says "does not meet the Scope 2 Quality Criteria". A warning on the **Emission factors** gate: "the excess covers nothing": the first warning goes; the coverage warning stays. |  |  |
| 4 | Click **Edit** on the instrument's row, set the covered quantity to 120 and click **Save instrument**. | The **Emission factors** gate no longer says "the excess covers nothing". |  |  |

### E3. The residual mix is stated either way

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Read the **Emission factors** gate on the pre-flight panel under **Records**. | A warning on the **Emission factors** gate: "The inventory does not say whether a residual mix is available.". |  |  |
| 2 | Choose **Yes, an adjusted residual mix is published** with no factor and save. | Refused: "A residual mix that is available needs its factor in kg CO2e per kWh.". |  |  |
| 3 | Choose **No residual mix is available** and save. | The **Emission factors** gate no longer says "does not say whether a residual mix is available": the report will print the double-counting disclosure and price uncovered kWh at the grid average. |  |  |

## F. The freeze

### F1. A version is cut, and a frozen inventory refuses writes

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Look. | No error remains on the pre-flight: the warnings are the ones this procedure left: the straddling record and the partial-period membership, and the two factors that publish CO₂e only (the Ghana grid and the supplier's flights), whose emissions the by-gas table carries on one row. |  |  |
| 2 | Click **Freeze inventory**. | The header reads FROZEN. The header reads "Boundary version 1". The screen reads "Frozen. The boundary and the activity view are read-only and runs are allowed.". |  |  |
| 3 | On the inventory "FY2025", open **Boundary**. | Adansi Logistics Ltd is in the boundary; its checkbox is disabled, the boundary is frozen. Try to change ACT-0001's factor: the drawer shows the classification without its factor, scope and category controls. The lifecycle bar says the boundary and the view are read-only; reopen the inventory as a draft to change either. |  |  |
| 4 | Click **Reopen as draft**, type "short" and confirm. | **Reopen as draft** stays disabled: "Reopening needs a reason of at least 10 characters: what the draft will change. The next freeze cuts a new boundary version.". |  |  |
| 5 | Click **Reopen as draft**, type "Checking that a reopen keeps the version" and confirm. | The header reads DRAFT. On **Boundary**, the version list keeps version 1 with its reopening: "Checking that a reopen keeps the version": Runs carries the same act in the inventory's history. |  |  |
| 6 | Click **Freeze inventory**. | The header reads "Boundary version 2"; the history reads 2 versions. |  |  |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** a custom unit in a classification (the mining pack); Appendix F for a leased asset in scope 1 or 2; the coverage matrix over twelve months, which needs monthly records; a legacy magnitude entered before the three exclusion states existed, which the UI cannot produce.

## Change notes

- **Version 2, 2026-09-29.** B3 step 2 and B6 step 4 quote the declaration warnings with the categories' report labels (PR #119).
- **Version 3, 2026-09-29.** E2 step 3 clicks Save instrument, the label the form now gives an edit. F1 step 1 lists the CO₂e-only warnings. The bulk exclusion dialog of C3 no longer offers the Montreal Protocol reason, which needs a gas and a mass per record (the walkthrough fixes of 2026-09-29).
- **Version 4, 2026-10-02.** Transliterated to the QA scenario DSL. The view's records, the gate findings, the rules, the instrument and the versions are read from the API as well as from the screen; the picker's offer, the drawer's sentences and the disabled buttons are observed on screen.
