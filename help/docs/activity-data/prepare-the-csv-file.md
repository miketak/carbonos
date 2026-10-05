---
owner: miketak
last_reviewed: 2026-10-05
description: The columns, limits and accepted values of the CSV or XLSX that Import reads, with every rejection message the preview can print and a worked example.
role: Preparer
---

# Prepare the spreadsheet

The file **Import** accepts on **Activity data**: a CSV, or an XLSX read from its first sheet. **Download CSV template** on the import page gives the header row with one example row, and **What each column must contain** opens this page.

<!-- sources: reference/csv-import-template.md (verified 2026-09-24); specs 04.6 and 04.11; QA procedure 3 cases A1, B1 and J1; ActivityImportService.java (COLUMNS, template, row problems, warnings, MAX_ROWS, MAX_BYTES), XlsxTable.java (the workbook's cells); ImportActivitiesPage.tsx; the fixture help/docs/assets/gye-nyame-2025.csv as previewed in the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt, "4 preview") -->

## Limits

| Limit | Value | Message when exceeded |
| --- | --- | --- |
| File | A CSV or an XLSX, chosen or dropped on the page; a workbook is read from its first sheet, whose row 1 is the header. | "Choose a CSV or XLSX file to import."; "The file is empty. Download the template and fill it in."; "Row 1 of the first sheet must be the header. Download the template."; "The workbook could not be read. Save it again as .xlsx or .csv." |
| File size | 5 MB | "The file is larger than 5 MB." |
| Rows | 10,000 per file | "The file has more than 10000 rows. Split it." |
| Header | The five required columns, in any order; other columns may be left out. | "The header lacks the '*column*' column. Download the template." |
| Dates | `2025-03-31`; a workbook's date-formatted cell reads as such. | "*field* '*value*' is not a date (use 2025-03-31)" |
| Workbook cells | A number reads as a plain decimal; a formula reads as its cached value. | No rejection; the preview warns. |

## Columns

| Column | Required | Accepted values | Rejected when |
| --- | --- | --- | --- |
| `facility` | Yes | The name of a facility under **Facilities**, matched without regard to case. | "facility is empty"; "no facility named '*name*'". |
| `emission_source` | No | The name of an emission source of that facility, matched without regard to case. A file that still heads the column `stream` is read the same way. A name the facility does not have is decided in the preview: used, mapped with a reason, or created. | "'*Facility*' has no emission source named '*name*'", only when **Add records** is clicked with the name undecided. |
| `activity_type` | Yes | Free text, up to 120 characters: what the row is. | "activity_type is empty"; "activity_type is longer than 120 characters". |
| `quantity` | Yes | A number greater than 0, up to 3 decimals and 11 integer digits. Commas are dropped. | "quantity '*value*' is not a number"; "quantity must be greater than 0"; "quantity has more than 3 decimals or more than 11 integer digits". |
| `unit` | Yes | A unit code, up to 30 characters: a registered code (`litre`, `kWh`, `tonne`, …) or a custom unit defined under **Units**. | "unit is empty"; "unit is longer than 30 characters". |
| `period_start` | Yes | A date, not in the future. | "period_start is empty"; "period_start is in the future". |
| `period_end` | No | A date, not before the start and not in the future; defaults to the start. | "period_end is before period_start"; "period_end is in the future". |
| `data_source` | No | Up to 120 characters: the kind of document. | "data_source is longer than 120 characters". |
| `evidence_ref` | No | Up to 150 characters: the document reference as printed on it. | "evidence_ref is longer than 150 characters". |
| `data_quality` | No | `MEASURED`, `ESTIMATED` or `CALCULATED`, in any case. | "data_quality must be MEASURED, ESTIMATED or CALCULATED". |
| `data_quality_tier` | No | 1 to 5, the Scope 3 Standard's tiers from metered primary data to assumption. | "data_quality_tier must be 1 to 5". |
| `uncertainty_percent` | No | A number, 0 or more. | "uncertainty_percent is not a number"; "uncertainty_percent must be 0 or more". |
| `note` | No | Up to 255 characters: context for the reviewer. | "note is longer than 255 characters". |

A repeated row is rejected: "duplicate: the same facility, activity, quantity, unit and period already exist on file or earlier in this file". Drafts do not count.

## What the preview says

| Block | Meaning |
| --- | --- |
| **Control totals** | Rows and summed quantity per facility, emission source and unit: "Check them against the spreadsheet's footer." |
| "*N* rows: reference only, nothing attached" | Rows with an `evidence_ref` and no file. Other counts name the missing item, for example "2 rows: missing source". |
| **Worth a look before adding** | Warnings that do not stop the import. |
| **Decide *N* unknown emission sources** | One card per emission source name the file has and the facility does not: the rows it covers, the similar names offered as **Use *name***, **Use another source of *facility*** with **Why this source?**, or **Create '*name*'**. Its rows read **Needs a decision** until then. |
| "*N* records to add" | The rows that will become records: "Row numbers count the header as row 1, as the spreadsheet does." |
| "Nothing will import: *N* rows rejected. Fix them and choose the file again." | Each rejected row with its problems. Nothing is added while any row is rejected. |

| Warning | When |
| --- | --- |
| "the period is longer than one month (*start* to *end*); monthly rows make the coverage matrix and cut-off checks precise" | The row covers more than a month. |
| "matches draft *ACT-NNNN* (same facility, activity and period): the draft stays on file, complete or remove it" | A draft on file has the same facility, activity type and period; the row adds a new record next to it. |
| "'*Source*' mixes units in this file:" followed by the units | Two rows on one emission source use different units. |
| "The workbook has *N* sheets; only '*Sheet1*' was read." | The file has more than one sheet. |
| "quantity came from a formula; the saved value is the cached result" | The row's quantity, unit or period cell is a formula; the figure is what the spreadsheet last calculated. |

## Example

The first rows of the walkthrough's file, [gye-nyame-2025.csv](../assets/gye-nyame-2025.csv):

```csv
facility,emission_source,activity_type,quantity,unit,period_start,period_end,data_source,evidence_ref,data_quality,data_quality_tier,uncertainty_percent,note
Nyame Pit and Plant,Haul fleet,Haul fleet diesel,11923608,litre,2025-01-01,2025-12-31,Fuel farm reconciliation,FF-2025,MEASURED,1,2,Free-issue diesel drawn by the company fleet
Nyame Pit and Plant,Contract ore haulage,Contract haulage diesel,1200000,litre,2025-01-01,2025-12-31,Contractor fuel issue log,CT-2025,MEASURED,1,3,Issued from the mine's fuel farm to the haulage contractor
Nyame Pit and Plant,Plant grid supply,Plant grid electricity H1,34000000,kWh,2025-01-01,2025-06-30,ECG invoices,ECG-OBU-2025-H1,MEASURED,1,,
```

Its last row, 1,600 litre of LPG from 2025-12-15 to 2026-01-15, is entered whole; see [Enter a record](enter-a-record.md#a-period-that-straddles-the-year-end).
