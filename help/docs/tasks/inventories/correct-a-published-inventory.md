---
owner: miketak
last_reviewed: 2026-09-24
---

# Correct a published inventory

**Role needed:** Reviewer or Owner.

A published inventory cannot change. To restate the year, you create a
correction: a new draft inventory over the same period and approach
that inherits every decision, so that only what was wrong needs
changing. Its report supersedes the published one and says what
changed.

<!-- sources: LifecycleBar.tsx (Create correction dialog); InventoryDetailPage.tsx "Where this inventory came from"; RunDetailPage.tsx section 00; specs 05.1, 05.2, 07.4; verified 2026-09-24 -->

## Before you start

Correct the fact first. A record corrected after publication is marked
in the published view's **Records** tab as "Changed since publication:
quantity", and the published run's page lists it under **Since
publication** ("Plant grid electricity: quantity 60000 → 61000"). The
published report itself does not move. See
[Facts, views and runs](../../concepts/facts-views-and-runs.md).

## Steps

1. Open the published inventory. In the **Inventory lifecycle** card
   click **Create correction**.
2. Read the dialog: "A correction is a new draft inventory over the
   same period and approach. It inherits this inventory's boundary,
   instruments, declaration and every classification and exclusion, so
   only what was wrong needs changing. Chapter 5 wants the reason
   stated; the correction's report prints it with what changed."
3. Keep or change **Name** (offered as "*Name* (correction)") and fill
   **Reason for the correction**.
4. Click **Create correction**.

What you see: "*Name* created as a correction." The new inventory opens
as a draft. Its **Where this inventory came from** card reads
"Correction of FY2025: 5 decisions inherited. Reason: …", and its
**Records** tab lists every record as **Included** with the tag
"inherited".

5. Click **Review activity data** to bring the corrected record's new
   value into the view ("1 new record under review."), and change any
   decision that was wrong.
6. Freeze the correction, launch a run, mark it final and publish it,
   as for any inventory.

## What the correction's report says

Section 00 of the correction's run reads "Report version 2, supersedes
FY2025" and adds a block **Correction of FY2025** with your reason and
the difference: "Against the published run: 0 lines added, 0 removed,
1 changed; +586 kg CO₂e in total." The rest of the report is the
restated year.

## What changed elsewhere

- The report version counts corrections; the boundary version counts
  freezes. Both are printed.
- The superseded inventory stays published and readable, and its run
  page says what came after it.
- If the year is the base year, a run of the correction can be recorded
  as the recalculated base; see
  [Decide a recalculation candidate](../base-year/decide-a-recalculation-candidate.md).
