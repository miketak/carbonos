---
owner: miketak
last_reviewed: 2026-09-24
---

# Review and classify records

**Role needed:** Preparer, Reviewer or Owner. The inventory must be a
draft.

Reviewing brings the organization's records into the inventory's view;
classifying decides, for each, the emission factor, the scope and the
category this inventory applies, or excludes it with a reason. The
records themselves are never modified.

<!-- sources: AssignmentsSection.tsx; AssignmentDrawer.tsx; format.ts exclusionLabels; specs 04, 04.3, 04.4, 04.8; verified 2026-09-24 -->

## Review

1. Open the inventory and its **Records** tab.
2. Click **Review activity data**.

What you see: "*N* new records under review." Running it again later
reads "*N* new records under review · *M* stale decisions refreshed."
or "All activity records are already reviewed." Each record gets a row
with a status:

| Status | Meaning |
| --- | --- |
| Unclassified | Under review, no decision yet. The Classification gate holds the freeze until every one is decided. |
| Included, with a scope | Classified with a factor. |
| Excluded | Left out with a reason. A record dated outside the period, at a facility outside the boundary or before its entity's membership window, or removed, is excluded on review without asking. |

The filters above the table narrow by facility, status, scope,
category, stream and lease treatment; the **Status** filter counts each.

## Classify a record

1. Click the row. The drawer reads "CLASSIFY RECORD" with the record's
   facility, quantity and period. If the facility is leased, it says so:
   "Leased facility: operating lease (leased in) inherited."
2. Click **Choose factor…**. The picker lists the approved factors that
   fit the record's unit and are valid in the inventory's period, each
   with its value, source and pack; type to narrow it. **Show
   unapproved** adds the rest. A record at a facility with a grid region
   offers a shortcut, "Suggested for this facility's grid: *factor*".
3. Click the factor.

What you see: the drawer reads **Included** with the scope, and the
**scope**, **category** and **lease type** fields filled from the
record's stream and facility. Choosing the factor saved the
classification; there is no separate save. The arrows at the foot of
the drawer move to the next record.

To change the decision later, click **Change factor…**, or choose
another scope or category.

### When a justification is asked

- **Another scope than the stream suggests.** The drawer says "The
  stream suggests Scope 1." and opens a **scope justification** field.
  The Classification gate errors until it holds 10 characters:
  "'Boiler LPG' is classified in scope 3; its stream 'Boiler LPG'
  defaults to scope 1. Record why (a justification of at least 10
  characters), or classify it in scope 1."
- **A proxy factor.** Tick **Proxy factor: stands in for one that is
  not published or not yet approved** and fill the justification the
  drawer opens; nothing is saved without it.
- **A mass meeting a factor per litre.** The drawer asks for a density:
  "tonne meets a factor per litre: choose the density that converts
  between them". A typical value may be used for a run but not a final
  one; see [Define units and densities](../organization/define-units-and-densities.md).

A leased facility needs no justification: Appendix F of the Standard
decides the scope under the inventory's approach, and the drawer
applies it.

## Exclude a record

1. In the drawer click **Exclude**.
2. Choose the reason: Outside reporting period, Outside boundary,
   Non-GHG activity, Duplicate, Not applicable, Methodology exclusion,
   Outside the scopes: Montreal Protocol gas, Record removed, or Other
   documented reason.
3. Fill the justification (at least 10 characters).
4. Say what the record would have emitted: an estimated magnitude in kg
   CO₂e, "This record emits nothing", or "Not estimated: there is no
   basis to size this record". A Montreal Protocol gas takes a gas name
   instead of a magnitude, and is offered only for a record whose unit
   is a mass.

What you see: the row reads **Excluded** with the reason. The report
totals the exclusions per reason and prints each with its
justification; it never prints "about 0 kg" for something nobody sized.

## What changed elsewhere

- The **Classification** gate reads PASS once every record is decided,
  and lists the upstream rules that will derive lines.
- The **Emission factors** gate warns for a CO₂e-only factor and errors
  for an unapproved one.
- A record changed after review is refreshed by the next **Review
  activity data**; a record removed is excluded by it.
