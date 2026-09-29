---
owner: miketak
last_reviewed: 2026-09-28
description: Download the PDF report, the lines and exclusions CSV files and the frozen inputs JSON of a run from its page, and learn what each file is for.
role: Anyone
minutes: 2
---

# Export the report

Every run offers four files generated from its snapshot, so they never change after the run. Download them when the board pack, a verifier or a script needs the figures outside CarbonOS.

<!-- sources: spec 07.5 (report export), spec 01.8 (account numbers in the PDF name); old page tasks/reporting/export-the-report.md (verified 2026-09-24 and 2026-09-26); backend/src/main/java/com/carbonos/ghg/internal/web/ExportController.java (file names); backend/src/main/java/com/carbonos/ghg/internal/export/RunCsv.java (nothing varies between downloads); frontend/src/features/ghg/SourceDocumentsPage.tsx (evidence index); screen text and file names from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt): "7 run page", "8 downloads" -->

## Before you start

- The inventory has a run on its **Runs** tab. Any member can export, a verifier included.

## Download a file

1. Open the inventory's **Runs** tab and click the run.
2. At the top of the run page, under the heading, click one of the four links.

| Link | File for Run 001 | Contents |
| --- | --- | --- |
| **PDF report** | `gye-nyame-gold-ltd-org-0001-2025-run-1.pdf` | The report as the page shows it, section by section. The name carries the organization, its account number, the period and the run number. |
| **Lines (CSV)** | `run-1-lines.csv` | One row per line, derived lines included, with every input the arithmetic used. |
| **Exclusions (CSV)** | `run-1-exclusions.csv` | One row per excluded record with its reason, justification and estimate. Only the header row when the report says "No exclusions." |
| **Frozen inputs (JSON)** | `run-1-inputs.json` | The period, approach, GWP set, market-based basis, boundary version, factors, instruments and residual-mix answer the run computed from. |

What you see: the browser downloads the file and the run page does not change. Downloading a file again later returns the same content.

## What the files are for

A verifier rebuilds every figure in the report from the lines file and checks every factor against the inputs file. The documents behind the records are not in these files: **Activity data › Source documents › Download evidence index (CSV)** lists every file and link across the organization with the record it belongs to. The columns of the CSV files and the keys of the JSON are in [Understand the export files](understand-the-export-files.md).

## What happens next

Nothing changes on the inventory. The PDF is assembled from the same report the run page shows, so it carries the report header (approver, assurance, intensity denominators) and the final designation as they stand when you download it. Fill the header before you download the copy for the board; see [Fill the report header and read the report](fill-the-report-header-and-read-the-report.md).
