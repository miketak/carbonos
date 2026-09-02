# 006: Facility control facts and boundary prefill

- **Status**: Approved
- **Owner**: Michael Takrama
- **Created**: 2026-08-31 (reconciled with spec 007 on 2026-09-02)
- **Backend module(s)**: `ghg`
- **Frontend feature(s)**: `src/features/ghg`
- **Relates to**: [spec 003](003-inventory-accounting-model.md), which this
  refines on the facility "facts" side (the consolidation approach stays on the
  inventory), and [spec 007](007-boundary-freeze-and-versioning.md), whose
  frozen versions snapshot the treatments this spec prefills.

## Problem / Motivation

Under the GHG Protocol Corporate Standard (Chapter 3), a company's
**consolidation approach** (equity share, financial control, or operational
control) is chosen once per inventory and applied consistently. Our model
already does this. What the facility should contribute are the
**approach-independent facts** of the corporate structure: percent equity
ownership, financial control, operational control.

Today this is half done, in two ways.

1. **The facility conflates the two controls.** It stores `equitySharePercent`
   and a single `controlled` boolean. Financial and operational control differ
   in exactly the interesting cases (operating a joint venture you do not
   financially control), so one boolean cannot express the facts the boundary
   needs.
2. **Boundary treatments do not inherit the facts.** Ticking a facility into an
   inventory's boundary enters it at 100% with both controls on, whatever the
   facility record says. The same fact is entered twice, can drift between the
   facility and each inventory, and an accountant who trusts the defaults
   silently over-consolidates partially owned facilities. The QA procedure for
   spec 003 carries this as a known gap.

## Behaviour

1. **A facility records three ownership and control facts**: equity share
   percent (0 to 100), financial control (yes/no), operational control
   (yes/no). The create and edit form asks for all three; the facilities list
   shows them.
2. **Boundary treatments prefill from the facility's facts, server-side.**
   When a facility is added to a boundary with no explicit values, its
   treatment starts as a copy of the facility's current facts. Any field the
   client does send wins. The rule lives in the backend so it holds for every
   client, not only the SPA.
3. **Prefill is a draft-time act.** A frozen boundary refuses treatment writes
   (spec 007), so adding a facility, and therefore prefilling, only happens
   while the boundary is a draft.
4. **Treatments stay overridable per inventory.** After prefill a treatment is
   editable exactly as before. Overrides never write back to the facility.
5. **Later facility edits never rewrite existing treatments or versions.** A
   treatment is the inventory's recorded decision, and a frozen version
   snapshots the treatment's facts at freeze time (spec 007). If a facility's
   facts change afterwards, the BOUNDARY gate gains a WARNING that the
   treatment differs from the facility record. While the boundary is frozen
   the warning is informational: the remedy is to reopen, reconcile, and
   re-freeze, which cuts a new version. History is untouched either way.
6. **The consolidation approach is untouched**: chosen per inventory, applied
   to all facilities, snapshotted by runs. Nothing moves to the facility.

Given a facility "Tema JV" with equity 40%, financial control no, operational
control yes: when it is added to an equity-share inventory's boundary with no
values, its treatment starts at 40% (accounting share 0.40) without manual
entry; in an operational-control inventory it starts with share 1; in a
financial-control inventory it starts with share 0.

## API contract

- `POST /api/ghg/organizations/{orgId}/facilities` and
  `PUT /api/ghg/facilities/{id}`: the request gains `financialControl` and
  `operationalControl` booleans (both required) and drops `controlled`.
  `equitySharePercent` is unchanged. The response mirrors it. A breaking DTO
  change is acceptable pre-1.0; the SPA is the only client.
- `PUT /api/ghg/inventories/{id}/boundary/{facilityId}`: every field of the
  body becomes optional. When the treatment is being **created**, an absent
  field is filled from the facility's facts, so `{}` prefills all three. When
  the treatment **already exists**, an absent field keeps its current value.
  Still 409 `Operation not allowed` while the boundary is frozen (spec 007).
- `GET /api/ghg/inventories/{id}/validation`: the BOUNDARY gate adds a
  WARNING per treatment whose three facts differ from the facility's current
  facts, for example
  `Tema JV's treatment (40%, financial no, operational yes) differs from the facility record (45%, financial no, operational yes). Review the boundary.`
- `GET .../facilities`: the response carries both booleans.

## Data

Migration `V10__facility_control_facts.sql` (spec 007 took V9):

- `ALTER TABLE ghg_facilities ADD COLUMN financial_control boolean,
  ADD COLUMN operational_control boolean;`
- Backfill both from the existing `controlled` column, then `SET NOT NULL`,
  then `DROP COLUMN controlled`.
- No change to `ghg_boundary_treatments`, `ghg_boundary_versions`, or the run
  tables.

A backfilled facility that was "controlled" becomes financial yes, operational
yes. Where a treatment was previously corrected by hand to "financial no,
operational yes", the drift warning will surface that difference after the
migration; that is the intended signal, and reconciling it is the accountant's
call.

## Events

None. Everything stays inside the `ghg` module.

## Non-goals

- Moving or duplicating the consolidation approach onto facilities or runs.
  The Standard requires one approach per inventory, applied consistently.
- Auto-syncing facility fact changes into existing treatments. The warning
  surfaces the drift; the accountant decides.
- **Effective-dated ownership.** A per-inventory percentage override is *not*
  a correct way to account for a facility acquired or divested mid-period:
  Chapter 5 of the Standard accounts for it from the transaction date and
  recalculates the base year. That needs date-bounded boundary membership,
  which is spec 010.
- A per-approach "what this facility would contribute" preview on the
  facilities list. Nice to have; no schema impact; can land later.

## Verification

- `GhgApiIntegrationTests`: an empty-body PUT prefills the Tema JV treatment
  and derives 0.40, 1, and 0 under the three approaches; an explicit value
  overrides and a later partial update keeps the rest; editing the facility
  after a freeze leaves the treatment and the version at their frozen values
  and raises the drift warning with the exact message above.
- Frontend: the facility form submits both flags; the facilities list shows
  both columns; ticking a facility into a boundary sends an empty treatment.

## Open questions

None blocking.
