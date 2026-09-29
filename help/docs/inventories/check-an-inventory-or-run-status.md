---
owner: miketak
last_reviewed: 2026-09-28
description: Each status an inventory and its runs can show, what it means and what moves it on, with the boundary version the freeze cuts and every run cites.
role: Anyone
---

# Check an inventory or run status

The badge in the workbench header reads the inventory's status and, from the first freeze on, its boundary version: **FROZEN · BOUNDARY v1**, then **FINAL · BOUNDARY v1** and **PUBLISHED · BOUNDARY v1** for Gye Nyame Gold.

<!-- sources: format.ts statusLabels; LifecycleBar.tsx (stateCopy, the freeze, reopen, withdraw and correction dialogs); InventoryDetailPage.tsx (runs tab, Run label, void dialog); InventoryService.java freezeBlockers; the old page reference/statuses-and-transitions.md (verified 2026-09-24 and 2026-09-26); specs 05.1, 05.2, 05.3 and 05.5; screen text from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt): "5 workbench", "7 after freeze", "7 runs listed", "8 after final", "8 after publish" -->

## Inventory statuses

| Status | What it permits | The lifecycle card says |
| --- | --- | --- |
| **DRAFT** | Edit the boundary, declaration, instruments, rules, classifications and exclusions. Runs are blocked. | "Draft. The boundary and the activity view are editable; runs are blocked until the inventory is frozen, which records a boundary version a verifier can trace every run back to." |
| **DRAFT** after a reopen | The same; the card counts the versions, "1 boundary version cut". | The same text. |
| **FROZEN · BOUNDARY v*N*** | Launch runs, void a run with a reason, read everything. | "Frozen. The boundary and the activity view are read-only and runs are allowed. Reopen the inventory as a draft to change either." |
| **FINAL · BOUNDARY v*N*** | Publish, or withdraw the designation. Runs can still be launched. | "Final. A run is designated the final result. Withdraw the designation to reopen the inventory, or publish it to issue the report." |
| **PUBLISHED · BOUNDARY v*N*** | Read the report as issued and create a correction. A launch is refused: "A published inventory cannot be recalculated. Create a correction that supersedes it." | "Published. The report was issued; nothing on this inventory can change. A correction is a new inventory that supersedes this one." |
| **PUBLISHED · SUPERSEDED** | Read only. **Where this inventory came from** links to the correction, "Superseded by a correction". | The published text. |

## What moves an inventory

| From | To | Act | Who | CarbonOS asks for |
| --- | --- | --- | --- | --- |
| (none) | Draft | **New inventory** | Preparer, Reviewer, Owner | Name, period, straddle treatment, consolidation approach and GWP set; optionally a view to copy from. |
| Draft | Frozen | **Freeze inventory** | Preparer, Reviewer, Owner | Confirmation in "Freeze the inventory?". Refused while a record "is not classified", lacks a scope justification, needs its lease scope re-derived under Appendix F, or "is a draft with data outstanding"; disabled while the boundary is empty. |
| Frozen | Draft | **Reopen as draft** | Preparer, Reviewer, Owner | A reason of at least 10 characters. The boundary version stays on the record. |
| Frozen | Final | **Mark as final** on a run | Reviewer, Owner | An optional review note. Refused while a line rests on a typical density or a blend on another GWP basis, or a base-year candidate is undecided. |
| Final | Frozen | **Withdraw final designation** | Reviewer, Owner | A reason of at least 5 characters. |
| Final | Published | **Publish** | Reviewer, Owner | Confirmation. The report is stored as issued. |
| Published | a new draft | **Create correction** | Reviewer, Owner | A name and a reason of at least 10 characters. The new inventory inherits the view and supersedes this one when published. |

## Run states

Runs are numbered per inventory, "Run 001" onward, and a number is never reused. Each row on the **Runs** tab reads "#001 Run 001", "11 lines · boundary v1", "86,412 t CO₂e" for Gye Nyame Gold.

| Marker | Meaning | Act | Who | CarbonOS asks for |
| --- | --- | --- | --- | --- |
| (none) | A completed run, readable and exportable. | **Launch calculation run** | Preparer, Reviewer, Owner | A **Run label**, prefilled with the next number. Disabled while the pre-flight holds the launch: "Resolve the blocking findings first". |
| **FINAL** | The designated result of the inventory. | **Mark as final** | Reviewer, Owner | See the inventory table. |
| **VOIDED** | Not to be relied on. Its number, lines and totals stay, struck through, with "Voided by *email* on *moment*: *reason*". | **Void…** | Preparer, Reviewer, Owner | A reason of at least 5 characters; a final run's designation must be withdrawn first, and a published inventory's runs cannot be voided. |

## Boundary version

| Moment | What happens to the version |
| --- | --- |
| Freeze | Cuts the next version, "boundary version 1 cut" in the history: the facilities in the boundary with their shares, and the declaration. |
| Reopen | Keeps it: "Boundary version 1 stays on the record with your reason, and the next freeze cuts a new boundary version." |
| Run | Cites the version current at the launch, "boundary v1" on the run row and the report cover. |
| Correction | Starts from the published view; its own freeze cuts its own version 1. |

To read why a freeze cuts a version, see [What is the inventory lifecycle?](what-is-the-inventory-lifecycle.md).
