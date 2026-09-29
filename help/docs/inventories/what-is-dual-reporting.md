---
owner: miketak
last_reviewed: 2026-09-28
description: Why every run reports scope 2 twice, what the location-based and market-based figures are made of, what an instrument must satisfy, and what the residual mix is.
---

# What is dual reporting?

Dual reporting is the GHG Protocol Scope 2 Guidance's requirement to
report purchased electricity two ways: location-based, at the average of
the grid it was drawn from, and market-based, at the factor of the
instruments the company contracted for. CarbonOS prints both on every
run; the total uses the location-based figure.

<!-- sources: concepts/scope-2-two-ways.md (verified 2026-09-24); specs 07.1, 07.3, 07.6; MarketFactorsCard.tsx ("Residual mix available", "The instrument is applied only when all eight are met"); InventoryService.java instrument findings; RunDetailPage.tsx section 04; gate, report texts and figures from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt): "5 workbench", "7 run page" -->

## How do the two figures differ?

| | Location-based | Market-based |
| --- | --- | --- |
| Each kilowatt-hour is priced at | The grid factor of the facility's region. | The instrument's factor for the kilowatt-hours it covers; the residual mix for the balance, or the grid average where none is published. |
| Answers | What the grid emitted to supply the company. | What the company contracted for. |
| Used for | The inventory total, the by-gas table and the category 3 losses. | Disclosure beside the location-based figure. |

Gye Nyame Gold held no instrument and Ghana publishes no residual mix,
so Run 001 prints 32,816.630 t CO₂e both ways, with the basis in words: "Market-based
basis: no instrument applied and no residual mix available; the grid
average (location-based) stands in."

## What makes an instrument count?

An instrument is recorded per facility on the **Method** tab with its
factor, coverage, dates and evidence. It counts only if it meets the Scope 2 Guidance's eight Quality Criteria:
"The instrument is applied only when all eight are met; an unanswered
criterion counts as not met until it is answered."

## What is the residual mix, and why answer either way?

The residual mix is the grid average once the generation claimed by
instruments is taken out; priced at it, the balance cannot count a green
kilowatt-hour twice. Every inventory answers **Residual mix available**
on the **Method** tab; until it does, the Emission factors gate warns
that "uncovered electricity is priced at the grid average". Where none
is available, the report says: "This may result in double counting
between electricity consumers."

## Where next

- [Record scope 2 instruments and upstream rules](record-scope-2-instruments-and-upstream-rules.md).
- [What is a pre-flight gate?](what-is-a-pre-flight-gate.md).
- [Meet Gye Nyame Gold](../get-started/meet-gye-nyame-gold.md).
