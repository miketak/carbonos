# 004 — Organization access (tenant isolation)

- **Status**: Implemented
- **Owner**: Michael Takrama (from GHG workflow audit finding AUTH-01, 2026-08-29)
- **Created**: 2026-08-29
- **Backend module(s)**: `ghg` (enforcement), `user` (principal becomes public API)
- **Frontend feature(s)**: none (behavioral)

## Problem / Motivation

Audit finding AUTH-01: every GHG endpoint was gated only by "is logged in".
Any authenticated user could read, mutate, and delete any organization's
data — a total confidentiality and integrity failure for a multi-client
deployment.

## Behavior

- Every GHG organization has an **owner**: the user who created it
  (`ghg_organizations.owner_user_id`, stamped at creation).
- An organization and everything nested under it (facilities, activities,
  inventories, boundaries, assignments, runs) is accessible to exactly two
  parties: **its owner** and **platform ADMINs**.
- Denials are **404s**, never 403s, so outsiders cannot confirm an id exists.
- `GET /api/ghg/organizations` lists only the caller's own organizations;
  ADMINs see all.
- The emission-factor library remains a shared read-only resource.
- The owner reference is loose (no FK): deleting a user leaves the org
  ADMIN-only rather than blocking user deletion. Migration `V7` backfills
  existing organizations to the oldest active ADMIN.

## Implementation notes

- `AuthenticatedUser` moved from `user/internal/security` to the `user`
  module's public API — the session principal is a cross-module contract.
- Enforcement is centralized in `ghg.internal.GhgAccess`, called at every
  entity-resolution point in `GhgService` / `InventoryService`.

## Non-goals

Multi-member organizations (sharing an org with teammates), transferable
ownership, and per-inventory roles — natural follow-ups on this foundation.
