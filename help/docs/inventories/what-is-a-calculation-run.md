---
owner: miketak
last_reviewed: 2026-10-04
description: A run is an immutable, numbered snapshot of the inventory's view; what it copies, how voiding and the final designation work, and what a later correction to a fact does.
---

# What is a calculation run?

A calculation run is the inventory's view calculated at a moment and
kept as an immutable snapshot, lines and exclusions alike. A report that
cites "Run 001" always finds the same numbers.

<!-- sources: concepts/facts-views-and-runs.md, run half (verified 2026-09-24); specs 00, 05, 05.1, 05.2, 05.3; InventoryDetailPage.tsx (runs intro, void dialog); RunDetailPage.tsx ("VOIDED", "Since publication", correction block); AssignmentsSection.tsx and AssignmentDetail.tsx ("Changed since publication"); run page and dialog texts from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt): "7 run page", "8 final dialog", "8 after final", "8 run after publish" -->

## What does a run hold?

Every input it used, copied into its lines: the quantity as converted,
the factor and its version, the accounting share, the period share, and
the result per gas. Run 001 for Gye Nyame Gold holds 11 lines, cites
boundary version 1, and totals 86,412 t CO₂e. The **Runs** tab states
the rule: "Recalculation creates a new run; earlier runs are kept. A run
is never deleted: it can be voided with a reason, and its number is
never reused."

## How are runs numbered, voided and designated?

| Act | What it does |
| --- | --- |
| **Launch calculation run** | Calculates the frozen view into the next number: Run 001, then Run 002. |
| **Void run** | Takes a reason of at least 5 characters. "The run keeps its number, lines and totals on the record, marked VOIDED with your reason and your name. Run numbers are never reused. This cannot be undone." |
| **Mark as final** | Makes one run the inventory's result: "the report and the base year attach to it, and the inventory can be published." The optional review note is printed in the report header. |

## What happens to a published run when a fact changes?

Nothing, on the run. A record corrected after publication is marked
"Changed since publication" on the view, and the run page reads exactly
as issued. Under its header, **Since publication** says: "The report
above reads exactly as it was published. What came after is listed here
and nowhere else." To restate the year, you create a correction, a new
inventory whose run prints, against the published run, how many lines
were added, removed and changed, and the difference in total.

## Where next

- [Freeze the inventory and launch a run](freeze-and-launch-a-run.md).
- [Designate a final run and publish](../reporting/designate-a-final-run-and-publish.md).
- [What is an activity record?](../activity-data/what-is-an-activity-record.md).
