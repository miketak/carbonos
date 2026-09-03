# 00: Principles and domain model

- **Status**: Implemented
- **Protocol**: Chapter 1 (accounting and reporting principles), and the
  structure of Chapters 3 to 10 that the rest of these specs follow
- **Owner**: Michael Takrama
- **Created**: 2026-09-02
- **Modules**: `ghg` (backend), `src/features/ghg` (frontend)

## What this document is

The reading guide. It states the five principles the GHG Protocol asks every
inventory to satisfy and how CarbonOS embodies each, then the three invariants
the data model is built on, then the objects and the workflow in the order a
user meets them. Every later spec assumes this one.

## The five principles

The Corporate Standard (Chapter 1) requires an inventory to be **relevant,
complete, consistent, transparent and accurate**. Each is a design constraint
here, not a slogan.

| Principle | The Standard's meaning | How CarbonOS holds it |
| --- | --- | --- |
| Relevance | The inventory reflects the emissions of the company and serves decision-making needs of users inside and outside it | The organizational boundary is chosen per inventory under a stated consolidation approach (spec 03); the same facts can be viewed under several approaches for different audiences (spec 05) |
| Completeness | All emission sources and activities within the boundary are accounted for; exclusions are disclosed and justified | "Review activity data" pulls every organizational record into the view and the completeness gate warns about anything unreviewed; exclusions carry a documented reason (spec 05). Exclusions are not yet snapshotted into runs (spec 05.1) |
| Consistency | Methodologies allow meaningful comparison over time; changes are documented | Runs are immutable snapshots; recalculation is a new run, never an edit (spec 05). Base-year recalculation policy is not yet modelled (spec 06) |
| Transparency | A clear audit trail; assumptions and methodologies disclosed | Every reported figure traces to run line, boundary version, assignment, factor, activity record and evidence reference (spec 07) |
| Accuracy | Emissions are neither systematically over nor under actual; uncertainty is reduced as far as practicable | Facts are recorded in their native unit and converted only within a physical dimension (spec 05); data quality is recorded per fact (spec 02); the run refuses to compute a number it cannot justify |

## Three invariants

Everything in the `ghg` module rests on the separation of **facts** from
**views** from **computations**.

1. **Activity records are organizational facts.** They exist independently of
   any inventory and carry no scope, category, emission factor or boundary
   treatment. A fact is corrected in place and never silently rewritten by an
   accounting decision.
2. **Inventories are accounting views.** An inventory selects, classifies,
   includes or excludes, and applies boundary treatment to facts through its
   own records, never by mutating the facts. Two inventories over the same
   facts may legitimately report different totals.
3. **Calculation runs are immutable, reproducible snapshots.** A run
   denormalizes every input it used. Nothing edited later, in facts, boundary
   or classification, changes a past run.

```
ORGANIZATION ── FACILITIES ── ACTIVITY RECORDS            «the facts»       spec 02
      │
      └── INVENTORIES ── boundary treatments + versions    «the view»        spec 03
                      ── activity assignments               «the view»        spec 04, 05
                            └── CALCULATION RUNS ── lines   «the computation» spec 05, 07
```

## The workflow, in the order a user meets it

1. **Get in.** An administrator creates an account, or a visitor requests
   access and an administrator approves it. Sessions, roles and tenant
   ownership of everything below. (01, 01.1)
2. **Describe the organization.** Create the organization, its facilities with
   their ownership and control facts, and record activity data in the units the
   source documents use, with evidence references and data quality. (02)
3. **Draw the organizational boundary.** Create an inventory for a reporting
   period under one consolidation approach; tick facilities into its boundary,
   prefilled from their facts; freeze it, which cuts an immutable version. (03)
4. **Set the operational boundary and classify.** Review the activity data
   into the inventory; classify each included record with an emission factor,
   which today fixes its scope and category; exclude with a reason. (04)
5. **Clear the gates and calculate.** Four validation gates recompute live;
   when none blocks, a run computes quantity × factor × accounting share per
   line, converting units within a dimension, and snapshots everything. (05)
6. **Track over time.** Base year and recalculation policy. (06, planned)
7. **Report and verify.** Read the run as the inventory report; follow every
   figure back to its sources; a verifier opens the boundary version and the
   snapshot lines. (07)

## Glossary: Protocol term to CarbonOS term

| Protocol | CarbonOS | Spec |
| --- | --- | --- |
| Reporting company | Organization | 02 |
| Operation, facility, business unit | Facility | 02 |
| Activity data | Activity record | 02 |
| Consolidation approach (equity share, financial control, operational control) | `consolidationApproach` on the inventory | 03 |
| Organizational boundary | The set of boundary treatments of an inventory; frozen as a boundary version | 03 |
| Equity share / control determination | Facility facts, copied into a boundary treatment, deriving an accounting share | 03 |
| Operational boundary (scopes) | Scope and category on an assignment, derived from the emission factor | 04 |
| Emission factor | Seeded emission-factor library | 04 |
| Inventory for a reporting period | Inventory | 05 |
| Calculation, GHG inventory results | Calculation run and its lines | 05 |
| Base year, recalculation policy | `baseYear` (field only) | 06 |
| Inventory report | Run detail page | 07 |
| Verification | Boundary version history, snapshot lines, traceability chain | 07 |

## Conformance at a glance

| Chapter | Requirement | State | Spec |
| --- | --- | --- | --- |
| 3 | One consolidation approach per inventory, applied consistently | Done | 03 |
| 3 | Equity share, financial and operational control as separate facts | Done | 03 |
| 3 | Table 1 rows for joint control, associates, fixed-asset investments | Planned | 03.1 |
| 3 | Consolidation by legal entity; economic interest over legal form | Planned | 03.1 |
| 3, 5 | Acquisitions and divestments from the transaction date | Planned | 03.2 |
| 4 | Scope 1, 2, 3 | Done, derived from the factor | 04 |
| 4 | Scope by the reporter's relationship to the source | Planned | 04.1 |
| 4 | Process emissions as a scope 1 kind; the fifteen scope 3 categories | Planned | 04.1 |
| 4, App. F | Leased assets | Planned | 04.1 |
| 5 | Base year, recalculation policy, significance threshold | Planned | 06 |
| 6 | Activity data × emission factor, in the factor's unit | Done | 05 |
| 7 | Data quality per fact; validation before calculation | Done | 02, 05 |
| 9 | Emissions by scope | Done | 07 |
| 9 | Each gas separately; biogenic CO2 separately | Planned | 07.1 |
| 9, Scope 2 Guidance | Location-based and market-based scope 2 | Planned | 07.1 |
| 9 | Exclusions reported with justification | Partly (kept, not snapshotted) | 05.1 |
| 9 | Operational boundary declared (which scope 3 categories) | Planned | 07.1 |
| 10 | Verifiable audit trail | Done for the boundary and lines | 07 |
