# Specifications

Specs are the source of truth for *what* CarbonOS does and *why*; the code is
the source of truth for *how*. They are organized to be read in order, from a
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
| 03.1 | [Legal entities and Table 1](03.1-legal-entities-and-table-1.md) | Ch. 3 | Implemented |
| 03.2 | [Effective-dated membership](03.2-effective-dated-membership.md) | Ch. 3, 5 | Implemented |
| 03.3 | [Table 1 completeness](03.3-table-1-completeness.md) | Ch. 3 | Draft |
| 04 | [Operational boundary and classification](04-operational-boundary-and-classification.md) | Ch. 4 | Implemented |
| 04.1 | [Scope as an accounting decision](04.1-scope-as-accounting-decision.md) | Ch. 4, App. F | Implemented |
| 05 | [Inventories and calculation](05-inventories-and-calculation.md) | Ch. 6, 7 | Implemented |
| 05.1 | [Inventory lifecycle and run snapshots](05.1-inventory-lifecycle-and-run-snapshots.md) | Ch. 7, 9 | Implemented |
| 06 | [Tracking emissions over time](06-tracking-emissions-over-time.md) | Ch. 5 | Implemented |
| 06.1 | [Recalculation policy conformance](06.1-recalculation-policy-conformance.md) | Ch. 5, 9 | Draft |
| 07 | [Reporting and verification](07-reporting-and-verification.md) | Ch. 9, 10 | Implemented |
| 07.1 | [Reporting completeness](07.1-reporting-completeness.md) | Ch. 9 | Implemented |
| 07.2 | [Required disclosures](07.2-required-disclosures.md) | Ch. 4, 9, Scope 2 Guidance, 2013 amendment | Draft |

A chapter spec (`NN`) describes one stage of the workflow as it is today. A
sub-spec (`NN.M`) is a branch of that stage that deserves its own document.
Every chapter spec is implemented as of 2026-09-08. The three `Draft`
sub-specs (03.3, 06.1, 07.2) come from a conformance review of the set against
the Standard on 2026-09-08. They collect the requirements the implemented
specs do not yet meet; the conformance table in spec 00 points to them.
Chapters 8 (reductions) and 11 (targets) of the Standard have no spec yet.

## Lifecycle

| Status | Meaning |
| --- | --- |
| `Draft` | Being written or discussed. Not ready to implement. |
| `Approved` | Reviewed and signed off. Implementation may begin. |
| `Implemented` | Shipped. The spec is kept in step with what was built. |

Rules: nothing is implemented from a `Draft`; if implementation reveals a spec
was wrong, the spec is corrected in the same PR; specs stay behavioral, not
structural. Copy [`TEMPLATE.md`](TEMPLATE.md) to start a new one.

## Writing conventions

Specs follow the [Google developer documentation style guide](https://developers.google.com/style)
with two project overrides: no em dashes anywhere (see `CLAUDE.md`), and the
GHG Protocol's requirement words. In particular:

- **Requirement words.** When a spec quotes or paraphrases the Standard,
  *shall* is a requirement, *should* a recommendation, and *may* a permission,
  exactly as the Standard uses them. When a spec describes CarbonOS, use
  *must* for a rule the product enforces, *can* for ability, and *might* for
  possibility.
- **Present tense, active voice.** Describe what the product does now ("the
  gate warns"), not what it will do. Name the actor when it matters: "the API
  refuses the write" rather than "the write is refused". Passive voice is fine
  when the actor is irrelevant.
- **Conditions first.** State the condition, then the behavior: "While the
  inventory is frozen, writes return 409."
- **Short sentences.** One idea per sentence. Do not chain clauses with
  semicolons; start a new sentence. A list of required elements is a list,
  not a sentence.
- **Sentence case** for titles and headings. **Bold** for UI labels a tester
  will see; code font for identifiers, enum values, paths, and payloads.
- **Plain words.** Write *for example* and *that is*, not *e.g.* and *i.e.*.
  Avoid *etc.*, *via*, and *in order to*. Do not point with *above* or
  *below*; name the table or section. Avoid idiom and figurative language,
  because readers and translators outside the team must be able to follow.
- **Expand an abbreviation** the first time each spec uses it (GWP, SPA,
  CSRF), except units and gas formulas.
- **American spelling**, matching the code (`organization`, `denormalize`).
  The unit code `litre` is a product string and stays as it is.
- **Unambiguous dates**: ISO `2026-09-08` in metadata, "1 July 2025" in prose.
- **Serial comma** in lists of three or more.
- **No pre-announcements.** Future work goes under *Non-goals and open
  questions* or into a `Draft` spec, never into the description of what the
  product does.

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
