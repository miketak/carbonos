---
owner: miketak
last_reviewed: 2026-09-28
description: Enter one activity record in the Add activity drawer, save a draft when figures are missing, and read what Ready and Needs attention mean.
role: Preparer
minutes: 5
screens: [step-4-records.png]
---

# Enter a record

Enter one record when an invoice, meter reading or log arrives; for a spreadsheet of rows, [import a CSV file](import-records-from-a-csv-file.md) instead.

<!-- sources: tasks/activity-data/enter-correct-and-evidence-a-record.md (verified 2026-09-24); specs 04.2, 04.5, 04.6; ActivityDrawer.tsx (labels, hints, toasts), badges.tsx and format.ts (pills and missing items), CompletenessBanner.tsx, InventoryFormModal.tsx (straddle setting); screen text and figures from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt): "4 activity empty", "4 after import", "4 record drawer", "5 inventory dialog", "6 under review", "7 run page" -->

## Before you start

- The facility exists under **Facilities**, with its source streams registered.
- You are a Preparer, Reviewer or Owner.

## Fill in the drawer

1. Open **Activity data** and click **+ Add activity**.
2. Fill **Activity type ***, for example `Kitchen LPG`, and choose the **Facility ***.
3. Choose the **Stream**. The drawer prints the default it carries.
4. Fill **Period start ***: "The period the quantity covers, not the invoice date." Fill **Period end**, or leave it: "Same as the start for a single reading."
5. Fill **Activity quantity *** and choose the unit. **Unregistered unit…** takes a code the list lacks.
6. Fill **Data source** and **Document reference**: "Invoice, meter reading or log number as printed on the document."
7. Under **Notes**, add **Context for the reviewer** when the figure needs explaining.
8. Under **Data quality**, keep **Method** as **Measured** for metered or invoiced figures, or choose **Estimated** or **Calculated**.
9. Set **Quality tier** if the source justifies one; blank follows the method. Add **Uncertainty, ± %** where the source states it.
10. Click **Save**.

![The Activity data register, seven Gye Nyame Gold records, every row Ready, completeness 100%](../assets/screens/step-4-records.png)

What you see: "Activity recorded." The row shows the facility, the period, the quantity and the data status **Ready**, with "ref" in the attachments column until evidence is attached.

## Save a draft

With only the activity type and the facility known, click **Save draft**: "Draft saved." Fill in the figures later and click **Save**: "Record entered. It is now a fact."

## Ready or needs attention

The banner counts the checks, for example "7 of 7 records ready": "Ready means the figures, a stream, a source and evidence are present; nothing here has been verified." A record that is not ready reads "Not ready for review yet." with the items missing: "Missing quantity", "Missing unit", "Missing period", "No stream", "Missing source" or "Needs evidence"; its pill names the first and counts the rest.

## A period that straddles the year end

Enter the record whole, as ACT-0007 was: `1600` litre, **Period start** `2025-12-15`, **Period end** `2026-01-15`; do not split the quantity by hand. Each inventory's setting **Records that straddle the period or a membership window** decides: **Pro-rate by days (default)** warns before the run, "17 of 32 days fall inside the reporting period and the membership window: the run pro-rates it to 53.13%", and **Block the run until the record is split** waits for one record per period.

## What happens next

The record carries no scope, category or factor; each inventory decides those for itself. See [Review and classify records](../inventories/review-and-classify-records.md) and [What is an activity record?](what-is-an-activity-record.md).
