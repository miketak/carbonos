# Procedure 3: Activity data

**Objective.** Confirm that facts are recorded one at a time and in bulk,
that every correction and removal carries a reason and leaves a history,
that evidence attaches to a record, and that the register stays usable with
many records.

**Covers** [spec 02](../../specs/02-organization-and-facts.md),
[spec 04.2](../../specs/04.2-activity-periods-and-pro-rating.md),
[spec 04.4](../../specs/04.4-activity-data-quality-evidence-and-corrections.md)
and [spec 04.5](../../specs/04.5-bulk-import-and-activity-register.md).

**Estimated time:** 60 minutes.

**Run this procedure** before a release, and after any change to activity
records, the import, evidence or the register.

## Prerequisites

- Sankofa Gold plc as procedure 2 leaves it (entities E0 to E2, facilities
  S1 to S6, the streams of section D).
- A small PDF file and a PNG file on your computer, and any `.exe` or
  `.zip` file.
- A spreadsheet application that saves CSV.

## A. Recording facts

### A1. A record with its quality tier and uncertainty

1. Open **Activity data** and record: facility S1, stream Haul fleet,
   activity "Haul fleet diesel", 1250000 US-gallon, period 2025-06-01 to
   2025-06-30, source "Fuel register", evidence ref INV-2025-0631, quality
   Measured, tier **1**, uncertainty 2.

**Expected result:** the row shows the period, the stream under the
activity, "Tier 1 · Measured" and "±2%". A period start after today is
refused under the date fields ("The period start cannot be after
today."), and an end before the start with "Must not be before the period
start.".

Verdict: ☐ pass ☐ fail. Notes:

### A1a. A quantity of zero and an uncertainty above 100 are refused inline

1. Open the record form again. Type 0 in **Quantity** and 150 in
   **Uncertainty, ± % (optional)**. Save.

**Expected result:** the form stays open with "Quantity must be greater
than 0." under the quantity and "Uncertainty must be between 0 and 100."
under the uncertainty. No record is created. Cancel.

Verdict: ☐ pass ☐ fail. Notes:

### A2. The tier follows the method when left blank

1. Record: S5, stream Camp LPG, "Camp LPG", 18000 litre, 2025-04-30,
   quality **Estimated**, tier left as "Follow the method".

**Expected result:** the row shows Tier 4 · Estimated. Recording the same
facts again with quality Calculated shows Tier 3. (Both records stay;
procedure 5 classifies both and procedure 7 expects the two tiers in the
data-quality table.)

Verdict: ☐ pass ☐ fail. Notes:

### A3. An unregistered unit is allowed and says so

1. Record: S1, "ANFO explosives consumed", 8400, unit chosen as
   **Unregistered unit…** and typed `tonne ANFO`, 2025-08-31.

**Expected result:** the form says an unregistered unit only matches a
factor in the identical unit and to define it under Units as a multiple
of a registered one. The record saves and the row reads "8,400 tonne
ANFO".

Verdict: ☐ pass ☐ fail. Notes:

### A4. A record in a custom unit

1. Record: S1, "Diesel in drums", 5 **drum**, 2025-04-01.

**Expected result:** the unit picker offers "Drum (200 L) (drum), 1 drum =
200 litre"; the record saves.

Verdict: ☐ pass ☐ fail. Notes:

## B. Corrections and removals

### B1. A correction needs a reason and keeps the history

1. On the haul fleet diesel record, click **Correct**, change the quantity
   to 1200000 and try to save with the reason field empty.
2. Enter the reason "Dispensing log reconciled with the supplier invoice"
   and save.
3. Click **History (1)**.

**Expected result:** the save button stays disabled until the reason has at
least 5 characters. The history lists the correction with your email, the
time, the reason, and "Quantity: 1250000 → 1200000".

Verdict: ☐ pass ☐ fail. Notes:

### B2. A removal needs a reason and leaves a tombstone

1. Record a duplicate of the camp LPG record, then click **Remove** on it.
2. Confirm with the reason "Entered twice from the same log".

**Expected result:** the dialog keeps Remove disabled until a reason is
typed; after the reason, the record leaves the list ("Activity removed.").
(Procedure 5 shows an inventory that had reviewed it excluding it as a
removed record.)

Verdict: ☐ pass ☐ fail. Notes:

### B3. A facility with records cannot be removed

1. On **Facilities**, try to remove S1 with a reason.

**Expected result:** refused with "'Obuasi Ridge Open Pit' has recorded
activity data. Facts are the audit trail: remove or reassign its activity
records before deleting the facility.".

Verdict: ☐ pass ☐ fail. Notes:

## C. Evidence

### C1. Files and links attach to a record

1. On the haul fleet diesel record, click **Attach evidence**.
2. Attach the PDF, then the PNG, then add the link "Fuel register
   (SharePoint)" with a URL that starts with `https://`.
3. Try to attach the `.exe` or `.zip` file.

**Expected result:** the two files and the link are listed with your email
and the date; the file names download; the link opens in a new tab. The
binary is refused with "Attach a PDF, an image (PNG, JPEG, WebP), a
spreadsheet (XLSX, XLS, CSV) or a text file." The record's row now says
"3 attachments".

Verdict: ☐ pass ☐ fail. Notes:

### C2. Evidence is tenant-scoped

1. Copy a file's download URL from the dialog.
2. Open it in a context signed in as a user who is not a member.

**Expected result:** not found (a 404 problem detail).

Verdict: ☐ pass ☐ fail. Notes:

## D. Bulk import

### D1. The template

1. Click **Import CSV**, then **Download the template**.

**Expected result:** a CSV with the header
`facility,stream,activity_type,quantity,unit,period_start,period_end,data_source,evidence_ref,data_quality,data_quality_tier,uncertainty_percent,note`
and one example row.

Verdict: ☐ pass ☐ fail. Notes:

### D2. A file with a bad row imports nothing

1. In the spreadsheet, fill twelve rows: one per month of **2024** for
   S2, stream Mill grid supply, "Mill grid electricity", 4000 MWh plus the
   month number (4001 for January, 4012 for December, so E1 has
   quantities to sort), period the whole month, source "ECG invoice",
   evidence `ECG-2024-MM`, quality MEASURED, tier 1. (2024, not 2025: the
   2025 inventories of the later procedures exclude these rows as outside
   the reporting period, so the July 2025 record of procedure 5 stays the
   mill's only 2025 electricity and the scope 2 arithmetic of procedures 6
   and 7 holds.)
2. In row 5, replace the quantity with `4,0O0` (a letter O). Save as CSV
   and import it.

**Expected result:** "Nothing imported: 1 row rejected. Fix them and
upload the file again.", naming row 6 (the header is row 1) and
"quantity '4,0O0' is not a number". The register is unchanged.

Verdict: ☐ pass ☐ fail. Notes:

### D3. A clean file imports every row; the same file again is all duplicates

1. Fix row 5 and import the file.
2. Import the same file again.

**Expected result:** the dialog closes and the register grows by twelve.
The second import rejects all twelve rows ("duplicate: the same facility,
activity, quantity, unit and period already exist on file or earlier in
this file") and imports nothing.

Verdict: ☐ pass ☐ fail. Notes:

### D4. Unknown names are named

1. Import a one-row file whose facility is "Obuasi Depot" and whose stream
   is "Gensets".

**Expected result:** rejected with "no facility named 'Obuasi Depot'" (the
stream is checked only once the facility resolves).

Verdict: ☐ pass ☐ fail. Notes:

## E. The register

### E1. Search, filters and sorting

1. Type `LPG` in the search box.
2. Clear it, choose facility S2 and stream Mill grid supply.
3. Sort by quantity and flip the direction.

**Expected result:** the search narrows the list to the two camp LPG
records; the filters show the twelve imported rows (once a facility is
chosen the stream list shows only that facility's streams); the sort
reorders them by quantity and the direction button (labelled "Sort
ascending" or "Sort descending") flips the order.

Verdict: ☐ pass ☐ fail. Notes:

### E2. Paging

1. Import a file of 60 more rows (any facility, periods in 2024 so the
   later procedures exclude them, distinct evidence references so none is
   a duplicate).
2. Clear the filters.

**Expected result:** the register shows 50 rows and the footer "77
records, page 1 of 2"; **Next** shows the remaining 27. (The overview
shows a tick on "Record activity data", not a count.)

Verdict: ☐ pass ☐ fail. Notes:

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** XLSX import (save as CSV), importing classifications,
restoring a removed record, virus scanning of uploads.
