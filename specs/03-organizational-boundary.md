# 03: Organizational boundary

- **Status**: Implemented
- **Protocol**: Chapter 3 (setting organizational boundaries)
- **Owner**: Michael Takrama
- **Created**: 2026-08-29 (treatments), 2026-09-02 (facts, prefill, freeze,
  versioning); merged 2026-09-02; legal entities, Table 1 and membership
  windows 2026-09-08
- **Modules**: `ghg`, `src/features/ghg` (inventory detail: boundary section,
  version history; run report: boundary version card)

## Problem

Chapter 3 asks a company to choose one **consolidation approach** and apply it
consistently to determine which operations' emissions it accounts for, and at
what share. It also expects that choice to be a deliberate, documented
declaration that a verifier can examine. The boundary is the single most
consequential judgement in an inventory, and this spec makes it explicit,
drawn by legal entity, prefilled from facts, frozen before use, and versioned.

## Behaviour

### Consolidation approaches

An inventory (spec 05) carries exactly one approach, applied to every entity
in its boundary:

- **Equity share.** The company accounts for emissions according to its share
  of equity in the operation. The Standard defines equity share as *economic
  interest*, which normally equals ownership percentage; where it does not,
  economic substance overrides legal form. An entity records both (spec 03.1).
- **Financial control.** 100% of emissions from operations over which the
  company has financial control, the economic interest of jointly controlled
  ventures, none from others.
- **Operational control.** 100% from operations the company operates, none
  from others.

A company that must report under more than one approach, for different
stakeholders, creates one inventory per approach over the same facts and
period. Overlapping periods are allowed by design.

### Boundary treatments, by legal entity

Each inventory holds its own **treatment** per legal entity (spec 03.1):
relationship type, economic interest percent, whether the company operates
it, and an optional membership window (spec 03.2), with the entity's
facilities included beneath it. Presence of a treatment is membership of the
boundary. The **accounting share** is derived, never stored on the treatment,
by Table 1 of the Standard:

| Relationship | Equity share | Financial control | Operational control |
| --- | --- | --- | --- |
| Wholly owned / subsidiary | economic interest | 100% | 100% if operated |
| JV, joint financial control | economic interest | economic interest | 100% for the operator, else 0 |
| Non-incorporated JV, company operates | economic interest | economic interest | 100% |
| Associate (significant influence) | economic interest | 0 | 0 |
| Fixed-asset investment | 0 | 0 | 0 |

The share flows down to every facility of the entity. The boundary response
spells out the Table 1 row applied, so the accountant and the verifier read
the same sentence.

### Prefill from facts

When a facility is ticked into a draft boundary, its entity joins the boundary
with a treatment copied from the entity's facts (spec 02); ticking the entity
itself brings every facility of it. The rule is server-side, so it holds for
every client: a `PUT` with `{}` prefills every field; any field the client
sends wins; on a treatment that already exists an absent field keeps its
current value. Treatments stay overridable per inventory, at the entity level,
and overrides never write back to the entity.

Given "Tema JV" (joint venture, 40%, operated) with two sites: ticking one site
into an equity-share inventory starts the entity at 40% (share 0.40); into an
operational-control inventory at share 1; into a financial-control inventory
at share 0.40. No manual entry in any case.

### Membership windows

A treatment may be bounded by **effective from** and **effective to** dates,
so an acquisition on 1 July is a member from 1 July (spec 03.2). Records
outside the window are outside the boundary; the version records the window;
the BOUNDARY gate warns about partial-period memberships.

### Drift between facts and treatment

Editing an entity never rewrites an existing treatment or a frozen version.
Instead the BOUNDARY gate warns when a treatment's relationship, interest or
operated flag differs from the entity's current facts, naming both sides.
While the inventory is frozen the warning is informational; the remedy is
reopen, reconcile, re-freeze, which cuts a new version.

### Zero-share entities

An entity whose share is 0 under the approach (an associate under a control
approach, a fixed-asset investment, a JV another party operates under
operational control) is, in the Standard's terms, outside the boundary under
that approach (spec 05.1). The gate warns and offers to remove it; review
auto-excludes its records as outside the boundary; the version records it as
excluded with the reason rather than as a member at 0%.

### States: draft and frozen

The boundary's lifecycle is the inventory's (spec 05.1). While the inventory
is `DRAFT` treatments are editable and the BOUNDARY gate raises an ERROR, so a
run is blocked. **Freezing the inventory** is refused when the boundary is
empty; otherwise it cuts version N+1, makes the boundary and the activity view
read-only (writes are refused with 409, and so is a change of approach), and
unblocks the run. **Reopen as draft** restores editing and never deletes or
alters a version. Every freeze cuts a new version, even an unchanged one: a
version is a record of a deliberate act, one row per act. A freeze also
measures the boundary against the organization's base year (spec 06).

Given an inventory frozen at v1, when the accountant reopens it, corrects
Tarkwa from 40% to 50% and freezes again, then v1 is untouched, v2 records the
correction, and a run launched before the reopen still cites v1.

### What a version holds

Per entity in the boundary: the entity id, its **name copied at freeze time**,
relationship type, economic interest, operated flag, the derived accounting
share, the membership window, whether it stood excluded and why, and the
facilities beneath it with their names and locations copied; plus the
approach, the entity and facility counts, who froze it (email copied at the
time) and when. Names are denormalized so the version stays readable after an
entity or facility is renamed or deleted.

### What a run reads

A run computes accounting shares **from the frozen version's entries**, on
each activity's date, never from live treatments, and records the version it
used. The arithmetic and the cited boundary cannot disagree. Entities in the
boundary that emitted nothing are still in the version, which is what a
verifier needs: completeness of the boundary is itself the assertion being
verified.

### Validation (the BOUNDARY gate)

- ERROR: the boundary is empty.
- ERROR: the inventory is a draft. `The inventory is a draft. Freeze it to enable a run.`
- ERROR: an included activity's facility is outside the boundary (not a
  member, a zero-share entity, or outside the membership window), naming why.
- WARNING: an entity's share is 0% under the chosen approach.
- WARNING: a treatment differs from the entity record, e.g.
  `Tema JV's treatment (joint venture, 40%, operated) differs from the entity record (joint venture, 45%, operated). Review the boundary.`
- WARNING: a membership window starts or ends inside the period.

## API

All under `/api/ghg`, session-authenticated, tenant-scoped.

- `GET /inventories/{id}/boundary` → every entity of the organization with
  `inBoundary`, its treatment or nulls, the derived `accountingShare`, the
  `table1Row`, the window, and `facilities[]` with `inBoundary` each.
- `PUT /inventories/{id}/boundary/{facilityId}` and
  `PUT /inventories/{id}/boundary/entities/{entityId}`
  `{relationshipType?, economicInterestPercent?, operatedByCompany?,
  effectiveFrom?, effectiveTo?, clearWindow?}` → upsert with prefill;
  `DELETE` removes the facility (and the entity when it was the last) or the
  entity. All 409 `Operation not allowed` unless the inventory is a draft.
- `POST /inventories/{id}/freeze` → `BoundaryVersionResponse`; 409 when
  frozen or empty. `POST /inventories/{id}/reopen` → `InventoryResponse`; 409
  when a draft, final or published (spec 05.1).
- `GET /inventories/{id}/boundary/versions` → summaries newest first
  `{id, versionNo, consolidationApproach, entityCount, facilityCount,
  frozenByUserId, frozenBy, frozenAt}`; `GET /boundary-versions/{id}` → the
  summary plus `entries[]`, each with `facilities[]`.
- `PUT /inventories/{id}` → 409 when `consolidationApproach`, the period or
  the GWP set changes while frozen.
- `InventoryResponse` carries `status`, `currentBoundaryVersionId`,
  `currentBoundaryVersionNo`; `RunResponse` carries `boundaryVersionId` and
  `boundaryVersionNo` (null for runs older than versioning).

## Data

- `V6`: the original per-facility `ghg_boundary_treatments`.
- `V9__boundary_versioning.sql`: `ghg_boundary_versions` and the original
  per-facility entries; `current_boundary_version_id` and `_no` on
  inventories; `boundary_version_id` and `_no` on runs.
- `V11__legal_entities.sql`: treatments re-keyed by entity with
  `ghg_boundary_facilities` beneath; version entries re-keyed by entity with
  `ghg_boundary_version_facilities` beneath; `entity_count` on versions.
- `V12__inventory_lifecycle.sql`: `effective_from`, `effective_to` on
  treatments and entries; `excluded`, `exclusion_reason` on entries;
  `boundary_status` folds into `ghg_inventories.status`.

## Events

None.

## Verification

`Table1Test`; `GhgApiIntegrationTests`: share derivation per approach for the
Sankofa fixture; prefill from entity facts under all three approaches,
explicit override, partial update, entity-level add and last-facility removal;
draft blocks the run and freezing enables it with the run citing v1; frozen
inventory refuses PUT, DELETE, re-freeze and approach change; reopen and
re-freeze cuts v2 with v1 kept; empty boundary cannot be frozen; a version
keeps the frozen facility name after a rename and is 404 to an outsider;
entity edits raise the drift warning without touching treatment or version;
membership windows; zero-share entities recorded as excluded. Frontend:
`InventoryDetailPage.test.tsx`, `RunDetailPage.test.tsx`. Manual:
`docs/qa/003-inventory.md` sections D, E, G, H, I, J.

## Non-goals and open questions

- Diffing versions; reverting to an earlier version.
- Group structures deeper than one entity layer (spec 03.1 non-goal).
