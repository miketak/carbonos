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

1. In the launch section, keep the proposed label "Run 001" and launch.

**Expected result:** the run page opens. The run cites boundary version 2
and is attributed to you as prepared by.

Verdict: ☐ pass ☐ fail. Notes:

### A2. The arithmetic re-performs

1. Open the snapshot lines and check:

| Line | Expected |
| --- | --- |
| Haul fleet diesel (R1, corrected to 1,200,000 US-gallon) | 1,200,000 × 3.785411784 = 4,542,494.14 litre × 2.66 = 12,083,034.42 kg |
| Contract mining fleet diesel (R13) | 2,100,000 × 2.66 = 5,586,000 kg, scope 3 |
| Diesel by tanker (R17) | 12,000 kg ÷ 0.8325 = 14,414.414 litre × 2.66 = 38,342.342 kg, with the note printed |
| Diesel in drums | 5 × 200 = 1,000 litre × 2.66 = 2,660 kg, "1 drum = 200 litre" |
| Straddling diesel (R19) | 10,000 × 2.66 × 50% = 13,300 kg, "pro-rated: 31 of 62 days" |
| Mill grid electricity (R2) | 48,500,000 × 0.441 = 21,388,500 kg; market-based as written down in procedure 6 |

**Expected result:** every figure matches to the kilogram; every line shows
its factor, its share and its conversion.

Verdict: ☐ pass ☐ fail. Notes:

### A3. Numbering never reuses and voiding keeps the figures

1. Launch "Run 002". Void it with the reason "Duplicate of run 001".
2. Launch again.

**Expected result:** the voided run stays listed, struck through, with your
name and the reason; the new run is **003**. A run designated final cannot
be voided until the designation is withdrawn with a reason.

Verdict: ☐ pass ☐ fail. Notes:

### A4. A run is a snapshot

1. Under **Activity data**, correct R1 back to 1,250,000 with a reason.
2. Reopen the run 001 page.

**Expected result:** run 001 still reads 1,200,000; the inventory's gate
now flags nothing (the fact changed, the run did not).

Verdict: ☐ pass ☐ fail. Notes:

## B. The report

### B1. Every Chapter 9 element in order

1. Read the run 003 report top to bottom.

**Expected result:** report header; company and boundary version;
operational boundary with the declaration table (investments "declared,
not quantified" with its reason; purchased goods and services with its
lines); reporting period; emissions by scope with scope 2 both ways and
the market basis; scope 3 by category; by facility, entity and country;
each gas in mass and CO2e; biogenic CO2; base year; methodology with the
factor table and the data-quality table; exclusions with the per-reason
summary and each justification; snapshot lines.

Verdict: ☐ pass ☐ fail. Notes:

### B2. Scope 2 disclosures

1. Read the scope 2 section.

**Expected result:** the instrument lists its eight outcomes, certificate,
registry, vintage and retirement date; the residual-mix disclosure matches
what procedure 6 recorded; the market-based figures match the ones written
down.

Verdict: ☐ pass ☐ fail. Notes:

### B3. Data quality and uncertainty

1. Under the inventory's report header, enter an uncertainty statement and
   save; launch run 004 and read its methodology section.

**Expected result:** the table shows each tier's share (tier 1 for the
metered lines, tier 4 for the estimated ones); the statement you typed is
printed with it.

Verdict: ☐ pass ☐ fail. Notes:

### B4. Intensity and header

1. Add the denominator "Gold produced", 120,000 oz, and an approver name;
   launch run 005.

**Expected result:** the header names the approver; the intensity section
gives t CO2e per oz to six decimals, equal to the total in tonnes divided
by 120,000.

Verdict: ☐ pass ☐ fail. Notes:

## C. Exports

### C1. The PDF

1. Download the PDF of run 005.

**Expected result:** the same sections as the page, in the same order, with
the data-quality table, the declaration table, the instrument outcomes and
the exclusion summary. Downloading it twice gives the same content.

Verdict: ☐ pass ☐ fail. Notes:

### C2. The calculation file

1. Download `lines.csv` and open it in the spreadsheet.

**Expected result:** one row per line with record id, evidence reference,
evidence files, factor id, converted quantity, conversion factor, density
and conversion note, share, period share, kg per gas, market columns,
data quality and tier. Recompute one line's kg CO2e from its columns.

Verdict: ☐ pass ☐ fail. Notes:

### C3. Exclusions and frozen inputs

1. Download `exclusions.csv` and `inputs.json`.

**Expected result:** the exclusions file carries each justification and
estimated magnitude; the JSON carries the boundary version, the factor set
as applied, the instruments and the residual mix.

Verdict: ☐ pass ☐ fail. Notes:

## D. Voided runs in the report

### D1. The banner

1. Open the report of the voided run 002 and its PDF.

**Expected result:** a VOIDED banner with the reason on the page. The PDF
prints the reason once on its first page and "VOIDED: this run must not
be relied on" on every page; the figures are still shown.

Verdict: ☐ pass ☐ fail. Notes:

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** an XLSX export; Monte Carlo uncertainty; a PDF that is
byte-identical on repeat (the container carries its own timestamp).
