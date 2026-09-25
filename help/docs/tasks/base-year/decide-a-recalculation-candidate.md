---
owner: miketak
last_reviewed: 2026-09-24
---

# Decide a recalculation candidate

**Role needed:** Reviewer or Owner.

A candidate is CarbonOS's record that something happened which may
require the base year to be recalculated under chapter 5 of the GHG
Protocol Corporate Standard. It is raised by a freeze, by an accepted
factor pack update, or by hand, and it is decided by recording a
recalculated base or by declining it.

<!-- sources: BaseYearPage.tsx candidate cards and dialogs; InventoryService.java refuseWhileARecalculationHolds; specs 06, 06.1; verified 2026-09-24 -->

## Read the candidate

Open **Base year**. Under **Recalculation history** each candidate
reads its state, when and from which boundary version it was raised,
its weight, and its reason, for example:

> FLAGGED · boundary v1 · 23.74% of base-year emissions, above the
> threshold · structural change: Harbour Depot removed; 23.74% of
> base-year emissions, above the 5% threshold, recalculation required

A candidate below the threshold reads "recalculation optional". "A
change is weighed on its own and together with the outstanding earlier
ones."

## What an undecided candidate holds

While a candidate above the threshold is FLAGGED, every inventory that
reports against the base year under the same approach can be run but
not marked final. **Mark as final** answers: "The 2025 base year has a
recalculation candidate above the significance threshold (…). An
inventory that reports against the base year cannot be marked final
until the recalculation is completed or declined. Calculation runs
stay available, because quantifying the movement is how a
recalculation is assessed." The inventory's **Base year** gate carries
the same finding, and the pre-flight banner reads "Base year holds the
final designation; runs stay available."

## Record a recalculated base

1. Launch a run of the base-year inventory that reflects the change,
   for example from a correction inventory that leaves the sold
   facility out. See [Correct a published inventory](../inventories/correct-a-published-inventory.md).
2. On **Base year** click **Record recalculated base** on the
   candidate. The dialog reads: "A recalculated base is a run of the
   base-year inventory (FY2025) that now carries the reason: … The
   earlier runs are kept, so both figures stay readable."
3. Choose **Recalculated base run** from the runs of the base-year
   inventory, each with its total, add a **Note (optional)**, and click
   **Record**.

What you see: the card reads RECALCULATED with your email and the run,
and the hold is released.

## Decline

1. Click **Decline** on the candidate. The dialog reads: "The base year
   is kept as it stands and the decision is recorded with the reason it
   was raised: …"
2. Add a **Note (optional)** saying why, and click **Decline**.

What you see: the card reads DECLINED with "Decided by *email*,
*moment* · *note*", and the hold is released. A declined candidate
still counts toward the cumulative weight of later ones.

## Raise a candidate by hand

A methodology change and the discovery of a significant error "cannot
be detected from the data, so the accountant raises it with its
weight."

1. Click **Raise a candidate**.
2. Choose **Trigger**: "Methodology change" or "Significant error
   corrected". Fill **What changed**.
3. Fill **Affected share of base-year emissions (%)**, or fill
   **Comparison run id (optional)** with a run of the base-year
   inventory: "the share is the difference between the two totals."
4. Click **Raise**.

The candidate then reads FLAGGED like any other and is decided the
same way.

## Superseded candidates

A candidate raised by a boundary change is SUPERSEDED without a
decision when a later freeze puts the boundary back exactly as the base
year held it; the card says so.
