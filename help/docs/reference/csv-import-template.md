---
owner: miketak
last_reviewed: 2026-09-24
---

# CSV import template

The file **Import CSV** accepts on **Activity data**. **Download CSV
template** in the dialog gives the header row with one example row.
One row is one activity record.

<!-- sources: ActivityImportService.java (COLUMNS, template, row problems, MAX_ROWS, MAX_BYTES); ImportActivitiesModal.tsx; spec 04.6; verified 2026-09-24 -->

## Limits

| Limit | Value |
| --- | --- |
| File size | 5 MB |
| Rows | 10,000 per file: "The file has more than 10000 rows. Split it." |
| Header | Every column below must be present, in any order: "The header lacks the '*column*' column. Download the template." |
| Dates | `2025-03-31`: "*field* '*value*' is not a date (use 2025-03-31)". |

## Columns

| Column | Required | Accepted values | Rejected when |
| --- | --- | --- | --- |
| `facility` | Yes | The name of a facility under **Facilities**, matched without regard to case. | "facility is empty"; "no facility named '*name*'". |
| `stream` | No | The name of a source stream of that facility. | "'*Facility*' has no stream named '*name*'". |
| `activity_type` | Yes | Free text, up to 120 characters: what the row is. | "activity_type is empty"; "activity_type is longer than 120 characters". |
| `quantity` | Yes | A number greater than 0, up to 3 decimals and 11 integer digits, no thousands separator. | "quantity '*value*' is not a number"; "quantity must be greater than 0"; "quantity has more than 3 decimals or more than 11 integer digits". |
| `unit` | Yes | A unit code, up to 30 characters: a registered code (`litre`, `kWh`, `tonne`, …) or a custom unit defined under **Units**. | "unit is empty"; "unit is longer than 30 characters". |
| `period_start` | Yes | A date, not in the future. | "period_start is empty"; "period_start is in the future". |
| `period_end` | No | A date, not before the start and not in the future; defaults to the start. | "period_end is before period_start"; "period_end is in the future". |
| `data_source` | No | Up to 120 characters: the kind of document. | "data_source is longer than 120 characters". |
| `evidence_ref` | No | Up to 150 characters: the document reference as printed on it. | "evidence_ref is longer than 150 characters". |
| `data_quality` | No | `MEASURED`, `ESTIMATED` or `CALCULATED`. | "data_quality must be MEASURED, ESTIMATED or CALCULATED". |
| `data_quality_tier` | No | 1 to 5, the Scope 3 Standard's tiers from metered primary data to assumption. | "data_quality_tier must be 1 to 5". |
| `uncertainty_percent` | No | A number, 0 or more. | "uncertainty_percent is not a number"; "uncertainty_percent must be 0 or more". |
| `note` | No | Up to 255 characters: context for the reviewer. | "note is longer than 255 characters". |

A row that repeats a record already on file, or an earlier row of the
same file, is rejected: "duplicate: the same facility, activity,
quantity, unit and period already exist on file or earlier in this
file". A row whose facility, activity type and period match a draft
completes that draft instead of adding a record.

## What the preview says

- **Control totals**: rows and summed quantity per facility and stream.
- "*N* rows: reference only, nothing attached": rows with an
  `evidence_ref` and no file, which is expected for an import.
- **Worth a look before adding**: warnings that do not stop the
  import, for example "Row *N*: the period is longer than one month
  (*start* to *end*); monthly rows make the coverage matrix and cut-off
  checks precise".
- "Nothing will import: *N* rows rejected. Fix them and choose the file
  again." with the row number and problems: nothing is added while any
  row is rejected.

Row numbers count the header as row 1, as the spreadsheet does.

## Example

The tutorial's file, [riverside-2025.csv](../assets/riverside-2025.csv):

```csv
facility,stream,activity_type,quantity,unit,period_start,period_end,data_source,evidence_ref,data_quality,data_quality_tier,uncertainty_percent,note
Riverside Plant,Boiler LPG,Boiler LPG,2400,litre,2025-03-01,2025-03-31,Gas supplier delivery note,LPG-2025-03,MEASURED,1,2,
Riverside Plant,Plant grid supply,Plant grid electricity,6000,kWh,2025-06-01,2025-06-30,ECG invoice,ECG-TAK-2025-06,MEASURED,1,,
```
