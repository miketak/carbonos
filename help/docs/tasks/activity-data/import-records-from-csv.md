---
owner: miketak
last_reviewed: 2026-09-24
---

# Import records from a CSV file

**Role needed:** Preparer, Reviewer or Owner.

An import brings several source records into the register at once,
after a preview you check against the spreadsheet's footer. The file is
kept with the records it creates.

<!-- sources: ImportActivitiesModal.tsx; ActivityPage.tsx; spec 04.6; verified 2026-09-24 with help/docs/assets/riverside-2025.csv -->

## Before you start

- The facilities and source streams the rows name must exist; the
  import matches the `facility` and `stream` columns by name.
- One row is one record: a facility, a stream, an activity type, a
  quantity, a unit, a period, and the document it came from. Monthly
  rows are best: "monthly rows make the coverage matrix and cut-off
  checks precise".
- The file is a CSV of up to 5 MB. The columns, the accepted values and
  the rejection reasons are in
  [CSV import template](../../reference/csv-import-template.md).

## Steps

1. Open **Activity data** and click **Import CSV**.
2. If you are starting from scratch, click **Download CSV template**
   under **Use the activity template** and fill it in.
3. Under **Select your completed CSV** choose the file, or drop it on
   the dialog.
4. Read the preview:
    - **Control totals** groups the rows by facility and stream with
      the row count and the summed quantity: "Check them against the
      spreadsheet's footer."
    - A line such as "5 rows: reference only, nothing attached" says how
      many rows cite a document without attaching one.
    - **Worth a look before adding** lists warnings that do not stop
      the import, for example "Row 6: the period is longer than one
      month". Row numbers count the header as row 1, as the spreadsheet
      does.
    - **Records to add** lists each row with its activity, facility,
      period, quantity and data status.
5. Click **Add records**.

## What you see

"*N* records imported." and one row per record in the register, each
numbered in the order of the file (ACT-0001, ACT-0002, …) with the data
status the preview showed and a "ref" mark where a document reference
was given and nothing attached.

## What changed elsewhere

- The imported file is kept: the records' history names it.
- The records carry no scope, category or factor. An inventory decides
  those when it reviews them; see
  [Review and classify records](../inventories/review-and-classify-records.md).
- An inventory that already reviewed the organization's records does
  not see the new ones until **Review activity data** is run again.

## If the file is rejected

The preview reads "Nothing will import: *N* rows rejected. Fix them and
choose the file again." and names each row with its problems, for
example "no facility named 'Plant 2'", "'Riverside Plant' has no stream
named 'Boiler'", "quantity '2,400' is not a number", "quantity must be
greater than 0", "unit is empty", "period_end is before period_start",
"period_start is in the future", "data_quality must be MEASURED,
ESTIMATED or CALCULATED", "data_quality_tier must be 1 to 5", or
"duplicate: the same facility, activity, quantity, unit and period
already exist on file or earlier in this file". Nothing is added while
any row is rejected, so the corrected file imports as one batch.
