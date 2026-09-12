# Procedure 7: Runs, reports and exports

**Objective.** Confirm that a run is a reproducible snapshot with the
arithmetic a verifier can re-perform, that runs are numbered and voided
rather than deleted, that the report carries every Chapter 9 element, and
that the exports match the page.

**Covers** [spec 05](../../specs/05-inventories-and-calculation.md),
[spec 05.1](../../specs/05.1-inventory-lifecycle-and-run-snapshots.md),
[spec 05.2](../../specs/05.2-run-numbering-and-voiding.md),
[spec 07](../../specs/07-reporting-and-verification.md),
[spec 07.1](../../specs/07.1-reporting-completeness.md),
[spec 07.2](../../specs/07.2-required-disclosures.md),
[spec 07.3](../../specs/07.3-scope-2-instrument-coverage.md),
[spec 07.4](../../specs/07.4-report-tables-factors-and-metadata.md),
[spec 07.5](../../specs/07.5-report-export.md) and the report parts of
[spec 04.4](../../specs/04.4-activity-data-quality-evidence-and-corrections.md).

**Estimated time:** 75 minutes.

**Run this procedure** before a release, and after any change to the
calculation, the report composite, the PDF or the CSV exports.

## Prerequisites

- **2025 Operational** frozen as procedures 5 and 6 leave it.
- A calculator. Do not eyeball the figures.
- A PDF reader and a spreadsheet application.

## A. Launching runs

### A1. The first run

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the launch section, keep the proposed label "Run 001" and launch. | The run page opens with "13 lines". The run cites boundary version 4 (versions 1 and 2 in procedure 4, 3 at the end of procedure 5, 4 at the end of procedure 6: every freeze cuts one) and is attributed to you as prepared by. | | |

### A2. The arithmetic re-performs

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open the snapshot lines. | Every figure matches to the kilogram; every line shows its factor, its share and its conversion. The totals are scope 1 13,694,478.207 kg, scope 2 location-based 21,483,315 kg (market-based 14,931,800 kg), scope 3 5,845,440 kg, total 41,023,233.207 kg (the total uses the location-based figure). | | |
| 2 | Check Haul fleet diesel (R1, corrected to 1,200,000 US-gallon). | 1,200,000 × 3.785411784 = 4,542,494.1408 litre × 2.66 = 12,083,034.415 kg; the three evidence attachments listed | | |
| 3 | Check Contract mining fleet diesel (R13). | 2,100,000 × 2.66 = 5,586,000 kg, scope 3 | | |
| 4 | Check Light vehicle fleet petrol (R3). | 120,000 × 2.162 = 259,440 kg, scope 3, with the justification printed | | |
| 5 | Check Diesel by tanker (R17). | 12,000 kg ÷ 0.8325 = 14,414.414414 litre × 2.66 = 38,342.342 kg, with the note "12 tonne = 12000 kg ÷ 0.8325 kg/litre = 14414.414414 litre (density of Diesel (GOIL, 2025 CoA))" | | |
| 6 | Check Diesel in drums. | 5 × 200 = 1,000 litre × 2.66 = 2,660 kg, "1 drum = 200 litre" | | |
| 7 | Check Straddling diesel (R19). | 10,000 × 2.66 × 50% = 13,300 kg, "pro-rated: 31 of 62 days inside the reporting period and the membership window (50%)"; its gas columns carry the same 50% (CO2 10,000 × 2.6307 × 50% = 13,153.5 kg) | | |
| 8 | Check ANFO explosives (R11). | 8,400 × 170 = 1,428,000 kg, scope 1 process, proxy flag and justification printed | | |
| 9 | Check Chiller refrigerant top-up (R6). | 45 kg × 1,624.21 = 73,089.45 kg, HFCs 45 kg of gas in the by-gas columns (AR5: 0.23 × 677 + 0.25 × 3,170 + 0.52 × 1,300) | | |
| 10 | Check Camp LPG (two records). | 18,000 × 1.557 = 28,026 kg each | | |
| 11 | Check Mill grid electricity (R2). | 48,500,000 × 0.441 = 21,388,500 kg; market-based 14,820,000 kg as written down in procedure 6, with the note "20,000,000 kWh at 0 kg/kWh (certificate); 28,500,000 kWh at 0.52 kg/kWh (residual mix)" | | |
| 12 | Check Office grid electricity (R4). | 210,000 × 0.441 = 92,610 kg; market-based 109,200 kg | | |
| 13 | Check Warehouse grid electricity (R18). | 5,000 × 0.441 = 2,205 kg; market-based 5,000 × 0.52 = 2,600 kg | | |

### A3. Numbering never reuses and voiding keeps the figures

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Launch "Run 002". | The run launches. | | |
| 2 | Void it with the reason "Duplicate of run 001". | The void dialog keeps its button disabled until a reason is typed; the voided run stays listed, struck through and marked VOIDED, with your name and the reason. | | |
| 3 | Launch again. | The new run is **003**. | | |
| 4 | Mark run 003 final. | Its **Void…** button disappears until **Withdraw final designation** is used with a reason (at least 5 characters). | | |
| 5 | Withdraw it again before going on, since procedure 8 designates the final run itself. | | | |

### A4. A run is a snapshot

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Under **Activity data**, correct R1 back to 1,250,000 with a reason. | The toast says "Record corrected. Past runs are unaffected." | | |
| 2 | Reopen the run 001 page. | Run 001 still reads 1,200,000; the inventory's gate now flags nothing (the fact changed, the run did not). Later runs pick the new quantity up: from run 004 on the total is 41,526,693 kg. | | |

## B. The report

### B1. Every Chapter 9 element in order

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Read the run 003 report top to bottom. | The numbered sections 00 to 10: report header; company and organizational boundary with the version; operational boundary with the declaration table (investments "declared, not quantified" with its reason; purchased goods and services with its lines); reporting period; emissions by scope with scope 2 both ways and the market basis, scope 3 by category, by facility, entity and country, and the intensity once B4 adds one; each gas in mass and CO2e with the footing row "Total (scope 2 location-based), ties to section 04" equal to the section 04 total (a row "CO₂e from factors without a gas split" naming its factors appears only when a line's factor publishes CO2e only; none does in this dataset); biogenic CO2; base year ("No base year designated" until procedure 8); methodology with the factor table and the data-quality table; exclusions with the per-reason summary (Outside reporting period 73 records, Outside boundary 1, Methodology exclusion 1 with 259 t, Record removed 1) and each justification; snapshot lines. | | |

### B2. Scope 2 disclosures

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Read the scope 2 section. | The instrument lists its eight outcomes, certificate, registry, vintage and retirement date; the residual-mix disclosure matches what procedure 6 recorded; the market-based figures match the ones written down. | | |

### B3. Data quality and uncertainty

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Under the inventory's report header, enter an uncertainty statement and save; launch run 004 and read its methodology section. | The table shows each tier's share (tier 1, 11 lines, 99.9%; tier 3, the calculated camp LPG record; tier 4, the estimated one); the paragraph above it ends "1 of 13 lines record a quantitative uncertainty; weighted by emissions it is ±2% for those lines." and the statement you typed is printed with it. | | |

### B4. Intensity and header

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Add the denominator "Gold produced", 120,000 oz, and an approver name; launch run 005. | The header names the approver; the **Intensity** section reads "0.346056 t CO₂e per oz of gold produced (120,000 oz)", equal to 41,526.693 t divided by 120,000. | | |

## C. Exports

### C1. The PDF

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Download the PDF of run 005. | The same sections as the page, in the same order, with the data-quality table, the declaration table, the instrument outcomes and the exclusion summary. The market-based method, its basis and the instrument sit under the scope table in section 4, before "Scope 3 by category"; the intensity line closes section 4; the gas table is section 5 with its footing row. | | |
| 2 | Read the header table and section 1 and 2. | Words, not codes: "Prepared by" names you with the date in the form "12 September 2026, 05:38 UTC" (day, month, year, time, zone); "Assurance" reads "Not verified"; the version row is labelled "Report version" and reads 1, and "Final designated" reads "not designated" (procedure 8 designates run 005); section 1 reads "Sankofa Gold plc, operational control approach (Corporate Standard, chapter 3). Boundary version 4 of 4."; section 2 reads "Scopes covered: Scope 1, Scope 2, Scope 3." and lists the declared categories with their numbers ("1. Purchased goods and services", "6. Business travel"). Nothing in the document reads like OPERATIONAL_CONTROL or 2026-09-12T05:38. | | |
| 3 | Read the exclusions table and the dates. | The reasons read "Outside reporting period", "Outside boundary", "Methodology exclusion" and "Record removed"; every date reads like "15 December 2025" and every period like "1 January 2025 to 31 December 2025". | | |
| 4 | Check every page break. | No heading or subheading stands alone at the foot of a page: "By facility", "By legal entity", "By country", "5. Emissions by gas" and "10. Snapshot lines" each sit on the same page as their column header and first row; a table that continues on a new page repeats its heading and column header there. | | |
| 5 | Download it again. | The same content (the same size). | | |

### C2. The calculation file

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Download `lines.csv` and open it in the spreadsheet. | One row per line with `record_id`, `record_ref` (ACT-0001), `evidence_ref`, `evidence_files`, `factor_id`, `converted_quantity`, `conversion_factor`, `density_material`, `density_kg_per_litre`, `conversion_note`, `accounting_share`, `period_share`, the kg per gas, `co2e_unsplit_kg` (0 on every line of this dataset: no factor publishes CO2e only), the `market_*` columns, `data_quality` and `data_quality_tier`. | | |
| 2 | Recompute one line's kg CO2e from its columns. | The recomputed figure matches. | | |

### C3. Exclusions and frozen inputs

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Download `exclusions.csv`. | The exclusions file carries each reason, detail, justification and `estimated_kg_co2e`. | | |
| 2 | Download `inputs.json`. | The JSON carries `boundaryVersion`, `factors` (six, as applied), `instruments` (one) and the residual mix (0.52). | | |

## D. Voided runs in the report

### D1. The banner

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open the report of the voided run 002. | The page carries the banner "This run is voided and must not be relied on. Voided by <you> on <date>: Duplicate of run 001. The figures are kept on the record as calculated." | | |
| 2 | Open its PDF. | The PDF prints the reason once on its first page and "VOIDED: this run must not be relied on" on every page; the figures are still shown. | | |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** an XLSX export; Monte Carlo uncertainty; a PDF that is
byte-identical on repeat (the container carries its own timestamp).
