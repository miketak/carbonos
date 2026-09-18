# Procedure 6: Runs, final, publication and correction

**Objective.** Confirm that a run is a numbered snapshot that is voided
with a reason and never renumbered, that a final run refuses a planning
value and a blend published on another GWP basis, that only a reviewer or
an owner designates and publishes, that the report carries its header and
intensity, that the exports match the page, that a published report never
changes, and that a correction supersedes it with a reason.

**Covers** [spec 05.1](../../../specs/05.1-inventory-lifecycle-and-run-snapshots.md),
[spec 05.2](../../../specs/05.2-run-numbering-and-voiding.md),
[spec 05.3](../../../specs/05.3-inheritance-and-the-published-record.md),
[spec 05.4](../../../specs/05.4-copying-a-view-across-consolidation-approaches.md),
[spec 05.7](../../../specs/05.7-what-a-final-run-refuses.md),
[spec 02.11](../../../specs/02.11-approval-as-a-control.md),
[spec 07](../../../specs/07-reporting-and-verification.md),
[spec 07.1](../../../specs/07.1-reporting-completeness.md),
[spec 07.4](../../../specs/07.4-report-tables-factors-and-metadata.md),
[spec 07.5](../../../specs/07.5-report-export.md),
[spec 07.7](../../../specs/07.7-emissions-by-gas-that-ties-to-the-total.md)
and [spec 07.8](../../../specs/07.8-pdf-readability.md).

**Estimated time:** 45 minutes.

**Run this procedure** after procedure 5. Procedure 7 raises a notice
against the organization it leaves published.

## Prerequisites

- FY2025 as procedure 5 leaves it: frozen at boundary version 2, every
  record decided, no gate error.
- Ama in the normal window; Kofi, Esi and Yaw in the private window as
  the cases name them.

These figures hold if every record was classified as procedure 5
lists. Run 001 rests on the supplier density (3 tonne of diesel at
0.8325 kg/litre is 3,603.6036 litre); the final run rests on the typical
one (0.84 kg/litre, 3,571.4286 litre) flagged as a proxy. The boundary
version and run numbers below assume a clean first pass; the product
numbers every freeze and every run by act, so a step driven twice shifts
them by one, and the verdict reads the state, not the number.

| Line | Arithmetic | kg CO₂e |
| --- | --- | --- |
| ACT-0001 Boiler LPG | 2,400 litre × 1.55713 | 3,737.11 |
| ACT-0002 Plant grid electricity, location-based | 120,000 kWh × 0.468809 | 56,257.08 |
| ACT-0003 Delivery fleet diesel (scope 3) | 5,000 litre × 2.66155 | 13,307.75 |
| ACT-0004 Forklift diesel, supplier density | 3,603.6036 litre × 2.66155 | 9,591.17 |
| ACT-0004 Forklift diesel, typical density | 3,571.4286 litre × 2.66155 | 9,505.54 |
| ACT-0005 Chiller refrigerant top-up | 20 kg × 1,624 | 32,480.00 |
| ACT-0006 Year-end boiler LPG, 17 of 32 days | 425 litre × 1.55713 | 661.78 |
| ACT-0010 Staff flights (scope 3) | 20,000 passenger-km × 0.195 | 3,900.00 |
| Well-to-tank of ACT-0001 (scope 3, category 3) | 2,400 litre × 0.18551 | 445.22 |
| Well-to-tank of ACT-0006 (scope 3, category 3) | 425 litre × 0.18551 | 78.84 |
| Total, run 001 | | 120,458.96 |
| Total, the final run | | 120,373.32 |

The market-based scope 2 figure is 0: the certificate covers the 120 MWh
at 0 kg CO₂e per kWh. The inventory total uses the location-based figure.

## A. Runs

### A1. The first run, and its lines

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Runs**, click **Launch calculation run**. | Run 001 appears with its total 120,458.96 kg CO₂e (120.46 t) and "Boundary version 2". | | |
| 2 | Open it and read the lines. | One line per included record as the table in the preamble lists them, plus two derived well-to-tank lines, each naming the LPG line it derives from. The straddling record's line reads 17 covered days of 32. The forklift line reads "3 tonne = 3,603.6036 litre (density of Diesel (Adansi CoA), 0.8325 kg/litre)". | | |
| 3 | Read the exclusions. | ACT-0007 (outside boundary, member from 2025-07-01), ACT-0008 (outside boundary), ACT-0009 (methodology exclusion, not estimated), each with its reason and detail. | | |
| 4 | Read the by-gas table. | The refrigerant line carries 20 kg under HFCs. The flights factor and the Ghana grid factor both publish CO₂e only, so the row "CO₂e from factors without a gas split" carries their 3,900 and 56,257.08 kg together, 60,157.08 kg; the Emission factors gate said so of each. The footing row "Total (scope 2 location-based), ties to section 04" equals the section 04 total. | | |

### A2. Voiding keeps the number and the figures

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Void…** on Run 001. | The dialog "Void Run 001?" keeps its button disabled until a reason is typed. | | |
| 2 | Give "Scratch run for the void case" and confirm. | Run 001 stays listed, marked VOIDED with your email and the reason. Its report opens with the banner that the run is voided and must not be relied on, and its figures are kept. | | |
| 3 | Launch another run. | Run 002. Numbers are never reused. | | |
| 4 | Look for **Mark as final** on Run 001. | There is none: a voided run cannot be designated final. | | |

## B. What a final run refuses

### B1. A planning value and a blend on another basis hold the designation

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Reopen as draft** with the reason "Reading the final-run holds". On **Records**, open ACT-0004 and switch its density to "Diesel (typical value)". | The **Emission factors** gate warns that the typical density is a planning value that a run may use and a final run may not. | | |
| 2 | Click **Edit inventory**, set the GWP set to AR6, and save. | The gate warns that 'Chiller refrigerant top-up' uses a blend whose CO2e is published under AR5 and cannot be re-derived under AR6 (no composition recorded). | | |
| 3 | Freeze (version 3) and launch Run 003. | The run completes: a run may use both. | | |
| 4 | Click **Mark as final** on Run 003 and confirm. | Refused. The message names the run by its number ("Run 3 cannot be designated final.") and then both holds: "'Forklift diesel' converts through the typical density of Diesel (0.84 kg/litre), a planning value: record the supplier's density under Units, or flag the classification as a proxy with a justification that says why the typical value stands (spec 02.2)." and "'Chiller refrigerant top-up' uses 'Blends: R407C, Emissions including only Kyoto products', whose CO2e is published under AR5 and cannot be re-derived under AR6 (no composition recorded): record the blend's composition, choose a factor on AR6, or run the inventory on AR5 (one GWP set across the inventory).". | | |

### B2. The proxy route, and one GWP set

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Reopen with the reason "Proxy flag and AR5 restored". On ACT-0004 tick **proxy factor** with the justification "No certificate of analysis for this delivery; typical mid-range density". | The gate's typical-density warning goes: a documented proxy is an answer. | | |
| 2 | **Edit inventory**, GWP set back to AR5. | The blend warning goes. | | |
| 3 | Freeze (version 4) and launch Run 004. | The forklift line reads "(density of Diesel, typical value)" with the justification. Total 120,373.32 kg CO₂e. | | |

## C. The report header and the intensity

### C1. Metadata persists and reaches the next run

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Report**, fill in **Approved by** "Kofi Mensah, Reviewer", the uncertainty statement "Metered fuel and electricity; the flights figure is the travel agent's estimate", and add the denominator "Product output", value 1500, unit `t`. Click **Save report header**. | "Report header saved.". | | |
| 2 | Reload the page. | Every field reads what you typed. The denominator is on the inventory, not in the browser. | | |
| 3 | Launch Run 005 and open its report. | The header names the approver. **Intensity** reads "0.080249 t CO₂e per t of product output (1,500 t)", 120.373 t divided by 1,500. The methodology section prints the uncertainty statement and ends "3 of 9 lines record a quantitative uncertainty; weighted by emissions it is ±2.": the run has nine lines, seven records and the two derived ones. | | |

## D. Exports, and the self-approval sentence

### D1. The four downloads match the page

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On Run 005's report, click **PDF report**. | The PDF carries the numbered sections of the page, the factor table with each factor's source and vintage, and the row "CO₂e from factors without a gas split". | | |
| 2 | Click **Lines (CSV)**. | One row per line with `line_id`, `derived_from_line_id`, `record_ref`, `evidence_ref`, `density_material`, `density_kg_per_litre`, `period_share` (0.53125 on the straddling line) and `co2e_unsplit_kg` (3,900 on the flights line). | | |
| 3 | Click **Exclusions (CSV)**. | Three rows; ACT-0009 carries `estimate_state` `NOT_ESTIMATED` with an empty `estimated_kg_co2e`. | | |
| 4 | Click **Frozen inputs (JSON)**. | The JSON carries `boundaryVersion` 4, the factors as applied, the one instrument and the residual mix (not available). | | |

### D2. A self-approved factor is disclosed on the report

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Yaw in the private window, open **Solo Ltd**. Add the facility "Solo Office" and one record: "Office generator diesel", 100 litre, 2025-03-01 to 2025-03-31, source "Fuel receipt". | The record is listed. | | |
| 2 | Create the inventory "Solo FY2025" (2025, operational control), click **Review activity data**, classify the record with **Diesel (Solo)**, state that no residual mix is available, freeze, and launch a run. | The run reads 266 kg CO₂e. | | |
| 3 | Open the PDF. | The methodology section prints "Approved by the person who entered them, no other member of the organization being able to check them at the time: Diesel (Solo) (<the Yaw alias>).". Adansi's PDF of case D1 prints no such sentence: Kofi checked its factors. | | |

## E. Final designation and publication

### E1. Only a reviewer or an owner designates and publishes

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Esi in the private window, open FY2025 and find **Mark as final** on Run 005. | The button is disabled, with the tooltip "Needs the Reviewer or Owner role.". A preparer's refusals are disabled controls with that tooltip, not dialogs. | | |
| 2 | As Kofi, click **Mark as final** on Run 005, type the review note "Reconciled against the March and June invoices", and confirm. | Run 005 is FINAL. The lifecycle bar reads "Final designated by <the Kofi alias> on <date>: Reconciled against the March and June invoices". **Reopen as draft** is gone. | | |
| 3 | Click **Withdraw final designation** and confirm with no reason. | The button stays disabled until a reason is typed. | | |
| 4 | Give "Checking the withdrawal" and confirm. | FROZEN again; the history records the withdrawal with Kofi's email. Mark Run 005 final again with no note. | | |
| 5 | As Esi, find **Publish**. | Disabled, with the same tooltip as step 1. | | |
| 6 | As Kofi, click **Publish** and confirm. | PUBLISHED. The report header reads "Published <time> by <the Kofi alias>", "Final designated by <the Kofi alias>" and "Report version 1". The bar says nothing on this inventory can change and that a correction is a new inventory that supersedes it. | | |

## F. The published record and its correction

### F1. Nothing on a published inventory changes

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Ama, look at the FY2025 header. | Only **Create correction** is offered: no reopen, no freeze, no edit. | | |
| 2 | Open **Runs**. | No **Void…** on any run: a published inventory's runs are a record. | | |
| 3 | On **Activity data**, correct ACT-0002 to 121 MWh with the reason "June invoice re-read after publication". Then read FY2025's **Records** tab. | The row is marked "Changed since publication: quantity". The published report still reads 120 MWh and 56,257.08 kg: the report is frozen; the view marks what moved after it. | | |

### F2. A correction needs a reason and inherits the view

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Create correction** and type the reason "typo". | The dialog's button stays disabled while the reason is under 10 characters: a correction needs a reason of at least 10 characters saying what was wrong in the published inventory. | | |
| 2 | Give "June electricity was 121 MWh, not 120". | A new draft, **FY2025 correction**, opens with the boundary, the declaration, the classifications, the rule, the instrument and the residual mix inherited. Each inherited decision is marked as inherited. | | |
| 3 | Freeze it and launch a run, then open the report. | The grid line reads 121,000 kWh × 0.468809 = 56,725.89 kg. The header reads "Report version 2, supersedes FY2025", and the correction block reads "Against the published run: 0 lines added, 0 removed, 1 changed". | | |
| 4 | Open FY2025's report again. | Unchanged, and its header says it is superseded by the correction. | | |

## G. Copying the view across approaches

### G1. The equity share view brings the associate in

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Create the inventory "FY2025 equity view": the same period, consolidation approach equity share, and **Copy the view from** FY2025. | The boundary lists Coldstore Ghana Ltd at 30%, its facility in the boundary, and its methodology exclusion dropped, listed under "Dropped exclusions". | | |
| 2 | Click **Review activity data** and read ACT-0008. | Included, unclassified: Takoradi Cold Store is in the boundary under this approach. The classifications of the other records are inherited and marked. | | |
| 3 | Leave the equity view a draft. | Procedure 8 reads its base-year gate. | | |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** a market-based figure priced at a residual mix (the
mining pack); the chain of two corrections; an XLSX export; Monte Carlo
uncertainty; a run label.
