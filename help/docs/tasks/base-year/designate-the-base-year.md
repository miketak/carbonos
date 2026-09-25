---
owner: miketak
last_reviewed: 2026-09-24
---

# Designate the base year

**Role needed:** Reviewer or Owner.

The base year is the reference point later inventories are compared
against, and the policy recorded with it says when it is recalculated.
The base-year figure is the final run of the inventory you name.

<!-- sources: BaseYearPage.tsx; specs 06, 06.1; verified 2026-09-24 -->

## Before you start

The inventory whose period is the base year needs a final run; the page
shows "Base-year run: Run *N* · *total*" once designated. The GHG
Protocol asks for a year with verifiable data and the reason for
choosing it.

## Steps

1. Open **Base year**. The page reads "Structural changes, methodology
   changes, and significant errors all trigger a recalculation under
   Chapter 5, on their own or together, so the Standard asks for a
   threshold and a policy. Organic growth or decline, and facilities
   that did not exist in the base year, never trigger one."
2. Choose **Base-year inventory**.
3. Fill **Significance threshold (%)**: "A change affecting more than
   this share of base-year emissions requires recalculation."
4. Fill **Why this year**.
5. Choose **Mid-year structural changes**: "From the transaction date
   (membership windows)", which is how membership windows account, or
   "For the whole year, as the Standard recommends". The report prints
   which convention was used.
6. Click **Designate base year**.

## What you see

"Base year 2025 designated." The page shows the base year, the
inventory that established it with "Base-year run: Run 001 · 56.06 t
CO₂e", the threshold, the convention and the reason, with **Edit
policy** and **Clear base year**. Under **Recalculation history**: "No
recalculation candidates yet."

## What changed elsewhere

- Every run's report prints section 07, **Base year**: the year, the
  threshold "applied to each change and to the cumulative effect since
  the base year", the reason, the convention, the base-year emissions,
  the recalculation history, and an **Emissions profile over time**
  table of each year's final run.
- Freezing an inventory whose boundary differs from the base year's
  raises a recalculation candidate, and the designation sweeps the
  inventories already frozen. See
  [Decide a recalculation candidate](decide-a-recalculation-candidate.md).
- Accepting a factor pack update that counts as a methodology change or
  an erratum raises a candidate too.
