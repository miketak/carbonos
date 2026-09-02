# 003 — Inventory accounting model (facts vs. views)

- **Status**: Implemented
- **Owner**: Michael Takrama (domain workflow supplied 2026-08-29; this spec condenses it and fixes v1 scope)
- **Created**: 2026-08-29
- **Backend module(s)**: `ghg`
- **Frontend feature(s)**: `src/features/ghg`
- **Supersedes**: the run model of the original GHG spike (runs belonged to organizations and read facts directly)

## Problem / Motivation

The spike conflated organizational facts with accounting decisions: activity
records carried an emission factor (and therefore scope/category), the
consolidation approach lived on the organization, and a calculation run was an
ad-hoc period query. Real GHG accounting separates these: the same facts must
be viewable under multiple accounting contexts (corporate vs. regulatory vs.
equity-share inventories) without ever mutating the source records.

## Domain invariants

1. **Activity records are organizational facts** and exist independently of
   inventories. They carry no scope, category, factor, or boundary treatment.
2. **Inventories are accounting views**: they select, classify,
   include/exclude, and apply accounting treatment to activity records via
   Inventory Activity Assignments — never by mutating the records.
3. **Calculation runs are immutable, reproducible snapshots** of one
   inventory's view and its referenced facts at a point in time.

```
ORGANIZATION ── FACILITIES ── ACTIVITY RECORDS   («the facts»)
      └── INVENTORIES ── boundary treatments,
                          ACTIVITY ASSIGNMENTS   («the view»)
                              └── CALCULATION RUNS ── lines («the computation»)
```

## Behavior

- **Facts**: activities are captured any time with facility, activity type,
  quantity, unit, date, data source, evidence reference, data-quality status
  (measured/estimated/calculated), notes. Valid even with no inventory.
- **Inventories** (per organization, many allowed, overlapping periods
  allowed — no org+year uniqueness): name, reporting period, purpose, base
  year (optional), consolidation approach. A recalculation is a new *run*,
  not a new inventory.
- **Boundary** belongs to the inventory: per facility, an ownership/equity %,
  financial-control and operational-control flags (prefilled from the
  facility's org-level defaults, editable per inventory). The accounting
  share derives from the inventory's approach (equity % / control 0-or-1).
- **Assignments**: "Review activity data" generates one assignment per
  organizational activity — auto-excluded with reason OUTSIDE_PERIOD or
  OUTSIDE_BOUNDARY where detectable, otherwise included and *unclassified*.
  Users classify (choose an emission factor ⇒ scope + category derive from
  it) or exclude with a documented reason (outside period/boundary, non-GHG,
  duplicate, not applicable, methodology, other). Exclusions are retained for
  auditability.
- **Validation gates** (pre-run, recomputed live): Boundary, Completeness,
  Classification, Emission factor. Findings are ERROR (blocks the run),
  WARNING (visible, non-blocking), or INFO. v1 checks: boundary non-empty and
  shares determinable; unreviewed activities; unclassified included
  assignments; factor-unit vs. activity-unit mismatches; missing evidence
  (warning); estimated data (info).
- **Runs**: created for an inventory (label only — the period is the
  inventory's). Creation re-validates; any ERROR ⇒ 409. Lines snapshot
  facility name, activity type, factor name/value, scope, category, quantity,
  unit, accounting share, kgCO₂e. Runs are listed newest-first and one may be
  designated **final** for the inventory.
- **Traceability**: reported CO₂e → run line → assignment → factor → activity
  record → evidence reference.

## API contract (all session-authenticated, under `/api/ghg`)

- Organizations lose `consolidationApproach` (`{name}` only).
- Activities: `POST /organizations/{orgId}/activities`
  `{facilityId, activityType, quantity, unit, activityDate, dataSource?,
  evidenceRef?, dataQuality, note?}`.
- `GET|POST /organizations/{orgId}/inventories`, `GET|PUT|DELETE /inventories/{id}`.
- `GET /inventories/{id}/boundary` (every facility + its treatment or null +
  derived share); `PUT /inventories/{id}/boundary/{facilityId}` upserts a
  treatment; `DELETE` removes it.
- `GET /inventories/{id}/assignments`; `POST /inventories/{id}/assignments/sync`;
  `PUT /assignments/{id}/classify` `{emissionFactorId}`;
  `PUT /assignments/{id}/exclude` `{reason}`; `PUT /assignments/{id}/include`.
- `GET /inventories/{id}/validation` → `{ready, gates:[{gate, status,
  findings:[{severity, message}]}]}`.
- `GET|POST /inventories/{id}/runs` (`{label}`; 409 `Validation failing` when
  blocked); `GET|DELETE /runs/{id}`; `POST /runs/{id}/finalize`.
- Errors are RFC 9457 problem details in the existing style.

## Data

Migration `V6__inventory_accounting.sql`: new `ghg_inventories`,
`ghg_boundary_treatments` (unique inventory+facility),
`ghg_assignments` (unique inventory+activity; nullable scope/category/factor;
exclusion_reason CHECK). `ghg_activities` gains activity_type, unit,
data_source, evidence_ref, data_quality and **drops emission_factor_id**
(existing rows migrate type/unit from their factor). `ghg_organizations`
drops consolidation_approach. `ghg_runs` re-parents to inventory
(**existing spike runs are deleted** — accepted for pre-1.0 data);
`ghg_inventories.final_run_id` references runs.

## Events

`GhgRunCompleted(runId, inventoryId, totalKgCo2e)` (field change: was
organizationId). Still no consumers.

## Amendments (2026-08-29 GHG workflow audit)

- **TRACE-01/02**: an activity referenced by any run line, and a facility with
  recorded activity data, can no longer be deleted (409 `Operation not
  allowed`) — facts referenced by history are the audit trail.
- **CORRECT-01**: facts are corrected in place via `PUT /activities/{id}`
  (same shape as create). Runs snapshot, so history is unaffected; gates
  re-evaluate against the corrected fact. Full versioning remains deferred.
- **RECON-01**: "Review activity data" also re-evaluates earlier
  OUTSIDE_PERIOD / OUTSIDE_BOUNDARY auto-exclusions — re-including records
  whose reason no longer holds (manual exclusions are never touched) — and
  the completeness gate warns about stale auto-exclusions until it runs.
  Sync returns `{created, updated}`.
- **PLAUS-01**: `activityDate` must be past-or-present (422 otherwise).
- **CLASS-01** (UI): the classification picker offers only factors whose unit
  matches the fact (all factors shown only when none match).
- Tenant isolation is spec 004.
- **Spec 007** completes the boundary for v1. Facilities record financial and
  operational control separately, and a treatment prefills from the facility's
  facts (the gate warns when the two later drift). The boundary gains a
  DRAFT/FROZEN lifecycle: a draft is a BOUNDARY-gate ERROR; freezing cuts an
  immutable, numbered `BoundaryVersion`, and a run computes its accounting
  shares from that version rather than from live treatments, then cites it.
  Treatments and the consolidation approach are read-only while frozen (409).

## Conformance with the GHG Protocol Corporate Standard

A review on 2026-09-02 against the Corporate Standard (revised edition, with
the Scope 2 Guidance and the NF3 amendment) recorded what this model can and
cannot yet express. None of these change v1 behaviour; each names the spec that
will close it.

- **Scope is derived from the emission factor.** Under the Standard, scope
  depends on the reporter's relationship to the source: diesel in an owned haul
  fleet is scope 1, the same diesel in a contractor's fleet is scope 3. Spec 009.
- **The share rule cannot express Chapter 3, Table 1 in full.** Joint financial
  control accounts at equity share under the financial-control approach;
  associates contribute nothing under either control approach; fixed-asset
  investments contribute nothing even under equity share. The model needs the
  relationship type, not only three facts. Spec 010.
- **Partial-year ownership** must be accounted from the transaction date and
  the base year recalculated (Chapter 5), not approximated by scaling a share.
  Spec 010.
- **`ActivityCategory` lacks PROCESS_EMISSIONS**, the fourth kind of scope 1
  source. A mine's explosives are the obvious casualty. Spec 009.
- **Exclusions are never snapshotted into a run**, though Chapter 9 requires
  reporting them with justification and Chapter 10 verifiers audit
  completeness. Spec 008.
- **The inventory has no lifecycle of its own.** A run can be final while the
  boundary is reopened and re-frozen (spec 007 open question), and a
  zero-share facility is recorded as a boundary member rather than as outside
  the boundary under that approach. Spec 008.
- **One CO2e figure per scope.** The Standard reports each of seven gases and
  biogenic CO2 separately, and Scope 2 both location-based and market-based;
  the operational boundary (which scope 3 categories are covered) is not
  declared anywhere. Spec 011.
- "Ownership/equity %" conflates legal ownership with economic interest
  (Chapter 3: economic substance overrides legal form), and leased assets have
  no treatment even though their scope depends on the approach. Specs 010
  and 009.

## Non-goals (v1)

Activity-record versioning (edits are in-place for now); conversion,
methodology, GWP-set, and duplicate-detection gates; multi-gas breakdowns;
currency and base-year recalculation; evidence file upload (string reference
only); assignment-level accounting-share overrides; effective-dated boundary
treatments. Each is a deliberate later step on this foundation.

## Open questions

None blocking.
