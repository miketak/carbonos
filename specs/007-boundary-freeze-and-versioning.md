# 007: Boundary freeze and versioning

- **Status**: Implemented
- **Owner**: Michael Takrama
- **Created**: 2026-09-02
- **Backend module(s)**: `ghg`
- **Frontend feature(s)**: `src/features/ghg`
- **Relates to**: [spec 003, the inventory accounting model](003-inventory-accounting-model.md)
  (adds a lifecycle to the boundary half of the "view", and changes what a run
  reads to compute accounting shares)

## Problem / Motivation

An inventory's organizational boundary is editable at any moment, including
after a run has produced a reported number. Two things follow.

First, **nothing forces a deliberate sign-off.** An accountant can tick a
facility in, launch a run, and publish the total without ever having declared
"this is the boundary". The boundary is the single most consequential judgement
in a GHG inventory, and today it is implicit.

Second, **a verifier cannot reconstruct the boundary that produced a number.**
Reproducibility is only partly covered: `ghg_run_lines` denormalizes each line's
accounting share as `weight`, so any individual line can be re-derived. But a
run only has lines for facilities with *included activity*. A facility that sits
inside the boundary with no activity records, or whose records were all
excluded, leaves no trace in the run whatsoever. Under the GHG Protocol the
completeness of the boundary is itself the assertion being verified, so
"which sites were in scope, and at what share" must be answerable independently
of which of them happened to emit.

This spec gives the boundary a two-state lifecycle and cuts an immutable,
numbered version each time it is frozen.

## Behaviour

### States

A boundary is `DRAFT` or `FROZEN`. New inventories start `DRAFT`.

- **DRAFT**: treatments are freely editable. The BOUNDARY validation gate
  raises an ERROR, so a calculation run is blocked.
- **FROZEN**: treatments are read-only. Attempts to add, change, or remove one
  are refused with 409. The run is unblocked as far as the boundary is
  concerned; the other three gates still apply.

### Transitions

- **Freeze.** Refused if the boundary is empty (a frozen empty boundary is
  meaningless) or if it is already frozen. Otherwise the system cuts version
  N+1, recording the consolidation approach, every treatment, each treatment's
  derived accounting share, who froze it and when. The state becomes `FROZEN`.
- **Reopen as draft.** Returns the boundary to `DRAFT` so it can be edited.
  Existing versions are never deleted or altered; the inventory keeps a pointer
  to the most recent one. Reopening does not invalidate runs already calculated.

**Every freeze cuts a new version**, even when nothing changed since the last
one. A version is a record of a deliberate act, not a diff, and one row per
freeze keeps the history unambiguous.

Given an inventory frozen at v1, when the accountant reopens it, corrects Tarkwa
from 100% to 40%, and freezes again, then v1 remains exactly as it was and v2
records the corrected boundary. A run launched before the reopen still cites v1.

### What a version holds

Per facility in the boundary: the facility id, its **name and location copied at
freeze time**, ownership percent, financial control, operational control, and
the accounting share derived from the inventory's approach. Those three facts
are whatever the treatment held when frozen, typically prefilled from the
facility record (spec 006) and possibly overridden for this inventory. Names are
denormalized for the same reason run lines denormalize them: a facility with no
activity records can still be deleted, and the version must stay readable.

### Runs

A run records the boundary version it used. `executeRun` computes accounting
shares **from that version's entries** rather than from the live treatments, so
the arithmetic and the cited boundary can never disagree.

Traceability becomes: reported CO₂e → run → boundary version → the full set of
in-scope facilities and their shares, alongside the existing chain of
run line → assignment → factor → activity record → evidence reference.

### The consolidation approach

An inventory's consolidation approach may not be changed while the boundary is
frozen (409). The stored shares are derived from it, so allowing it to move
would leave the version internally inconsistent. Name, period, purpose and base
year remain editable.

### Validation

The existing BOUNDARY gate gains one ERROR finding while the state is `DRAFT`:

> The organizational boundary is a draft. Freeze it to enable a run.

No new gate is introduced. Findings for an empty boundary, zero accounting
shares, and activity outside the boundary are unchanged.

## API contract

All under `/api/ghg`, session-authenticated, tenant-scoped as spec 004.

- `POST /inventories/{id}/boundary/freeze` → 200 `BoundaryVersionResponse`.
  409 `Operation not allowed` when already frozen or when the boundary is empty.
- `POST /inventories/{id}/boundary/reopen` → 200 `InventoryResponse`.
  409 when already a draft.
- `GET /inventories/{id}/boundary/versions` → `BoundaryVersionSummaryResponse[]`,
  newest first: `{id, versionNo, consolidationApproach, facilityCount,
  frozenByUserId, frozenBy, frozenAt}`. `frozenBy` is the freezer's email
  copied at freeze time, as facility names are, so the record does not depend
  on the user still existing; it is null for versions the migration
  reconstructed.
- `GET /boundary-versions/{versionId}` → `BoundaryVersionResponse`: the summary
  plus `entries[]` of `{facilityId, facilityName, location, ownershipPercent,
  financialControl, operationalControl, accountingShare}`.
- `PUT|DELETE /inventories/{id}/boundary/{facilityId}`: unchanged shape, but
  refused with 409 `Operation not allowed` while frozen.
- `PUT /inventories/{id}`: refused with 409 when `consolidationApproach`
  differs from the stored one and the boundary is frozen.
- `InventoryResponse` gains `boundaryStatus`, `currentBoundaryVersionId`,
  `currentBoundaryVersionNo`.
- `RunResponse` gains `boundaryVersionId` and `boundaryVersionNo`, both null for
  runs calculated before this feature shipped.

Errors stay RFC 9457 problem details in the existing style.

## Data

Migration `V9__boundary_versioning.sql`.

- **`ghg_boundary_versions`**: `id`, `inventory_id` (FK, cascade), `version_no`
  int, `consolidation_approach` varchar+CHECK, `facility_count` int,
  `frozen_by_user_id` uuid (loose ref, as `ghg_organizations.owner_user_id`),
  `frozen_at` timestamptz. `UNIQUE (inventory_id, version_no)`.
- **`ghg_boundary_version_entries`**: `id`, `boundary_version_id` (FK, cascade),
  `facility_id` uuid (loose ref, no FK), `facility_name`, `location`,
  `ownership_percent` numeric(5,2), `financial_control`, `operational_control`,
  `accounting_share` numeric(7,4).
- **`ghg_inventories`** gains `boundary_status` varchar(20) NOT NULL DEFAULT
  `'DRAFT'` with a CHECK, plus `current_boundary_version_id` (FK, SET NULL) and
  `current_boundary_version_no`. The number is copied beside the id, as
  `final_run_id` is a plain column, so responses never need a second lookup.
- **`ghg_runs`** gains `boundary_version_id` (FK, nullable) and
  `boundary_version_no`.

**Backfill.** Inventories that already have at least one run become `FROZEN`
with a v1 reconstructed from their current treatments. Inventories with no run
stay `DRAFT`. Existing runs keep a **null** boundary version: the boundary may
have changed since they were calculated, so pointing them at the reconstructed
v1 would assert something we cannot know to be true. The UI states plainly that
pre-007 runs cite no boundary version.

## Events

None. Everything stays inside the `ghg` module. `GhgRunCompleted` is unchanged.

## Non-goals

- **Freezing the activity view.** Assignments (inclusion, exclusion, and
  classification) remain editable while the boundary is frozen. Run lines
  already snapshot per-line classification, so the arithmetic is reproducible;
  the same "excluded records leave no trace" gap exists there and is the natural
  follow-up to this spec, but it is a separate decision.
- **Diffing two versions.** The history lists versions and shows each in full;
  a side-by-side comparison is a later addition and needs no schema change.
- **Effective-dated treatments.** A version is cut when a human freezes it, not
  on a business-time axis. Note that a per-inventory percentage override is
  *not* a correct substitute for mid-period acquisitions or divestments:
  Chapter 5 of the Standard accounts from the transaction date and recalculates
  the base year. Date-bounded membership is spec 010.
- **Reverting to an earlier version.** Reopening gives a draft seeded from the
  current treatments, not from an arbitrary past version.
- **Approval workflow.** Anyone who can edit the inventory can freeze and
  reopen it. Segregation of duties between preparer and approver is a
  multi-member-organization concern, which spec 004 lists as a non-goal.

## Verification

- `GhgApiIntegrationTests`: a draft boundary blocks the run with the BOUNDARY
  finding and freezing enables it, with the run citing v1; a frozen boundary
  refuses PUT, DELETE, re-freeze and an approach change with 409, and reopening
  then re-freezing cuts v2 while v1 is kept; freezing an empty boundary is
  refused; a version keeps the facility name it was frozen with after a rename
  and is invisible to an outsider (404). Every pre-existing run test gained a
  freeze step.
- Frontend `InventoryDetailPage.test.tsx`: the draft chip and finding, the
  confirm-then-freeze flow, the frozen read-only state with reopen, the version
  history and its expansion. `RunDetailPage.test.tsx`: a run cites its version
  including a facility that emitted nothing, and a pre-007 run says so.

## Open questions

- **Freeze and final runs do not interact.** A run can be designated final,
  then the boundary reopened, changed and re-frozen. The final run still cites
  the version it used, so traceability holds, but the inventory's current
  boundary now differs from its final report's. The Standard frames the
  boundary as a declaration for a reporting period, which suggests the
  lifecycle ultimately belongs on the inventory (draft, final, published) with
  the boundary freeze as one of its gates. Deferred to spec 008.
