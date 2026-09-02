# 008: Inventory lifecycle and complete run snapshots

- **Status**: Draft
- **Owner**: Michael Takrama
- **Created**: 2026-09-02 (from the GHG Protocol conformance review of spec 003)
- **Backend module(s)**: `ghg`
- **Frontend feature(s)**: `src/features/ghg`
- **Relates to**: [spec 003](003-inventory-accounting-model.md),
  [spec 007](007-boundary-freeze-and-versioning.md)

## Problem / Motivation

Spec 007 gave the organizational boundary a DRAFT/FROZEN lifecycle and made it
reproducible. Two related gaps remain, and they share one root cause: the
inventory itself has no lifecycle, so its parts are governed piecemeal.

First, the activity view is not reproducible. A run snapshots the lines it
calculated, but an assignment that was *excluded* leaves no trace, and included
assignments can be reclassified after the run. Chapter 9 of the GHG Protocol
Corporate Standard requires reporting exclusions with justification, and
Chapter 10 verifiers audit completeness; neither can be reconstructed for a
past run today.

Second, a run can be designated final while the boundary is later reopened
and re-frozen, so the inventory's current boundary can differ from its final
report's. The Standard frames the boundary as a declaration made for a
reporting period, which points at the inventory as the thing that should have
states. And a facility with a 0% share under the chosen approach is today a
boundary member "contributing nothing"; in the Standard's terms it is outside
the boundary under that approach.

## Behaviour

- **Inventory states**: `DRAFT` (boundary and activity view editable, runs
  blocked), `FROZEN` (both halves read-only, runs allowed), `FINAL` (a run is
  designated final; reopening is refused until the designation is withdrawn),
  `PUBLISHED` (a report was issued; nothing may change, and a correction is a
  new inventory that supersedes this one). Freezing is one act covering the
  boundary and the activity view; spec 007's boundary status folds into this.
- **Runs snapshot every assignment** that existed when launched: included ones
  as lines (today) and excluded ones as exclusion records carrying the
  activity's facts and the documented reason. The run report lists exclusions
  under the lines, grouped by reason.
- **Zero-share facilities** are represented as outside the boundary under that
  approach: the gate offers to remove them, and versions record them as
  excluded with the reason rather than as members at 0%.
- While frozen or later, classify, exclude and include are refused with 409,
  exactly as boundary writes are today.

## API contract

Sketch: `POST /inventories/{id}/freeze`, `/reopen`, `/finalize`, `/publish`,
`/supersede`; `RunDetailResponse` gains `exclusions[]`; assignment and boundary
writes return 409 `Operation not allowed` in any state but `DRAFT`.

## Data

`ghg_inventories.status` replaces `boundary_status`; `superseded_by_id`; a new
`ghg_run_exclusions` table denormalizing the activity facts and reason, as
`ghg_run_lines` does. Boundary versions (spec 007) become one part of an
inventory version.

## Events

`InventoryPublished`, for future reporting and notification consumers.

## Non-goals

An approval workflow with separate preparer and approver roles; that needs
multi-member organizations, which spec 004 lists as a non-goal. Diffing two
runs' exclusion sets.

## Open questions

Whether a boundary reopened under a `FINAL` inventory should require the
final designation to be withdrawn first, or should be refused outright.
