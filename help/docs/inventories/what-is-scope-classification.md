---
owner: miketak
last_reviewed: 2026-10-04
description: Why a record carries no scope, where the default scope comes from, when a departure needs a justification, and how a leased facility is treated under Appendix F.
---

# What is scope classification?

Scope classification is the inventory's decision about which scope and
category a record's emissions belong to, and which factor prices them. A
record carries no scope of its own, because two inventories may decide
differently about the same fact.

<!-- sources: concepts/classification-is-an-accounting-decision.md (verified 2026-09-24); specs 04, 04.1, 04.3, 04.7, 02.2, 10; AssignmentDetail.tsx ("The stream suggests", "Leased facility: ... inherited", scope justification); InventoryService.java scope departure finding; detail texts from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt): "6 classified Contract haulage diesel", "7 run page" -->

## Where does the default come from?

From the record's source stream. A stream has a kind and says whether a
contractor operates it; the kind fixes the categories, the operator the
default scope.

| Stream | Default scope |
| --- | --- |
| Owned combustion or process stream | Scope 1 |
| Purchased electricity, heat, steam or cooling | Scope 2 |
| Contractor-operated stream | Scope 3, category 1: chapter 4 of the Corporate Standard puts a contractor's combustion in the customer's scope 3. |

Gye Nyame Gold's Contract ore haulage stream is contractor-operated, so
"Contract haulage diesel" lands in **Scope 3**, **1. Purchased goods and
services**, with no justification asked.

## When is a justification required?

When you choose a scope other than the default. The record's detail says
"The stream suggests Scope 1." and opens a justification field; until it
holds 10 characters, the Classification gate holds the run: "Record why
(a justification of at least 10 characters), or classify it in scope 1."

A justification is also required for a **proxy factor**. A factor must
be approved by someone other than its author before a run can use it.

## What about a leased facility?

A facility's lease is a fact of the facility, inherited by every record
at it; the detail prints "Leased facility: operating lease (leased in)
inherited." Appendix F settles the scope under each approach, so no
justification is asked: under operational control a site leased in is
scope 1 and 2; under equity share or financial control a finance lease
is scope 1 and 2 and an operating lease scope 3, category 8. Under
operational control, Obuasi Camp's lines sit in scope 1 and print
"Operating lease (leased in)".

## Where next

- [Review and classify records](review-and-classify-records.md).
- [What is a pre-flight gate?](what-is-a-pre-flight-gate.md).
- [Meet Gye Nyame Gold](../get-started/meet-gye-nyame-gold.md).
