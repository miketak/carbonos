---
owner: miketak
last_reviewed: 2026-09-24
---

# Export the report

**Role needed:** any member, including a verifier.

Every run offers four files. They are generated from the run's
snapshot, so they never change after the run.

<!-- sources: RunDetailPage.tsx export links; report.pdf, lines.csv, exclusions.csv, inputs.json endpoints; verified 2026-09-24 -->

## Steps

1. Open the inventory's **Runs** tab and click the run, or open it from
   the report link.
2. At the top of the run page click one of the links:

| Link | File | Contents |
| --- | --- | --- |
| **PDF report** | `<organization>-<year>-run-<N>.pdf` | The report as the page shows it, section by section. |
| **Lines (CSV)** | `run-<N>-lines.csv` | One row per line, with the record and its reference, the facility and legal entity, the period, scope and category, the quantity and unit, the factor, the conversion, the accounting share, the period share, the kilograms of CO₂e and of each gas, the market-based columns, the stream, the justifications, the data-quality fields, the evidence files, the density and the derivation notes. |
| **Exclusions (CSV)** | `run-<N>-exclusions.csv` | One row per excluded record: reason, detail, justification, estimate and its state, gas. Only the header row when nothing was excluded. |
| **Frozen inputs (JSON)** | `run-<N>-inputs.json` | The run's period, consolidation approach, GWP set, market-based basis, boundary version, the factors it applied with their values and versions, the instruments, and the residual-mix answer. |

## What you see

The browser downloads the file. The column list of the lines file and
the keys of the inputs file are in [Report exports](../../reference/report-exports.md).

## What the files are for

A verifier can rebuild every figure in the report from the lines file
and check every factor against the inputs file. The evidence index on
**Activity data › Source documents** (**Download evidence index
(CSV)**) lists the documents behind the records.
