---
owner: miketak
last_reviewed: 2026-09-28
description: The five checks that decide whether a run may launch, the difference between a hold, a warning and a note, and why a warning is a disclosure.
---

# What is a pre-flight gate?

A pre-flight gate is one of five checks that say whether a calculation
run may launch; they recompute after every change you save.

<!-- sources: concepts/pre-flight-gates.md (verified 2026-09-24); PreflightPanel.tsx (PASS, WARN, HOLD, the ℹ note); PreflightBanner.tsx ("Base year holds the final designation; runs stay available."); Validation.java holdsFinal (PR #101); specs 05, 05.5, 05.7, 06.1, 07.6; panel and banner texts from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt): "5 workbench", "7 freeze dialog", "7 after freeze" -->

## What do the five gates read?

| Gate | What it reads |
| --- | --- |
| Reporting boundary | The boundary against the entity facts: shares, membership windows, facilities in or out, exclusions with reasons. |
| Activity data completeness | The organization's records against the view: unreviewed records, records that straddle the period. |
| Classification | Every included record's scope, category and factor, and the scope 3 declaration. |
| Emission factors | The factors, densities and instruments the lines rest on, and the residual mix statement. |
| Base year | The base year's recalculation candidates against this inventory. |

The **Records** tab shows the **Pre-flight checks** panel, one row per
gate with PASS, WARN or HOLD; every tab carries the banner, "Launch on
hold" with the gate that holds ("Reporting boundary is blocking.") or
"Ready to launch a run".

## Hold, warn or inform?

| Sign | Status | Effect |
| --- | --- | --- |
| ✕ | HOLD | Holds the launch until the finding is cleared. |
| ▲ | WARN | The run launches; the condition is carried into its lines and its report. |
| ℹ | Note | Records something a verifier may ask about. Holds nothing. |

The **Base year** gate is different: an undecided recalculation
candidate above the threshold holds **Mark as final** and **Publish**,
not the run, and the banner says "Base year holds the final designation;
runs stay available."

## Why is a warning a disclosure?

A warning is not a defect to clear first. A partial membership window is
a fact about the year; a factor that publishes CO₂e only, a fact about
the source; a missing residual mix, a fact about the market. The report
discloses each one where the reader meets the figure.

## Where next

- [Clear the pre-flight findings](clear-the-pre-flight-findings.md).
- [Freeze the inventory and launch a run](freeze-and-launch-a-run.md).
- [What is the inventory lifecycle?](what-is-the-inventory-lifecycle.md).
