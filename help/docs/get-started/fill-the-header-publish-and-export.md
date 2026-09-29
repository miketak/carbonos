---
owner: miketak
last_reviewed: 2026-09-28
description: Fill the report header with the approver and an intensity denominator, mark Run 001 final, publish FY2025, and download the four export files of the report.
role: Owner
minutes: 10
screens: [step-8-published.png]
---

# Fill the header, publish and export

This last step signs off Run 001 and issues the FY2025 report of Gye Nyame Gold Ltd with its four export files. Afterwards nothing on the inventory can change.

<!-- sources: specs 05.1 and 05.5 (final designation, publication, deliberate lifecycle acts), 05.3 (the published record), 07.4 (report metadata, intensity) and 07.5 (report export); section 9 of the old tutorial help/docs/get-started/your-first-inventory.md; screen text and figures from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt) -->

## Before you start

- Step 7 is done: FY2025 is frozen and Run 001 has been launched.

## Fill the report header

The **Report** tab holds what is printed at the top of the report: who approved it, its assurance, and the intensity denominators the report divides the total by.

1. Open the **Report** tab. Fill **Approved by (optional)** with `Ama Owusu, owner, Gye Nyame Gold Ltd`. Leave **Assurance** as "Not verified", since nobody has verified this inventory.
2. Under **Intensity denominators** fill **Denominator** `Gold produced`, **Value** `185000`, **Unit** `oz`, and click **Add denominator**. The card now lists "Gold produced: 185,000 oz".
3. Click **Save report header**.

What you see: "Report header saved." Section 04 of the report gains an intensity line: "0.467092 t CO₂e per oz of gold produced (185,000 oz)".

## Mark the run final

1. On the **Runs** tab click **Mark as final** on Run 001.
2. Read the dialog "Mark Run 001 as final?": "Run #001 (86,412 t CO₂e) becomes this inventory's final run: the report and the base year attach to it, and the inventory can be published. The designation, your name and your note are recorded in the history and printed in the report header." Fill **Review note (optional)** with `Reconciled against the fuel farm records and the ECG statements`.
3. Click **Mark as final**.

What you see: "Run 001 designated final." The header reads "FINAL · BOUNDARY v1", the run's row carries the tag FINAL, and the lifecycle card reads "Final. A run is designated the final result. Withdraw the designation to reopen the inventory, or publish it to issue the report." with your note under it. In a team this is the reviewer's act; here the owner did it, and the history says so.

## Publish

1. Click **Publish** in the lifecycle card.
2. Read the dialog "Publish the inventory?": "Publishing issues the report; nothing on this inventory can change afterwards. A correction is a new inventory that supersedes it."
3. Click **Publish**.

![FY2025 published: the header reads PUBLISHED · BOUNDARY v1, the lifecycle card offers Create correction, and the message "Inventory published." shows](../assets/screens/step-8-published.png)

What you see: "Inventory published." The header reads "PUBLISHED · BOUNDARY v1"; the lifecycle card reads "Published. The report was issued; nothing on this inventory can change. A correction is a new inventory that supersedes this one." with the moment of publication, and the only action left is **Create correction**.

Open Run 001 again. Section 00 now reads "Approved by Ama Owusu, owner, Gye Nyame Gold Ltd", "Published" with the moment and your email, and "Final designated by owner@gyenyame.example" with your note. A new block, **Since publication**, reads "The report above reads exactly as it was published. What came after is listed here and nowhere else." and, for now, "Nothing has changed since." A later correction is listed there, not in the report.

## Export

The run page offers four files at the top:

| Link | File | Contents |
| --- | --- | --- |
| **PDF report** | `gye-nyame-gold-ltd-org-0001-2025-run-1.pdf` | The report as the page shows it. |
| **Lines (CSV)** | `run-1-lines.csv` | One row per line, eleven here: record, facility, scope, category, quantity, factor, share, CO₂e, and gases. |
| **Exclusions (CSV)** | `run-1-exclusions.csv` | One row per excluded record; only the header row here, because the report says "No exclusions." |
| **Frozen inputs (JSON)** | `run-1-inputs.json` | The run's period, approach, GWP set, boundary version, the five factors it applied, and the residual-mix answer. |

A verifier can rebuild every figure from the lines file and check every factor against the inputs file.

## What you have

- An organization with two legal entities, two facilities, and five source streams, with their shares under each approach.
- Seven activity records, one of them corrected with its history kept.
- Two factor pack editions, and one derived factor you approved.
- FY2025: an operational-control inventory with a declared scope 3, boundary version 1, two upstream rules, seven classifications, one run of 86,412 t CO₂e designated final, and a published report with its exports.

## Where next

- [Correct a published inventory](../tasks/inventories/correct-a-published-inventory.md): what a correction after publication does.
- [Designate the base year](../tasks/base-year/designate-the-base-year.md): section 07 of the report is waiting for one.
- [Understand the export files](../reference/report-exports.md): every column and field of the four files.
