---
owner: miketak
last_reviewed: 2026-09-28
description: Import the seven 2025 activity records for Gye Nyame Gold from a CSV file, read the preview, then correct the electricity record whose figure lost a zero.
role: Preparer
minutes: 10
screens: [step-4-import-preview.png]
---

# Import the records and correct one

This fourth step of the Get started series brings in the year's activity data for Gye Nyame Gold from one CSV file and corrects one record in place, keeping its history. Activity data is what happened: fuel burned, electricity bought. It carries no scope and no factor; every inventory decides those separately.

<!-- sources: specs 04.5, 04.6 (activity records, corrections and their history, CSV import); the old tutorial get-started/your-first-inventory.md (verified 2026-09-24); screen text and figures from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt) with the fixture help/docs/assets/gye-nyame-2025.csv -->

## Before you start

- The two facilities and five source streams exist, from [Record the facilities and source streams](record-the-facilities-and-source-streams.md). The import matches each row to a facility and a stream by name.
- Download the year's records: [gye-nyame-2025.csv](../assets/gye-nyame-2025.csv). It has seven rows, and the second-half electricity row carries 3,600,000 kWh on purpose: a lost zero that you correct at the end of this step. The columns are described in [Prepare the CSV file](../activity-data/prepare-the-csv-file.md).

## Import the file

1. Open **Activity data**. The page reads "No activity data yet". Click **Import CSV**.
2. Under **Select your completed CSV** in the **Import activity data** dialog, choose `gye-nyame-2025.csv`. The dialog also offers **Download CSV template**, which the fixture follows.
3. Read the preview. **Control totals** groups the rows by facility and stream (Nyame Pit and Plant, Plant grid supply: 2 rows, 37,600,000 kWh, and so on) so you can check them against the spreadsheet's footer. A badge reads "7 rows: reference only, nothing attached".
4. Read **Worth a look before adding**. Every row is listed, for example "Row 5: the period is longer than one month (2025-07-01 to 2025-12-31); monthly rows make the coverage matrix and cut-off checks precise". A long period is a warning rather than an error because the fact is still a fact; monthly rows are better because they let the coverage matrix and the cut-off checks see each month on its own.
5. Check that each row under **7 records to add** reads "Ready", then click **Add records**.

![The import preview for gye-nyame-2025.csv with the control totals by facility and stream and the Worth a look before adding warnings](../assets/screens/step-4-import-preview.png)

What you see: "Checking the file…" then "7 records imported." The register reads "7 of 7 records ready" and "Record completeness 100%". The records are numbered ACT-0001 to ACT-0007 in the order of the file: "Haul fleet diesel" (ACT-0001), "Contract haulage diesel" (ACT-0002), "Plant grid electricity H1" (ACT-0003), "Plant grid electricity H2" (ACT-0004), "Genset diesel" (ACT-0005), "Kitchen LPG" (ACT-0006) and "Year-end kitchen LPG" (ACT-0007). The list sorts by period, so the year-end row comes first. Each row has the data status **Ready** and a "ref" mark, because it cites a document reference and nothing is attached.

## Correct the electricity record

The file says the plant bought 3,600,000 kWh in the second half of the year. The second ECG statement says 36,000,000 kWh. A record is corrected in place, and CarbonOS keeps both values.

1. Click the row "Plant grid electricity H2" (ACT-0004). The drawer opens with "All completeness checks passed." and the record's fields. Notice the line "Stream default: Scope 2 · Purchased electricity. Scope is confirmed in each inventory's review." and, under **Data quality**, the field **Reason for the correction**, explained as "Recorded with the old and new values in the record's history."
2. Change **Activity quantity** to `36000000`.
3. Fill **Reason for the correction** with `Second ECG statement: the second half was 36,000,000 kWh, not 3,600,000`.
4. Click **Save**.

What you see: "Record corrected. Past runs are unaffected." and the row now reads 36,000,000 kWh. Open the record again and click **History**: "History of Plant grid electricity H2" lists "Corrected by owner@gyenyame.example" with the moment, your reason, and "Quantity: 3600000 → 36000000". No inventory exists yet, so nothing else changes; the last step of the series shows what a correction does after a report is published.

## What you have

- Seven activity records, ACT-0001 to ACT-0007, all **Ready**, each citing a document reference with nothing attached.
- One of them corrected, with the old value, the new value and your reason kept in its history.
- Six records that sit inside 2025, and a year-end LPG delivery that straddles 31 December; step 6 shows what the inventory does with it.
