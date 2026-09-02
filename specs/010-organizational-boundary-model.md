# 010: Organizational boundary: legal entities, Table 1, and changes over time

- **Status**: Draft
- **Owner**: Michael Takrama
- **Created**: 2026-09-02 (from the GHG Protocol conformance review of spec 003)
- **Backend module(s)**: `ghg`
- **Frontend feature(s)**: `src/features/ghg`
- **Relates to**: [spec 003](003-inventory-accounting-model.md),
  [spec 007](007-boundary-freeze-and-versioning.md)

## Problem / Motivation

Spec 003 models the organizational boundary as per-facility treatments with
three facts (ownership percent, financial control, operational control) and a
share rule of "equity percent under equity share, 1 or 0 under the control
approaches". Measured against Chapter 3 and Chapter 5 of the GHG Protocol
Corporate Standard, that is incomplete in three ways that share one data model.

1. **Table 1 is richer than the rule.** A jointly financially controlled joint
   venture is accounted at equity share *under the financial-control
   approach*; associates with significant influence contribute nothing under
   either control approach; fixed-asset investments contribute nothing even
   under equity share. The three facts cannot express the relationship type
   that drives these rows.
2. **The Standard consolidates legal entities, not sites.** A 40% stake in a
   joint venture company that owns three sites is one fact, not three
   percentages to keep in step. And "ownership/equity %" conflates legal
   ownership with economic interest; Chapter 3 says economic substance
   overrides legal form.
3. **Changes over time are mis-modelled.** Specs 003, 006 and 007 handle a
   facility acquired or divested mid-period by a per-inventory override of its
   share. Chapter 5 accounts for it from the transaction date and recalculates
   the base year for structural changes above a documented significance
   threshold (but not for organic growth). Scaling a share to 50% applies half
   a year's ownership to a whole year's activity, which is a different and
   wrong number.

## Behaviour

- An organization has **legal entities**; each facility belongs to one. An
  entity carries its **relationship type** (wholly owned or subsidiary, joint
  venture with joint financial control, operated non-incorporated joint
  venture, associate with significant influence, fixed-asset investment) and
  its **economic interest** percent.
- The accounting share derives from relationship type x approach exactly as
  Table 1, and flows down to the entity's facilities. Per-inventory overrides
  remain possible, at the entity level.
- Boundary membership is **effective-dated**: a treatment has from and to
  dates, and an activity counts for the inventory only when its date falls
  inside the window; outside it, the assignment auto-excludes as
  OUTSIDE_BOUNDARY with the window shown.
- An inventory records a **base year** and a **recalculation policy**
  (significance threshold, triggers). A boundary version (spec 007) that adds
  or removes an entity or facility, or changes a relationship, flags the base
  year for recalculation and records the reason.

## API contract

Sketch: `/organizations/{id}/entities` CRUD; facility gains `entityId`;
boundary treatments become per entity with per-facility inclusion and
`effectiveFrom` / `effectiveTo`; inventory gains `baseYearPolicy`; validation
gains a BASE_YEAR finding.

## Data

New `ghg_entities`; `ghg_facilities.entity_id`; treatments and version entries
re-keyed and dated; `ghg_inventories.recalculation_policy`. The migration
creates one entity per facility to preserve current behaviour.

## Events

None.

## Non-goals

Multi-level group structures beyond one entity layer; franchise accounting;
automatic recalculation of base-year figures (this spec records the trigger
and the reason, the recalculation is a run).

## Open questions

Whether the boundary version snapshots entities, facilities, or both.
