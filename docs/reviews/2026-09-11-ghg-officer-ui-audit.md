# CarbonOS: GHG officer review (second engagement walkthrough)

Reviewer: certified GHG inventory practitioner (Corporate Standard, Scope 2 Guidance, Scope 3 Standard, ISO 14064-1), evaluating as a prospective customer through the UI only, three days after the first walkthrough and against the same scenario.
Date: 11 September 2026. App: local build of main (21e93ec) at http://localhost:5173, driven with Playwright and headless Chromium. Screenshot names in the Evidence lines refer to the capture folder from the walkthrough session; they are not stored in the repository.

Scenario used throughout: Asante Gold Resources Ltd (AGR), a mid-tier Ghanaian gold miner, reporting year FY2025, operational control, AR5, rebuilt from scratch in a fresh account so the two audits are comparable.
Legal entities: Nkawkaw Mining Ltd (100% subsidiary, owns the open pit), Obuom Processing JV (50% JV, AGR is operator, held through Nkawkaw), Wassa Gold Associates (30% associate, not operated), Tarkwa Logistics Ltd (100% subsidiary acquired 1 July 2025, recorded on the entity), Kumasi Exploration Ltd (60% subsidiary), Ahafo Camp Services JV (40% JV, partner-operated), Bonsu Royalty Holdings (5% fixed-asset investment), plus a probe entity (45% JV consolidated under IFRS 10) that was removed again.
Activity data: 36 records imported from one CSV plus one draft and four probes entered by hand: owned-fleet diesel (8.45 ML, later corrected to 8.46 ML), contractor diesel (3.1 ML, corrected to 3.16 ML after publication), genset diesel in m3, ANFO and emulsion explosives, R-410A and R-22 top-ups, grid electricity in kWh, MWh and GWh, six monthly electricity invoices, quicklime and cyanide purchases, LPG in kg and in litres, water, landfill waste, flights, hired cars, an estimated commuting record with no evidence, wood pellets, a "drum (200 L)" custom unit, a pre-acquisition record, a record straddling year end (15 Dec 2025 to 14 Jan 2026), a November 2024 record, an unregistered unit, a negative quantity, an end date before the start, and a record with no date.
Inventories built: FY2025 operational control (frozen, Run 001, reopened for instruments, Run 002 voided, Run 003 final, published, then corrected with a correction run), FY2025 equity share on AR6 copied from the operational-control view (frozen, run), FY2025 financial control (boundary only), FY2024 (boundary only), an 18-month probe, and an end-before-start probe.

## 1. Verdict

I would put a client on CarbonOS today for an operational-control Scope 1 and Scope 2 inventory with Scope 3 categories 1, 5, 6 and 7, on two conditions: the emissions-by-gas table is fixed before the report goes to a verifier, and the HTML report or the CSV exports, not the PDF, are treated as the issued document. Almost everything that stopped me on 8 September is gone: contractual instruments apply to the megawatt-hours they cover (market-based Scope 2 recomputed to the kilogram), the factor library is extensible with packs, provenance, validity and approval, runs are voided with a reason and never renumbered, the report exports as PDF, lines CSV, exclusions CSV and frozen-inputs JSON, activity records carry a period and are pro-rated by days, classifications and instruments are copied into corrections and new views, organizations have members with four roles and every act is attributed, and the report now has the header, the by-facility, by-entity, by-country and by-category tables, the factor register, the data-quality table and the "Since publication" block that Corporate Standard chapter 9 asks for. My recomputation of the Scope 1 diesel, the refrigerant, both Scope 2 totals and the Scope 3 lines agrees with the product to the rounding of the factor.

What stands in the way is shorter and more specific than last time. Section 05 (emissions by gas) sums to 50,121 t against an inventory total of 80,851 t because CO2e-only factors (the grid, landfill, water and travel lines) are dropped from the table without a reconciling row, and pro-rated lines carry their full-period gas masses, so the table a verifier tests first does not tie. The equity-share view built with "Copy the view from" inherited the operational-control exclusions of the 30% associate and the 40% JV and kept the leased head office in Scope 1 and 2, which is the Appendix F treatment that was right on 8 September and is wrong now. The PDF prints internal identifiers ("OPERATIONAL_CONTROL", "PURCHASED_GOODS_SERVICES", "GRID_AVERAGE") and its tables drift away from their headings. A platform administrator who is not a member sees and can administer every client organization and can delete one, with its published inventory, in two clicks. Pack-imported factors all cite "Selection from the DEFRA 2026, EPA Hub 2025, IPCC 2006 and NGA 2024 packs" as their source and appear two or three times in the classification list. Fix those and the tool is ready for a limited-assurance engagement.

## 2. Findings

### Stage A: accounts, access, collaboration

**F1. Organizations now have members with four roles, and every act is recorded under the member's own email.**
- Severity: none (positive). Area: Organization overview, Members; inventory History.
- What I did: Created AGR, read the Members panel, added a second user as Verifier, and read the inventory's History after freezing, classifying, running, voiding and publishing.
- What happened: Roles are Owner, Reviewer (approves and publishes), Preparer (records, classifies, runs) and Verifier (read-only). The History lists each classification, freeze, reopen, run, void and publication with the actor's email and a timestamp; run cards show "frozen ... by officer@review.test" and "Voided by officer@review.test".
- Why it matters: ISO 14064-1 clause 8 and Corporate Standard ch. 7 assume defined roles and a reviewable trail. This closes the blocker of the first walkthrough.
- Evidence: 08-agr-overview.png, 81-runs-after-void.png, 99-member-verifier-added.png.

**F2. The Verifier role is enforced by the server but not by the screen: a read-only user sees every write control and her saves fail without a message.**
- Severity: Major. Area: GHG home, Activity data, Inventory page (signed in as the Verifier).
- What I did: Signed in as Abena Owusu (Verifier on AGR) in a second browser, opened the GHG home, the activity register, a record drawer, and the published inventory; clicked "+ Add activity", filled a record and pressed Save; then sent the same request directly.
- What happened: The home shows "Edit" and "Delete" on the organization card and "New organization"; the register shows "Import CSV" and "+ Add activity"; the inventory page shows "Create correction", "Review activity data" and "Launch calculation run". The drawer opened and accepted input; Save produced a 403 ("This action needs the PREPARER, REVIEWER or OWNER role in the organization.") that the screen never showed; the drawer stayed open with no error. The record drawer for an existing fact correctly showed no Save button.
- Why it matters: A verifier given read-only access will try to attach a note or a file; a silent failure looks like a bug or, worse, like a saved change. ISO 14064-3 evidence-gathering relies on the verifier trusting what the system shows. The server-side check itself is correct.
- What to do: Hide or disable write controls by role; surface 403 responses as a message ("Your role is read-only in this organization").
- Evidence: 100-abena-ghg-home.png, 101-abena-agr-overview.png, 103-abena-inventory.png, 105-verifier-ui-write.png.

**F3. A platform administrator who is not a member sees and can administer every client's organization.**
- Severity: Major. Area: GHG home, Organization overview (Sankofa Gold plc).
- What I did: Signed in as the fresh admin account with no organizations and opened the GHG home, then the other team's organization "Sankofa Gold plc".
- What happened: The other team's organization is listed with "Edit" and "Delete"; its overview shows "Your role: ADMIN", its final run totals, its members with editable role selects and "Remove" buttons, and an "Add member" form. The Verifier account, by contrast, gets "Organization not found" for the same URL.
- Why it matters: A hosted GHG platform holds several clients' pre-publication inventories. Confidentiality and change-control (ISO 14064-1:2018 clause 8.2, and any verifier's IT-controls enquiry) require that access to an inventory be by membership, not by platform role. A support administrator may need break-glass access, but it must be explicit, logged and visible to the organization's owner.
- What to do: Restrict organization data to members; give administrators a separate, logged "assume access" action that the organization's history records.
- Evidence: 02-ghg-home.png, 05-sankofa-org-visible-to-officer.png, 104-abena-sankofa-attempt.png.

**F4. Adding a member whose account does not exist fails silently.**
- Severity: Minor. Area: Organization overview, Members.
- What I did: Typed an email with no account and clicked "Add member"; later typed the email of a user who had not yet activated.
- What happened: The request returned 404; the form kept the email and showed nothing. Once the account existed the same action succeeded with a 201.
- Why it matters: The preparer cannot tell whether the invitation worked. Not a standards point, a trust one.
- What to do: Show "No account with that email; add the user under Manage users first" and offer the link.
- Evidence: 92-add-member-unknown.png.

**F5. Request-access, approval, set-password email and activation status work; the password policy is now 12 characters with a letter and a digit.**
- Severity: none (positive). Area: Landing page, Admin > Users, Mailpit, Set your password.
- What happened: "Request received ... you'll get an email at abena@review.test" on the landing page; the request appeared under Access requests with Approve and Deny; after approval the Users table showed "Pending activation"; Mailpit received "Your CarbonOS access is approved" with a set-password link; an 8-character password was refused ("At least 12 characters, with a letter and a digit"); a compliant one signed the user in. "Add user" now issues a temporary password to share out of band instead of an email.
- Evidence: 93-landing.png, 94-request-submitted.png, 96-after-approve.png, 97-set-password.png, 98-weak-password.png.

**F6. Deleting an organization destroys its published inventories and runs after a two-click dialog with no typed confirmation and no reason.**
- Severity: Major. Area: GHG home, Delete organization.
- What I did: Clicked "Delete" on the AGR card (which holds a published, superseded inventory and a base year) and read the dialog, then cancelled.
- What happened: "Delete Asante Gold Resources Ltd? Its facilities, activity data, and past runs are removed with it." with Cancel and Delete. The same control is offered to a platform administrator on another team's organization (F3).
- Why it matters: A published report is a record the company has issued; ISO 14064-1:2018 clause 8.2 requires retention of the records that support it. Everywhere else the product now refuses hard deletion (runs are voided, records and entities are kept "on file as removed"); the organization is the one place where the whole trail can vanish.
- What to do: Block deletion while any inventory is published or any run is final; otherwise require a typed name and a reason, and keep a tombstone.
- Evidence: 131-delete-org-dialog.png.

**F7. The post-login splash is now a neutral loader.**
- Severity: none (positive). Area: Post-login splash.
- What happened: "Loading your workspace. Click or press any key to skip." The seven-tick checklist with "Verifying audit trail integrity" is gone.
- Evidence: 132-splash.png.

### Stage B: organization, legal entities, facilities

**F8. Table 1 consolidation logic is still correct, and the IFRS 10 control override works.**
- Severity: none (positive). Area: Legal entities, inventory boundary.
- What I did: Entered the seven entities and a probe 45% JV marked "Consolidated under financial control (IFRS 10), whatever the holding"; read the three share columns and the three inventories' boundaries.
- What happened: Operated 50% JV: 50% / 50% / 100%; associate not operated: 30% / 0% / 0%; 60% subsidiary: 60% / 100% / 100%; partner-operated 40% JV: 40% / 40% / 0%; fixed-asset investment 0% / 0% / 0%; the chain shows "50% through the chain"; the IFRS 10 probe shows "financially controlled by decision" with 45% / 100% / 100%. The financial-control inventory shows Ahafo at "40% economic interest (jointly controlled)" and Wassa at 0%.
- Why it matters: Corporate Standard ch. 3, Table 1, and the text that control is the ability to direct policies, not a percentage.
- Evidence: 10-entities-table.png, 13-ifrs10-override-row.png, 108-financial-control-boundary.png.

**F9. Entities carry acquisition and disposal dates and a jurisdiction, and the dates feed every inventory's membership window.**
- Severity: none (positive). Area: Add legal entity, inventory boundary.
- What happened: "Acquired on 2025-07-01" on Tarkwa Logistics appeared as "Member from 2025-07-01" in every new inventory without re-entry; the pre-acquisition record was excluded automatically ("Tarkwa Logistics Ltd: member from 2025-07-01"); a disposal date before the acquisition date was refused inline ("The disposal date is before the acquisition date."); 150% was refused inline ("Economic interest must be between 0 and 100.").
- Why it matters: Corporate Standard ch. 5 requires structural changes to be dated once and applied consistently.
- Evidence: 09-add-entity-dialog.png, 11-probe-150pct.png, 12-probe-disposed-before-acquired.png, 55-auto-excluded-rows.png.

**F10. Facilities carry country, grid region, type and lease, but the grid region is free text and does not pre-select the location-based factor.**
- Severity: Minor. Area: Add facility, Review activity data.
- What I did: Entered "GHA" for six sites and "XX-NOWHERE" for the seventh; classified the electricity records.
- What happened: Both values were accepted and printed ("Mine · grid XX-NOWHERE"). At classification the dropdown for a "grid GHA" site offered every Scope 2 factor including "Grid electricity (UK, 2025)" and the "Ecoriv 2025" figure, with nothing pre-selected; the dialog's promise that "its location-based factor is suggested" was not visible.
- Why it matters: Scope 2 Guidance ch. 6 ties the location-based factor to the grid where consumption occurs; the mapping is the first thing a verifier tests.
- What to do: Validate the region code against the imported grid packs and default the factor from it, with the year matching the reporting period.
- Evidence: 16-add-facility-dialog.png, 17-facilities-table.png.

**F11. Removed entities and records are kept "on file as removed" with a reason, but nothing in the UI shows them.**
- Severity: Minor. Area: Legal entities, Activity data, Source documents.
- What I did: Removed the probe entity and the probe record with reasons, then searched the register for "ACT-0037", filtered Source documents by "Record removed", and re-read the entities table.
- What happened: Both dialogs said the item "stays on file as removed, with your name, the date and the reason"; afterwards neither appears anywhere: the register search returns nothing, the entities table has no removed section, and the record number is simply skipped.
- Why it matters: Corporate Standard transparency principle and ISO 14064-1:2018 clause 8.2: a verifier who sees ACT-0036 followed by ACT-0038 will ask for ACT-0037.
- What to do: Add a "Removed" filter to the register and the entities table showing the tombstone with who, when and why.
- Evidence: 14-remove-entity-confirm.png, 45-remove-record-dialog.png, 130-removed-record-search.png.

**F12. A source-stream register per facility drives the default scope, including contractor-operated sources.**
- Severity: none (positive). Area: Facilities > Source streams; Review activity data.
- What happened: Streams have a kind (stationary, mobile, process, fugitive, purchased electricity, heat, waste, transport, travel, commuting, purchased goods, other), a fuel, a meter or supplier, and an "Operated by a contractor" flag; the Rocksure fleet stream reads "contractor-operated · defaults to Scope 3, 1. Purchased goods and services" and its record classified straight into Scope 3 category 1.
- Why it matters: Corporate Standard ch. 4 and the Scope 3 Standard cat 1 guidance; this was the most common misclassification risk in the first walkthrough (old F26).
- Evidence: 26-source-streams.png, 27-streams-nkawkaw.png, 56-classified-two-rows.png.

### Stage C: activity data entry and units

**F13. Records have a period, straddling records are pro-rated by days, and a monthly coverage matrix shows which months each stream has.**
- Severity: none (positive). Area: Record drawer, Review activity data, Pre-flight.
- What happened: "Period start" and "Period end" ("The period the quantity covers, not the invoice date"); the record for 15 Dec 2025 to 14 Jan 2026 was flagged "17 of 31 days fall inside the reporting period and the membership window: the run pro-rates it to 54.84%" and the line printed 160,000 litre at 54.84% = 233.53 t CO2e; the November 2024 record was excluded as "Outside reporting period"; the matrix shows filled and empty months per facility and stream. The inventory offers "Pro-rate by days (default)" or "Block the run until the record is split".
- Why it matters: Corporate Standard ch. 5 and ch. 7 on period attribution and structural changes. This closes old F9 (but see F44 for the gas masses on pro-rated lines).
- Evidence: 30-record-drawer.png, 55-auto-excluded-rows.png, 61-preflight-after-classification.png.

**F14. CSV import with a template, control totals, a row-by-row preview and a retained source file.**
- Severity: none (positive). Area: Activity data > Import CSV; Source documents.
- What I did: Downloaded the template, imported 36 rows covering seven facilities, read the preview, confirmed, and opened Source documents.
- What happened: Template columns include stream, period start and end, data source, evidence reference, data quality, tier and uncertainty. The preview printed control totals per facility and stream ("Nkawkaw Open Pit · Grid supply (ECG bulk) · 1 · 18,500,000 kWh"), warned on periods longer than a month, on a stream that mixes units ("drum, litre"), on rows without a stream and on a row without evidence; all 36 became ACT-0001 to ACT-0036. The uploaded file is kept with its SHA-256 digest and row range.
- Why it matters: ISO 14064-1:2018 clause 8.2 traceability from record to source document; this closes old F15.
- Evidence: 31-import-dialog.png, 32-import-preview.png, 33-register-after-import.png, 44-source-documents.png.

**F15. Evidence can be attached as files or links, prints on the run lines and in the lines CSV, and an evidence index is exportable.**
- Severity: none (positive). Area: Record drawer > Evidence; Source documents; run lines.
- What happened: Uploaded a PDF to ACT-0001; the line reads "Evidence: FUEL-NKW-2025-invoice.pdf"; the CSV has an evidence_files column; Source documents lists the file with facility, period, uploader and a link back to the record; "Download evidence index (CSV)" is offered. Pre-flight lists every record that "cites X but nothing is attached" as information.
- Why it matters: ISO 14064-3 sampling from a report line to the primary document. Closes old F13.
- Evidence: 36-evidence-tab.png, 37-evidence-uploaded.png, 44-source-documents.png.

**F16. Corrections need a reason and keep a history; removals need a reason; records a run has calculated cannot be removed.**
- Severity: none (positive). Area: Record drawer, Remove record.
- What happened: Save is disabled until "Reason for the correction" is filled; History shows "Corrected by officer@review.test ... Quantity: 8450000 → 8460000" with the reason; after publication a second correction produced "History (2)" and the toast "Record corrected. Past runs are unaffected."; the removal dialog says "A record a run calculated cannot be removed."
- Why it matters: Corporate Standard ch. 5 and ISO 14064-1:2018 clause 8.2. Closes old F14.
- Evidence: 38-history-after-correction.png, 45-remove-record-dialog.png, 123-fact-corrected-after-publication.png.

**F17. Data quality is a method, a five-tier score and a percentage uncertainty, and the report weights them.**
- Severity: none (positive). Area: Record drawer > Data quality; report section 8a.
- What happened: "Method" (Measured, Estimated, Calculated), "Quality tier" 1 to 5 with descriptions, "Uncertainty, ± %". The report prints "77.3% of the total rests on tier 1 data ... 30 of 30 lines record a quantitative uncertainty; weighted by emissions it is ±5.5%" with a tier table by scope, followed by the free-text uncertainty statement.
- Why it matters: ISO 14064-1 clause 9.3.1 and Scope 3 Standard ch. 7. Closes old F12.
- Evidence: 41-data-quality-expanded.png, 74-run1-top.png.

**F18. Bulk actions in the register are limited to removal; 24 of 36 imported rows without a stream had to be fixed one by one.**
- Severity: Minor. Area: Activity data register.
- What I did: Selected two rows; read the bar; used "Needs attention".
- What happened: The only bulk action is "Remove 2 selected". The import accepted rows without a stream (23 of 36) and the register then listed them under "Needs attention" with no way to assign a stream in bulk or from the import preview.
- What to do: Add bulk "Assign stream" and "Set data quality", and let the import preview create or map streams.
- Evidence: 42-bulk-selection.png, 43-needs-attention.png.

**F19. An unregistered unit is accepted with a warning and dead-ends at classification unless a factor exists in that exact unit.**
- Severity: Minor. Area: Record drawer.
- What happened: "Unregistered unit…" opened a free-text box ("bags-25kg") with the note "An unregistered unit only matches a factor in the identical unit. Define it under Units as a multiple of a registered unit and it converts." The record saved and showed "No stream +2". The defined custom unit "drum" converted correctly ("1 drum = 200 litre" on the line).
- What to do: Offer to define the unit from the drawer, or block save until it is defined.
- Evidence: 39-probe-unregistered-unit.png, 25-units-defined.png.

**F20. Mass-to-volume conversion works through a density, but the row stays "Unclassified" without saying why until a second dropdown is noticed.**
- Severity: Minor. Area: Review activity data (LPG in kg).
- What I did: Classified 12,000 kg of LPG with "LPG (/litre)".
- What happened: No request was sent and the row remained "Unclassified"; a line "kg meets a factor per litre: choose the density that converts between them to finish classifying." and a density select appeared beneath the factor. Choosing "LPG, 0.54 kg/litre (typical value)" classified the record; the line prints "12000 kg ÷ 0.54 kg/litre = 22222.222222 litre (density of LPG, typical value)" and the pre-flight warns "Replace it with the supplier's specification before a final run." A supplier density (GOIL CoA, 0.835) can be recorded under Units.
- Why it matters: This closes old F11 in substance; the remaining point is discoverability. Corporate Standard ch. 6 on unit consistency.
- What to do: Show a toast or inline status ("Density needed") when the factor is chosen; default the density from the stream's fuel.
- Evidence: 69-lpg-kg-retry.png, 71-preflight-frozen.png, 25-units-defined.png.

### Stage D: emission factor library

**F21. The factor library is extensible: packs, organization factors with full provenance, validity dates and an approval flag, and derived factors that arrive unapproved.**
- Severity: none (positive). Area: Emission factors.
- What I did: Imported the mining, Ghana grid, refrigerant, oil-and-gas and construction packs; added a DEFRA 2026 well-to-tank diesel factor by hand (0.62409 kg CO2e/litre, WTT- fuels, Diesel 100% mineral, with URL and validity 2025-01-01 to 2026-12-31); probed a negative value and a blank source.
- What happened: Packs list their source, count, GWP set and retrieval date; "a second import updates them in place". The add-factor form has scope, category (Scope 3 shows the 15 categories), unit, CO2e and per-gas values, a fossil-methane flag, source, URL, publication year, data year, validity and "Approved for use in runs"; the negative value and blank source were refused inline. "Grid electricity T&D losses, Ghana (derived)" imports as "Not approved" with the instruction to check the year's loss rate. "Only approved factors can be run."
- Why it matters: Corporate Standard ch. 6 and ch. 9 (factor documentation), Scope 2 Guidance §6.4. Closes old F17.
- Evidence: 19-factors-page.png, 20-add-factor-dialog.png, 23-add-factor-validation.png, 24-custom-factor-added.png, 134-factors-all-packs.png.

**F22. Sector-pack factors cite the pack, not the publication, and carry the pack's year as their publication year.**
- Severity: Major. Area: Emission factors (This organization's factors); report section 08 factor table; PDF.
- What happened: Every factor imported through a sector pack reads "Selection from the DEFRA 2026, EPA Hub 2025, IPCC 2006 and NGA 2024 packs: ..." as its source, followed by the underlying row, and "published 2026" even for IPCC 2006 Table 2.4 lime and clinker rows ("published 2026, data year 2006"). The report's factor table and the PDF repeat this wording for the diesel, grid, lime, explosives and landfill factors. The same rows imported directly from the DEFRA or Ghana pack cite the publication correctly.
- Why it matters: Corporate Standard ch. 9 requires the source of each factor; "a selection from four packs" is not a citation, and a wrong publication year defeats the vintage check a verifier runs on every factor (consistency principle, ch. 1).
- What to do: Store the underlying publication, table and year on each factor regardless of which pack delivered it; print the pack name separately.
- Evidence: 22-org-factors-after-import.png, 126-sector-packs-imported.png, 74-run1-top.png.

**F23. The same factor imported by several packs appears two or three times, and the classification list cannot tell them apart.**
- Severity: Major. Area: Emission factors; Review activity data.
- What I did: Imported five packs; read the organization factors and the classify dropdown of a litre record and of an electricity record.
- What happened: "Refrigerant R-410A leakage (/kg)" three times, every "Grid electricity, Ghana (year)" twice, "T&D losses, Ghana (derived)" three times (one approved by pack import, others not), "Liquid fuels: Diesel (100% mineral diesel)" per litre twice; 107 options with 6 identical labels in one dropdown; 182 organization factors after five packs. Which copy a preparer picks is invisible in the report.
- Why it matters: Consistency principle (ch. 1) and QA (ch. 7): two sites could use two copies of "the same" factor whose approval status or later update differs.
- What to do: De-duplicate on publication row across packs (one factor, several pack tags); show the pack and approval status in the dropdown; hide unapproved rows there.
- Evidence: 22-org-factors-after-import.png, 58-classify-retry.png, 134-factors-all-packs.png.

**F24. The shared library still offers an unsourced Ghana grid factor and an assumed district-cooling factor as "Approved", beside 2025 rows that mix vintages with the 2026 packs.**
- Severity: Minor. Area: Emission factors (Shared library).
- What happened: "Grid electricity (Ghana, Ecoriv 2025) 0.441 kg CO2e/kWh: a secondary estimate with no published derivation or data year; CO2 only. Ember publishes 0.469 ... Prefer the ghana pack's Ember figure" and "District cooling 0.12: Ecoriv assumption ... An assumption, not a published factor" are both status "Approved" and appear in the classify list next to the Ember rows. The shared rows are the 2025 UK edition ("LPG 1.557", "Water supply 0.149", "Petrol 2.162") while the packs are the 2026 edition; one inventory can and here did mix them (LPG at 2025, diesel at 2026).
- Why it matters: Corporate Standard ch. 6 vintage consistency; the labelling is honest, which is why this is minor, but "Approved" should mean something.
- What to do: Ship the shared library unapproved where the caveat says so; warn at pre-flight when factors of two editions of one publication are in the same run.
- Evidence: 19-factors-page.png.

**F25. Per-gas splits are rebuilt from rounded values, so line factors differ from the published figure in the sixth decimal.**
- Severity: Minor. Area: Emission factors; run lines.
- What happened: The shared "Diesel (100% mineral diesel)" is "rounded to 2.66 kg CO2e (published 2.66155, CO2 2.62818); the gas split apportions the rounded total" and shows CO2 2.6307. The pack row stores CH4 0.00001 and N2O 0.000125 kg per litre (rounded) and the run recomputes CO2e = 2.62818 + 0.00001 x 28 + 0.000125 x 265 = 2.661585 kg/litre, printed on every diesel line, against the published 2.66155 (bundled DEFRA 2026: 2.66155, CH4 1.0357e-05, N2O 1.2483e-04).
- Why it matters: Immaterial here (0.4 t on 32,779 t of diesel) but a verifier re-performing a line against the DEFRA flat file will see a number that is not in the publication.
- What to do: Store the published CO2e and the unrounded gas masses; derive, do not round.
- Evidence: 19-factors-page.png, 74-run1-top.png.

**F26. Still no HCFC-22 disclosure route, no cyanide, and the mining pack does not contain the purchased-goods factors its description promises.**
- Severity: Major. Area: Emission factors; Review activity data.
- What I did: Searched the classify list for R-22, cyanide, lime, cement, steel and grinding media after importing the mining pack whose card says "lime and cement as purchased goods, grinding media and steel ... Cyanide and tailings have no published factor: record a supplier factor."
- What happened: The refrigerant pack has 55 HFC, PFC, SF6 and NF3 rows and blends, none for HCFC-22 or any Montreal Protocol gas (the card says they "are shown for separate disclosure", but no row exists), so R-22 could only be excluded and its tonnage cannot be disclosed. For a tonne record the list offered only calcination factors (IPCC lime and clinker, Scope 1) plus construction aggregates and concrete rows; nothing for lime, cement, steel or grinding media as purchased goods (Scope 3 cat 1). Cyanide was excluded with "0" as the estimate (F35).
- Why it matters: Corporate Standard ch. 4 (report non-Kyoto gases separately as optional information; Montreal gases are not in the scopes) and Scope 3 Standard cat 1 minimum boundary. Purchased lime is a cat 1 line at every Ghanaian gold plant; forcing the calcination factor into Scope 3 with a proxy flag (as I did) is a workaround a verifier will question.
- What to do: Add "outside the scopes: Montreal Protocol gases" rows (HCFC-22 and the common HCFC blends) that report tonnes and, for information, CO2e; add DEFRA "Material use" rows for lime, cement, steel and other metals to the mining pack; add a supplier-factor template for cyanide.
- Evidence: 19-factors-page.png, 59-exclude-r22.png, 60-exclude-cyanide.png, 62-quicklime-scope3-proxy.png.

**F27. Under AR6 the R-410A factor is computed correctly (2,255.5) but its printed source still cites the AR5 potentials, and the biogenic methane GWP used (27.9) should be checked against Table 7.15.**
- Severity: Minor. Area: AR6 inventory report, factor table and section 05.
- What happened: The equity-share AR6 report prints "Refrigerant R-410A leakage 2255.5 / kg ... IPCC AR6" with the source "IPCC AR5 WG1 Table 8.A.1 100-year potentials (HFC-32 677, HFC-125 3,170) applied to the ASHRAE composition of R-410A"; 0.5 x 771 + 0.5 x 3,740 = 2,255.5 is the AR6 value, so the number is right and the citation is wrong. Section 05 says "Methane of fossil origin is converted at 29.8 and biogenic methane at 27.9"; my reference table (IPCC AR6 WG1 ch. 7, Table 7.15) gives 27.0 for non-fossil CH4 (27.2 in some AR6 tables). Fossil CH4 at 29.8 is correct (old F37 closed).
- What to do: Render the GWP citation from the GWP set actually applied; state the AR6 table and row used for non-fossil methane.
- Evidence: 107-equity-run.png.

**F28. The classification dropdown is filtered by unit family, not by the stream's kind, and a copied note misdescribes a pure gas.**
- Severity: Minor. Area: Review activity data; Emission factors.
- What happened: A litre diesel record was offered cement clinker (/tonne), all refrigerants (/kg) and coal (/tonne) because mass and volume bridge through density; a tonne record was offered the same list. The stream's kind ("fixes the categories it can be classified into") does not narrow the factor list. In the mining pack, "Refrigerant HFC-134a leakage" carries the blend note "Composition includes a component with no Kyoto potential ..." that belongs to HCFC blends.
- What to do: Filter by stream kind first, then unit; fix the note.
- Evidence: 58-classify-retry.png, 22-org-factors-after-import.png.

### Stage E: inventory setup, organizational and operational boundary

**F29. The boundary is pre-populated from Table 1, exclusions take a reason and detail, the declaration is checked against the lines, the residual-mix statement is explicit, the report header is configurable, and non-annual periods are flagged.**
- Severity: none (positive). Area: New inventory, Inventory page.
- What happened: "Start with every operation the approach includes in the boundary" ticked all entities with a non-zero share; Wassa, Ahafo and Bonsu were disabled with "Outside the boundary under operational control: 0% share from its Table 1 row. Record why it is left out"; the reasons print in the report ("Left out: Ahafo Camp Services JV (whole entity) · Methodology exclusion · ..."). Pre-flight warned "Scope 3 fuel energy related is declared as covered but no included record is classified into it" and the report prints "declared, not quantified: no reason recorded". "Residual mix available" must be stated. The header takes approved-by, assurance level, provider, statement reference, an uncertainty statement and intensity denominators. The 18-month probe drew "The reporting period 2024-07-01 to 2025-12-31 is not twelve months (18 months). Chapter 9 expects an annual inventory"; end-before-start was refused.
- Why it matters: Corporate Standard ch. 3, ch. 9; Scope 2 Guidance ch. 8; Scope 3 Standard ch. 11. Closes old F21, F22 (entity level), F23, F24 (warning), F34, F44.
- Evidence: 47-new-inventory-dialog.png, 50-boundary-exclusions.png, 53-preflight-draft.png, 117-18-month-inventory.png, 111-endstart-dialog.png.

**F30. "Copy the view from" copies boundary exclusions and scopes across consolidation approaches, so the equity-share view kept the 30% associate and the 40% JV excluded with operational-control reasons.**
- Severity: Major. Area: New inventory (Copy the view from); equity-share inventory boundary and report.
- What I did: Created "FY2025 Equity share (AR6)" copying the operational-control view; read its boundary and ran it.
- What happened: Wassa Gold Associates and Ahafo Camp Services JV stayed "left out with the entity: Methodology exclusion" with the copied detail "0% under operational control", although under equity share their Table 1 shares are 30% and 40% and the pre-populate rule would have included them. The run reported 65,505 t with no line for either. No pre-flight gate says "an excluded entity has a non-zero share under this approach".
- Why it matters: Corporate Standard ch. 3: under equity share the associate and the JV are in by definition; the copied text in the report is false for this view.
- What to do: When the approach differs, copy classifications but rebuild the boundary from Table 1; gate any exclusion whose entity has a non-zero share under the inventory's approach.
- Evidence: 106-equity-inventory.png, 107-equity-run.png.

**F31. Freezing is allowed while classification is on HOLD and a draft record is outstanding, and each reopen cuts a new boundary version that the report then cites beside a different "Version".**
- Severity: Minor. Area: Inventory lifecycle; report header.
- What happened: The first freeze went through with three unclassified records and "LAUNCH ON HOLD"; I reopened twice, so the final run cites "Boundary version 3" in section 01 while the header says "Version 1" (the correction chain). Reopening posts immediately with no reason prompt; the History records "reopened as a draft".
- What to do: Block freeze while classification holds (or say what the freeze is for); ask for a reopen reason; label the two versions differently ("boundary v3", "report version 1").
- Evidence: 66-freeze-dialog.png, 67-frozen.png, 68-reopen-dialog.png, 89-run3-published-header.png.

**F32. An excluded entity without facilities gets no reason field and does not appear in the report's exclusions.**
- Severity: Minor. Area: Inventory boundary; report section 09.
- What happened: Bonsu Royalty Holdings (5% fixed-asset investment) shows "Outside the boundary ... Record why it is left out" but no picker ("No facilities under this entity."); section 09 lists only Ahafo and Wassa.
- Why it matters: Corporate Standard ch. 9 asks for every excluded operation; a royalty holding is exactly the kind of interest a reader asks about (Scope 3 cat 15).
- What to do: Offer the reason field for every entity outside the boundary and print it.
- Evidence: 49-inventory-page-top.png, 74-run1-top.png.

### Stage F: review and classification

**F33. Scope is an explicit choice with a required justification when it departs from the factor's default, a proxy flag with justification exists, and the lease type is inherited from the facility.**
- Severity: none (positive). Area: Review activity data.
- What happened: Quicklime classified with the calcination factor in Scope 3 drew "'Quicklime (high-calcium lime) calcination' suggests Scope 1. Record why (a justification of at least 10 characters)"; the justification and the proxy justification are stored and printed; head-office rows read "Operating lease (leased in)" from the facility without re-entry; the contractor row defaulted to Scope 3 category 1.
- Why it matters: Corporate Standard ch. 4, Appendix F. Closes old F26 and F30.
- Evidence: 62-quicklime-scope3-proxy.png, 63-preflight-ready-to-freeze.png.

**F34. Scope is still locked for Scope 2 and Scope 3 factors ("inherent").**
- Severity: Major. Area: Review activity data.
- What I did: Read the scope select on the grid electricity, landfill and head-office electricity rows.
- What happened: The select is disabled (Scope 2 for electricity, Scope 3 for waste) with no override, while "any scope" fuels allow a change with justification.
- Why it matters: Ownership fixes the scope, not the factor: an on-site landfill is Scope 1 CH4, electricity consumed by a tenant at a leased-out asset is cat 13, electricity bought for resale is cat 3 (Corporate Standard ch. 4; Scope 3 Standard cat 3 and cat 13).
- What to do: Allow the override with the same justification mechanism.
- Evidence: 63-preflight-ready-to-freeze.png, 58-classify-retry.png.

**F35. Record exclusions require a numeric "Estimated emissions left out", so a preparer without a factor has to type 0, which the report then prints as an estimate.**
- Severity: Major. Area: Review activity data > Exclude; report section 09.
- What I did: Excluded the R-22 top-up and the 3,200 t of sodium cyanide as "Methodology exclusion" with justifications.
- What happened: The "Exclude" button stayed disabled until a number was entered; with "0" the report prints "Sodium cyanide purchased ... ~0 kg CO2e" and totals "Methodology exclusion 2 records 0 kg CO2e", while the "Outside boundary" reason correctly shows "3 not estimated". My justification had to say the 0 is a placeholder.
- Why it matters: Scope 3 Standard ch. 11 and Corporate Standard ch. 9: an exclusion must be justified and, where possible, sized; a false zero is worse than "not estimated". For R-22 the correct disclosure is tonnes of gas outside the scopes, not 0 kg CO2e.
- What to do: Allow "not estimated" for manual exclusions; add an "outside the scopes (non-Kyoto gas)" reason that prints the mass.
- Evidence: 59-exclude-r22.png, 60-exclude-cyanide.png, 74-run1-top.png.

**F36. The review renders every record with a 107-option select and no pagination in view; the inventory page took 8 seconds to load and accessibility snapshots timed out.**
- Severity: Minor. Area: Inventory page > Activity view.
- What happened: 36 rows produced a 215,000-character accessibility tree; the page loads in about 8 s on this machine and the browser stalled on several screenshots. A mine with thousands of monthly rows will not be usable in this layout.
- What to do: Paginate or virtualise the review; load the factor list once, or as a searchable picker.
- Evidence: 54-review-top.png.

**F37. Appendix F under equity share has regressed: the leased-in head office stays in Scope 1 and Scope 2 in the equity-share view.**
- Severity: Major (regression). Area: Equity-share inventory, Review activity data and report.
- What I did: Read the head-office rows and the by-facility table in the equity-share AR6 run.
- What happened: Every head-office row is labelled "Operating lease (leased in)" and shows the scope as "inherited"; the run puts 47.927 t in Scope 1 and 196.9 t in Scope 2 for Accra Head Office and nothing in category 8. On 8 September the same set-up moved these lines to Scope 3 category 8 under equity share (old F28).
- Why it matters: Corporate Standard Appendix F: under the equity-share and financial-control approaches the lessee of an operating lease reports the asset's emissions in Scope 3 category 8; under operational control in Scope 1 and 2. The copied "inherited" scope overrode the approach-dependent rule.
- What to do: Re-derive the lease treatment from the inventory's approach after a copy; never inherit a scope that Appendix F decides.
- Evidence: 107-equity-run.png, 106-equity-inventory.png.

### Stage G: market-based Scope 2

**F38. Contractual instruments now apply to the megawatt-hours they cover, the balance takes the grid average, each Quality Criterion is answered one at a time, a failed instrument is not applied, and both totals are always printed.**
- Severity: none (positive). Area: Market-based scope 2 instruments; report sections 04 and instruments.
- What I did: Added a 20,000 MWh PPA at Obuom (46,500 MWh consumed), 5,000 MWh of Ghana I-RECs at Nkawkaw (18,500 MWh), a 500 MWh Norwegian GO at the head office failing criterion 5, and a probe at -0.1 kg/kWh; ran the inventory.
- What happened: Obuom market-based "20,000,000 kWh at 0 kg/kWh (contract); 26,500,000 kWh at 0.468809 kg/kWh (grid average ...)" = 12,423.44 t; Nkawkaw 6,328.92 t; head office "the facility's instrument does not meet the Scope 2 Quality Criteria and was not applied"; the negative factor was refused ("kg CO2e per kWh must be 0 or more."). Instruments carry certificate reference, registry, vintage, retirement date, eight criteria, notes and evidence. Recomputed: 30,760.481 - 25,000 MWh x 0.468809 = 19,040.256 t, which is what the report prints. Without instruments Run 001 printed market-based = location-based with the statement that the grid average stands in.
- Why it matters: Scope 2 Guidance §6.2, ch. 7 Quality Criteria, ch. 8 dual reporting. Closes old F31, F32, F33, F34.
- Evidence: 75-instrument-ppa.png, 76-instruments-listed.png, 78-run2-scope2.png.

**F39. Copied instruments lose their criteria answers when the original had a "Not met" criterion.**
- Severity: Minor. Area: Copy the view from; equity-share instruments and report.
- What happened: The PPA and the I-RECs copied as "All eight met"; the failing GO copied as "Not applied: 8 unanswered" and the report says "not applied: 0 criteria not met, 8 unanswered" with "no certificate details recorded", although the original had one criterion "Not met" and full certificate details.
- What to do: Copy the answers and certificate fields verbatim.
- Evidence: 106-equity-inventory.png, 107-equity-run.png.

**F40. Instruments cannot be added while the inventory is frozen; the form disappears rather than showing read-only, so adding one costs a reopen and a new boundary version.**
- Severity: Minor. Area: Inventory page (frozen).
- What happened: After freezing, the instruments section showed only "No instruments recorded ..." with no form; "Reopen as draft" was needed, which cut boundary version 3 for a change that does not touch the boundary.
- What to do: Show the list read-only when frozen; consider letting instruments change without a boundary version, since runs snapshot them anyway.
- Evidence: 88-published.png, 67-frozen.png.

**F41. One record takes one factor, so well-to-tank and T&D-loss lines (Scope 3 category 3) cannot be produced from the fuel and electricity records that exist.**
- Severity: Major. Area: Review activity data; report section 02.
- What I did: Declared category 3 as covered, imported the Ghana T&D factor and added a WTT diesel factor; tried to classify the electricity and diesel records into category 3 as well.
- What happened: A record has a single classify select; the report prints "3. Fuel- and energy-related activities: declared, not quantified: no reason recorded". The only route is to duplicate every fuel and electricity record with a different activity type, which doubles the register and breaks the coverage matrix.
- Why it matters: Scope 3 Standard cat 3 minimum boundary (upstream emissions of purchased fuels and electricity, T&D losses); for a Ghanaian mine WTT diesel is 10 to 20% of Scope 1 diesel and T&D losses are around 20% of Scope 2, both material.
- What to do: Allow secondary classifications ("also apply: WTT diesel, cat 3; T&D losses, cat 3") on a record, or derive cat 3 lines automatically from Scope 1 fuel and Scope 2 electricity lines with the chosen upstream factors.
- Evidence: 74-run1-top.png, 24-custom-factor-added.png.

### Stage H: calculation runs

**F42. Runs are voided with a reason, keep their number and figures, and the history records it; there is no delete.**
- Severity: none (positive). Area: Inventory > Calculation runs.
- What happened: "Void…" opened "Void Run 002 (with instruments)? The run keeps its number, lines and totals on the record, marked VOIDED with your reason and your name. Run numbers are never reused. This cannot be undone."; the card then reads "VOIDED · Voided by officer@review.test on ...: reason"; the next label offered was "Run 003". (I voided Run 002 rather than Run 001 because the newest run sits first; the dialog named the run clearly, so the error was mine.)
- Why it matters: ISO 14064-1:2018 clause 8.2. Closes old F35.
- Evidence: 80-void-dialog.png, 81-runs-after-void.png.

**F43. "Mark as final" acts immediately, with no confirmation and no note.**
- Severity: Minor. Area: Inventory > Calculation runs.
- What happened: One click posted the finalisation; the FINAL badge appeared; there is no reason or reviewer note, unlike void, correction and removal.
- Why it matters: Corporate Standard ch. 7 (review and approval step); the final run is what the base year and the report attach to.
- What to do: Confirm with an optional review note; restrict to the Reviewer and Owner roles, as the Members text says.
- Evidence: 85-run3-final.png, 83-run3-top.png.

**F44. Pro-rated lines carry the full-period gas masses, so the by-gas table and the lines CSV overstate CO2, CH4 and N2O for records that straddle a period or a membership window.**
- Severity: Major (wrong number). Area: Run lines CSV; report section 05.
- What I did: Compared kg_co2e with co2_kg, ch4_kg and n2o_kg for ACT-0029 (160,000 litre, 15 Dec 2025 to 14 Jan 2026, pro-rated to 54.84%) in run-1-lines.csv.
- What happened: kg_co2e = 233,532.578 (pro-rated, correct) but co2_kg = 420,508.8 (= 160,000 x 2.62818, the full record), ch4_kg = 1.6 and n2o_kg = 20 (also full). The by-gas table therefore includes 187 t of CO2 that the scope totals do not. With a mid-year acquisition of a whole mine the same defect scales to thousands of tonnes.
- Why it matters: Corporate Standard ch. 9 requires emissions per gas in tonnes; the per-gas figures must tie to the CO2e totals for a verifier to accept either.
- What to do: Apply period_share (and the accounting share) to every gas column, not only to kg_co2e.
- Evidence: 74-run1-top.png, 83-run3-top.png (section 05; the CSV is in the export set).

**F45. The emissions-by-gas table omits every CO2e-only line without a reconciling row, so it sums to 50,121 t against a total of 80,851 t.**
- Severity: Blocker (required disclosure does not tie). Area: Report section 05; PDF section 5; lines CSV.
- What I did: Summed the by-gas rows of Run 003 (CO2 49,439.149 t; CH4 4.679 t CO2e; N2O 514.040 t CO2e; HFCs 163.498 t CO2e) and compared with the total; cross-checked in the CSV.
- What happened: The by-gas rows add to 50,121.4 t CO2e; the total is 80,850.9 t; the 30,729.5 t difference is the grid electricity (30,760 t), landfill, water, travel and commuting lines whose factors publish CO2e only, plus the pro-rating error of F44. Section 05 says only "Each gas in mass and in CO2e under IPCC AR5 100-year potentials"; the pre-flight warning claims "the by-gas table carries no CH4 or N2O for it, and the report says so", but the report does not, and it does not say the CO2 column excludes them either. The PDF's gas table has the same gap.
- Why it matters: Corporate Standard ch. 9 required information: "emissions data for all seven Kyoto gas groups separately in metric tonnes and in tonnes CO2e". A table that does not tie to the total is the first thing a verifier will fail under ISO 14064-3, and 38% of this inventory is missing from it.
- What to do: Add a row "CO2e from factors without a gas split" with its tonnes and the list of factors, so the table foots to the total; or attribute CO2e-only factors to CO2 with a footnote, which is what most reporters do for grid factors.
- Evidence: 74-run1-top.png, 83-run3-top.png.

**F46. Arithmetic reproduces from the displayed factors.**
- Severity: none (positive). Area: Run pages, lines CSV.
- What I did: Recomputed the Scope 1 diesel, the refrigerant, both Scope 2 totals, Scope 3 category 1 and category 5, and the AR6 factors from the factors the product displays (DEFRA 2026 diesel 100% mineral 2.66155 kg/litre with the gas split shown; Ember Ghana 2024 0.468809 kg CO2e/kWh; R-410A from 50% HFC-32 and 50% HFC-125 at AR5 677 and 3,170 and AR6 771 and 3,740; DEFRA 2026 C&I waste to landfill 520.58023 kg/t). All factors compared are in my bundled tables at the same values.

| Item | Recomputed | Product | Difference |
| --- | --- | --- | --- |
| Scope 1 diesel, owned fleet, 8,460,000 litre x 2.661585 (t CO2e) | 22,517.009 | 22,517.010 | -0.001 |
| Scope 1 diesel, straddling record pro-rated 17/31 (t CO2e) | 233.533 | 233.530 | +0.003 |
| Scope 1 R-410A, 85 kg x 1,923.5 (t CO2e, AR5) | 163.498 | 163.500 | -0.002 |
| Scope 1 total (t CO2e) | 33,701.580 with published 2.66155 | 33,702.011 with 2.661585 | -0.431 (F25) |
| Scope 2 location-based, 65,614,100 kWh x 0.468809 (t CO2e) | 30,760.481 | 30,760.481 | 0.000 |
| Scope 2 market-based, 25,000 MWh at 0, balance at grid average (t CO2e) | 19,040.256 | 19,040.256 | 0.000 |
| Scope 3 cat 1: contractor diesel + lime proxy + water (t CO2e) | 15,727.564 | 15,727.564 | 0.000 |
| Scope 3 cat 5: 310 t x 520.58023 (t CO2e) | 161.380 | 161.380 | 0.000 |
| AR6 diesel factor 2.62818 + 0.00001 x 29.8 + 0.000125 x 273 (kg/litre) | 2.662603 | 2.662603 | 0.000 |
| AR6 R-410A, 85 kg x 2,255.5 (t CO2e) | 191.718 | 191.718 | 0.000 |

- What happened: Every line shows quantity, conversion ("1,200 m3 → 1,200,000 litre", "1 drum = 200 litre", the density arithmetic), factor, accounting share, period share and result; equity shares of 50% and 60% and biogenic CO2 (45 t under operational control, 27 t under 60% equity) are applied consistently; the correction run states "0 lines added, 0 removed, 1 changed; +159.7 t CO2e in total", which is 60,000 litre x 2.661585.
- Evidence: 74-run1-top.png, 78-run2-scope2.png, 107-equity-run.png, 128-correction-run-report.png.

### Stage I: the inventory report

**F47. The report exports as PDF, lines CSV, exclusions CSV and frozen-inputs JSON, and the evidence index exports as CSV.**
- Severity: none (positive). Area: Run page.
- What happened: "PDF report" (6 pages), "Lines (CSV)" with 58 columns (record_ref, factor_id, kg_co2e_per_unit, gwp_set, accounting_share, period_days, covered_days, period_share, per-gas masses, market_based fields, stream, scope_justification, proxy_factor, data_quality_tier, uncertainty_percent, evidence_files, density fields), "Exclusions (CSV)" with reason, justification and estimate, and "Frozen inputs (JSON)" with the boundary version, every factor with its source, the instruments and the residual-mix statement. Download names carry the entity and year.
- Why it matters: ISO 14064-3 re-performance; Corporate Standard ch. 9. Closes old F38.
- Evidence: 74-run1-top.png, 44-source-documents.png.

**F48. The PDF prints internal identifiers, ISO timestamps and tables that drift away from their headings.**
- Severity: Major. Area: PDF report.
- What I did: Extracted the text of asante-gold-resources-ltd-2025-run-1.pdf.
- What happened: "Asante Gold Resources Ltd, OPERATIONAL_CONTROL approach", "Scopes covered: [SCOPE_1, SCOPE_2, SCOPE_3]. Scope 3 categories declared: [PURCHASED_GOODS_SERVICES, FUEL_ENERGY_RELATED, ...]", "Scope 2, market-based (GRID_AVERAGE)", "Assurance UNVERIFIED", "OUTSIDE_PERIOD", "METHODOLOGY"; "Prepared by officer@review.test, 2026-09-12T05:38:08.038809Z"; the residual-mix paragraph sits under heading 4 before the header table; the headings "Scope 3 by category", "By facility", "By legal entity", "By country" and "5. Emissions by gas" appear on page 1 with their tables on page 2 after the intensity lines; "9. Exclusions" and "10. Snapshot lines" appear before the wood-pellets factor row. The HTML report has none of these problems.
- Why it matters: The PDF is what goes to a board, a lender or the Ghana EPA. Corporate Standard ch. 9 asks for a report a reader can follow; enum names are not English and a table separated from its heading is misread.
- What to do: Render labels through the same dictionary as the HTML; keep heading and table together; format dates for the reader with a timezone.
- Evidence: 74-run1-top.png (the PDF file is in the export set).

**F49. Report content now covers the required information: header, boundary version, Scope 3 by category, by facility, entity and country, intensity, factor register with GWP and source, data-quality table, exclusions with justification, base year and profile, "Since publication".**
- Severity: none (positive). Area: Run page.
- What happened: Sections 00 to 10 as listed; the published run shows "Since publication: The report above reads exactly as it was published. What came after is listed here and nowhere else."; the base-year section separates "Other views ... They are not years of the base year's series and do not compare with it"; the methodology cites Corporate Standard ch. 3 Table 1 and Scope 2 Guidance ch. 4 and no longer cites internal specifications; the HFC sentence reads "HFC and PFC blends are converted from their component gases with the same potentials."
- Why it matters: Corporate Standard ch. 9, Scope 2 Guidance ch. 8, Scope 3 Standard ch. 11. Closes old F39 to F44.
- Evidence: 74-run1-top.png, 89-run3-published-header.png, 107-equity-run.png.

**F50. Wording and labelling: "Total emissions" tiles do not say which Scope 2 they use, "Version 1" and "Boundary version 3" sit in one report, and dates are in US locale with no timezone.**
- Severity: Minor. Area: Run page header and section 04.
- What happened: The KPI tiles show "Total emissions 80,850.91 t CO2e, Scope 2 30,760.48" without "location-based" (the footnote below the table says it); the header "Version 1" is the correction chain while section 01 says "Boundary version 3"; timestamps read "9/11/2026, 10:38:08 PM" in the HTML and "2026-09-12T05:38:08.038809Z" in the PDF for the same event.
- What to do: Label the tiles; rename one of the versions; print dates as "11 Sep 2026, 22:38 GMT".
- Evidence: 89-run3-published-header.png, 74-run1-top.png.

### Stage J: base year and recalculation

**F51. Base-year designation, policy, manual candidates, decision dialogs, and the rule that only same-series inventories are held all work.**
- Severity: none (positive). Area: Base year; pre-flight.
- What happened: Designation from the final run with threshold 5%, rationale and the transaction-date convention; "Raise a candidate" with trigger (methodology change or significant error), description, affected share or a comparison run; the 6% candidate came back "FLAGGED ... above the 5% threshold, recalculation required" and prints in every later report; "Record recalculated base" lists the base-year inventory's runs and "Decline" records the decision with a note (both inspected, not submitted); the equity-share view was "READY TO LAUNCH" and the correction read "This inventory is not held because its period does not follow the 2025 base year."
- Why it matters: Corporate Standard ch. 5. Closes old F45 (still holds) and F46.
- Evidence: 86-base-year-designated.png, 118-raise-candidate-dialog.png, 119-candidate-raised.png, 120-record-recalc-dialog.png, 121-decline-dialog.png, 122-correction-preflight.png.

**F52. The affected share of a manual candidate is typed or derived from a run id pasted by hand.**
- Severity: Minor. Area: Base year > Raise a candidate.
- What happened: "Comparison run id (optional): A run of the base-year inventory that applies the new method" expects a UUID; there is no picker and no link from a fact correction or a correction inventory to the candidate it would justify.
- What to do: Offer a run picker and a "raise from this correction" action on the correction inventory.
- Evidence: 118-raise-candidate-dialog.png.

### Stage K: lifecycle (freeze, final, publish, correction)

**F53. Publication freezes the report, corrections require a reason and inherit the view, the correction report prints the reason and a line-level diff, and the published view marks facts that changed since.**
- Severity: none (positive). Area: Publish, Create correction, published inventory page, correction run.
- What happened: "Publishing issues the report; nothing on this inventory can change afterwards."; the correction dialog's "Create correction" is disabled until "Reason for the correction" is filled; the correction opened with 30 classified and 6 excluded records and the three instruments; after the contractor fuel fact was corrected at organization level, the published inventory's row reads "Changed since publication: quantity" and the banner says "the activity view shows each record as the published run snapshotted it"; the correction run header reads "Version 2, supersedes FY2025 Operational control (AR5)" and "Against the published run: 0 lines added, 0 removed, 1 changed; +159.7 t CO2e in total."
- Why it matters: Corporate Standard ch. 5 and the transparency principle. Closes old F41, F48 (still holds), F49 and F50 (the button responded to a normal click this time).
- Evidence: 87-publish-dialog.png, 114-correction-dialog.png, 124-published-view-after-fact-correction.png, 128-correction-run-report.png.

**F54. Reopening a frozen inventory has no reason prompt.**
- Severity: Minor. Area: Inventory lifecycle.
- What happened: "Reopen as draft" posted immediately; the History says "reopened as a draft" without a why; each reopen and refreeze adds a boundary version (F31).
- What to do: Ask for a reason and record it with the version.
- Evidence: 68-reopen-dialog.png, 81-runs-after-void.png.

### Stage L: sector fit (Ghana mining, oil and gas, construction)

**F55. Sector packs for mining, oil and gas and construction exist, with a Ghana grid and T&D pack.**
- Severity: none (positive). Area: Emission factors > Factor packs.
- What happened: Mining (53 factors: fuels per litre, tonne and kWh, EPA non-road CH4 and N2O for mining equipment, explosives, lime and clinker calcination, refrigerants, waste, Ghana grid by year, T&D losses, travel, commuting, WTT), oil and gas (69: natural gas per m3 and scf, CNG, LNG, HFO, marine fuels, jet fuel and aviation turbine fuel, naphtha, refinery miscellaneous, SF6, WTT), construction (80), Ghana grid 2019 to 2024 from Ember with the caveat that no official factor exists, IPCC 2006 process defaults, NGA 2024 explosives, EPA refrigerant GWPs.
- Why it matters: Reference 05 of my practice notes lists these as the sources a West African inventory needs. Closes the coverage half of old F51.
- Evidence: 19-factors-page.png, 134-factors-all-packs.png.

**F56. Gaps remain for the stated markets: no flaring or venting methane factor, no HCFC line, no cyanide, no purchased lime, cement or steel in the mining pack, no land-clearing or tailings method.**
- Severity: Major. Area: Emission factors; classification.
- What happened: The oil-and-gas card says "Methane from venting and fugitives: use the site gas composition with the GWP set (1 kg CH4 at 28 under AR5), which the refrigerants pack does not carry; flaring per m3 needs the gas composition", and no row for CH4 as a gas, for flaring with a default efficiency, or for venting exists; a user would have to add a factor by hand from IPCC 2006 vol. 2 or the API Compendium. The mining pack's purchased-goods rows are absent (F26). R-22 still cannot be reported as tonnes outside the scopes. Nothing for land-use change on pit clearing or for tailings and mine-water treatment (IPCC 2006 vol. 4 and vol. 5 methods).
- Why it matters: Scope 1 flaring and venting are the dominant sources at any oil and gas client (Corporate Standard ch. 4; API Compendium); purchased reagents are the dominant cat 1 sources at a gold plant (Scope 3 Standard cat 1).
- What to do: Add a "gas as itself" factor family (CH4, N2O, CO2 vented) that multiplies mass by the GWP set; a flaring factor per m3 and per tonne with efficiency and composition inputs; DEFRA material-use rows to the mining pack; an outside-the-scopes HCFC family.
- Evidence: 134-factors-all-packs.png, 126-sector-packs-imported.png.

## 3. What works well

- Facts versus views is intact and now complete: activity records with periods, streams, evidence and data quality are shared; each inventory holds its own boundary version, classifications, exclusions and instruments; runs are immutable snapshots that can only be voided.
- Table 1 logic is correct for every relationship, chain holdings and all three approaches, with an IFRS 10 override and dated membership windows that default from the entity record.
- Market-based Scope 2 is right: coverage in MWh, per-criterion checks, failed instruments not applied, residual-mix statement, both totals always printed and recomputable to the kilogram.
- The pre-flight is specific and honest: pro-rating percentages, declared-but-empty categories, typical densities, CO2e-only factors, missing evidence, draft records, partial memberships, non-annual periods and base-year holds are all named with the record and the clause.
- Import preview with control totals and warnings, retained source files with digests, evidence attachments printed on lines and an evidence index: a verifier's sampling trail exists.
- Exports: PDF, lines CSV with record and factor identifiers, exclusions CSV and frozen-inputs JSON reproduce the run.
- Report content meets the chapter 9 list: header, boundary version, by facility, entity, country and Scope 3 category, factor register with GWP set and source, data-quality tiers weighted by emissions, exclusions with justifications, base year with policy and a filtered profile, "Since publication" and a correction diff.
- Base-year policy and recalculation candidates remain a textbook implementation of chapter 5, and now hold only the inventories that follow the base year.
- Membership with four roles and per-action attribution in the inventory history; server-side authorization refuses a verifier's writes with a clear message.
- Unit handling: dimension conversion, custom units, densities with supplier values, and per-tonne, per-litre and per-kWh fuel factors.

## 4. Not exercised

- "Record recalculated base" and "Decline" (dialogs inspected, not submitted, to keep the flagged state visible in reports).
- Deleting an organization or a facility with records (dialogs inspected and cancelled).
- The Preparer and Reviewer roles in a second browser (only Verifier was tested end to end); whether "Mark as final" and "Publish" are refused to a Preparer.
- Password reset for an existing user; disabling a user and the effect on attributed history.
- Concurrency: two members editing one inventory at the same time.
- Steam, heat and cooling Scope 2 lines; franchise relationship; downstream categories 9 to 14; the construction pack's rows in a run.
- Performance beyond 36 records and 182 organization factors (see F36 for what was already visible).
- Whether the "grid region" on a facility pre-selects a factor anywhere (F10 reports what was visible in the classify list).
- Profile picture and resume upload; the other team's Sankofa inventories beyond the read-only overview.
- The PDF's rendering of the equity-share and correction runs (only Run 001's PDF was read).

## 5. Top 10 priorities

1. F45 and F44: make the emissions-by-gas table foot to the total (a row for CO2e-only factors) and pro-rate the gas masses like the CO2e.
2. F37 and F30: re-derive Appendix F lease treatment and the boundary from the inventory's approach when a view is copied; gate exclusions of entities with a non-zero share.
3. F48: render the PDF with reader labels, keep tables with their headings, format dates; until then issue the HTML report and the CSVs.
4. F3 and F6: restrict organizations to members with a logged break-glass for administrators; block deletion of organizations holding published inventories or final runs.
5. F2 and F4: role-aware UI and visible error messages for refused writes and failed member additions.
6. F22 and F23: store the underlying publication and year on every pack factor; de-duplicate factors across packs and show pack and approval status in the picker.
7. F41 and F34: secondary classifications (or derived cat 3 lines) for WTT and T&D losses; scope override for "inherent" factors with justification.
8. F35 and F26: allow "not estimated" and an outside-the-scopes (Montreal gas) reason on record exclusions; add HCFC disclosure rows and the purchased-goods factors the mining pack promises.
9. F56: flaring, venting and gas-as-itself factors for oil and gas; land clearing and tailings methods for mining.
10. F36, F43, F54 and F31: paginate the review, confirm "Mark as final" with a note, ask for a reopen reason, and block freeze while classification holds.

## 6. Status of the 8 September findings

| Old | Title (short) | Status | Note |
| --- | --- | --- | --- |
| F1 | Organizations private to creator | Resolved | Membership and four roles; per-action attribution; see new F2 and F3 |
| F2 | Weak password policy, pending users hidden | Resolved | 12 characters with letter and digit; "Pending activation" shown |
| F3 | Splash claims audit-trail verification | Resolved | Neutral "Loading your workspace" |
| F4 | Table 1 logic correct (positive) | Resolved | Still holds; IFRS 10 override added |
| F5 | No entity dates, jurisdiction, control override | Resolved | Acquired, disposed, jurisdiction, IFRS 10; windows default from the entity |
| F6 | 150% silently rejected | Resolved | Inline "must be between 0 and 100" |
| F7 | Facilities lack country, grid, type, lease | Resolved | All four fields; grid region is free text and not enforced, new F10 |
| F8 | No confirmation or soft delete | Partly resolved | Reason and tombstone on removal; tombstone not visible anywhere, new F11 |
| F9 | Single date, no period | Resolved | Period start and end, pro-rating, coverage matrix; gas masses not pro-rated, new F44 |
| F10 | Free-text activity, no stream register | Resolved | Source streams per facility with kind, fuel, meter, contractor flag |
| F11 | Mass-to-volume and custom units dead-end | Resolved | Densities, custom units, per-tonne factors; discoverability, new F20 |
| F12 | Data quality is a three-way label | Resolved | Method, tier 1 to 5, uncertainty %, weighted table in the report |
| F13 | Evidence is a text reference | Resolved | Files and links, printed on lines and in CSV, evidence index |
| F14 | Correction without reason or history | Resolved | Reason required, history with old and new values, removal with reason |
| F15 | No import, search, filter, sort | Resolved | CSV import with preview, search, filters, sort, readiness tabs; bulk limited, new F18 |
| F16 | Basic validation present (positive) | Resolved | Still holds; end-before-start also refused |
| F17 | Read-only 17-factor library | Resolved | Packs and organization factors with provenance; gaps remain, new F26 and F56 |
| F18 | R-410A 2,088 labelled AR5 | Resolved | 1,923.5 under AR5 and 2,255.5 under AR6 from components; citation text lags, new F27 |
| F19 | Weak factor provenance | Partly resolved | Shared rows cite table and year; pack rows cite the pack, new F22; Ecoriv grid still approved, new F24 |
| F20 | Grid factor CO2 only, by-gas omits it | Partly resolved | Pre-flight warns; by-gas table still silent and does not tie, new F45 |
| F21 | Boundary not pre-populated | Resolved | Pre-ticked from Table 1; unticking needs a reason |
| F22 | Record exclusions have no justification | Resolved | Justification and estimate required; forced estimate, new F35 |
| F23 | Scope 3 declaration unchecked | Resolved | Pre-flight warns; report prints "declared, not quantified" |
| F24 | No warning for non-12-month periods | Partly resolved | 18-month warning added; fiscal-year labelling still by calendar year |
| F25 | Pre-flight gates (positive) | Resolved | Still holds and extended |
| F26 | Contractor fuel defaults to Scope 1 | Resolved | Contractor stream defaults to Scope 3 cat 1; justification on departures |
| F27 | Scope locked for Scope 2 and 3 factors | Open | Still disabled, new F34 |
| F28 | Appendix F lease treatment correct (positive) | Regressed | Leased office stays Scope 1 and 2 under equity share, new F37 |
| F29 | Classifications not carried over | Resolved | "Copy the view from" and correction inheritance; copies across approaches carry wrong exclusions, new F30 |
| F30 | No proxy-factor flag | Resolved | Proxy flag with justification, printed |
| F31 | Instrument applied to whole consumption | Resolved | Covered MWh and period; balance at grid average; recomputed exactly |
| F32 | Quality Criteria one checkbox | Resolved | Eight criteria, certificate, registry, vintage, retirement, evidence |
| F33 | Negative factor silently rejected | Resolved | "must be 0 or more"; residual-mix statement kept |
| F34 | Market-based omitted without instruments | Resolved | Always printed with the basis stated |
| F35 | Runs deletable, numbers reused | Resolved | Void with reason; numbers never reused |
| F36 | Arithmetic transparent (positive) | Resolved | Still holds within its inputs; see F44 and F45 for the by-gas table |
| F37 | AR6 uses 27.9 for fossil methane | Resolved | Fossil CH4 at 29.8; non-fossil value to confirm, new F27 |
| F38 | No export | Resolved | PDF, lines CSV, exclusions CSV, frozen inputs JSON |
| F39 | No Scope 3, facility, entity, country tables | Resolved | All present, plus intensity |
| F40 | Factors listed by name only | Resolved | Factor table with value, gases, GWP set, source |
| F41 | Published content drifts | Resolved | "Since publication" block; report reads as published |
| F42 | Profile mixes approaches | Resolved | "Other views" separated from the base-year series |
| F43 | Wording and spec references | Resolved | Chapter citations; HFC sentence rewritten |
| F44 | No report metadata | Resolved | Entity, contact, prepared by, approved by, published, version, assurance |
| F45 | Base-year policy well designed (positive) | Resolved | Still holds |
| F46 | Pending candidate blocks unrelated inventories | Resolved | Only inventories following the base year are held |
| F47 | Affected share typed by hand | Partly resolved | Comparison run id computes it; no picker, new F52 |
| F48 | Lifecycle model right (positive) | Resolved | Still holds |
| F49 | Correction without reason; published view drifts | Resolved | Reason required; "Changed since publication" marker; line diff |
| F50 | Create correction did not respond to click | Resolved | Normal click worked in this session |
| F51 | Sector coverage thin | Partly resolved | Sector packs added; flaring, venting, HCFC, cyanide, purchased lime and steel still missing, new F56 |
