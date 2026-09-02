# 007: Organizational boundary: control facts, prefill, freeze and versioning

- **Status**: Implemented
- **Owner**: Michael Takrama
- **Created**: 2026-09-02 (absorbs the former draft 006, "Facility control facts
  and boundary prefill", 2026-08-31, before either shipped)
- **Backend module(s)**: `ghg`
- **Frontend feature(s)**: `src/features/ghg`
- **Relates to**: [spec 003](003-inventory-accounting-model.md), whose boundary
  half this spec completes for v1. Its successor is
  [spec 010](010-organizational-boundary-model.md).

## Problem / Motivation

Spec 003 models an inventory's organizational boundary as a set of per-facility
treatments. Measured against the GHG Protocol Corporate Standard, three things
were missing.

**The facility could not state its facts.** Chapter 3 needs three
approach-independent facts per operation: equity share, financial control,
operational control. The facility stored one `controlled` flag, so "we operate
this joint venture but do not financially control it", the case that
distinguishes the approaches, could not be recorded. And ticking a facility
into a boundary ignored the facility anyway, entering it at 100% with both
controls on, so partially owned sites were silently over-consolidated unless
someone corrected them by hand.

**Nothing forced a deliberate sign-off.** The boundary was editable at any
moment, including after a run had produced a reported number. An accountant
could tick a facility in, launch a run, and publish the total without ever
declaring "this is the boundary".

**A verifier could not reconstruct the boundary behind a number.** Run lines
snapshot each line's accounting share, so any line can be re-derived, but a run
only has lines for facilities with included activity. A facility in the
boundary with no activity, or whose records were all excluded, left no trace.
Under the Standard the completeness of the boundary is itself the assertion
being verified, so "which sites were in scope, and at what share" must be
answerable independently of which of them happened to emit.

## Behaviour

### Facility facts

A facility records **equity share percent** (0 to 100), **financial control**
and **operational control**. The create and edit form asks for all three; the
facilities list shows them. These are facts about the corporate structure, not
accounting decisions; the consolidation approach stays on the inventory.

### Prefill

When a facility is added to a boundary with no explicit values, its treatment
starts as a copy of the facility's current facts. The rule is server-side, so
it holds for every client: a `PUT` with `{}` prefills all three fields, and any
field the client does send wins. When a treatment already exists, an absent
field keeps its current value. Treatments stay overridable per inventory, and
overrides never write back to the facility.

Given "Tema JV" with equity 40%, financial control no, operational control
yes: added to an equity-share inventory it starts at 40% (share 0.40); in an
operational-control inventory it starts with share 1; in a financial-control
inventory with share 0. No manual entry in any case.

### States

A boundary is `DRAFT` or `FROZEN`. New inventories start `DRAFT`.

- **DRAFT**: treatments are freely editable, which is the only time a facility
  can be added (and therefore prefilled). The BOUNDARY validation gate raises
  an ERROR, so a calculation run is blocked.
- **FROZEN**: treatments are read-only. Attempts to add, change, or remove one
  are refused with 409. The run is unblocked as far as the boundary is
  concerned; the other three gates still apply.

### Transitions

- **Freeze.** Refused if the boundary is empty or already frozen. Otherwise the
  system cuts version N+1, recording the consolidation approach, every
  treatment, each treatment's derived accounting share, who froze it and when.
  The state becomes `FROZEN`.
- **Reopen as draft.** Returns the boundary to `DRAFT`. Existing versions are
  never deleted or altered; the inventory keeps a pointer to the most recent
  one. Reopening does not invalidate runs already calculated.

**Every freeze cuts a new version**, even when nothing changed. A version is a
record of a deliberate act, not a diff, and one row per freeze keeps the
history unambiguous. Given an inventory frozen at v1, when the accountant
reopens it, corrects Tarkwa from 100% to 40%, and freezes again, v1 remains
exactly as it was, v2 records the corrected boundary, and a run launched before
the reopen still cites v1.

### What a version holds

Per facility in the boundary: the facility id, its **name and location copied
at freeze time**, ownership percent, financial control, operational control,
and the accounting share derived from the inventory's approach. The three facts
are whatever the treatment held when frozen, typically prefilled and possibly
overridden. Names are denormalized for the same reason run lines denormalize
them: a facility with no activity records can still be deleted, and the version
must stay readable.

### Runs

A run records the boundary version it used and computes accounting shares
**from that version's entries**, never from live treatments, so the arithmetic
and the cited boundary cannot disagree. Traceability becomes: reported CO₂e →
run → boundary version → the full set of in-scope facilities and their shares,
alongside the existing chain of run line → assignment → factor → activity
record → evidence reference.

### Facility edits and drift

Editing a facility's facts never rewrites an existing treatment or a frozen
version. Instead the BOUNDARY gate gains a WARNING when a treatment's three
facts differ from the facility's current facts. While the boundary is frozen
the warning is informational: the remedy is to reopen, reconcile, and
re-freeze, which cuts a new version. History is untouched either way.

### The consolidation approach

An inventory's consolidation approach may not change while the boundary is
frozen (409). The stored shares derive from it, so allowing it to move would
leave the version internally inconsistent. Name, period, purpose and base year
remain editable.

### Validation

The existing BOUNDARY gate gains two findings; no new gate is introduced.

- ERROR while `DRAFT`:
  `The organizational boundary is a draft. Freeze it to enable a run.`
- WARNING per drifted treatment, for example:
  `Tema JV's treatment (40%, financial no, operational yes) differs from the facility record (45%, financial no, operational yes). Review the boundary.`

Findings for an empty boundary, zero accounting shares, and activity outside
the boundary are unchanged.

## API contract

All under `/api/ghg`, session-authenticated, tenant-scoped as spec 004.

- `POST /organizations/{orgId}/facilities`, `PUT /facilities/{id}`: request and
  response carry `financialControl` and `operationalControl` (both required)
  and no longer carry `controlled`.
- `PUT /inventories/{id}/boundary/{facilityId}`: every body field optional;
  see Prefill. `DELETE` unchanged. Both 409 `Operation not allowed` while
  frozen.
- `POST /inventories/{id}/boundary/freeze` → 200 `BoundaryVersionResponse`;
  409 when already frozen or empty.
- `POST /inventories/{id}/boundary/reopen` → 200 `InventoryResponse`; 409 when
  already a draft.
- `GET /inventories/{id}/boundary/versions` → summaries newest first:
  `{id, versionNo, consolidationApproach, facilityCount, frozenByUserId,
  frozenBy, frozenAt}`. `frozenBy` is the freezer's email copied at freeze
  time; null for versions the migration reconstructed.
- `GET /boundary-versions/{versionId}` → the summary plus `entries[]` of
  `{facilityId, facilityName, location, ownershipPercent, financialControl,
  operationalControl, accountingShare}`.
- `PUT /inventories/{id}`: 409 when `consolidationApproach` changes while
  frozen.
- `InventoryResponse` gains `boundaryStatus`, `currentBoundaryVersionId`,
  `currentBoundaryVersionNo`; `RunResponse` gains `boundaryVersionId` and
  `boundaryVersionNo`, both null for runs older than this spec.

Errors stay RFC 9457 problem details in the existing style.

## Data

Two migrations.

**`V9__boundary_versioning.sql`**

- `ghg_boundary_versions`: `id`, `inventory_id` (FK, cascade), `version_no`,
  `consolidation_approach`, `facility_count`, `frozen_by_user_id` (loose ref),
  `frozen_by`, `frozen_at`. `UNIQUE (inventory_id, version_no)`.
- `ghg_boundary_version_entries`: `id`, `boundary_version_id` (FK, cascade),
  `facility_id` (loose ref), `facility_name`, `location`, `ownership_percent`,
  `financial_control`, `operational_control`, `accounting_share`.
- `ghg_inventories` gains `boundary_status` (DEFAULT `'DRAFT'`, CHECK),
  `current_boundary_version_id` (FK, SET NULL) and
  `current_boundary_version_no`, the number copied beside the id as
  `final_run_id` is a plain column.
- `ghg_runs` gains `boundary_version_id` (FK, nullable) and
  `boundary_version_no`.
- Backfill: inventories with at least one run become `FROZEN` with a v1
  reconstructed from their current treatments and no freezer recorded;
  inventories with no run stay `DRAFT`; existing runs keep a **null** version,
  because the boundary may have changed since they were calculated and citing
  v1 would assert something we cannot know to be true.

**`V10__facility_control_facts.sql`**

- `ghg_facilities` gains `financial_control` and `operational_control`, both
  backfilled from `controlled`, then `SET NOT NULL`; `controlled` is dropped.
- A facility that was "controlled" becomes financial yes, operational yes.
  Where a treatment had been corrected by hand to "financial no, operational
  yes", the drift warning surfaces the difference after the migration; that is
  the intended signal, and reconciling it is the accountant's call.

## Events

None. Everything stays inside the `ghg` module; `GhgRunCompleted` is
unchanged.

## Non-goals

- **Freezing the activity view.** Assignments remain editable while the
  boundary is frozen. Run lines already snapshot per-line classification, but
  excluded records leave no trace; spec 008.
- **Auto-syncing facility fact changes into treatments.** The warning surfaces
  the drift; the accountant decides.
- **Effective-dated treatments.** A version is cut when a human freezes it,
  not on a business-time axis. A per-inventory percentage override is *not* a
  correct substitute for a mid-period acquisition or divestment: Chapter 5 of
  the Standard accounts from the transaction date and recalculates the base
  year. Date-bounded membership is spec 010.
- **Diffing two versions**, and **reverting to an earlier version**. Reopening
  gives a draft seeded from the current treatments.
- **Moving the consolidation approach** onto facilities or runs. The Standard
  requires one approach per inventory, applied consistently.
- **Approval workflow.** Anyone who can edit the inventory can freeze and
  reopen it; segregation of duties needs multi-member organizations, a spec
  004 non-goal.

## Verification

- `GhgApiIntegrationTests`: a draft boundary blocks the run with the BOUNDARY
  finding and freezing enables it, the run citing v1; a frozen boundary refuses
  PUT, DELETE, re-freeze and an approach change with 409, and reopen then
  re-freeze cuts v2 with v1 kept; freezing an empty boundary is refused; a
  version keeps the facility name it was frozen with after a rename and is
  invisible to an outsider; an empty-body PUT prefills the Tema JV treatment
  and derives 0.40, 1 and 0 under the three approaches; an explicit value
  overrides and a partial update keeps the rest; editing the facility after a
  freeze leaves the treatment and the version at their frozen values and
  raises the drift warning with the exact message above.
- Frontend: the draft chip and finding, confirm-then-freeze, the frozen
  read-only state with reopen, the version history and its expansion, the run
  report citing its version including a facility that emitted nothing, a
  pre-versioning run saying so, the facility form submitting both flags, the
  facilities list showing both columns, and tick-in sending an empty
  treatment.

## Open questions

- **Freeze and final runs do not interact.** A run can be designated final,
  then the boundary reopened, changed and re-frozen. The final run still cites
  the version it used, so traceability holds, but the inventory's current
  boundary now differs from its final report's. The Standard frames the
  boundary as a declaration for a reporting period, which suggests the
  lifecycle ultimately belongs on the inventory. Deferred to spec 008.
