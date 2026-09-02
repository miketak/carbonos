# 006 — Facility control facts & boundary prefill

- **Status**: Draft
- **Owner**: Michael Takrama
- **Created**: 2026-08-31
- **Backend module(s)**: `ghg`
- **Frontend feature(s)**: `src/features/ghg`
- **Relates to**: [003 — Inventory accounting model](003-inventory-accounting-model.md)
  (refines the facility "facts" side; the consolidation approach stays on the inventory)

## Problem / Motivation

Per the GHG Protocol Corporate Standard (Ch. 3), a company's **consolidation
approach** (equity share / financial control / operational control) is chosen
once per inventory and applied consistently — our model already does this
correctly. What the facility should contribute are the **approach-independent
facts** of the corporate structure: percent equity ownership, financial
control, operational control.

Today this is half-done, in two ways:

1. **Facility conflates the two controls.** It stores `equitySharePercent` and
   a single `controlled` boolean. Financial and operational control differ in
   exactly the interesting cases (e.g. operating a JV you don't financially
   control), so one boolean can't express the facts the boundary needs.
2. **Boundary treatments don't inherit the facts.** Toggling a facility into an
   inventory's boundary defaults its treatment to `100% / financial ✓ /
   operational ✓` regardless of what the facility says. The same fact is
   entered twice, can drift between the facility and each inventory, and an
   accountant who trusts the defaults silently over-consolidates partially
   owned facilities.

## Behavior

1. **Facility records three ownership/control facts**: equity share percent
   (0–100), financial control (yes/no), operational control (yes/no). The
   create/edit facility form asks for all three; the facilities list shows them.
2. **Boundary treatments prefill from the facility's facts.** When a facility
   is added to an inventory's boundary, its treatment starts as a copy of the
   facility's current facts — not `100 / true / true`.
3. **Treatments stay overridable per inventory.** After prefill, the treatment
   is editable exactly as today (a legitimate need for e.g. partial-year
   ownership in one reporting period). Overrides never write back to the
   facility.
4. **Later facility edits do not rewrite existing treatments.** A treatment is
   the inventory's recorded decision; runs snapshot it (invariant 3 of spec
   003). If a facility's facts change, existing inventories keep their
   treatments; the validation report gains a WARNING when a treatment differs
   from the facility's current facts, so the accountant reviews deliberately
   rather than being silently updated.
5. **Consolidation approach is untouched**: chosen per inventory, applied to
   all facilities, snapshotted by runs. Nothing moves to the facility or the
   run stage.

Given/when/then for the key change:

- Given a facility "Tema JV" with equity 40%, financial control ✗,
  operational control ✓ — when it is added to an equity-share inventory's
  boundary, then its treatment starts at 40% (accounting share 0.40) without
  any manual entry; in an operational-control inventory it starts with
  share 1.0; in a financial-control inventory it starts with share 0.

## API contract

- `POST/PUT /api/ghg/organizations/{orgId}/facilities` — request gains
  `financialControl` and `operationalControl` booleans, replacing `controlled`;
  `equitySharePercent` unchanged. Response mirrors it. (Breaking DTO change is
  fine pre-1.0; the SPA is the only client.)
- `PUT /api/ghg/inventories/{id}/boundary/{facilityId}` — unchanged. The
  prefill happens when the SPA toggles a facility in: it sends the facility's
  facts instead of hardcoded defaults. The backend additionally uses facility
  facts (not 100/true/true) if a treatment is created without explicit values.
- `GET /api/ghg/inventories/{id}/validation` — BOUNDARY gate gains a WARNING
  finding when a treatment's facts differ from the facility's current facts:
  "Tema JV's treatment (100%) differs from the facility record (40%) — review
  the boundary."
- `GET .../facilities` — response includes the two booleans.

## Data

Migration `V9__facility_control_facts.sql`:

- `ALTER TABLE ghg_facilities ADD COLUMN financial_control boolean,
  ADD COLUMN operational_control boolean;`
- Backfill both from the existing `controlled` column, then `SET NOT NULL`,
  then `DROP COLUMN controlled`.
- No change to `ghg_boundary_treatments` or run tables.

## Events

None — all within the `ghg` module.

## Non-goals

- Moving or duplicating the consolidation approach onto facilities or runs
  (the Protocol requires one approach per inventory, applied consistently).
- Auto-syncing facility fact changes into existing treatments (the validation
  warning surfaces the drift; the accountant decides).
- Time-versioned ownership history (partial-year ownership is handled by the
  per-inventory override; a full ownership timeline is a future concern).

## Open questions

- Should the facilities list also show, per inventory approach, the share each
  fact-set would yield (a small "what this means" preview)? Nice-to-have; can
  land later without schema impact.
