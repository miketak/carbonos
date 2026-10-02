<!-- generated from qa/packs/governance/006-runs-final-publication-and-correction.yaml by make qa-export; edit the YAML -->
# Procedure 6: Runs, final, publication and correction

**Objective.** Confirm that a run is a numbered snapshot that is voided with a reason and never renumbered, that a final run refuses a planning value and a blend published on another GWP basis, that only a reviewer or an owner designates and publishes, that the report carries its header and intensity, that the exports match the page, that a published report never changes, and that a correction supersedes it with a reason.

**Covers** [spec 05.1](../../../specs/05.1-inventory-lifecycle-and-run-snapshots.md), [spec 05.2](../../../specs/05.2-run-numbering-and-voiding.md), [spec 05.3](../../../specs/05.3-inheritance-and-the-published-record.md), [spec 05.4](../../../specs/05.4-copying-a-view-across-consolidation-approaches.md), [spec 05.7](../../../specs/05.7-what-a-final-run-refuses.md), [spec 02.11](../../../specs/02.11-approval-as-a-control.md), [spec 07](../../../specs/07-reporting-and-verification.md), [spec 07.1](../../../specs/07.1-reporting-completeness.md), [spec 07.4](../../../specs/07.4-report-tables-factors-and-metadata.md), [spec 07.5](../../../specs/07.5-report-export.md), [spec 07.7](../../../specs/07.7-emissions-by-gas-that-ties-to-the-total.md) and [spec 07.8](../../../specs/07.8-pdf-readability.md).

**Estimated time:** 50 minutes.

**Procedure version:** 4 (2026-10-02). The change notes are at the foot.

**Run this procedure** after procedure 5. Procedure 7 raises a notice against the organization it leaves published.

## Prerequisites

- FY2025 as procedure 5 leaves it: frozen at boundary version 2, every record decided, no gate error.
- Ama in the normal window; Kofi, Esi and Yaw in the private window as the cases name them.
- These figures hold if every record was classified as procedure 5 lists. Run 001 rests on the supplier density (3 tonne of diesel at 0.8325 kg/litre is 3,603.6036 litre); the final run rests on the typical one (0.84 kg/litre, 3,571.4286 litre) flagged as a proxy. The product numbers every freeze and every run by act, so a step driven twice shifts them by one, and the verdict reads the state, not the number.

## A. Runs

### A1. The first run, and its lines

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Ama Owusu in the private window, sign in as "Ama Owusu". | Ama Owusu is signed in. |  |  |
| 2 | On **Runs**, click **Launch calculation run**. | Run 001 is listed with its total 120,458.96 kg CO₂e and "boundary v2". |  |  |
| 3 | Open Run 001. | The line of ACT-0004 reads 9,591.17 kg CO₂e and "3 tonne = 3000 kg ÷ 0.8325 kg/litre = 3603.603604 litre (density of Diesel (Adansi CoA))". The line of ACT-0006 reads 661.78 kg CO₂e and 17 covered days of 32. The derived line of ACT-0001 reads 445.22 kg CO₂e. The derived line of ACT-0006 reads 78.84 kg CO₂e: one line per included record as the table in the preamble lists them, plus two derived well-to-tank lines, each naming the LPG line it derives from. |  |  |
| 4 | Open Run 001 of "FY2025". | The exclusions are ACT-0007 (outside boundary, member from 2025-07-01), ACT-0008 (outside boundary), ACT-0009 (methodology, not estimated), each with its reason and detail. |  |  |
| 5 | Open Run 001 of "FY2025". | The refrigerant line carries 20 kg under HFCs. The row "CO₂e from factors without a gas split" carries 60,681.14 kg: four lines are priced from factors that publish CO₂e only, the Ghana grid 56,257.08, the flights 3,900.00 and the two well-to-tank LPG lines 445.22 and 78.84; the footing row "Total (scope 2 location-based), ties to section 04" equals the section 04 total. |  |  |

### A2. Voiding keeps the number and the figures

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Look. | Click Void… on Run 001: the dialog "Void Run 001?" keeps its button disabled until a reason is typed. |  |  |
| 2 | Click **Void…** on Run 001, give "Scratch run for the void case" and confirm. | Run 001 is listed marked VOIDED with your email and the reason "Scratch run for the void case". Its report opens with the banner that the run is voided and must not be relied on, and its figures are kept. |  |  |
| 3 | On **Runs**, click **Launch calculation run**. | Run 002 is listed; numbers are never reused. |  |  |
| 4 | Look. | Look for Mark as final on Run 001: there is none, a voided run cannot be designated final. |  |  |

## B. What a final run refuses

### B1. A planning value and a blend on another basis hold the designation

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Reopen as draft**, type "Reading the final-run holds" and confirm. |  |  |  |
| 2 | Open ACT-0004 and choose **Liquid fuels: Diesel (100% mineral diesel) (/litre)**, choose the density "Diesel (typical value)". | A warning on the **Emission factors** gate: "converts through the typical density of Diesel (0.84 kg/litre), a planning value. A run may use it; a final run may not". |  |  |
| 3 | Click **Edit inventory**, set the GWP set to AR6, and save. | A warning on the **Emission factors** gate: "whose CO2e is published under AR5 and cannot be re-derived under AR6 (no composition recorded)". |  |  |
| 4 | Click **Freeze inventory**. | The header reads "Boundary version 3". |  |  |
| 5 | On **Runs**, click **Launch calculation run**. | Run 003 is listed and "boundary v3": the run completes: a run may use both. |  |  |
| 6 | Click **Mark as final** on Run 003 and confirm. | Refused: "Run 3 cannot be designated final. <holds>": the message names the run by its number and then both holds, the blend first: "'Chiller refrigerant top-up' uses 'Blends: R407C, Emissions including only Kyoto products', whose CO2e is published under AR5 and cannot be re-derived under AR6 (no composition recorded): record the blend's composition, choose a factor on AR6, or run the inventory on AR5 (one GWP set across the inventory)." and "'Forklift diesel' converts through the typical density of Diesel (0.84 kg/litre), a planning value.". |  |  |

### B2. The proxy route, and one GWP set

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Reopen as draft**, type "Proxy flag and AR5 restored" and confirm. |  |  |  |
| 2 | Open ACT-0004 and choose **Liquid fuels: Diesel (100% mineral diesel) (/litre)**, choose the density "Diesel (typical value)", tick **proxy factor** and type "No certificate of analysis for this delivery; typical mid-range density". | The **Emission factors** gate no longer says "typical density": a documented proxy is an answer. |  |  |
| 3 | Click **Edit inventory**, set the GWP set to AR5, and save. | The **Emission factors** gate no longer says "cannot be re-derived". |  |  |
| 4 | Click **Freeze inventory**. | The header reads "Boundary version 4". |  |  |
| 5 | On **Runs**, click **Launch calculation run**. | Run 004 is listed with its total 120,373.32 kg CO₂e. The line of ACT-0004 reads 9,505.54 kg CO₂e and "(density of Diesel, typical value)". The proxy justification is not printed on the line; the lines CSV of case D1 carries it in proxy_justification. |  |  |

## C. The report header and the intensity

### C1. Metadata persists and reaches the next run

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Report**, fill in **Approved by (optional)** "Kofi Mensah, Reviewer", the uncertainty statement "Metered fuel and electricity; the flights figure is the travel agent's estimate", type the denominator "Product output", value 1500, unit `t`, then click **Add denominator**. Click **Save report header**. | "Report header saved." Every field reads what you typed; the row reads "Product output: 1,500 t". A row left in the fields is not saved; reload the page: every field reads what you typed, the denominator is on the inventory, not in the browser. |  |  |
| 2 | On **Runs**, click **Launch calculation run**. | The header names the approver "Kofi Mensah, Reviewer". **Intensity** reads "0.080249 t CO₂e per t of product output (1,500 t)": 120.373 t divided by 1,500. The methodology section prints the uncertainty statement "Metered fuel and electricity; the flights figure is the travel agent's estimate". The methodology section ends "3 of 9 lines record a quantitative uncertainty; weighted by emissions it is ±2.8% for those lines.": the run has nine lines, seven records and the two derived ones. |  |  |

## D. Exports, and the self-approval sentence

### D1. The four downloads match the page

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open Run 005. | Click PDF report: the PDF carries the numbered sections of the page, the factor table with each factor's source and vintage, and the row "CO₂e from factors without a gas split". |  |  |
| 2 | Look. | **Lines (CSV)** with `line_id`, `derived_from_line_id`, `record_ref`, `evidence_ref`, `density_material`, `density_kg_per_litre`, `proxy_justification`, `period_share`, `co2e_unsplit_kg`: one row per line; the forklift line carries the proxy justification, the straddling line period_share 0.53125 and the flights line co2e_unsplit_kg 3,900. |  |  |
| 3 | Look. | **Exclusions (CSV)** has 3 rows; ACT-0009 carries `estimate_state` `NOT_ESTIMATED`. **Exclusions (CSV)**; ACT-0009 carries `estimated_kg_co2e` empty. |  |  |
| 4 | Look. | **Frozen inputs (JSON)** carries `boundaryVersion` 4, the one instrument, the residual mix (not available). |  |  |

### D2. A self-approved factor is disclosed on the report

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Yaw Darko in the private window, sign in as "Yaw Darko". | Yaw Darko is signed in. |  |  |
| 2 | In Solo Ltd, open **Facilities**, then click **Add facility**. Fill in **Name** with `Solo Office`, fill in **Location** with `Accra`, fill in **Country (optional)** with `GH`, set **Legal entity** to Solo Ltd, then click **Add facility**. | Solo Office is listed under Solo Ltd. |  |  |
| 3 | Add the record "Office generator diesel" at Solo Office: 100 litre, 2025-03-01 to 2025-03-31, source "Fuel receipt". | Office generator diesel is on the register as a fact with the quantity 100 litre. |  |  |
| 4 | Open **Inventories** and click **New inventory**. Name "Solo FY2025", period 2025-01-01 to 2025-12-31, consolidation approach operational control, GWP set AR5, straddling records **Pro-rate by days (default)**, and **Start with every operation the approach includes in the boundary** ticked. Click **Create inventory**. | The list shows "Solo FY2025" as DRAFT with **Open**. |  |  |
| 5 | Click **Review activity data**. |  |  |  |
| 6 | Open Office generator diesel and choose **Diesel (Solo)**. | Office generator diesel reads included, uses **Diesel (Solo)**. |  |  |
| 7 | Choose **No residual mix is available** and save. | The inventory records that no residual mix is available. |  |  |
| 8 | Click **Freeze inventory**. |  |  |  |
| 9 | On **Runs**, click **Launch calculation run**. | Run 001 is listed with its total 266.00 kg CO₂e. |  |  |
| 10 | Look. | Open the PDF: the methodology section prints "Approved by the person who entered them, no other member of the organization being able to check them at the time: Diesel (Solo) (<the Yaw alias>).". Adansi's PDF of case D1 prints no such sentence: Kofi checked its factors. |  |  |

## E. Final designation and publication

### E1. Only a reviewer or an owner designates and publishes

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Esi Boateng in the private window, sign in as "Esi Boateng". | Esi Boateng is signed in. |  |  |
| 2 | Click **Mark as final** on Run 005 and confirm. | **Mark as final** is disabled, with the tooltip "Needs the Reviewer or Owner role.": a preparer's refusals are disabled controls, not dialogs. |  |  |
| 3 | As Kofi Mensah in the private window, sign in as "Kofi Mensah". | Kofi Mensah is signed in. |  |  |
| 4 | Open **Emission factors** and click **Unapprove** on "Long-haul flights (supplier)". | "Long-haul flights (supplier)" is listed as **Not approved**. |  |  |
| 5 | Click **Mark as final** on Run 005 and confirm. | Refused: "Run 5 cannot be designated final. <holds>": "'Staff flights' uses 'Long-haul flights (supplier)', which is not approved. Approve it under Emission factors, or choose another.": approval is checked again at the designation, not only at the run. |  |  |
| 6 | Click **Approve** on "Long-haul flights (supplier)". | "Long-haul flights (supplier)" is listed as **Approved** "by the Kofi alias" with the date: approved by Kofi, who did not enter it. |  |  |
| 7 | Click **Mark as final** on Run 005, type the review note "Reconciled against the March and June invoices" and confirm. | The header reads FINAL. . no **Reopen as draft**: the lifecycle bar reads "Final designated by <the Kofi alias> on <date>: Reconciled against the March and June invoices". |  |  |
| 8 | Click **Withdraw final designation** with no reason and confirm. | **Withdraw designation** stays disabled: "{what} needs a reason of at least 5 characters.". |  |  |
| 9 | Click **Withdraw final designation**, give "Checking the withdrawal" and confirm. | The header reads FROZEN: the history records the withdrawal with Kofi's email. |  |  |
| 10 | Click **Mark as final** on Run 005 and confirm. | The header reads FINAL. |  |  |
| 11 | As Esi Boateng in the private window, click **Publish** and confirm. | **Publish** is disabled, with the tooltip "Needs the Reviewer or Owner role.": a preparer's refusals are disabled controls, not dialogs. |  |  |
| 12 | As Kofi Mensah in the private window, click **Publish** and confirm. | The header reads PUBLISHED. The header reads "Report version 1": the lifecycle bar reads "Final designated by <the Kofi alias>" and "Published <time>." and says nothing on this inventory can change and that a correction is a new inventory that supersedes it; the Report tab reads "Published by <the Kofi alias>". |  |  |

## F. The published record and its correction

### F1. Nothing on a published inventory changes

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Ama Owusu in the private window, open the inventory "FY2025" (**Open**). | Only **Create correction** is offered: no **Reopen as draft**, no **Freeze inventory**, no **Edit inventory**. |  |  |
| 2 | On the inventory "FY2025", open **Runs**. | no **Void…**. The screen reads "Published. The runs are a record; a correction restates the year.". **Launch calculation run** is disabled with the title "A published inventory cannot be recalculated. Create a correction that supersedes it.": a published inventory's runs are a record. |  |  |
| 3 | Open ACT-0002, change the quantity to 121, and save with the reason "June invoice re-read after publication". | ACT-0002 is marked "Changed since publication: quantity". The line of ACT-0002 reads 56,257.08 kg CO₂e: the published report still reads 120 MWh and 56,257.08 kg: the report is frozen; the view marks what moved after it. |  |  |

### F2. A correction needs a reason and inherits the view

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Create correction** and type the reason "typo". | **Create correction** stays disabled: "A correction needs a reason of at least 10 characters: what was wrong in the published inventory.". |  |  |
| 2 | Click **Create correction** and type the reason "June electricity was 121 MWh, not 120". | The header reads DRAFT. A new draft, FY2025 (correction), opens with the boundary, the declaration, the classifications, the rule, the instrument and the residual mix inherited. Each inherited decision is marked as inherited. |  |  |
| 3 | Click **Freeze inventory**. |  |  |  |
| 4 | On **Runs**, click **Launch calculation run**. | The line of ACT-0002 reads 56,725.89 kg CO₂e. The header reads "Report version 2, supersedes FY2025". The correction block reads "Against the published run: 0 lines added, 0 removed, 1 changed". |  |  |
| 5 | Open Run 005 of "FY2025". | The header reads "Report version 1"; its header says it is superseded by FY2025 (correction): unchanged, and its header says it is superseded by the correction. |  |  |

## G. Copying the view across approaches

### G1. The equity share view brings the associate in

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Inventories** and click **New inventory**. Name "FY2025 equity view", period 2025-01-01 to 2025-12-31, consolidation approach equity share, GWP set AR5, straddling records **Pro-rate by days (default)**, and **Copy the view from (optional)** FY2025. Click **Create inventory**. | The list shows "FY2025 equity view" as DRAFT with **Open**. |  |  |
| 2 | On the inventory "FY2025 equity view", open **Boundary**. | Coldstore Ghana Ltd is in the boundary; Takoradi Cold Store is in; the economic interest reads 30. |  |  |
| 3 | Open **Where this inventory came from** at the top of the workbench. | **Where this inventory came from** lists "Coldstore Ghana Ltd: Methodology exclusion dropped, 30% equity share under this approach". |  |  |
| 4 | Click **Review activity data**. | ACT-0008 is still unclassified: Takoradi Cold Store is in the boundary under this approach; the classifications of the other records are inherited and marked. |  |  |
| 5 | Look. | Leave the equity view a draft. Procedure 8 reads its base-year gate. |  |  |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** a market-based figure priced at a residual mix (the mining pack); the chain of two corrections; an XLSX export; Monte Carlo uncertainty; a run label.

## Change notes

- **Version 2, 2026-09-29.** E1 steps 1a and 1b: Mark as final is refused while a factor the inventory applies is unapproved (PR #119). F1 step 2 reads the published inventory's banner and the disabled launch button's title (PR #119).
- **Version 3, 2026-09-29.** A1 step 2 and F2 step 2 quote the forklift line and the correction's name as the product prints them. F2 step 2: the inherited instrument keeps its certificate, registry and vintage (the walkthrough fix of 2026-09-29).
- **Version 4, 2026-10-02.** Transliterated to the QA scenario DSL. The runs, their lines, the exclusions, the by-gas row, the report header, the intensity, the CSV and JSON exports and the correction block are read from the API as well as from the screen; the PDF's sentences, the voided banner and the inherited marks are observed on screen.
