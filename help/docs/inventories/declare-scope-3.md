---
owner: miketak
last_reviewed: 2026-09-29
description: Declare on the Boundary tab which scope 3 categories the inventory covers and why the others are excluded, and read the warnings raised when the declaration and the records disagree.
role: Preparer
minutes: 5
screens: [step-5-declaration.png]
---

# Declare scope 3

The operational boundary declaration states which scope 3 categories this inventory quantifies and why the others are left out; the report prints it beside each category's total. Make it before the freeze, and amend it whenever the categories you quantify change.

<!-- sources: specs 04.7, 07.2 and 07.6; the old page tasks/inventories/create-an-inventory-set-the-boundary-and-declare-scope-3.md (verified 2026-09-24); OperationalBoundaryCard.tsx (the per-category field and the toast); InventoryService.java classification findings; screen text from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt): "5 boundary", "5 declaration saved", "6 under review", "7 run page" section 02 -->

## Before you start

- The inventory is a draft, and you are Preparer, Reviewer or Owner.
- Know which categories the records and the upstream rules will quantify this year.

## Declare the categories

1. Open the inventory, then the **Boundary** tab, and scroll to **Operational boundary declaration**.
2. Under **Scope 3 categories covered**, tick each category this inventory quantifies. Gye Nyame Gold ticks **1. Purchased goods and services** and **3. Fuel- and energy-related activities**.
3. If a ticked category will carry no lines this year, fill the field that opens under it, "Not quantified this year because…".
4. Fill **Why other categories are excluded**.
5. Click **Save declaration**.

![The Operational boundary declaration card with categories 1 and 3 ticked and the reason for the other categories filled in](../assets/screens/step-5-declaration.png)

What you see: "Operational boundary declaration saved." The card states the rule: "Scope 1 and scope 2 are always covered. Declare which scope 3 categories this inventory covers and why the others are excluded; the report prints this declaration beside each category's total. A declared category with no lines needs a reason, or the pre-flight warns: a reader takes "covered" to mean quantified."

## Read the cross-check

The **Classification** gate compares the declaration with the records and the upstream rules. Each finding is a warning: it does not hold the launch, but it stays until the declaration and the view agree.

| The gate warns | What to do |
| --- | --- |
| "Scope 3 '*category*' is declared as covered but no included record is classified into it: a reader takes 'covered' to mean quantified. Classify records into it, or say in the declaration why it is not quantified this year." | Classify a record into the category, or fill "Not quantified this year because…" under it. |
| "Fuel- and energy-related activities is declared, but no upstream rule matches a scope 1 or scope 2 factor in this view; add a rule or say why category 3 is not quantified." | Add an upstream rule on the **Method** tab, or give the reason under category 3. |
| "Records are classified into scope 3 '*category*' but the declaration does not list it as covered. Declare it, or reclassify the records." | Tick the category, or reclassify the records. |

## What happens next

The freeze fixes the declaration into the boundary version, and section 02 of the report, "Operational boundary", prints each declared category with its lines and total, and your text under "Why other categories are excluded". Next: [Review and classify records](review-and-classify-records.md), then [Record scope 2 instruments and upstream rules](record-scope-2-instruments-and-upstream-rules.md).
