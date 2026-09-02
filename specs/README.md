# Specifications

Every non-trivial feature starts here as a spec, **before** any code is written.
Specs are the source of truth for *what* is being built and *why*; the code is
the source of truth for *how*.

## Lifecycle

| Status        | Meaning                                                              |
| ------------- | -------------------------------------------------------------------- |
| `Draft`       | Being written or discussed. Not ready to implement.                  |
| `Approved`    | Reviewed and signed off. Implementation may begin.                   |
| `Implemented` | Shipped. The spec is updated to match what was actually built.       |
| `Superseded`  | Replaced by a newer spec (link to it in the header).                 |

## Rules

1. One spec per feature, numbered sequentially: `NNN-short-name.md`.
2. Copy [`TEMPLATE.md`](TEMPLATE.md) to start a new spec.
3. Nothing gets implemented from a `Draft` spec.
4. If implementation reveals the spec was wrong, update the spec in the same
   PR — a spec that disagrees with shipped behavior is a bug.
5. Keep specs behavioral (what the user/system does), not structural (which
   classes exist). Structure belongs in the code and `CLAUDE.md` conventions.

## Index

| #   | Spec                                                     | Status   |
| --- | -------------------------------------------------------- | -------- |
| 001 | [Admin user management](001-admin-user-management.md)    | Implemented |
| 002 | [Access requests](002-access-requests.md)                | Implemented |
| 003 | [Inventory accounting model](003-inventory-accounting-model.md) | Implemented |
| 004 | [Organization access](004-organization-access.md)        | Implemented |
| 005 | [Unit conversion](005-unit-conversion.md)                | Implemented |
| 006 | [Facility control facts and boundary prefill](006-facility-control-facts.md) | Superseded |
| 007 | [Organizational boundary: control facts, prefill, freeze and versioning](007-boundary-freeze-and-versioning.md) | Implemented |
| 008 | [Inventory lifecycle and complete run snapshots](008-inventory-lifecycle.md) | Draft |
| 009 | [Scope as an accounting decision](009-scope-as-accounting-decision.md) | Draft |
| 010 | [Organizational boundary: legal entities, Table 1, and changes over time](010-organizational-boundary-model.md) | Draft |
| 011 | [Reporting completeness](011-reporting-completeness.md) | Draft |
