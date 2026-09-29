---
owner: miketak
last_reviewed: 2026-09-28
description: Name the inventory whose final run is the base-year figure, set the significance threshold and the mid-year convention, and record why that year was chosen.
role: Reviewer
minutes: 5
---

# Designate the base year

The base year is the reference every later inventory is compared against, and the policy recorded with it says when it must be recalculated. You designate it once the chosen year's inventory has a final run.

<!-- sources: specs 06 and 06.1; old page tasks/base-year/designate-the-base-year.md (verified 2026-09-24); frontend/src/features/ghg/BaseYearPage.tsx (labels, hints, buttons, the designation card, the empty history); frontend/src/features/ghg/format.ts (conventionLabels); frontend/src/features/ghg/roles.ts (mayWrite); frontend/src/features/ghg/RunDetailPage.tsx (section 07); screen text from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt): "8 run after publish" (section 07 before a base year exists) -->

## Before you start

- The inventory whose period is the base year has a final run; that run is the base-year figure. See [Designate a final run and publish](designate-a-final-run-and-publish.md).
- You hold the Preparer, Reviewer or Owner role.

## Designate the base year

The **Base year** page opens with the card **Base year and recalculation policy**, which says what triggers a recalculation under Chapter 5 and what never does.

1. Open **Base year**.
2. Choose **Base-year inventory**: "The inventory whose period is the base year; its final run is the base-year figure."
3. Fill **Significance threshold (%)**: "A change affecting more than this share of base-year emissions requires recalculation."
4. Fill **Why this year**: "The Standard asks for a year with verifiable data and the reason for choosing it."
5. Choose **Mid-year structural changes**: "From the transaction date (membership windows)" or "For the whole year, as the Standard recommends".
6. Click **Designate base year**.

What you see: "Base year 2025 designated.", for an inventory over 2025. The card shows **Base year**, **Established by** with the inventory and "Base-year run: Run *N* · *total*", the threshold, the convention and the reason, with **Edit policy** and **Clear base year**. Under **Recalculation history**: "No recalculation candidates yet."

!!! note "Which convention to choose"
    The field's hint says it: "Chapter 5 recommends recalculating the base year and the current year for the entire year. Membership windows account from the transaction date instead; the report prints which convention was used." Choose the transaction date when the boundary already carries membership windows, and the whole year when you restate both years in full.

## Edit or clear the policy

1. On **Base year** click **Edit policy**, change the threshold, the reason or the convention, and click **Save policy**.
2. To remove the designation, click **Clear base year**: "Base year cleared."

## What happens next

- Section 07 **Base year** of every run's report changes from "No base year designated. Set one under Base year." to the year, its policy, the base-year run and its total, the recalculation history and an **Emissions profile over time** table with each year's final run.
- The designation sweeps the inventories already frozen: one whose boundary differs from the base year's gets a candidate at once. From then on a freeze that moves the boundary, or an accepted factor pack update that counts as a methodology change, raises one; see [Decide a recalculation candidate](decide-a-recalculation-candidate.md).
