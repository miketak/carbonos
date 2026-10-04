---
owner: miketak
last_reviewed: 2026-10-04
description: Restate a published year by creating a correction inventory that inherits every decision, supersedes the published report, and prints what changed and why.
role: Reviewer
minutes: 10
---

# Correct a published inventory

A published inventory cannot change. To restate the year you create a correction: a new draft inventory over the same period and approach that inherits every decision, so only what was wrong needs changing, and whose report supersedes the published one.

<!-- sources: specs 05.1, 05.2, 05.3, 07.4 and 10 (the title row, the provenance disclosure, the inventories table); old page tasks/inventories/correct-a-published-inventory.md (verified 2026-09-24); frontend/src/features/ghg/components/LifecycleBar.tsx ("Create a correction" dialog); frontend/src/features/ghg/components/AssignmentsSection.tsx ("Changed since publication", "Review activity data"); frontend/src/features/ghg/InventoryDetailPage.tsx ("Where this inventory came from", "Superseded by a correction"); frontend/src/features/ghg/RunDetailPage.tsx (section 00: the correction block, "supersedes", the Since publication block); screen text from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt): "8 after publish", "8 run after publish" -->

## Before you start

- The inventory is published and you hold the Reviewer or Owner role.
- The fact is corrected first, on **Activity data** with its reason; see [Enter, correct and evidence a record](../activity-data/enter-a-record.md). The published inventory's **Records** tab then marks the record "Changed since publication: quantity".

## What the published report shows meanwhile

The published report does not move. Its run page keeps the block **Since publication**: "The report above reads exactly as it was published. What came after is listed here and nowhere else." Under it, "Nothing has changed since." gives way to one line per changed record, then "Later inventories:" and a count of the acts since publication.

## Create the correction

1. Open the published inventory and click **Create correction** in the title row.
2. Read the dialog "Create a correction": "A correction is a new draft inventory over the same period and approach. It inherits this inventory's boundary, instruments, declaration and every classification and exclusion, so only what was wrong needs changing. Chapter 5 wants the reason stated; the correction's report prints it with what changed."
3. Keep or change **Name**, offered as "FY2025 (correction)", and fill **Reason for the correction** with at least 10 characters.
4. Click **Create correction**.

What you see: "FY2025 (correction) created as a correction." The new draft's **Where this inventory came from**, under its title, opens to "Correction of FY2025: *N* decisions inherited. Reason: …"; the published inventory's row on **Inventories** reads "Superseded by a correction"; and every record of the source is on the **Records** tab with the tag "inherited".

## Restate the year and publish

1. On the **Records** tab click **Review activity data** to bring the corrected value into the view: "1 new record under review."
2. Change any decision that was wrong; the inherited ones stand.
3. Freeze the correction, launch a run, mark it final and publish it; see [Designate a final run and publish](designate-a-final-run-and-publish.md).

What you see: section 00 of the correction's run reads "Report version 2, supersedes FY2025", and a block **Correction of FY2025** prints your reason with "Against the published run: *N* lines added, *N* removed, *N* changed; *difference* in total."

## What happens next

- The report version counts corrections; the boundary version counts freezes.
- The superseded inventory stays published and readable.
- If the year is the base year, a run that reflects the change can be recorded as the recalculated base; see [Decide a recalculation candidate](decide-a-recalculation-candidate.md).
