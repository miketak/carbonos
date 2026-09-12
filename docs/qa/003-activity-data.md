# Procedure 3: Activity data

**Objective.** Confirm that facts are recorded one at a time in the drawer
and in bulk with a preview, that a draft can hold a source until its figures
arrive and stays out of review until it is entered, that every record shows
how ready it is, that every correction and removal carries a reason and
leaves a history, that evidence attaches to a record and is listed as source
documents, and that the register stays usable with many records.

**Covers** [spec 02](../../specs/02-organization-and-facts.md),
[spec 04.2](../../specs/04.2-activity-periods-and-pro-rating.md),
[spec 04.4](../../specs/04.4-activity-data-quality-evidence-and-corrections.md),
[spec 04.5](../../specs/04.5-bulk-import-and-activity-register.md) and
[spec 04.6](../../specs/04.6-activity-register-drafts-readiness-and-source-documents.md).

**Estimated time:** 75 minutes.

**Run this procedure** before a release, and after any change to activity
records, the drawer, readiness, the import, evidence or the register.

## Prerequisites

- Sankofa Gold plc as procedure 2 leaves it (entities E0 to E2, facilities
  S1 to S6, the streams of section D).
- A small PDF file and a PNG file on your computer, and any `.exe` or
  `.zip` file.
- A spreadsheet application that saves CSV.

## A. Recording facts

### A1. A record with its quality tier and uncertainty

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Activity data** and click **Add activity**. | A drawer opens beside the table, headed "Add activity", with a "New activity" title and the sections Activity details, Source and traceability, Notes and a collapsed Data quality group. | | |
| 2 | Fill in: activity type "Haul fleet diesel", facility S1, stream Haul fleet, period 2025-06-01 to 2025-06-30, quantity 1250000, unit US-gallon, data source "Fuel register", document reference INV-2025-0631; open **Data quality** and set Measured, tier **1**, uncertainty 2. | Once the stream is chosen the drawer shows "Stream default: Scope 1 · Mobile combustion. Scope is confirmed in each inventory's review." and the stream's meter or supplier. | | |
| 3 | Click **Save**. | "Activity recorded." The drawer stays open on the saved record, now headed "Edit activity" with its number (ACT-0001 if this is the organization's first record) and a **Ready** pill. The row behind it shows "Haul fleet · ACT-0001", "Jun 2025", "1,250,000" over "US-gallon", Ready, and a paperclip reading "ref". | | |
| 4 | Enter a period start after today. | Refused under the date field ("The period start cannot be after today."). | | |
| 5 | Enter an end before the start. | Refused with "Must not be before the period start.". Close the drawer with **Esc**. | | |

### A1a. A quantity of zero and an uncertainty above 100 are refused inline

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Press **n**. In the new drawer type an activity type, 0 in **Activity quantity** and, under Data quality, 150 in **Uncertainty, ± %**. Click **Save**. | The drawer stays open with "Quantity must be greater than 0." under the quantity and "Uncertainty must be between 0 and 100." under the uncertainty. No record is created. | | |
| 2 | Clear the activity type, leave everything else empty and click **Save**. | "Enter quantity.", "Choose a unit." and "Enter the period start." appear under their fields; **Save** and **Save draft** need an activity type first. Press Esc. | | |

### A2. The tier follows the method when left blank

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Add: S5, stream Camp LPG, "Camp LPG", 18000 litre, 2025-04-30, method **Estimated**, tier left as "Follow the method". Save. | The saved record's Data quality group shows tier 4. | | |
| 2 | Add the same facts again with method Calculated. | Tier 3. | | |

Both records stay; procedure 5 classifies both and procedure 7 expects the
two tiers in the data-quality table.

### A3. An unregistered unit is allowed and says so

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Add: S1, "ANFO explosives consumed", 8400, unit chosen as **Unregistered unit…** and typed `tonne ANFO`, 2025-08-31. | The drawer says an unregistered unit only matches a factor in the identical unit and to define it under Units as a multiple of a registered one. The record saves and the row reads "8,400" over "tonne ANFO". | | |

### A4. A record in a custom unit

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Add: S1, "Diesel in drums", 5 **drum**, 2025-04-01. | The unit picker offers "Drum (200 L) (drum), 1 drum = 200 litre"; the record saves. | | |

## B. Readiness and the completeness banner

### B1. A record says what it lacks

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Look at the banner above the tabs. | "n of m records ready" with the share as a bar labelled "Record completeness", the line "Ready means the figures, a stream, a source and evidence are present; nothing here has been verified.", and "Resolve k items →" where k is the number not ready. The footnote reads "Review status reflects completeness, not assurance." | | |
| 2 | Open the ANFO record (click its row). | The pill reads "No stream +2" and the check box in the drawer lists No stream, Missing source and Needs evidence. | | |
| 3 | Choose the stream Explosives, type the data source "Magazine register" and the document reference "MAG-08-2025", give a reason and click **Save**. | The pill turns **Ready**; the drawer says "All completeness checks passed." and that it cites a reference with nothing attached. The banner's ready count rises by one. | | |
| 4 | Click **Resolve k items →**. | The **Needs attention** tab is selected and only records that are not ready are listed. Click **All records**. | | |
| 5 | Hover the paperclip on the haul fleet diesel row. | The tooltip reads "Reference INV-2025-0631, nothing attached". | | |

## C. Drafts

### C1. A draft holds a source until its figures arrive

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Press **n**, type "July dispensing", facility S1, stream Haul fleet, period 2025-07-01 to 2025-07-31, and click **Save draft**. | "Draft saved." The record is headed with a **Draft** pill and the drawer says "A draft, not yet a fact." with Missing quantity and Missing unit listed. A **Drafts** tab appears with a count of 1. | | |
| 2 | Change the period end to 2025-07-15 and click **Save draft** again. | Saved without asking for a reason; **History** shows nothing. | | |

### C2. A draft is visible to the gate and the coverage matrix but not to review

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open the 2025 corporate inventory of procedure 5 (or create a draft inventory with S1 in its boundary) and run **Review activity data**. | The draft is not among the reviewed records. | | |
| 2 | Read the pre-flight panel. | COMPLETENESS warns "1 draft record is not entered: ACT-00nn 'July dispensing' at Obuasi Ridge Open Pit (2025-07-01 to 2025-07-15). Complete or remove them before the run." | | |
| 3 | Read the period coverage matrix. | The Haul fleet row shows a half circle for July, tooltip "draft on file, data expected". | | |

### C3. Entering a draft leaves a trace, and a fact never goes back

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Back on Activity data, open the draft, type 96000 US-gallon, data source "Fuel register", document reference INV-2025-0731 and click **Save**. | "Record entered. It is now a fact." The pill turns Ready and the Drafts tab disappears. | | |
| 2 | Click **History (1)**. | "Entered from a draft" by your email, with every value and "Draft: true → false". | | |
| 3 | Change the quantity and click **Save**. | Refused until a reason of at least 5 characters is typed: a fact is corrected with a reason. | | |

## D. Corrections and removals

### D1. A correction needs a reason and keeps the history

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open the haul fleet diesel record, change the quantity to 1200000 and try to save with the reason field empty. | **Save** stays disabled until the reason has at least 5 characters. | | |
| 2 | Enter the reason "Dispensing log reconciled with the supplier invoice" and save. | "Record corrected. Past runs are unaffected." | | |
| 3 | Click **History (1)** in the drawer's header. | The history lists the correction with your email, the time, the reason, and "Quantity: 1250000 → 1200000". | | |

### D2. A removal needs a reason and leaves a tombstone

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Add a duplicate of the camp LPG record, then click **Remove** in its drawer header. | The dialog keeps Remove disabled until a reason is typed. | | |
| 2 | Confirm with the reason "Entered twice from the same log". | The record leaves the list ("Activity removed.") and the drawer closes. | | |

Procedure 5 shows an inventory that had reviewed it excluding it as a
removed record.

### D3. Several records are removed with one reason

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Add two throw-away records, tick both in the first column and click **Remove 2 selected**. | A dialog "Remove 2 records?" asks for one reason. | | |
| 2 | Confirm with "Test records". | "2 records removed." and the selection clears. | | |

### D4. A facility with records cannot be removed

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Facilities**, try to remove S1 with a reason. | Refused with "'Obuasi Ridge Open Pit' has recorded activity data. Facts are the audit trail: remove or reassign its activity records before deleting the facility.". | | |

## E. Evidence

### E1. Files and links attach to a record

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open the haul fleet diesel record and click the **Evidence** tab. | The evidence panel with "Attach a file" and the link form. | | |
| 2 | Attach the PDF, then the PNG, then add the link "Fuel register (SharePoint)" with a URL that starts with `https://`. | The two files and the link are listed with your email and the date; the file names download; the link opens in a new tab. The tab reads "Evidence 3" and the row's paperclip reads 3. | | |
| 3 | Try to attach the `.exe` or `.zip` file. | Refused with "Attach a PDF, an image (PNG, JPEG, WebP), a spreadsheet (XLSX, XLS, CSV) or a text file.". | | |

### E2. Evidence is tenant-scoped

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Copy a file's download URL from the panel. | | | |
| 2 | Open it in a context signed in as a user who is not a member. | Not found (a 404 problem detail). | | |

## F. Bulk import

### F1. The template

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Import CSV**, then **Download CSV template**. | The dialog is headed "Bulk entry", numbered steps 1 and 2. A CSV with the header `facility,stream,activity_type,quantity,unit,period_start,period_end,data_source,evidence_ref,data_quality,data_quality_tier,uncertainty_percent,note` and one example row downloads. | | |

### F2. A file with a bad row will not import

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the spreadsheet, fill twelve rows: one per month of **2024** for S2, stream Mill grid supply, "Mill grid electricity", 4000 MWh plus the month number (4001 for January, 4012 for December, so E1 has quantities to sort), period the whole month, source "ECG invoice", evidence `ECG-2024-MM`, quality MEASURED, tier 1. (2024, not 2025: the 2025 inventories of the later procedures exclude these rows as outside the reporting period, so the July 2025 record of procedure 5 stays the mill's only 2025 electricity and the scope 2 arithmetic of procedures 6 and 7 holds.) | | | |
| 2 | In row 5, replace the quantity with `4,0O0` (a letter O). Save as CSV and choose the file in step 2 of the dialog. | The file is checked at once: "Nothing will import: 1 row rejected. Fix them and choose the file again.", naming row 6 (the header is row 1) and "quantity '4,0O0' is not a number". **Add records** stays disabled. The register is unchanged. | | |

### F3. A clean file previews, then imports; the same file again is all duplicates

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Fix row 5 and choose the file again. | "Control totals" lists Obuasi Mill, Mill grid supply, 12 rows, 48,078 MWh. "12 records to add" lists each row with facility, period and a **Ready** pill, and "12 rows: reference only, nothing attached". | | |
| 2 | Click **Add records**. | "12 records imported." The dialog closes and the register grows by twelve. | | |
| 3 | Choose the same file again. | Every row is rejected ("duplicate: the same facility, activity, quantity, unit and period already exist on file or earlier in this file") and Add records stays disabled. Cancel. | | |

### F4. Warnings and unknown names

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Choose a two-row file for S1, stream Haul fleet, "Haul fleet diesel": one row of 300 litre for 2025-09-01 to 2025-09-30 and one of 100 US-gallon for 2025-10-01 to 2025-12-31, no source, no reference. | Two totals (litre and US-gallon); "Worth a look before adding" names the mixed units on row 3 and the period longer than one month; both rows show "Missing source +1". Cancel without adding. | | |
| 2 | Choose a one-row file whose facility is "Obuasi Depot" and whose stream is "Gensets". | Rejected with "no facility named 'Obuasi Depot'" (the stream is checked only once the facility resolves). | | |

## G. The register

### G1. Search, filters, tabs and sorting

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Press **/** and type `LPG`. | The search box takes focus and narrows the list to the two camp LPG records. | | |
| 2 | Clear it and type the number of the haul fleet diesel record (for example `ACT-0001`, `act1` or `1`). | That one record is listed. | | |
| 3 | Clear it, choose facility S2 and stream Mill grid supply, and set the period to any month of 2024. | One imported row for that month (once a facility is chosen the stream list shows only that facility's streams; the period's arrows step a month at a time). | | |
| 4 | Clear the period, sort by quantity and flip the direction. | The sort reorders them by quantity and the direction button (labelled "Sort ascending" or "Sort descending") flips the order. | | |
| 5 | Click the **Ready** tab, then copy the address bar into a new tab. | The same tab, filters and sort open from the link. | | |

### G2. Keys

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | With nothing focused, press **j** twice, then **Enter**. | The highlight moves down two rows and the second row opens in the drawer. | | |
| 2 | Press **Esc**, then **k**, then **Enter**. | The row above opens. | | |
| 3 | In the drawer, use the **‹** and **›** arrows beside "n/m". | The drawer moves through the records of the page; the row behind it is highlighted. | | |
| 4 | Click into the search box and press **j** and **n**. | The letters are typed; no row moves and no drawer opens. | | |

### G3. Paging

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Import a file of 60 more rows (any facility, periods in 2024 so the later procedures exclude them, distinct evidence references so none is a duplicate). | The import succeeds. | | |
| 2 | Clear the filters. | The register shows 50 rows and the footer "50 of 77 records, page 1 of 2". | | |
| 3 | Click **Next**. | Shows the remaining 27. | | |

The overview shows a tick on "Record activity data", not a count.

## H. Source documents

### H1. Every document with its record

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Source documents** in the switch beside the buttons. | A page headed "Source documents": an "Imported files" card listing each CSV with its rows and the records they became (ACT-00nn to ACT-00mm), size, who and when, and the start of its sha256 (the full digest on hover), then a card per document with kind and size, facility and period, and "ACT-00nn · activity →". | | |
| 2 | Click the record link on the haul fleet invoice. | The register opens with that record in the drawer. | | |
| 3 | Back on Source documents, search `invoice`, then choose **Links only** under Show. | The search narrows to the PDF; the filter lists the SharePoint link alone. | | |
| 4 | Choose **Record removed**. | The documents of the LPG duplicate removed in D2 (if any were attached) are listed with the record struck through and "(record removed)"; otherwise "No documents match". | | |
| 5 | Click **Download evidence index (CSV)**. | A CSV with the header `record_ref,activity_type,facility,period_start,period_end,evidence_ref,document,kind,url,content_type,size_bytes,uploaded_by,uploaded_at` and one row per document of a live record. | | |

### H2. Evidence of a calculated record stays on file

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | After procedure 7 has run the inventory, look at a document of a record that run calculated. | The card offers no **remove**; it reads "on a calculated run" and its tooltip says the evidence stays on file so the run remains traceable. | | |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** XLSX import (save as CSV), importing classifications,
restoring a removed record, virus scanning of uploads, a bulk evidence link,
a documented zero quantity (a draft must not stand for "nothing to report").
