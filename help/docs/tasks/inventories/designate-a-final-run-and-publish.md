---
owner: miketak
last_reviewed: 2026-09-24
---

# Designate a final run and publish

**Role needed:** Reviewer or Owner.

Marking a run as final names the run that stands as the inventory's
result. Publishing issues the report; after it, nothing on the inventory
can change.

<!-- sources: LifecycleBar.tsx stateCopy; InventoryDetailPage.tsx runs tab dialogs; specs 05.1, 05.5, 07.4; verified 2026-09-24 -->

## Mark a run as final

1. Open the inventory's **Runs** tab and click **Mark as final** on the
   run.
2. Read the dialog "Mark Run *N* as final?": "Run #*N* (*total*) becomes
   this inventory's final run: the report and the base year attach to
   it, and the inventory can be published. The designation, your name
   and your note are recorded in the history and printed in the report
   header."
3. Fill **Review note (optional)**, up to 500 characters, with what you
   checked.
4. Click **Mark as final**.

What you see: "Run *N* designated final." The header reads "FINAL ·
BOUNDARY v*N*", the run's row carries the tag FINAL, and the lifecycle
card reads "Final. A run is designated the final result. Withdraw the
designation to reopen the inventory, or publish it to issue the
report." with "Final designated by *email* on *date*: *note*".

The designation is refused while the **Base year** gate carries an
error, for example an undecided recalculation candidate above the
threshold. Runs stay available meanwhile; see
[When must I recalculate the base year?](../../concepts/base-year-and-recalculation.md).

**Withdraw final designation** asks for a reason and returns the
inventory to Frozen.

## Publish

1. Click **Publish** in the lifecycle card.
2. Read the dialog "Publish the inventory?": "Publishing issues the
   report; nothing on this inventory can change afterwards. A correction
   is a new inventory that supersedes it."
3. Click **Publish**.

What you see: "Inventory published." The header reads "PUBLISHED ·
BOUNDARY v*N*"; the lifecycle card reads "Published. The report was
issued; nothing on this inventory can change. A correction is a new
inventory that supersedes this one." with the moment of publication.
The only action left is **Create correction**. On the **Report** tab
the header fields are disabled.

On the final run's page, section 00 reads "Published *moment* by
*email*", and a block **Since publication** reads "The report above
reads exactly as it was published. What came after is listed here and
nowhere else." followed by "Nothing has changed since." A record
included in the run and changed later is listed there, for example
"Plant grid electricity: quantity 60000 → 61000", with the later
inventories over the period; the report itself does not move.

## What changed elsewhere

- The final run is the figure the base year uses if this inventory is
  designated the base year.
- A factor pack edition that applies from a date inside a published
  period cannot be accepted until the inventory is reopened by a
  correction.
- To restate the year, see [Correct a published inventory](correct-a-published-inventory.md).
