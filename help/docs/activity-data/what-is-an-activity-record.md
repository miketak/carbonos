---
owner: miketak
last_reviewed: 2026-09-28
description: An activity record is a fact the organization owns, read by every inventory; learn what it holds, why a correction keeps both values, and its statuses.
---

# What is an activity record?

An activity record is one fact about the organization: what a site consumed or produced, in which quantity and unit, over which period, and the document that says so. It carries no scope, category or factor; those are an inventory's decisions about it.

<!-- sources: concepts/facts-views-and-runs.md (the fact half) and reference/statuses-and-transitions.md (activity records), both verified 2026-09-24; spec 00 (three invariants); specs 04, 04.4, 04.5; badges.tsx (pills); ActivityDrawer.tsx (toasts); screen text from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt): "4 after import", "4 history" -->

## A fact, not a view

Facts belong to the organization, like its facilities, emission sources, factors and units. A view is one inventory's accounting decisions about those facts, for one period under one consolidation approach: "Each inventory decides separately how it is accounted for." So one record serves several inventories, each classifying it for itself, and a record that straddles the year end is read by both years' inventories, each taking its own days.

## Why does a correction keep both values?

A record is corrected in place, with a reason, and its history keeps the old value, the new value, who changed it and when: "Quantity: 3600000 → 36000000". A run copies every input it used into its lines, so "Record corrected. Past runs are unaffected." Removing a record works the same way: it stays on file as removed, with the reason.

## What the statuses mean

| Status | Meaning | What changes it |
| --- | --- | --- |
| Draft | Saved with only the activity type and the facility: "A draft; not yet a fact". | **Save draft**. **Save** with the figures turns it into a fact, and a fact never goes back. |
| Ready | "All completeness checks passed": figures, an emission source, a data source and evidence are present. | **Save** or **Add records** with every item filled. |
| Needs attention | A fact with something missing; the pill names the first missing item. | Filling the missing item, or attaching evidence. |
| Removed | Left the register, with your name, the date and the reason. | **Remove** with a reason. A record a run calculated cannot be removed. |

Readiness measures completeness, not correctness: "Review status reflects completeness, not assurance."

## Where next

- [Enter a record](enter-a-record.md)
- [Correct or remove a record and attach evidence](correct-or-remove-a-record-and-attach-evidence.md)
- [Review and classify records](../inventories/review-and-classify-records.md)
