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
