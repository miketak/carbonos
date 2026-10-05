---
owner: miketak
last_reviewed: 2026-10-04
description: Why the launch is on hold, how the pre-flight chip and its popover read, and every finding of the five gates as CarbonOS prints it, with what clears each one.
role: Preparer
---

# Clear the pre-flight findings

The launch is on hold because a gate other than Base year holds an error. Click the pre-flight chip beside the title, find the gate that reads **Hold** and take the action its table gives. Warnings and information lines never hold a run.

<!-- sources: InventoryService.java validation findings (validate, excludedWithAShare, leaseDisagreement, PLACEHOLDER_MAGNITUDE; verified by grep 2026-09-28); PreflightChip.tsx (the chip's labels, the popover's summary line, Pass, Warn and Hold, Resolve the findings); spec 10; format.ts gateLabels; the old page reference/pre-flight-gates-and-findings.md (verified 2026-09-24); specs 02.1 to 02.4, 03, 04.2 to 04.8, 05.6, 06.1, 07.2, 07.3 and 07.6; screen text from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt): "5 workbench", "6 under review", "6 records after rules" -->

## How the chip reads

**Launch on hold · 1 blocking** means an error in Reporting boundary, Activity data completeness, Classification or Emission factors; the popover names the gate, "Reporting boundary is blocking.", with **Resolve the findings →**. **Ready to launch** means none: "Every gate passes", plus a warning count. "Base year holds the final designation; runs stay available." means an error in Base year only, which holds **Mark as final**, not a run.

*Italics* stand for what the line prints; "…" for the rest. Freeze refusals: [Freeze the inventory and launch a run](freeze-and-launch-a-run.md).

## Reporting boundary

| Finding | Level | What clears it |
| --- | --- | --- |
| The inventory is a draft. Freeze it to enable a run. | Error | **Freeze inventory**. |
| The organizational boundary is empty: add at least one facility. | Error | Tick a facility in. |
| '*Facility*' (*Entity*) is neither in the boundary nor excluded with a reason. … | Error | Tick it in, or choose a reason. |
| *Entity* is excluded but holds a *100% share* under this approach. … (also per entity's facilities) | Error | Include it, or choose "Non-GHG activity" or "Not applicable". |
| Included activity '*Record*' (…) is outside the boundary (…): … | Error | **Review activity data**, or widen the boundary. |
| *Entity* is excluded as *reason* but holds a *100% share* …: the report discloses the exclusion. (also per facility) | Warning | None. |
| *Entity* has a 0% accounting share under *approach*: it is outside the boundary … (or its facilities) | Warning | Leave it, or choose a reason on its row. |
| *Entity*'s treatment (…) differs from the entity record (…). Review the boundary. | Warning | None if intended. |
| *Entity* is a member from *date*: a partial-period membership, … | Warning | None. |
| *Entity* has a membership window, but the recalculation policy accounts structural changes for the whole year. … | Warning | Clear the window, or change the convention. |
| The reporting period *start* to *end* is not twelve months (…). … | Warning | None if deliberate. |

## Activity data completeness

| Finding | Level | What clears it |
| --- | --- | --- |
| Included activity '*Record*' covers *period*, outside the reporting period: exclude it. | Error | **Review activity data**. |
| '*Record*' (…) was removed (…) but is still included: … | Error | **Review activity data**. |
| '*Record*' (…) covers *period*; *N* of *M* days fall inside … The inventory blocks straddling records: … | Error | Split or exclude it, or change the straddle treatment. |
| … the run pro-rates it to *P*%. | Warning | None; the line prints the split. |
| *N* organizational activity records have not been reviewed: … | Warning | **Review activity data**. |
| '*Record*' (…) is excluded for a reason that no longer holds: … | Warning | **Review activity data**. |
| *N* draft records are not entered: … | Warning | Complete or remove them. |
| *N* exclusions have a magnitude entered before the three states existed; confirm or size it: … | Warning | Size each, or say it emits nothing or is not estimated. |
| '*Record*' (…) has no evidence: no reference and nothing attached. | Warning | Add a reference or attach evidence. |
| '*Record*' (…) cites *reference* but nothing is attached. | Info | None. |
| '*Record*' (…) is *method* data, tier *N* (…) … | Info | None. |
| *Record* is excluded as a Montreal Protocol gas; a factor exists that would report it as a calculated line (…). | Info | Classify it so. |

## Classification

| Finding | Level | What clears it |
| --- | --- | --- |
| '*Record*' (…) is unclassified: assign an emission factor or exclude it. | Error | Either. |
| '*Record*' is classified in *scope*; its emission source '*source*' defaults to *scope*. … | Error | A justification of at least 10 characters, or the default. |
| '*Record*' (…) is a leased asset (…) stored in *scope*, but Appendix F under *approach* puts it in *scope* (…). … | Error | Choose the factor again. |
| Fuel- and energy-related activities is declared, but no upstream rule matches a scope 1 or scope 2 factor in this view; … | Warning | Add a rule, or a reason in the declaration. |
| Scope 3 '*category*' is declared as covered but no included record is classified into it: … | Warning | Classify a record into it, or give the reason. |
| Records are classified into scope 3 '*category*' but the declaration does not list it as covered. … | Warning | Declare it, or reclassify. |
| *N* upstream rules: … | Info | None. |

## Emission factors

| Finding | Level | What clears it |
| --- | --- | --- |
| '*Record*' uses '*factor*', which is not approved. … | Error | Someone other than its author approves it. |
| '*Record*' is recorded in *unit* but its factor '*factor*' is per *unit*: choose the density that converts … | Error | Choose a density on **Classify**. |
| '*Record*' is recorded in *unit* but its factor '*factor*' is per *unit*: no conversion between them. … | Error | A compatible unit, a factor in its unit, or a custom unit under **Units**. |
| '*Record*' uses '*factor*', a gas outside the scopes, but is classified as *scope*. … | Error | Classify it as scope 1. |
| '*factor*' publishes CO2e only. … | Warning | None. |
| '*factor*' is valid from *date* until *date*, which does not cover the reporting period. | Warning | A version valid in the period, or accept. |
| '*Record*' uses '*factor*', whose CO2e is published under *set* and cannot be re-derived under *set* … | Warning | The composition, or another factor. Holds **Mark as final**. |
| '*Record*' converts through the typical density of *material* (…), a planning value. … | Warning | The supplier's density, or a proxy with a justification. Holds **Mark as final**. |
| '*Record*' at *Facility* has a market-based factor per kWh but is recorded in *unit*: … | Warning | Record electricity in kWh or MWh. |
| *N* records use a factor for a gas outside the scopes (Montreal Protocol). … | Warning | None. |
| The inventory does not say whether a residual mix is available. … | Warning | **Residual mix available** on **Method**. |
| The instrument for *Facility* does not meet the Scope 2 Quality Criteria (…): … | Warning | Answer every criterion as Met, or accept. |
| The instrument for *Facility* covers *from* to *to*, which reaches outside the reporting period; … | Warning | None. |
| The instrument for *Facility* covers *N* kWh but the facility's scope 2 electricity … is *M* kWh: … | Warning | Reduce the coverage, or record the electricity. |

## Base year

| Finding | Level | What clears it |
| --- | --- | --- |
| Base year flagged for recalculation (…). Record the decision under the organization's base year. | Error above the threshold when reported against, else Warning | Decide it under **Settings**, **Baseline and targets**. |
| This inventory uses IPCC *set* potentials; the *year* base year uses IPCC *set*. … | Warning | Use the same set, or accept. |
| The recalculated base '*run*' carries a membership window, but the policy accounts structural changes for the whole year. … | Warning | Recalculate the whole year, or change the convention. |
