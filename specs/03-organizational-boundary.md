# 03: Organizational boundary

- **Status**: Implemented
- **Protocol**: Chapter 3 (setting organizational boundaries)
- **Owner**: Michael Takrama
- **Created**: 2026-08-29 (treatments), 2026-09-02 (facts, prefill, freeze,
  versioning); merged 2026-09-02
- **Modules**: `ghg`, `src/features/ghg` (inventory detail: boundary section,
  version history; run report: boundary version card)

## Problem

Chapter 3 asks a company to choose one **consolidation approach** and apply it
consistently to determine which operations' emissions it accounts for, and at
what share. It also expects that choice to be a deliberate, documented
declaration that a verifier can examine. The boundary is the single most
consequential judgement in an inventory, and this spec makes it explicit,
prefilled from facts, frozen before use, and versioned.

## Behaviour

### Consolidation approaches

An inventory (spec 05) carries exactly one approach, applied to every facility
in its boundary:

- **Equity share.** The company accounts for emissions according to its share
  of equity in the operation. The Standard defines equity share as *economic
  interest*, which normally equals ownership percentage; where it does not,
  economic substance overrides legal form (today the model holds one
  percentage; spec 03.1 separates the two).
- **Financial control.** 100% of emissions from operations over which the
  company has financial control, none from others.
- **Operational control.** 100% from operations over which the company has
  operational control, none from others.

A company that must report under more than one approach, for different
stakeholders, creates one inventory per approach over the same facts and
period. Overlapping periods are allowed by design.

### Boundary treatments

Each inventory holds its own **treatment** per facility: ownership percent,
financial control, operational control. Presence of a treatment is membership
of the boundary. The **accounting share** is derived, never stored on the
treatment:

```
EQUITY_SHARE        -> ownershipPercent / 100
FINANCIAL_CONTROL   -> financialControl   ? 1 : 0
OPERATIONAL_CONTROL -> operationalControl ? 1 : 0
```

This rule is exact for wholly owned operations and subsidiaries, and for
operated joint ventures under operational control. It cannot yet express the
Table 1 rows for jointly financially controlled ventures, associates and
fixed-asset investments; spec 03.1.

### Prefill from facts

When a facility is added to a draft boundary with no explicit values, its
treatment starts as a copy of the facility's facts (spec 02). The rule is
server-side, so it holds for every client: a `PUT` with `{}` prefills all
three fields; any field the client sends wins; on a treatment that already
exists an absent field keeps its current value. Treatments stay overridable
per inventory and overrides never write back to the facility.

Given "Tema JV" with equity 40%, financial control no, operational control
yes: added to an equity-share inventory it starts at 40% (share 0.40); to an
operational-control inventory with share 1; to a financial-control inventory
with share 0. No manual entry in any case.

### Drift between facts and treatment

Editing a facility never rewrites an existing treatment or a frozen version.
Instead the BOUNDARY gate warns when a treatment's three facts differ from the
facility's current facts, naming both sides. While the boundary is frozen the
warning is informational; the remedy is reopen, reconcile, re-freeze, which
cuts a new version.

### States: draft and frozen

- **DRAFT.** Treatments are editable; this is the only time a facility can be
  added. The BOUNDARY gate raises an ERROR, so a run is blocked.
- **FROZEN.** Treatments are read-only; any write is refused with 409. The
  consolidation approach may not change either, because the stored shares
  derive from it. The run is unblocked as far as the boundary is concerned.

**Freeze** is refused when the boundary is empty or already frozen; otherwise
it cuts version N+1 and flips the state. **Reopen as draft** restores editing
and never deletes or alters a version. Every freeze cuts a new version, even an
unchanged one: a version is a record of a deliberate act, one row per act.

Given an inventory frozen at v1, when the accountant reopens it, corrects
Tarkwa from 100% to 40% and freezes again, then v1 is untouched, v2 records the
correction, and a run launched before the reopen still cites v1.

### What a version holds

Per facility in the boundary: the facility id, its **name and location copied
at freeze time**, ownership percent, financial control, operational control,
and the derived accounting share; plus the approach, who froze it (email
copied at the time) and when. Names are denormalized so the version stays
readable after a facility is renamed or deleted.

### What a run reads

A run computes accounting shares **from the frozen version's entries**, never
from live treatments, and records the version it used. The arithmetic and the
cited boundary cannot disagree. Facilities in the boundary that emitted nothing
are still in the version, which is what a verifier needs: completeness of the
boundary is itself the assertion being verified.

### Validation (the BOUNDARY gate)

- ERROR: the boundary is empty.
- ERROR: the boundary is a draft. `The organizational boundary is a draft. Freeze it to enable a run.`
- ERROR: an included activity's facility is outside the boundary.
- WARNING: a facility's share is 0% under the chosen approach. (Under the
  Standard such a facility is outside the boundary under that approach; spec
  05.1 will represent it as such.)
- WARNING: a treatment differs from the facility record, e.g.
  `Tema JV's treatment (40%, financial no, operational yes) differs from the facility record (45%, financial no, operational yes). Review the boundary.`

## API

All under `/api/ghg`, session-authenticated, tenant-scoped.

- `GET /inventories/{id}/boundary` → every facility of the organization with
  `inBoundary`, its treatment or nulls, and the derived `accountingShare`.
- `PUT /inventories/{id}/boundary/{facilityId}` `{ownershipPercent?,
  financialControl?, operationalControl?}` → upsert with prefill;
  `DELETE` removes. Both 409 `Operation not allowed` while frozen.
- `POST /inventories/{id}/boundary/freeze` → `BoundaryVersionResponse`; 409
  when frozen or empty. `POST .../reopen` → `InventoryResponse`; 409 when a draft.
- `GET /inventories/{id}/boundary/versions` → summaries newest first
  `{id, versionNo, consolidationApproach, facilityCount, frozenByUserId,
  frozenBy, frozenAt}`; `GET /boundary-versions/{id}` → the summary plus
  `entries[]`.
- `PUT /inventories/{id}` → 409 when `consolidationApproach` changes while
  frozen.
- `InventoryResponse` carries `boundaryStatus`, `currentBoundaryVersionId`,
  `currentBoundaryVersionNo`; `RunResponse` carries `boundaryVersionId` and
  `boundaryVersionNo` (null for runs older than versioning).

## Data

- `V6`: `ghg_boundary_treatments` (unique inventory + facility; ownership
  percent, two control flags).
- `V9__boundary_versioning.sql`: `ghg_boundary_versions` (inventory, version_no
  unique per inventory, approach, facility_count, frozen_by_user_id, frozen_by,
  frozen_at) and `ghg_boundary_version_entries` (facility id as a loose
  reference, name, location, the three facts, accounting_share);
  `ghg_inventories.boundary_status`, `current_boundary_version_id`,
  `current_boundary_version_no`; `ghg_runs.boundary_version_id`,
  `boundary_version_no`. Backfill: inventories that had already run became
  FROZEN with a reconstructed v1 and no freezer; their historical runs keep a
  null version, because citing a reconstruction would assert something unknown.
- `V10`: facility facts (spec 02); a treatment corrected by hand before the
  split will show the drift warning afterwards, which is the intended signal.

## Events

None.

## Verification

`GhgApiIntegrationTests`: share derivation per approach; prefill from facts
under all three approaches, explicit override, partial update; draft blocks the
run and freezing enables it with the run citing v1; frozen boundary refuses
PUT, DELETE, re-freeze and approach change; reopen and re-freeze cuts v2 with
v1 kept; empty boundary cannot be frozen; a version keeps the frozen facility
name after a rename and is 404 to an outsider; facility edits raise the drift
warning without touching treatment or version. Frontend: the status chip and
draft finding, confirm-then-freeze, read-only frozen state with reopen, version
history and expansion, the run report's boundary card, tick-in sending an
empty treatment. Manual: `docs/qa/003-inventory.md` sections D, E, G, H, I, J.

## Non-goals and open questions

- Table 1 in full, legal entities, economic interest: spec 03.1.
- Effective-dated membership for mid-period acquisitions and divestments: spec
  03.2. A per-inventory percentage override is *not* a correct substitute.
- Diffing versions; reverting to an earlier version.
- The interaction of a frozen boundary with a final run (a final run's
  boundary can diverge from the inventory's current one) and freezing the
  activity view alongside: spec 05.1.
