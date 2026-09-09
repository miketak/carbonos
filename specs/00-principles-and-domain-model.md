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
| Completeness | All emission sources and activities within the boundary are accounted for; exclusions are disclosed and justified | "Review activity data" pulls every organizational record into the view and the completeness gate warns about anything unreviewed; exclusions carry a documented reason and are snapshotted into every run with it (spec 05, 05.1) |
| Consistency | Methodologies allow meaningful comparison over time; changes are documented | Runs are immutable snapshots; recalculation is a new run, never an edit (spec 05). A base year with a recalculation policy, structural changes flagged and decided (spec 06) |
| Transparency | A clear audit trail; assumptions and methodologies disclosed | Every reported figure traces to run line, boundary version, assignment, factor, activity record and evidence reference; the report prints the Chapter 9 elements, the methodology and the exclusions (spec 07, 07.1) |
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
ORGANIZATION ── LEGAL ENTITIES ── FACILITIES ── ACTIVITY RECORDS   «the facts»       spec 02, 03.1
      │
      ├── BASE YEAR + recalculation policy                              «the policy»     spec 06
      └── INVENTORIES (draft → frozen → final → published)              «the view»       spec 05.1
                 ── boundary treatments by entity + versions            «the view»       spec 03
                 ── activity assignments, declaration, market factors   «the view»       spec 04, 05, 07.1
                       └── CALCULATION RUNS ── lines + exclusions       «the computation» spec 05, 07
```

## The workflow, in the order a user meets it

1. **Get in.** An administrator creates an account, or a visitor requests
   access and an administrator approves it. Sessions, roles and tenant
   ownership of everything below. (01, 01.1)
2. **Describe the organization.** Create the organization, its legal
   entities with their Table 1 facts, the facilities under each, and record
   activity data in the units the source documents use, with evidence
   references and data quality. (02, 03.1)
3. **Draw the organizational boundary.** Create an inventory for a reporting
   period under one consolidation approach; tick entities and facilities into
   its boundary, prefilled from the entity's facts, with membership windows
   for mid-period changes; declare the operational boundary. (03, 03.2, 07.1)
4. **Classify.** Review the activity data into the inventory; classify each
   included record with an emission factor and the scope and category the
   relationship to the source dictates, leased assets per Appendix F; exclude
   with a reason. (04, 04.1)
5. **Freeze, clear the gates and calculate.** Freezing the inventory cuts a
   boundary version and makes both halves read-only; five validation gates
   recompute live; when none blocks, a run computes quantity × factor ×
   accounting share per line and per gas, converting units within a
   dimension, and snapshots lines and exclusions. Designate a final run,
   publish, or supersede with a correction. (05, 05.1)
6. **Track over time.** Designate the base year and its recalculation
   policy; a freeze that changes the boundary flags a candidate
   recalculation for a decision. (06)
7. **Report and verify.** Read the run as the inventory report in Chapter
   9's order: boundary, declaration, period, scopes both ways, gases,
   biogenic CO2, base year, methodology, exclusions, lines; a verifier opens
   the boundary version and the snapshot lines. (07, 07.1)

## Glossary: Protocol term to CarbonOS term

| Protocol | CarbonOS | Spec |
| --- | --- | --- |
| Reporting company | Organization | 02 |
| Legal entity, joint venture, associate, investment (Table 1) | Legal entity, with a relationship type and economic interest | 03.1 |
| Operation, facility, business unit | Facility, under one legal entity | 02 |
| Activity data | Activity record | 02 |
| Consolidation approach (equity share, financial control, operational control) | `consolidationApproach` on the inventory | 03 |
| Organizational boundary | The set of entity treatments of an inventory, with facilities and membership windows; frozen as a boundary version | 03, 03.2 |
| Equity share / control determination | Entity facts, copied into a boundary treatment, deriving a Table 1 accounting share | 03, 03.1 |
| Operational boundary (scopes) | Scope and category chosen on an assignment, defaulted from the factor; the declaration of scope 3 categories on the inventory | 04, 04.1, 07.1 |
| Emission factor | Seeded emission-factor library | 04 |
| Inventory for a reporting period | Inventory | 05 |
| Calculation, GHG inventory results | Calculation run and its lines | 05 |
| Base year, recalculation policy | The organization's base year, threshold, triggers and recalculation history | 06 |
| Inventory report | Run report page (`/runs/{id}/report`) | 07, 07.1 |
| Verification | Boundary version history, snapshot lines, traceability chain | 07 |

## Conformance at a glance

Reviewed on 2026-09-08 against the revised edition of the Standard, the Scope
2 Guidance (2015), and the required-gases amendment (2013). *Done* means the
requirement is met as the Standard states it. *Partial* means the behavior
exists but misses a stated condition. *Gap* means the requirement is not
implemented. Every Partial and Gap names the `Draft` spec that closes it.

| Chapter | Requirement | State | Spec |
| --- | --- | --- | --- |
| 3 | One consolidation approach per inventory, applied consistently | Done | 03 |
| 3 | Equity share, financial control, and operational control as separate facts | Done | 03 |
| 3 | Table 1: subsidiaries, joint control, associates, fixed-asset investments | Done | 03.1 |
| 3 | Table 1: franchises | Gap | 03.3 |
| 3 | The consolidation policy applied at every level of the group | Partial: one entity layer, so a chained interest is entered as its product | 03.3 |
| 3 | Consolidation by legal entity; economic interest over legal form | Done | 03.1 |
| 3, 5 | Acquisitions and divestments accounted from a stated date | Done for the transaction-date convention; the whole-year convention the guidance recommends is not offered or disclosed | 03.2, 06.1 |
| 4 | Scope 1 and scope 2 accounted and reported separately | Done | 04 |
| 4 | Scope 2 covers electricity, steam, heat, and cooling | Partial: no cooling category | 07.2 |
| 4 | Scope by the reporter's relationship to the source | Done | 04.1 |
| 4 | Process emissions as a scope 1 kind; the fifteen scope 3 categories | Done | 04.1 |
| 4, App. F | Leased assets by lease type and approach | Done | 04.1 |
| 4, 9 | Biogenic CO2 outside scope 1; CH4 and N2O from biomass inside it | Done | 05, 07.1 |
| 5 | A base year with a stated reason for choosing it | Partial: no reason recorded | 06.1 |
| 5 | Recalculation policy with a significance threshold | Done | 06 |
| 5 | Structural changes, methodology changes, and error corrections all trigger recalculation | Partial: methodology and error triggers can be switched off and are never raised | 06.1 |
| 5 | Threshold applied to the cumulative effect of changes since the base year | Gap: each freeze is measured alone | 06.1 |
| 5 | No recalculation for organic growth or for facilities that did not exist in the base year | Done | 06 |
| 6 | Activity data × emission factor, converted within a physical dimension | Done | 05 |
| 6, amendment | 100-year GWP values from one IPCC assessment report per inventory | Partial: HFC and PFC blends keep the source's potentials, and the source's report is not named | 07.1, 07.2 |
| 7 | Data quality per fact; validation before calculation | Done | 02, 05 |
| 9 | Emissions by scope, total scope 1 and 2 independent of trades | Done | 07 |
| 9, amendment | Each of the seven gases in tonnes of gas and tonnes CO2e | Partial: kilograms; HFCs and PFCs as CO2e only | 07.2 |
| 9, Scope 2 Guidance | Location-based and market-based scope 2, each labeled | Done | 07.1 |
| Scope 2 Guidance | Instruments meet the Scope 2 Quality Criteria; residual mix or its absence disclosed; the method behind a single total named | Gap | 07.2 |
| 9 | Exclusions of sources, facilities, and operations, with justification | Partial: excluded records and zero-share entities only; an entity or facility left out of the boundary is not reported | 05.1, 07.2 |
| 9 | Operational boundary declared (which scope 3 categories) | Done | 07.1 |
| 9 | Base-year emissions and an emissions profile over time | Partial: base year and current period only | 06.1 |
| 10 | Verifiable audit trail | Done for the boundary, lines, and exclusions | 07 |
| 2, 8, 11 | Inventory design, reductions, targets | No spec | |
