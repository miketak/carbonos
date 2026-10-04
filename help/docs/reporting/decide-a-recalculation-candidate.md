---
owner: miketak
last_reviewed: 2026-10-04
description: Read a base-year recalculation candidate, record a recalculated base or decline it, raise one by hand for a methodology change or an error, and know the four candidate statuses.
role: Reviewer
minutes: 10
---

# Decide a recalculation candidate

A candidate is CarbonOS's record of something that may require the base year to be recalculated under chapter 5. You decide it by recording a recalculated base or declining it; until then one above the threshold holds the sign-off of later years.

<!-- sources: specs 06 and 06.1; old pages tasks/base-year/decide-a-recalculation-candidate.md and reference/statuses-and-transitions.md (base-year recalculation candidates), both verified 2026-09-24; frontend/src/features/ghg/BaseYearPage.tsx (the candidate table, the Raise, Decline and Record dialogs, toasts); frontend/src/features/ghg/components/PreflightChip.tsx (spec 10); frontend/src/features/ghg/roles.ts (mayWrite); backend/src/main/java/com/carbonos/ghg/internal/BaseYear.java (the candidate's reason and cumulative weight); backend/src/main/java/com/carbonos/ghg/internal/BaseYearService.java (superseded candidates); backend/src/main/java/com/carbonos/ghg/internal/InventoryService.java (refuseWhileARecalculationHolds) -->

## Before you start

- A base year is designated; see [Designate the base year](designate-the-base-year.md).
- You hold the Preparer, Reviewer or Owner role.

## Read the candidate

Open **Settings** and the **Baseline and targets** tab. Under **Recalculation history** each candidate's row carries its status, weight, who raised it and its reason: "structural change: *facility* removed; *N*% of base-year emissions, above the *T*% threshold, recalculation required".

| Status | Meaning | What leads here |
| --- | --- | --- |
| FLAGGED | Awaits a decision. | A freeze that moves the boundary, an accepted factor pack update, or **Raise a candidate**. |
| RECALCULATED | A run of the base-year inventory is the new base. | **Record recalculated base**. |
| DECLINED | The base year stands. | **Decline**. |
| SUPERSEDED | The boundary went back. | A later freeze; the row reads "put back in boundary version *N* as the base year held it". |

## What an undecided candidate holds

While a candidate above the threshold is FLAGGED, an inventory that reports against the base year under the same approach can be run but not marked final or published; its pre-flight chip stays **Ready to launch** and its popover reads "Base year holds the final designation; runs stay available." Another approach gets a warning, not a hold.

## Record a recalculated base

1. Launch a run of the base-year inventory that reflects the change, for example from a correction; see [Correct a published inventory](correct-a-published-inventory.md).
2. Click **Record recalculated base** on the candidate.
3. Read the dialog "Record the recalculated base year": "The earlier runs are kept, so both figures stay readable."
4. Choose **Recalculated base run**, add a **Note (optional)**, and click **Record**.

What you see: "Recalculated base year recorded." The row reads RECALCULATED with "Decided by *email*, *moment* · recalculated base: Run *N*", and the hold is released.

## Decline

1. Click **Decline** on the candidate.
2. Read the dialog "Decline the recalculation?": "The base year is kept as it stands and the decision is recorded with the reason it was raised: …"
3. Add a **Note (optional)** and click **Decline**.

What you see: "Recalculation declined." The row reads DECLINED with "Decided by *email*, *moment* · *note*".

## Raise a candidate by hand

1. Click **Raise a candidate**.
2. In "Raise a recalculation candidate" choose **Trigger**: "Methodology change" or "Significant error corrected". Fill **What changed**.
3. Fill **Affected share of base-year emissions (%)**, or **Comparison run id (optional)**: "the share is the difference between the two totals."
4. Click **Raise**.

What you see: "Recalculation candidate raised." The candidate reads FLAGGED with "raised by *email*".
