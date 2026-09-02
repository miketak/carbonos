# 009: Scope as an accounting decision

- **Status**: Draft
- **Owner**: Michael Takrama
- **Created**: 2026-09-02 (from the GHG Protocol conformance review of spec 003)
- **Backend module(s)**: `ghg`
- **Frontend feature(s)**: `src/features/ghg`
- **Relates to**: [spec 003](003-inventory-accounting-model.md),
  [spec 007](007-boundary-freeze-and-versioning.md)

## Problem / Motivation

Spec 003 derives scope and category from the chosen emission factor. Under
Chapter 4 of the GHG Protocol Corporate Standard, scope depends on the
reporter's relationship to the source, not on the physics: diesel burned in an
owned haul fleet is scope 1 (mobile combustion); the same diesel burned by a
mining contractor is scope 3. A mining client cannot classify contractor
mining at all today, and the seeded library has no PROCESS_EMISSIONS category,
so explosives, lime and cement process emissions have nowhere to go.

## Behaviour

- Classification records **an emission factor and a scope/category**, both
  chosen by the accountant. The factor library offers scope-agnostic factors
  where the physics is the same, with a suggested default scope.
- `ActivityCategory` gains `PROCESS_EMISSIONS` (scope 1) and the scope 3
  categories needed to reach the Standard's fifteen.
- Leased assets: per Appendix F, whether a leased asset's emissions are scope
  1/2 or scope 3 depends on the lease type and the consolidation approach; the
  assignment carries a lease flag and the derivation applies it.

## API contract

Sketch: `PUT /assignments/{id}/classify` takes `{emissionFactorId, scope,
category, leaseType?}`; the CLASSIFICATION gate errors when scope and factor
are incompatible.

## Data

Columns on `ghg_assignments` and `ghg_run_lines`; factor library rows for the
new categories via migration.

## Events

None.

## Non-goals

Automatic scope inference from facility or supplier metadata.

## Open questions

Whether the seeded factors stay scope-tagged as defaults or become fully
scope-agnostic.
