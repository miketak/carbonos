---
owner: miketak
last_reviewed: 2026-09-28
description: The order CarbonOS follows from an empty organization to a published report, where each of the eight steps happens, and the states an inventory passes through.
---

# How an inventory becomes a report

CarbonOS follows the order the GHG Protocol Corporate Standard sets out:
facts about the organization, then one inventory's decisions about them,
then a run and a report. The eight Get started steps walk that order
once.

<!-- sources: concepts/the-workflow.md (verified 2026-09-24); spec 00 "The workflow, in the order a user meets it"; spec 05.1 (lifecycle); lifecycle and pre-flight texts from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt): "5 workbench", "7 after freeze", "8 after final", "8 after publish" -->

## What happens at each step?

| Step | Where | What it leaves behind |
| --- | --- | --- |
| 1. [Create the organization and its legal entity](create-the-organization-and-its-legal-entity.md) | **Legal entities** | The reporting company and the entities it consolidates, with Table 1 facts. |
| 2. [Record the facilities and source streams](record-the-facilities-and-source-streams.md) | **Facilities** | The sites, each under one entity, and their streams, which set default scopes. |
| 3. [Import the factor packs](import-the-factor-packs.md) | **Emission factors** | The factors with citations; a derived one waits as "Not approved". |
| 4. [Import the records and correct one](import-the-records-and-correct-one.md) | **Activity data** | What happened, with period, source and evidence; no scope yet. |
| 5. [Create the inventory and draw its boundary](create-the-inventory-and-draw-its-boundary.md) | **Inventories**, **Boundary** tab | A draft view: period, approach, GWP set, boundary, declaration. |
| 6. [Classify the records and add the upstream rule](classify-the-records-and-add-the-upstream-rule.md) | **Records** and **Method** tabs | Each record "Included" with factor, scope and category, or "Excluded" with a reason; rules for category 3. |
| 7. [Freeze the inventory and launch the run](freeze-and-launch-the-run.md) | **Runs** tab | Boundary version 1 and Run 001, a snapshot of every line. |
| 8. [Fill the header, publish and export](fill-the-header-publish-and-export.md) | **Report** tab | The final run, the published report, the exports. |

Steps 1 to 4 are facts every inventory reads; 5 and 6 are one view's
decisions; 7 and 8 are that view calculated and issued. Nothing edited
later changes a past run.

## Which states does the inventory pass through?

```mermaid
flowchart LR
    accTitle: The inventory lifecycle
    accDescr: An inventory starts as a draft, is frozen to allow runs, becomes final when a run is designated, and is published. A published inventory never changes; a correction supersedes it.
    D[Draft] -->|Freeze inventory| F[Frozen]
    F -->|Reopen as draft| D
    F -->|Mark as final| N[Final]
    N -->|Withdraw final designation| F
    N -->|Publish| P[Published]
    P -->|Create correction| C[Superseded by a correction]
```

| State | What the lifecycle bar says | What you can do |
| --- | --- | --- |
| Draft | "runs are blocked until the inventory is frozen" | Draw the boundary, classify, clear the gates, **Freeze inventory**. |
| Frozen | "The boundary and the activity view are read-only and runs are allowed." | **Launch calculation run**, or **Reopen as draft** with a reason. |
| Final | "A run is designated the final result." | Fill the header, then **Publish** or **Withdraw final designation**. |
| Published | "The report was issued; nothing on this inventory can change." | **Create correction**, a new inventory that supersedes it. |

The pre-flight banner reads "Launch on hold" until the five gates pass,
then "Ready to launch a run". A warning never holds a run; an error does.

## Where next

- [Meet Gye Nyame Gold](meet-gye-nyame-gold.md).
- [Create the organization and its legal entity](create-the-organization-and-its-legal-entity.md), step 1.
- [Pre-flight gates and findings](../reference/pre-flight-gates-and-findings.md).
