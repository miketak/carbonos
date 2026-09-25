---
owner: miketak
last_reviewed: 2026-09-24
---

# Enter, correct, evidence and remove a record

**Role needed:** Preparer, Reviewer or Owner.

An activity record is a fact: what was consumed or produced, where,
when, and the document that says so. It carries no scope and no factor.
This page covers the drawer on **Activity data**: entering a record,
saving a draft, correcting a figure, attaching evidence, and removing a
record that should never have been entered.

<!-- sources: ActivityDrawer.tsx; ActivityPage.tsx; EvidencePanel.tsx; RemoveDialog.tsx; ActivityHistoryModal.tsx; SourceDocumentsPage.tsx; specs 04.5, 04.6; verified 2026-09-24 -->

## Enter a record

1. Open **Activity data** and click **+ Add activity**.
2. Fill **Activity type** (what the row is, for example `Boiler LPG`),
   choose **Facility**, and choose **Stream**. A record with "No stream"
   takes its default scope from the factor chosen later instead of from
   the stream.
3. Fill **Period start** and **Period end**: "The period the quantity
   covers, not the invoice date." A single reading has the same start
   and end.
4. Fill **Activity quantity** and choose **Unit**. The list holds the
   registered units and any custom unit defined under **Units**;
   "Unregistered unit…" lets you type a code the list does not have.
5. Fill **Data source** (the kind of document) and **Document
   reference** ("Invoice, meter reading or log number as printed on the
   document.").
6. Under **Data quality**, leave **Method** as "Measured" for metered or
   invoiced figures, or choose "Estimated" or "Calculated". **Quality
   tier** follows the method unless you set one of the five tiers; add
   **Uncertainty, ± %** where the source states it.
7. Click **Save**, or **Save draft** to keep a record with only the
   activity type and the facility.

What you see: "Record entered. It is now a fact." The row shows the
period, the quantity and the data status **Ready**. A draft shows
"Draft" with a dotted circle, and the drawer lists what is missing:
"Missing quantity", "Missing unit", "Missing period", "Missing source",
"Needs evidence". The **Needs attention** filter above the table counts
records that are not ready; **Ready** counts the rest.

## Correct a figure

1. Click the record's row. The drawer opens on the record.
2. Change the field, for example **Activity quantity**.
3. A **Reason for the correction** field appears: "Recorded with the
   old and new values in the record's history." Fill it.
4. Click **Save**.

What you see: the row shows the new value. Click **History** in the
drawer to read "Corrected by *email*" with the moment, your reason,
and "Quantity: 6000 → 60000".

What changed elsewhere: inventories that already reviewed the record
keep their classification of it. A published inventory that included it
shows the record under **Since publication** on its run's report page,
as "Plant grid electricity: quantity 60000 → 61000", and the report itself is
unchanged. See [Facts, views and runs](../../concepts/facts-views-and-runs.md).

## Attach evidence

1. In the drawer open the **Evidence** tab.
2. Either choose a file under **Attach a file** ("PDF, image,
   spreadsheet or text, up to 20 MB."), or fill **Link name** and
   **URL** and click **Add link** for a document that lives elsewhere.

What you see: "*file* attached." or "Link attached.", and the item
listed with who attached it and when. The row's attachments column
shows the count instead of "ref". "Files print on the run's lines and
in the calculation file; a link opens the document where it lives."

**Source documents**, the second tab of **Activity data**, lists every
file and link across the organization with the record it belongs to,
and offers **Download evidence index (CSV)**. Its **Show** filter has
"All documents", "Links only" and "Record removed".

## Remove a record

A record entered by mistake is removed, not deleted.

1. Open the record and click **Remove** at the top of the drawer.
2. Read the dialog: "The record stays on file as removed, with your
   name, the date and the reason; inventories that reviewed it exclude
   it on their next review. A record a run calculated cannot be
   removed."
3. Fill **Reason** and click **Remove**. The button stays disabled
   until a reason is given.

What you see: "Activity removed." The row leaves the register; the
record's documents stay listed under **Source documents** with the
"Record removed" filter. An inventory that reviews the organization's
records again excludes it with the reason "Record removed".
