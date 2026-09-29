---
owner: miketak
last_reviewed: 2026-09-28
description: Read the notice a new factor pack edition raises under Updates, weigh the estimated movement, and accept it as a vintage progression or decline it with a note.
role: Reviewer
minutes: 8
---

# Accept or decline an edition notice

When the platform publishes a new edition of a pack you hold, CarbonOS raises one notice under **Updates** and changes none of your figures. A Reviewer or Owner decides it once.

<!-- sources: specs 02.6, 02.7, 02.9; the old page tasks/factor-updates/accept-or-decline-an-edition-notice.md (verified 2026-09-24); frontend/src/features/ghg/FactorPackUpdatesPage.tsx; frontend/src/features/ghg/components/AdoptionDiffDrawer.tsx; frontend/src/features/ghg/OrganizationLayout.tsx (the badge); frontend/src/features/ghg/format.ts (history labels); backend/src/main/java/com/carbonos/ghg/internal/FactorPackAdoptionService.java, FactorPackImportService.java and GhgAccess.java (refusals, history) -->

## Before you start

- A notice exists: **Updates** carries a badge and "1 factor pack update waiting".
- You hold the Reviewer or Owner role; a Preparer can only read the notice.

## Read the notice

1. Open **Updates**. The table lists each notice with **Edition**, **Raised**, **Rows affected**, **Moving over 5%**, **Estimated movement** and **Status**.
2. On a row that reads **Waiting on you**, click **Review**.
3. Read **Rows moving**, **Over five percent** and **Estimated movement**.
4. Read **What moves**: each lineage with **Now**, **New**, **Change** and **Estimated movement**, flagged "Provenance changed" or "Gases changed" where those moved.
5. Read **Conflicts** (rows you edited locally), **Blocked** (rows a frozen, final or published period uses) and **Discontinued** (lineages the edition drops), when present.
6. Read **Earlier periods**: "These end before *date*, so they will raise coverage warnings once the edition is accepted."

What you see: the drawer's estimate, "over *inventory*, using the activity data already recorded", is the one to weigh; the table's comes from your last completed run.

## Accept the edition

1. Answer **How does chapter 5 treat this adoption?**; for a 2026 edition applied from 2026 onward, "Vintage progression: the edition applies to the next reporting year forward".
2. Fill **Note (optional)**: "Required when a vintage progression is at or above your significance threshold".
3. Click **Accept**.

What you see: "Adopted *edition*: *N* versions cut, *N* lineages added." The row reads **Accepted** "by *email*", each factor that moved shows "2 versions of this factor", and the history on **Settings** records **Factor pack adopted**.

!!! note "The recalculation question"
    "Accepting raises a base-year recalculation candidate. If it is above your significance threshold, inventories that report against the base year cannot be marked final or published until the recalculation is completed or declined."

## Decline the edition

1. Fill **Note (optional)** with the reason.
2. Click **Decline**.

What you see: "Declined *edition*. Nothing changed." The row reads **Declined** "by *email*" and the history records **Factor pack declined**.

## When acceptance is refused

- The date falls inside a frozen, final or published period: "A reported period keeps the factors it reported with, so this edition cannot be accepted until that inventory is reopened. Declining stays available."
- Support access: "Support access cannot adopt an edition for an organization."
- The publisher withdrew it: the row reads **Withdrawn by the publisher**, and "there is nothing to decide."
