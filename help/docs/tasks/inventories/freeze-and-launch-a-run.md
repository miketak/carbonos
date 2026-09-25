---
owner: miketak
last_reviewed: 2026-09-24
---

# Freeze the inventory and launch a run

**Role needed:** Preparer, Reviewer or Owner.

A run is an immutable snapshot of the view: its lines, its exclusions,
its factors and the boundary version it cites. A run can only be
launched from a frozen inventory, and freezing cuts that boundary
version.

<!-- sources: LifecycleBar.tsx; PreflightPanel.tsx; InventoryDetailPage.tsx runs tab; Validation.java; specs 05, 05.1, 05.5; verified 2026-09-24 -->

## Freeze

1. Open the inventory. In the **Inventory lifecycle** card click
   **Freeze inventory**.
2. Read the dialog "Freeze the inventory?". It lists the five gates with
   their state and says what the freeze does: "This freezes the boundary
   and the activity view together and cuts boundary version *N*: an
   immutable record of the *N* facilities currently in the boundary
   with their accounting shares. Calculation runs will cite this
   version. You can reopen the inventory later with a reason; the
   version is kept."
3. Click **Freeze inventory**.

What you see: "Inventory frozen as boundary version 1." The header reads
"FROZEN · BOUNDARY v1"; the lifecycle card reads "Frozen. The boundary
and the activity view are read-only and runs are allowed. Reopen the
inventory as a draft to change either."

The freeze is refused while a record is unclassified, a departure from
the stream's scope is unjustified, or a draft record sits at a facility
in the boundary; the dialog names the records.

## Read the pre-flight

**Pre-flight checks** lists five gates. An error in **Reporting
boundary**, **Activity data completeness**, **Classification** or
**Emission factors** holds the launch: the panel reads **LAUNCH ON
HOLD** and each finding says what to do. A warning is a disclosure and
does not hold. An error in **Base year** holds only the final
designation: "Base year holds the final designation; runs stay
available." When every gate passes the panel reads **READY TO
LAUNCH**, with "Every gate passes; *N* carries a warning."

The findings are listed with what clears each in
[Reference](../../reference/index.md).

## Launch

1. Open the **Runs** tab and click **Launch calculation run**.

What you see: the run computes at once and its page opens, "Run 001",
with the report section by section and the four export links. See
[Read the report and fill the header](../reporting/read-the-report-and-fill-the-header.md).

Back on the **Runs** tab, each run is listed with its number, moment,
line count, boundary version and totals, and the actions **Mark as
final** and **Void…**.

## Reopen, recalculate, void

- **Reopen as draft**, in the lifecycle card of a frozen inventory,
  asks for a reason: "The boundary and the activity view become
  editable again. Boundary version 1 stays on the record with your
  reason, and the next freeze cuts a new boundary version." What you
  see: "Inventory reopened as a draft." and "1 boundary version cut" in
  the lifecycle card.
- A change to the view means a new run: "Recalculation creates a new
  run; earlier runs are kept."
- **Void…** on a run asks for a reason: "The run keeps its number,
  lines and totals on the record, marked VOIDED with your reason and
  your name. Run numbers are never reused. This cannot be undone." What
  you see: "Run 001 voided." and the row tagged VOIDED with "Voided by
  *email* on *moment*: *reason*". A final run
  is refused: "is designated final. Withdraw the designation, with a
  reason, before voiding it." So is a run of a published inventory: "A
  published inventory's runs are a record and cannot be voided."

## What changed elsewhere

- A freeze whose boundary differs from the base year's raises a
  recalculation candidate under **Base year**.
- The **History** card on the **Runs** tab records the freeze, the
  reopen with its reason, each run and each void.
