---
owner: miketak
last_reviewed: 2026-09-24
---

# Pre-flight gates and findings

The **Pre-flight checks** panel on an inventory lists five gates. Each
finding is an error, a warning or an information line. An error in the
first four gates holds the launch of a run; an error in the Base year
gate holds only the final designation and the publication. A warning
never holds anything: it is a disclosure the report prints or a check
for you to read. This page lists the findings as CarbonOS prints them,
with what clears each. Names in *italics* stand for the record,
facility, entity or factor concerned.

<!-- sources: InventoryService.java validation findings (lines 480 to 2370 on main at 1086931); Validation.java Gate, Severity, GateStatus, holdsFinal; PreflightPanel.tsx; PreflightBanner.tsx; verified 2026-09-24 -->

## How the panel reads

| Panel | Meaning |
| --- | --- |
| LAUNCH ON HOLD | At least one error in Reporting boundary, Activity data completeness, Classification or Emission factors. The banner names the first blocking gate: "Reporting boundary is blocking." |
| READY TO LAUNCH | No such error. "Every gate passes; *N* carries a warning." |
| Base year holds the final designation; runs stay available. | An error in the Base year gate only. |

Each gate reads PASS, WARN or HOLD.

## Reporting boundary

| Finding | Severity | What clears it |
| --- | --- | --- |
| The inventory is a draft. Freeze it to enable a run. | Error | **Freeze inventory**. |
| The organizational boundary is empty: add at least one facility. | Error | Tick a facility in on the **Boundary** tab. |
| '*Facility*' (*Entity*) is neither in the boundary nor excluded with a reason. Tick it in, or record why it is left out. | Error | Tick the facility in, or untick its entity and choose a reason. |
| *Entity* is excluded but holds a 100% share under this approach. Include it, or record why it emits nothing. | Error | Include the entity, or choose the reason "Non-GHG activity" or "Not applicable", the two that say it emits nothing. |
| Every facility of *Entity* is excluded but it holds a 100% share under this approach. Include them, or record why they emit nothing. | Error | The same, for an entity whose facilities were all unticked. |
| Included activity '*Record*' (*Facility*, *period*) is outside the boundary (*detail*): exclude it or change the boundary. | Error | **Review activity data** excludes it as Outside boundary, or widen the boundary. |
| *Entity* is excluded as not applicable in the period but holds a 100% share under this approach: the report discloses the exclusion. | Warning | None needed; the report prints the exclusion. Also printed per facility: "'*Facility*' (*Entity*) is excluded as … while *Entity* holds a 100% share …". |
| *Entity* has a 0% accounting share under *approach*: it is outside the boundary under this approach. Remove it, or leave it and the version records it as excluded. | Warning | Record why it is left out so the report says so. |
| *Entity*'s treatment (…) differs from the entity record (…). | Warning | The view overrides the entity's facts; leave it if intended. |
| *Entity* is a member from *date*: a partial-period membership, accounted from that date. | Warning | None needed; the report discloses it. |
| *Entity* has a membership window, but the recalculation policy accounts structural changes for the whole year. Include the full year of the operation, or change the convention. | Warning | Clear the window, or change the base-year convention. |
| The reporting period *start* to *end* is not twelve months (*N* months). Chapter 9 expects an annual inventory; keep it only if the period is deliberate. | Warning | None if the period is deliberate. |

## Activity data completeness

| Finding | Severity | What clears it |
| --- | --- | --- |
| Included activity '*Record*' covers *period*, outside the reporting period: exclude it. | Error | **Review activity data**. |
| '*Record*' (*period*) was removed (*detail*) but is still included: run "Review activity data". | Error | **Review activity data**. |
| '*Record*' (*Facility*) covers *period*; *N* of *M* days fall inside the reporting period and the membership window. The inventory blocks straddling records: split the record at the cut-off or exclude it. | Error | Split the record into two, or exclude it; or change the inventory's straddle treatment before the freeze. |
| '*Record*' (*Facility*) covers *period*; *N* of *M* days fall inside the reporting period and the membership window: the run pro-rates it to *P*%. | Warning | None needed; the line prints the split. |
| *N* organizational activity records have not been reviewed: run "Review activity data". | Warning | **Review activity data**. |
| '*Record*' (*period*) is excluded for a reason that no longer holds: run "Review activity data". | Warning | **Review activity data**. |
| *N* draft records are not entered: *list*. Complete or remove them before the run. | Warning | Fill in or remove the drafts under **Activity data**. |
| *N* exclusions have a placeholder magnitude: … | Warning | Replace the placeholder estimate with a magnitude, "emits nothing" or "not estimated". |
| '*Record*' (*period*) has no evidence: no reference and nothing attached. | Warning | Add a document reference or attach evidence. |
| '*Record*' (*period*) cites *reference* but nothing is attached. | Info | Attach the document, or leave the citation. |
| '*Record*' (*period*) is *method* data, tier *N* (*label*)… | Info | For the data-quality table. |
| *Record* is excluded as a Montreal Protocol gas; a factor exists that would report it as a calculated line ('*factor*'). | Info | Classify it with that factor if a calculated line is wanted. |

## Classification

| Finding | Severity | What clears it |
| --- | --- | --- |
| '*Record*' (*Facility*, *period*) is unclassified: assign an emission factor or exclude it. | Error | Classify or exclude the record. |
| '*Record*' is classified in *scope*; its stream '*stream*' defaults to *scope*. Record why (a justification of at least 10 characters), or classify it in *scope*. | Error | Fill the scope justification, or take the default. |
| '*Record*' (*Facility*) *disagreement between the declaration and the classification* | Error | Reconcile the record's category with the declaration. |
| Fuel- and energy-related activities is declared, but no upstream rule matches a scope 1 or scope 2 factor in this view; add a rule or say why category 3 is not quantified. | Warning | Add an upstream rule on the **Method** tab, or explain in the declaration. |
| Scope 3 *category* is declared as covered but no included record is classified into it: a reader takes 'covered' to mean quantified. Classify records into it, or say in the declaration why it is not quantified this year. | Warning | Classify a record into it, or amend the declaration. |
| Records are classified into scope 3 *category* but the declaration does not list it as covered. Declare it, or reclassify the records. | Warning | Tick the category in the declaration. |
| *N* upstream rules: *primary* → *upstream* (*kind*) | Info | For information. |

## Emission factors

| Finding | Severity | What clears it |
| --- | --- | --- |
| '*Record*' uses '*factor*', which is not approved. Approve it under Emission factors, or choose another. | Error | A reviewer or owner other than the person who entered it approves the factor. |
| '*Record*' is recorded in *unit* but its factor '*factor*' is per *unit*: choose the density that converts between them (record one under Units if none fits). | Error | Choose a density in the classification drawer. |
| '*Record*' is recorded in *unit* but its factor '*factor*' is per *unit*: no conversion between them. Record it in a unit compatible with *unit*… | Error | Change the record's unit or the factor. |
| '*Record*' uses '*factor*', a gas outside the scopes, but is classified as *scope*. Classify it as scope 1; the scope is informational on a line outside the scopes. | Error | Classify it as scope 1. |
| '*factor*' publishes CO2e only. Its emissions are counted in the scope totals and appear in the by-gas table on the row 'CO2e from factors without a gas split', not under CO2, CH4 or N2O. | Warning | None needed; the report says so. |
| '*factor*' is valid from *date* until *date*, which does not cover the reporting period. | Warning | Choose a version valid in the period, or accept the coverage warning a vintage implies. |
| '*Record*' uses '*factor*', whose CO2e is published under *GWP set* and cannot be re-derived under *GWP set* (no composition recorded). A run prints it as published; a final run needs one GWP set… | Warning | Record the blend composition, or use a factor under the inventory's GWP set. |
| '*Record*' converts through the typical density of *material* (*value* kg/litre), a planning value. A run may use it; a final run may not: record the supplier's density under Units… | Warning | Record the supplier's density under **Units**, or flag the classification as a proxy with a justification. |
| '*Record*' at *Facility* has a market-based factor per kWh but is recorded in *unit*: the market-based figure falls back to location-based. | Warning | Record electricity in kWh or MWh. |
| *N* records use a factor for a gas outside the scopes (Montreal Protocol). Its mass is reported in the block 'Gases outside the scopes (Montreal Protocol)' … and no scope total includes it. | Warning | None needed. |
| The inventory does not say whether a residual mix is available. Every run reports scope 2 market-based, and the Scope 2 Guidance requires the disclosure either way; until it is recorded, uncovered electricity is priced at the grid average. | Warning | Answer **Residual mix available** on the **Method** tab. |
| The instrument for *Facility* does not meet the Scope 2 Quality Criteria (*why*): the market-based figure falls back to location-based. | Warning | Answer every criterion as Met, or accept the fallback. |
| The instrument for *Facility* covers *from* to *to*, which reaches outside the reporting period; only the part inside it applies. | Warning | None needed. |
| The instrument for *Facility* covers *N* kWh but the facility's scope 2 electricity in its period is *M* kWh: the excess covers nothing. | Warning | Reduce the covered quantity, or record the electricity. |

## Base year

| Finding | Severity | What clears it |
| --- | --- | --- |
| Base year flagged for recalculation (*reason*). Record the decision under the organization's base year. | Error under the base year's approach, warning under another | Record a recalculated base or decline the candidate under **Base year**. Runs stay available. |
| This inventory uses IPCC *set* potentials; the *year* base year uses IPCC *set*. The required-gases amendment recommends the same set for both. | Warning | Use the same GWP set, or accept the disclosure. |
| The recalculated base '*run*' carries a membership window, but the policy accounts structural changes for the whole year. Recalculate the base for the entire year, or change the convention. | Warning | Recalculate from a full-year view, or change the convention. |

## Freeze blockers

**Freeze inventory** is refused, and the dialog names the records, while
a record is unclassified, a departure from the stream's scope is
unjustified, or a draft record sits at a facility in the boundary.
