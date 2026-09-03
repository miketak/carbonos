# Specifications

Specs are the source of truth for *what* CarbonOS does and *why*; the code is
the source of truth for *how*. They are organised to be read in order, from a
visitor's first sign-in to a verifier reading a finished inventory, and their
chapters follow the GHG Protocol Corporate Accounting and Reporting Standard
(revised edition, with the Scope 2 Guidance of 2015 and the NF3 amendment of
2013), because that is the standard the product exists to implement.

## Reading order

| # | Spec | Protocol | Status |
| --- | --- | --- | --- |
| 00 | [Principles and domain model](00-principles-and-domain-model.md) | Ch. 1 | Implemented |
| 01 | [Identity and access](01-identity-and-access.md) | | Implemented |
| 01.1 | [Access requests](01.1-access-requests.md) | | Implemented |
| 02 | [Organization and facts](02-organization-and-facts.md) | Ch. 6, 7 | Implemented |
| 03 | [Organizational boundary](03-organizational-boundary.md) | Ch. 3 | Implemented |
| 03.1 | [Legal entities and Table 1](03.1-legal-entities-and-table-1.md) | Ch. 3 | Draft |
| 03.2 | [Effective-dated membership](03.2-effective-dated-membership.md) | Ch. 3, 5 | Draft |
| 04 | [Operational boundary and classification](04-operational-boundary-and-classification.md) | Ch. 4 | Implemented |
| 04.1 | [Scope as an accounting decision](04.1-scope-as-accounting-decision.md) | Ch. 4, App. F | Draft |
| 05 | [Inventories and calculation](05-inventories-and-calculation.md) | Ch. 6, 7 | Implemented |
| 05.1 | [Inventory lifecycle and run snapshots](05.1-inventory-lifecycle-and-run-snapshots.md) | Ch. 7, 9 | Draft |
| 06 | [Tracking emissions over time](06-tracking-emissions-over-time.md) | Ch. 5 | Draft |
| 07 | [Reporting and verification](07-reporting-and-verification.md) | Ch. 9, 10 | Implemented |
| 07.1 | [Reporting completeness](07.1-reporting-completeness.md) | Ch. 9 | Draft |

A chapter spec (`NN`) describes one stage of the workflow as it is today. A
sub-spec (`NN.M`) is a branch of that stage that deserves its own document,
usually the planned next step. Chapters 8 (reductions) and 11 (targets) of the
Standard have no spec yet.

## Lifecycle

| Status | Meaning |
| --- | --- |
| `Draft` | Being written or discussed. Not ready to implement. |
| `Approved` | Reviewed and signed off. Implementation may begin. |
| `Implemented` | Shipped. The spec is kept in step with what was built. |

Rules: nothing is implemented from a `Draft`; if implementation reveals a spec
was wrong, the spec is corrected in the same PR; specs stay behavioural, not
structural. Copy [`TEMPLATE.md`](TEMPLATE.md) to start a new one.

## Where the old numbers went

The set was restructured on 2026-09-02 from eleven feature-numbered specs into
the chapters above. Commit messages and migration comments still carry the old
numbers.

| Old | Now |
| --- | --- |
| 001 Admin user management | 01 |
| 002 Access requests | 01.1 |
| 003 Inventory accounting model | 00 (invariants), 02 (facts), 04 (classification), 05 (views, gates, runs) |
| 004 Organization access | 01 (tenant ownership) |
| 005 Unit conversion | 02 (registry), 05 (conversion in calculation) |
| 006 Facility control facts (superseded) | 03 |
| 007 Boundary freeze and versioning | 03 |
| 008 Inventory lifecycle and run snapshots | 05.1 |
| 009 Scope as an accounting decision | 04.1 |
| 010 Legal entities, Table 1, changes over time | 03.1, 03.2, 06 |
| 011 Reporting completeness | 07.1 |
