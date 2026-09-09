# CarbonOS: GHG officer review (first-engagement walkthrough)

Reviewer: certified GHG inventory practitioner (Corporate Standard, Scope 2 Guidance, Scope 3 Standard, ISO 14064-1), evaluating as a prospective customer through the UI only.
Date: 8 September 2026. App: local build of v0.5.0 at http://localhost:5173, driven with headless Chromium. Screenshot names in the Evidence lines refer to the capture folder from the walkthrough session; they are not stored in the repository.

Scenario used throughout: Asante Gold Resources Ltd (AGR), a mid-tier Ghanaian gold miner, reporting year FY2025, operational control, AR5.
Legal entities: Nkawkaw Mining Ltd (100% subsidiary, owns the open pit), Obuom Processing JV (50% JV, AGR is operator, held through Nkawkaw), Wassa Gold Associates (30% associate, not operated), Tarkwa Logistics (100% subsidiary acquired 1 July 2025), Kumasi Exploration (60% subsidiary), Ahafo Camp Services (40% JV, partner-operated), Bonsu Royalty Holdings (5% fixed-asset investment).
Activity data: 30 records covering owned-fleet diesel (8.45 ML), contractor diesel (3.1 ML), genset diesel entered in m3, ANFO and emulsion explosives, petrol, R-410A and R-22 top-ups, grid electricity in kWh, MWh and GWh, quicklime and cyanide purchases, LPG in kg and in litres, water, landfill waste, flights, hired cars, commuting, wood pellets, a custom "drum (200 L)" unit, an estimated record with no evidence, a pre-acquisition record, and probes (negative quantity, missing date, 2024 date).
Inventories built: FY2025 operational control (frozen, run, final, published, then corrected), FY2025 equity share on AR6 (run), FY2025 financial control (boundary only), FY2024 and an 18-month probe.

## 1. Verdict

I would not adopt CarbonOS for a client inventory today, but it is closer than most first-generation tools and its skeleton is right. The separation of facts (activity records) from accounting views (inventories), frozen boundary versions, the Table 1 logic for every relationship including chains and Appendix F lease treatment, the pre-flight gates, the base-year policy with recalculation candidates, and the correction-supersedes-publication lifecycle are all things a verifier will like. What stands between it and a verifiable inventory is a short list of accounting errors and gaps, not a redesign: the market-based Scope 2 calculation applies a contractual instrument to a facility's entire consumption (a 20 GWh PPA zeroed 46.5 GWh, understating market-based Scope 2 by roughly 11,700 tCO2e); the emission factor library is 17 read-only factors with a mislabelled GWP set (R-410A at 2,088 is AR4, labelled AR5) and an unsourced Ghana grid factor, with no way to add a supplier-specific, national, or client-specific factor; calculation runs can be deleted with one click and no confirmation despite being described as immutable; nothing can be exported (no PDF, CSV, or evidence pack); the report has no Scope 3 by category, no by-facility or by-entity table, no factor values and vintages, no data quality or uncertainty statement; activity records carry a single date rather than a period; and every inventory and every correction requires re-classifying every record from scratch. Fix those and I would put a client on it.

## 2. Findings

### Stage A: accounts, access, collaboration

**F1. Organizations are private to the user who created them; a client team cannot work on the same inventory.**
- Severity: Blocker (for any real engagement). Area: GHG accounting home, Manage users.
- What I did: As admin, approved the access request from "Abena Owusu" (client analyst), followed the set-password link from Mailpit, signed in as her, opened GHG accounting and then the organization URL directly.
- What happened: Her GHG home says "No organizations yet". The organization I created as admin does not appear; the direct URL sent her to login. Roles are only "Member" and "Admin" (Add user dialog).
- Why it matters: An inventory is prepared by site data owners, reviewed by a sustainability lead, and inspected by a verifier. ISO 14064-1 §8 (inventory quality management) and the Corporate Standard ch. 7 assume defined roles and a review step. With per-user silos, one login has to be shared, which destroys the audit trail (every action shows "officer@review.test").
- What to do: Make organizations tenant-level with membership and roles (preparer, reviewer/approver, read-only verifier). Record who classified, froze, finalised, and published.
- Evidence: 06-admin-users.png, 09-add-user-dialog.png, 15-member-ghg.png, 73-member-org-access.png.

**F2. Request-access flow works, but password policy is weak and the approved user does not appear in the Users list until activation.**
- Severity: Minor. Area: Landing page, Admin > Users.
- What I did: Submitted a request, approved it, read the email, set a password of 12 characters.
- What happened: Flow works end to end ("Abena Owusu approved, setup email sent"). Minimum password length is 8 characters, no other rule. After approval the Users table still said "1 team member".
- Why it matters: Verifiers ask about access controls when inventory data is in a hosted system. Not a standards issue, a credibility one.
- What to do: Show pending-activation users; adopt a stronger password policy or SSO.
- Evidence: 10-after-approve.png, 13-set-password.png, 14-after-set-password.png.

**F3. Loading screen claims "Verifying audit trail integrity" and "Calibrating consolidation models".**
- Severity: Minor. Area: Post-login splash.
- What happened: A decorative checklist of seven ticks appears on every login.
- Why it matters: A verifier who sees "Verifying audit trail integrity" will ask what was verified. Nothing was. Marketing copy that imitates assurance language undermines trust.
- What to do: Remove or replace with a neutral loader.
- Evidence: 05-after-signin.png.

### Stage B: organization, legal entities, facilities

**F4. Table 1 consolidation logic is correct, including ownership chains and all three approaches.**
- Severity: none (positive), recorded for completeness. Area: Legal entities, inventory boundary.
- What I did: Entered the seven entities; checked the computed shares under equity share, financial control, and operational control.
- What happened: JV operated by AGR: 50% / 50% / 100%. Associate not operated: 30% / 0% / 0%. 60% subsidiary: 60% / 100% / 100%. Partner-operated 40% JV: 40% / 40% / 0%. Fixed-asset investment: 0% under all. JV held through a subsidiary shows "50% through the chain".
- Why it matters: This matches Corporate Standard ch. 3, Table 1, and the guidance on applying the policy at every level.
- Evidence: 19-entities-table.png, 56-equity-boundary.png, 66-financial-control-boundary.png.

**F5. Entities have no effective dates, jurisdiction, or control-rights override at organization level.**
- Severity: Major. Area: Add legal entity.
- What I did: Added "Tarkwa Logistics Ltd (acquired 1 Jul 2025)". The only place to record the acquisition date is the per-inventory "Member from" field, which I found only after ticking the entity into a boundary.
- What happened: The organization-level entity record has no acquisition or disposal date, no country, and no way to record that a 40% holding is consolidated under IFRS 10 (financial control without majority). "Held through" and "Operated by the company" are the only qualifiers.
- Why it matters: Corporate Standard ch. 5 requires structural changes to be dated for base-year recalculation; ch. 3 defines financial control by the ability to direct policies, not by percentage. A client with a 45% consolidated subsidiary cannot express it. The per-inventory "Member from" is a good mechanism but it must be entered again in every inventory, and the pre-acquisition activity record was only caught because I had entered the date there.
- What to do: Add effective-from/to dates, jurisdiction, and a "consolidated under IFRS 10 / financially controlled" override on the entity; default "Member from" in each inventory from those dates.
- Evidence: 18-add-entity.png, 30-tarkwa-member-from.png.

**F6. Economic interest above 100% is silently rejected.**
- Severity: Minor. Area: Add legal entity.
- What I did: Entered 150% economic interest.
- What happened: The dialog stayed open with no visible message (the browser's native number-range validation is the only guard).
- What to do: Show an inline validation message; also validate that legal ownership and economic interest are both between 0 and 100 and warn when they differ materially.
- Evidence: 19-err-Probe_150pct.png.

**F7. Facilities carry no country, grid region, facility type, or lease flag.**
- Severity: Major. Area: Add facility.
- What happened: A facility is name, free-text location, and legal entity. Nothing drives the choice of grid factor; "Grid electricity (UK)" is offered for a mine in Ghana. Lease status has to be re-declared per activity record per inventory.
- Why it matters: Scope 2 Guidance §6.3 requires the location-based factor for the grid where the facility sits; a verifier tests that factor-to-facility mapping. Lease treatment (Appendix F) is a property of the site, not of each fuel record.
- What to do: Add country and grid region (auto-select the location-based factor), facility type, and lease-in/lease-out flags with dates; inherit them on records.
- Evidence: 18-add-facility.png, 20-facilities-table.png.

**F8. Removing a facility or entity with dependencies is blocked (good), but there is no confirmation and no soft delete anywhere.**
- Severity: Minor. Area: Facilities, Legal entities, Activity data.
- What I did: Tried to remove Kumasi Exploration Camp (has records, in a published boundary) and Nkawkaw Mining Ltd (has facilities).
- What happened: Both blocked with clear messages ("Facts are the audit trail: remove or reassign its activity records before deleting the facility"). But a facility without records, an entity without facilities, and any activity record are removed instantly with no confirmation.
- What to do: Add a confirmation step and a soft-delete/undo with audit entry.
- Evidence: 71-remove-facility.png.

### Stage C: activity data entry and units

**F9. Activity records have a single date, not a period.**
- Severity: Blocker. Area: Record activity.
- What I did: Entered annual totals dated 2025-12-31 (the only way to enter a year's fuel), plus a Tarkwa Jul-Dec record and a Jan-Jun pre-acquisition record.
- What happened: The date is used to test membership windows and the reporting period. A record dated 31 December for a full year's consumption is included 100% in an inventory even if the entity joined on 1 July. The Jan-Jun record was caught only because I dated it 30 June. A record dated 2024-11-15 was accepted in the organization and would silently fall out of the FY2025 view.
- Why it matters: Corporate Standard ch. 5 and ch. 7: data must be attributable to the reporting period and pro-rated across structural changes. Verifiers test period cut-off first. With a single date, monthly meter reads straddling year-end, quarterly invoices, and mid-year acquisitions cannot be represented.
- What to do: Give records a period start and end; pro-rate or block records that straddle a membership window or period boundary; show period coverage per facility per stream (which months have data).
- Evidence: 21-record-activity-dialog.png, 23-activity-table.png, 41-preflight-after-classification.png.

**F10. Activity is a free-text label; there is no activity type, fuel, or meter register.**
- Severity: Major. Area: Record activity, Review activity data.
- What happened: "Activity" is a text box ("e.g. Diesel consumption"). The factor list offered at classification is filtered by unit dimension only, so "Diesel - standby gensets" offers Diesel, LPG, Natural gas, Petrol and Water supply. Nothing prevents choosing Petrol for diesel or "Waste to landfill" for cyanide.
- Why it matters: Completeness checks (ISO 14064-1 §9.3.3, Corporate Standard ch. 7) need a controlled list of source streams per facility so that a missing stream is visible. Free text also blocks year-on-year consistency.
- What to do: Add a source-stream register per facility (fuel type, meter, supplier) and derive the factor candidates from it.
- Evidence: 21-record-activity-dialog.png, 31-review-activity.png.

**F11. Unit handling: dimension conversion works, but mass-to-volume and custom units dead-end.**
- Severity: Major. Area: Record activity, classification.
- What I did: Entered genset diesel as 1,200 m3, electricity as MWh and GWh, LPG as 12,000 kg, diesel as "150 drum (200 L)".
- What happened: m3 to litre and MWh/GWh to kWh conversions are correct and printed on the line ("1,200 m3 -> 1,200,000 litre"). LPG in kg could only be matched to per-tonne factors (ANFO, quicklime, waste), not to LPG per litre; there is no density conversion, and no LPG per-tonne factor. The custom unit is explicitly told "won't auto-convert" and no factor matched, so the record had to be excluded. Correcting the record after publication was the only way out.
- Why it matters: LPG, HFO, and coal are invoiced by mass in Ghana; diesel is often in drums or in tonnes at remote sites. A verifier will not accept an exclusion caused by a unit mismatch.
- What to do: Add per-tonne fuel factors (DEFRA publishes tonnes, litres and kWh for every fuel), a density table, and a custom-unit definition (1 drum = 200 litre) that converts.
- Evidence: 22-custom-unit.png, 47-run-page.png (exclusions block), 87-fact-corrected.png.

**F12. Data quality is a three-way label; no tier, score, or uncertainty.**
- Severity: Major. Area: Record activity, report.
- What happened: "Measured / Estimated / Calculated" only. Pre-flight lists estimated and calculated records as information. The report does not mention data quality or uncertainty at all.
- Why it matters: ISO 14064-1 §9.3.1 requires a description of uncertainty; the Corporate Standard ch. 7 asks for a data quality assessment; the Scope 3 Standard ch. 7 defines a five-tier data quality scoring. Verifiers score materiality by the share of the inventory on estimated data.
- What to do: Add a scored tier per record (or per stream), a percentage uncertainty where known, and print a data-quality table and a qualitative uncertainty statement in the report.
- Evidence: 21-record-activity-dialog.png, 47-run-page.png.

**F13. Evidence is a text reference; no attachment, no evidence pack.**
- Severity: Major. Area: Record activity, report.
- What happened: "Evidence ref (optional)" takes "Invoice #2938". No upload, no link, and the reference is not printed on the report lines.
- Why it matters: ISO 14064-3 sampling starts from a line in the report and traces to the primary document. Without a stored document or at least the reference on the line, every sample is a manual chase.
- What to do: Allow file attachments or document links per record; print the evidence reference and record ID on each snapshot line.
- Evidence: 21-record-activity-dialog.png, 47-run-page.png.

**F14. Record correction has no reason field and no visible history; removal is instant and unlogged.**
- Severity: Major. Area: Activity data.
- What I did: Used "Correct" on a record to change 100,000 to 110,000 litre, then "Remove" on the same record. Later corrected the LPG record from 12,000 kg to 23,530 litre after the inventory was published.
- What happened: The Correct dialog is the entry form with no "reason" field; after saving, the row shows the new value with no marker that it was corrected and no way to see the previous value. Remove deleted the record immediately with no confirmation. The toast "Record corrected. Past runs are unaffected." is accurate for runs, but see F49.
- Why it matters: ISO 14064-1 §8.3 (records) and the Corporate Standard's transparency principle. Verifiers ask for the change log of any figure that moved between draft and final.
- What to do: Require a reason on correction, keep and show the value history (who, when, old, new, why), confirm removals, and keep removed records as tombstones.
- Evidence: 24-correct-dialog.png, 24-after-correct.png.

**F15. No bulk import, search, filter, sort, or pagination for activity data.**
- Severity: Major. Area: Activity data.
- What happened: Thirty records already display in an unsorted list (not by date, facility, or entry order). The only entry route is one modal per record.
- Why it matters: A mine site generates thousands of fuel dispensing lines a year. Practitioners work from spreadsheets and monthly templates.
- What to do: CSV/XLSX import with a template and validation report; column sort, facility and stream filters, and monthly completeness matrix.
- Evidence: 23-activity-table.png.

**F16. Basic validation is present for quantity and date.**
- Severity: none (positive). Area: Record activity.
- What happened: Negative quantity rejected ("must be greater than 0"); missing date rejected ("must not be null").
- Evidence: 22-rejected-PROBE_negative_diesel.png, 22-rejected-PROBE_diesel_with_no_date.png.

### Stage D: emission factor library

**F17. The library is read-only and has 17 factors; there is no way to add a supplier-specific, national, or client-specific factor.**
- Severity: Blocker. Area: Emission factors.
- What I did: Looked for an add/import control; tried clicking a factor row.
- What happened: Page states "Seeded and read-only." Missing for my client: R-22 (an ODS, to be reported separately), R-134a, R-407C, R-404A; emulsion explosives; heavy fuel oil; kerosene/Jet A-1; coal; LPG per tonne; diesel per tonne; well-to-tank factors for any fuel (Scope 3 cat 3); transmission and distribution losses (cat 3); grid factors for any West African country other than Ghana; upstream transport (cat 4); cement, steel, grinding media, cyanide (cat 1); any waste type other than a single "landfill" figure; any flight class or haul other than one long-haul figure; employee commuting by car or tro-tro; hotel nights. Seven of the fifteen Scope 3 categories cannot be quantified at all with this library.
- Why it matters: Corporate Standard ch. 6 and Scope 2 Guidance §6.4: factors must be appropriate to the activity and the market; supplier-specific factors are the top of the Scope 2 market-based hierarchy and the Scope 3 Standard prefers supplier data. Without a way to add factors, most of a real inventory is either excluded or calculated with a wrong proxy.
- What to do: Allow organization-level factors with source, URL, vintage, GWP set, unit, per-gas values, validity dates, and an approval flag; ship the DEFRA/DESNZ full set and EPA Hub as importable packs; add the IPCC 2006 defaults for process emissions.
- Evidence: 17-factors.png.

**F18. R-410A factor of 2,088 kg CO2e/kg is the AR4 value but is labelled "IPCC AR5 GWP100".**
- Severity: Blocker (wrong number, wrong label). Area: Emission factors, report.
- What I did: Compared with the EPA Hub AR5 blend table (R-410A = 1,924 under AR5; 2,088 under AR4; 2,256 under AR6).
- What happened: 85 kg top-up was reported as 177.48 tCO2e. Under AR5 it should be 163.54 tCO2e (8.5% overstatement on the line). The AR6 inventory kept 2,088 and its report says "the HFC and PFC blends keep the potentials of IPCC AR5 that their source applied", which compounds the mislabel.
- Why it matters: The 2013 required-gases amendment and Corporate Standard ch. 9 require the GWP source to be stated and used consistently. A verifier who checks one refrigerant GWP will find this in minutes and will then re-test every factor.
- What to do: Store refrigerants as gas mass with per-component composition and compute CO2e from the inventory's GWP set (AR5: HFC-32 677, HFC-125 3,170; AR6: 771 and 3,740). Re-label the library.
- Evidence: 17-factors.png, 47-run-page.png (emissions by gas), 61-equity-run.png.

**F19. Factor provenance is weak or wrong for several entries.**
- Severity: Major. Area: Emission factors.
- What happened: "Grid electricity (Ghana) 0.441 kg CO2e/kWh, Ecoriv factor library 2025" is not a primary source and carries no data year (Ember generation-based intensity for Ghana is 0.469 for 2024; IEA and Ghana Energy Commission publish different figures). "ANFO explosives detonation 170 kg CO2e/tonne, IPCC 2006 Vol. 3 (approx.)": IPCC 2006 Vol. 3 has no ANFO factor; 0.17 tCO2e/t is the Australian NGA figure. "District cooling 0.12, DEFRA 2025 (approx.)": DEFRA publishes no district cooling factor. "Diesel 2.66" is DEFRA's 100% mineral diesel, but the label does not say so and its CO2 component (2.6307) does not match DEFRA's (2.628). "Waste to landfill 446.2" is DEFRA's commercial and industrial waste figure, unlabelled by waste type. No factor shows a vintage year, validity period, uncertainty, or URL.
- Why it matters: Corporate Standard ch. 9 requires factor sources to be documented; "(approx.)" in a source citation is not a source. The grid factor alone is 33% of this client's inventory.
- What to do: Cite the exact publication, table, and data year for each factor; add validity dates; replace "Ecoriv factor library" with the underlying source; add the Ghana Energy Commission or an IFI grid factor with year.
- Evidence: 17-factors.png.

**F20. Scope 2 grid factor is CO2 only; the by-gas table then omits CH4 and N2O from electricity.**
- Severity: Minor. Area: Emission factors, report section 05.
- What to do: Carry per-gas values where the source publishes them (DEFRA does for UK electricity; Ember does not, and the report should say so).
- Evidence: 17-factors.png, 47-run-page.png.

### Stage E: inventory setup, organizational and operational boundary

**F21. Boundary must be built by ticking every entity and facility; nothing is pre-populated from the consolidation approach.**
- Severity: Major. Area: Inventory > Organizational boundary.
- What I did: Created the operational-control inventory; all seven entities and seven facilities were unticked.
- What happened: I had to tick each one; the pre-flight then listed each unticked facility as "neither in the boundary nor excluded with a reason" (good). I could also tick the non-operated associate under operational control; the app allowed it with a warning that the share is 0% and "the version records it as excluded".
- Why it matters: Under a control approach every controlled operation is in by definition (ch. 3). Making inclusion an opt-in per inventory invites omissions and doubles the work for each new inventory.
- What to do: Pre-tick everything with a non-zero share under the chosen approach; treat unticking as the exclusion that needs a reason.
- Evidence: 26-inventory-page.png, 27-boundary-with-wassa.png, 29-boundary-set.png.

**F22. Boundary exclusion reasons are captured at entity and facility level with free text (good); record-level exclusions have a reason category only.**
- Severity: Major. Area: Inventory > Activity view > Exclude.
- What happened: Entity exclusion has a picklist plus "Detail for the verifier" and prints on the report. Record exclusion offers seven reasons as a menu with no text field; the report lists the excluded records under the reason heading with no justification. My R-22 and cyanide exclusions read only "Methodology exclusion".
- Why it matters: Corporate Standard ch. 9 and Scope 3 Standard ch. 11 require exclusions to be disclosed and justified. "Methodology exclusion" is a category, not a justification.
- What to do: Add a required free-text justification and an estimated magnitude for each record exclusion; total the excluded quantity on the report.
- Evidence: 38-exclude-popover.png, 47-run-page.png (section 09).

**F23. The Scope 3 declaration is not checked against what was actually calculated.**
- Severity: Major. Area: Operational boundary declaration, report section 02.
- What I did: Declared categories 1, 3, 4, 5, 6, 7, 15 as covered.
- What happened: The report prints the declaration verbatim. Categories 3, 4 and 15 had no lines at all (no factors exist for them) and the report does not flag "declared but zero". Category 15 in particular was my stated treatment of the associate, and it evaluates to nothing.
- Why it matters: Scope 3 Standard ch. 11: reported categories must be quantified or the report must say why not. A reader takes "covered" to mean quantified.
- What to do: Cross-check declaration versus lines at pre-flight; warn on declared-but-empty categories; print per-category totals.
- Evidence: 28-declaration-saved.png, 47-run-page.png.

**F24. No warning for reporting periods other than 12 months, and no fiscal-year handling.**
- Severity: Minor. Area: New inventory.
- What happened: An 18-month inventory (2024-07-01 to 2025-12-31) was created without comment. End-before-start was rejected correctly.
- What to do: Warn on periods not equal to 12 months; support fiscal years explicitly (the base-year page labels by calendar year only).
- Evidence: 65-inventory-list.png.

**F25. Pre-flight gates are a genuine strength.**
- Severity: none (positive). Area: Inventory > Pre-flight.
- What happened: The gates caught the empty boundary, unticked facilities, the pre-acquisition record ("outside the boundary, member from 2025-07-01"), unclassified records, missing evidence, estimated data, the JV entity record drifting from the frozen treatment ("treatment (joint venture, 50%) differs from the entity record (40%)"), a failed Quality Criteria instrument, an AR6 inventory against an AR5 base year, and a pending recalculation decision.
- Evidence: 41-preflight-after-classification.png, 45-frozen.png.

### Stage F: review and classification

**F26. Selecting a factor immediately classifies the record with the factor's suggested scope; Scope 1 is the default for contractor fuel.**
- Severity: Major. Area: Review activity data.
- What I did: Selected "Diesel (/litre)" for the contractor-owned Rocksure fleet.
- What happened: The row became "Included, Scope 1, Mobile combustion" instantly; I had to change the scope to 3 and pick a category. The pre-flight then warns "'Diesel' suggests scope 1" on every contractor line, forever.
- Why it matters: Contractor-owned and operated equipment is Scope 3 (cat 1 or 4) under operational control unless the reporting company directs its operation (Corporate Standard ch. 4 and the Scope 3 Standard cat 1 guidance). Mining contractors burn a third of site diesel in Ghana; a default of Scope 1 is the most common misclassification a verifier finds.
- What to do: Make scope an explicit choice, drive it from the source-stream register (owned vs contractor), and suppress the "suggests scope 1" warning once the user has documented the reason.
- Evidence: 32-classified-contractor-diesel.png, 41-preflight-after-classification.png.

**F27. Scope is locked ("inherent") for Scope 2 and Scope 3 factors.**
- Severity: Major. Area: Review activity data.
- What happened: For "Waste to landfill", "Grid electricity", and all travel factors the scope select is disabled with the note "This factor's scope is inherent."
- Why it matters: Mines operate their own landfills (Scope 1 CH4), sell electricity to the grid or to a JV partner, and host contractors' consumption. The factor physics do not fix the scope; ownership does. Also, purchased electricity at a leased-out asset is Scope 3 cat 13 (the app handles this through the lease field, but only if the user finds it).
- What to do: Allow scope override with a required justification, as already done for "any scope" fuels.
- Evidence: 35-exclude-inline.png (row controls), 31-review-activity.png.

**F28. Appendix F lease treatment is implemented correctly.**
- Severity: none (positive). Area: Review activity data.
- What happened: Marking the head office as "Operating lease (leased in)" kept its electricity and generator in Scope 2 and 1 under operational control, and moved them to Scope 3 category 8 under equity share, with the reason printed on the line.
- Evidence: 61-equity-run.png.

**F29. Classifications, exclusions, and the Scope 3 declaration are not carried into a second inventory or into a correction.**
- Severity: Major. Area: Review activity data, Create correction.
- What I did: Created the equity share view over the same period, then created a correction of the published inventory.
- What happened: In both, all 30 records came back "Unclassified"; every factor, scope, category, lease flag, and record exclusion had to be re-entered. The correction carried the boundary and the market-based instruments but not the classification or the Scope 3 declaration text.
- Why it matters: Consistency principle (ch. 1). A correction that exists to fix one line should not require re-deciding 29 others, each of which is a chance for the corrected inventory to diverge from the published one.
- What to do: Copy the activity view from the source inventory (or from the previous year) with a diff; allow "apply last year's classification".
- Evidence: 57-equity-review.png, 93-correction-review.png.

**F30. No way to record that a factor is a proxy.**
- Severity: Minor. Area: Review activity data.
- What happened: I used the ANFO factor for emulsion explosives and the quicklime calcination factor for purchased lime; the line and report show only the factor name, and the activity description is dropped from the snapshot line (the emulsion line reads "ANFO explosives detonation").
- What to do: Print the record's own description on the line; add a "proxy factor" flag with justification.
- Evidence: 47-run-page.png (section 10).

### Stage G: market-based Scope 2

**F31. A contractual instrument is applied to the facility's entire electricity consumption; partial coverage cannot be expressed.**
- Severity: Blocker. Area: Market-based scope 2 instruments, report.
- What I did: Added a PPA for the Obuom plant at 0 kg/kWh with quality notes "Covers 20,000 MWh of 46,500 MWh only".
- What happened: The report shows Obuom market-based Scope 2 as 0 kg CO2e on 46,500 MWh. Correct treatment: 20,000 MWh at 0 plus 26,500 MWh at the residual mix (or grid average where none exists) = 11,686.5 tCO2e. The inventory's market-based Scope 2 is stated as 1,475 tCO2e against a correct figure of about 13,162 tCO2e.
- Why it matters: Scope 2 Guidance §6.2 and §7.4: instruments apply to the MWh they cover; the balance takes the residual mix or grid average. This is the single largest misstatement in the test inventory and it is in the direction that flatters the client.
- What to do: Give each instrument a quantity (MWh) and period; apply it to that quantity; compute the balance with the residual mix or location-based factor and print the split on the line.
- Evidence: 42-instrument-ppa.png, 47-run-page.png (section 04 and line 2).

**F32. Quality Criteria are a single self-attested checkbox.**
- Severity: Major. Area: Market-based scope 2 instruments.
- What happened: "Meets the eight Scope 2 Quality Criteria" is one tick plus free-text notes. When unticked, the app correctly fell back to location-based and disclosed it. Nothing captures certificate serial numbers, retirement date, vintage, registry, or the market boundary.
- Why it matters: Scope 2 Guidance §7.1 lists the criteria individually; verifiers test retirement statements and vintage matching one instrument at a time.
- What to do: One field per criterion, with certificate ID, registry, vintage, retirement date, and an upload; block "met" when any criterion is unanswered.
- Evidence: 43-instruments.png.

**F33. Residual mix statement is implemented; negative factor is silently rejected.**
- Severity: Minor. Area: Market-based scope 2 instruments.
- What happened: After adding an instrument, a "Residual mix available" disclosure appears and prints in the report ("An adjusted emission factor (residual mix) is not available..."), which is what the Guidance asks for. A probe instrument at -0.1 kg/kWh was dropped with no message.
- What to do: Keep the disclosure; show a validation message for out-of-range factors.
- Evidence: 43-instruments.png, 47-run-page.png.

**F34. Without instruments, Scope 2 is reported location-based only.**
- Severity: Major. Area: Report section 04.
- What happened: The equity share view's report has no market-based line at all ("No instruments recorded: scope 2 is reported location-based only").
- Why it matters: Scope 2 Guidance §4 and Corporate Standard ch. 9 (as amended 2015): both figures must be reported by any company with operations in a market with contractual instruments, and Ghana has I-RECs. Where no instruments are held, market-based equals the residual mix or the grid average, and that number must still be printed.
- What to do: Always print both totals; compute market-based from residual mix or grid average when there are no instruments and say so.
- Evidence: 61-equity-run.png.

### Stage H: calculation runs

**F35. A run can be deleted with one click, no confirmation, while the page describes runs as immutable.**
- Severity: Blocker. Area: Inventory > Calculation runs.
- What I did: Clicked "Delete" on Run 001 of the frozen inventory to see whether a confirmation appeared.
- What happened: The run vanished immediately. No dialog, no undo, no log entry. The next run was numbered 001 again, so the audit trail does not even show that a run existed. The Delete button remains on a run marked FINAL until the inventory is published.
- Why it matters: ISO 14064-1 §8.3 and the Corporate Standard's transparency principle. A verifier who learns that runs can be silently deleted and renumbered will not rely on any run history.
- What to do: Remove hard delete; allow "void" with reason, keep the record and number; never reuse run numbers.
- Evidence: 51-delete-run-dialog.png, 58-inv1-state.png.

**F36. Arithmetic is transparent and correct within its inputs.**
- Severity: none (positive). Area: Run page.
- What happened: Every line shows quantity, converted quantity, factor, accounting share, and result in kg; by-gas totals reconcile to the scope totals (I re-added them). Equity share weighting (50%, 30%, 60%, 40%) and biogenic CO2 (45 t under operational control, 27 t under 60% equity) are applied consistently. AR6 CH4 and N2O conversions are applied to the per-gas components.
- Evidence: 47-run-page.png, 61-equity-run.png.

**F37. AR6 uses the non-fossil methane GWP (27.9) for fossil fuel combustion.**
- Severity: Minor. Area: GWP set AR6.
- What happened: The AR6 diesel factor came out at 2.66079 kg/L, which corresponds to CH4 at 27.9. AR6 gives 29.8 for fossil-origin methane; 27.9 is for biogenic methane (landfill, biomass).
- What to do: Carry a fossil/biogenic flag on CH4 per factor and apply 29.8 to fossil fuel combustion under AR6.
- Evidence: 61-equity-run.png.

### Stage I: the inventory report

**F38. No export of any kind: no PDF, no CSV of lines, no evidence pack, no print layout.**
- Severity: Blocker. Area: Run page.
- What happened: The run page has no buttons other than "Sign out". The report cannot leave the browser except by copy-paste.
- Why it matters: The deliverable of an engagement is a report and a calculation file a verifier can re-perform (ISO 14064-3 requires re-performance of a sample). Board packs, lender covenants, and Ghana EPA submissions need a document.
- What to do: PDF report following Corporate Standard ch. 9; CSV/XLSX of snapshot lines with record IDs, evidence references, factor IDs, and versions; a JSON of the frozen boundary and factor set.
- Evidence: 47-run-page.png, 77-run-top.png.

**F39. The report lacks Scope 3 by category, by facility, by entity, and by country tables.**
- Severity: Blocker. Area: Report section 04.
- What happened: Section 04 gives Scope 1, Scope 2 (both methods), Scope 3, and total. Nothing per Scope 3 category; the reader must sum the snapshot lines. Nothing per facility or legal entity (the Overview page has "top facilities" but the report does not).
- Why it matters: Corporate Standard ch. 9 required information includes Scope 3 by category where Scope 3 is reported, and recommends breakdowns by business unit, facility, and country. Verifiers and lenders work at facility level.
- What to do: Add the tables; add intensity metrics (tCO2e per ounce, per tonne milled) as optional KPIs.
- Evidence: 47-run-page.png.

**F40. Emission factors are listed by name only; no values, vintages, units, or sources in the report.**
- Severity: Major. Area: Report section 08.
- What happened: "Emission factors: ANFO explosives detonation, Business travel - average car, Diesel, ..." with no numbers. Section 10 shows the value per line, but not the source or year.
- What to do: Print a factor table (name, value, unit, per-gas split, GWP set, source, publication year, retrieval date).
- Evidence: 47-run-page.png.

**F41. Published report content is not frozen: the base-year section changed after publication.**
- Severity: Major. Area: Report section 07.
- What I did: Published the FY2025 report, then raised a recalculation candidate and created other inventories.
- What happened: The published run's section 07 now shows the FLAGGED candidate raised after publication and an "Emissions profile over time" table listing the equity view, the financial control view, and the correction, all as "2025, not yet final". The published page also shows "SUPERSEDED", which is appropriate, but the body text of the issued report should not move.
- Why it matters: A published report is a point-in-time document. If its content drifts, the verifier's opinion no longer attaches to what the reader sees.
- What to do: Snapshot the entire report at publication (or at least at final run) and show later events in a clearly separated "since publication" block.
- Evidence: 89 output (run page text), 83-run1.png.

**F42. "Emissions profile over time" mixes consolidation approaches as if they were years.**
- Severity: Minor. Area: Report section 07, Base year.
- What happened: Four 2025 rows, one per inventory, including equity share and financial control views, appear in a time-series table. Only inventories with the same approach and GWP set as the base year belong in a trend.
- What to do: Filter the profile to the base-year approach and GWP set; show other views separately.
- Evidence: run page text (89-run-slow output).

**F43. Wording issues in the report.**
- Severity: Minor. Area: Report.
- Examples: "The HFC and PFC blends used the same report" (section 05) is unintelligible to a client; "Figures in metric tonnes to three decimals; each line below keeps its kilograms" is fine; the methodology paragraph cites "spec 03" and "spec 07.1", which are internal specification numbers, not standard references.
- What to do: Replace internal spec references with Corporate Standard chapter citations; rewrite the HFC sentence.
- Evidence: 47-run-page.png.

**F44. No report metadata: preparer, approver, date prepared, contact, assurance status, or version.**
- Severity: Major. Area: Report.
- What to do: Add a header block: reporting entity address, contact, prepared by, approved by, publication date, version (with supersession chain), assurance level and provider or "unverified".
- Evidence: 47-run-page.png.

### Stage J: base year and recalculation

**F45. Base-year policy, thresholds, structural-change convention, and the candidate workflow are well designed.**
- Severity: none (positive). Area: Base year.
- What happened: Designation captures threshold (5%), rationale, and the choice between transaction-date and whole-year treatment for mid-year changes, and prints all of it in the report. Raising a "significant error, 6%" candidate produced "FLAGGED, above the threshold, recalculation required", blocked runs in other inventories until a decision is recorded, and offered "Record recalculated base" with a run picker and note.
- Why it matters: This is Corporate Standard ch. 5 done properly, and better than most tools.
- Evidence: 55-base-year-designated.png, 70-candidate-raised.png, 76-record-recalc-dialog.png.

**F46. A pending recalculation candidate blocks runs on unrelated inventories.**
- Severity: Minor. Area: Pre-flight > Base year.
- What happened: After raising the candidate, the FY2024 draft and the financial control view both show "Base year: HOLD ... Record the decision under the organization's base year."
- What to do: Block only inventories that report against the base year (same approach, later period); warn elsewhere.
- Evidence: 74-* screenshots.

**F47. Structural change detection depends on the per-inventory "Member from" being entered by hand (see F5); the affected-share percentage for manual candidates is typed, not computed.**
- Severity: Minor. Area: Base year.
- What to do: Compute the affected share from the runs where possible; let the user override with a note.
- Evidence: 60-raise-candidate.png.

### Stage K: lifecycle (freeze, final, publish, correction)

**F48. Freeze, boundary version, final, publish, and supersession are the right model.**
- Severity: none (positive). Area: Inventory lifecycle.
- What happened: Freeze cut "boundary version 1" with the frozen shares; editing the JV's economic interest at organization level afterwards did not alter the published figures and the correction's pre-flight flagged the drift. Publish locked everything ("nothing on this inventory can change"). "Create correction" produced a new draft over the same period and marked the original "PUBLISHED, SUPERSEDED".
- Evidence: 44-freeze-dialog.png, 64-published.png, 82-correction-inventory.png.

**F49. Correction has no reason, and the published inventory's activity view silently reflects post-publication fact corrections.**
- Severity: Major. Area: Create correction, published inventory page.
- What I did: Created a correction (name field only), then corrected the LPG fact from 12,000 kg to 23,530 litre at organization level.
- What happened: The correction dialog asks only for a name. The published inventory page (not the run) now lists the LPG record as "23,530 litre, Excluded, Other documented reason": the corrected quantity beside the now-meaningless original exclusion, with no "changed since publication" marker. The run snapshot itself is unaffected, which is correct.
- Why it matters: Corporate Standard ch. 5: restatements need a stated reason and the change must be visible. A reader of the published inventory page sees a fact that no longer matches the report they were given.
- What to do: Require a reason and an affected-lines summary on the correction; render published inventories from their frozen snapshot (facts as they were), with a diff panel for later corrections.
- Evidence: 87-fact-corrected.png, 88-published-after-fact-correction.png.

**F50. "Create correction" did not respond to a pointer click in automation; it worked only via a dispatched DOM click.**
- Severity: Minor (possibly test-harness only). Area: Published inventory page.
- What happened: Playwright reported the modal's backdrop or the header intercepting pointer events; no network request was sent on click. A dispatched click sent the request and the correction was created. I could not confirm whether a human click is affected; note the animated glass overlays as a likely cause.
- What to do: Check z-index and pointer-events on the dialog backdrop and sticky header.
- Evidence: 85-correction-attempt.png.

### Stage L: sector fit (Ghana mining, oil and gas, construction)

**F51. Sector coverage is thin for the stated target market.**
- Severity: Major. Area: Factor library, classification.
- What happened: No explosives other than ANFO, no lime and cement as purchased goods (only calcination as if the mine produced lime), no cyanide, no grinding media or steel, no HFO or crude flaring/venting/fugitive methane for oil and gas, no clinker or asphalt for construction, no land-use change for open-pit clearing, no tailings or mine water treatment, no ODS separate line. Biomass fuels are handled (biogenic split works). No T&D loss factor for the Ghana grid, which is a required part of cat 3 and material at 17-20% losses.
- What to do: Ship sector packs (mining, oil and gas, construction) with IPCC 2006 and DEFRA-derived defaults and a Ghana grid pack (Energy Commission generation mix, T&D losses, residual mix statement).
- Evidence: 17-factors.png.

## 3. What works well

- Facts versus views: activity records are shared, each inventory holds its own accounting decisions, runs are snapshots; the "Record corrected. Past runs are unaffected." behaviour is right.
- Table 1 logic is correct for every relationship type, chain holdings, and all three approaches, and the report prints the frozen boundary version with shares.
- Appendix F lease treatment switches correctly between operational control and equity share.
- Pre-flight gates are specific, cite the entity and record, and block the run for the right reasons (empty boundary, unreviewed records, pre-acquisition data, pending recalculation, GWP mismatch with base year).
- Base-year policy and recalculation candidates are close to a textbook implementation of ch. 5.
- Biogenic CO2 is reported outside the scopes; dual GWP sets exist; per-gas mass and CO2e reconcile.
- Membership windows ("Member from") give a real mechanism for mid-year acquisitions.
- The Scope 2 residual-mix disclosure is present and the failed-criteria fallback is disclosed.
- Freeze, final, publish, supersede is a sound lifecycle; frozen shares survive later edits to the entity record.
- Unit conversion within a dimension is explicit on every line.

## 4. Not exercised

- Email deliverability beyond Mailpit, password reset, user disable/delete effects on audit trail.
- Concurrency (two users editing the same inventory), because organizations are single-user.
- Steam, heat, and cooling Scope 2 lines (factors exist; no client data in scenario).
- Franchise relationship type and downstream categories 9 to 14 (no factors exist to test them).
- "Record recalculated base" and "Decline" outcomes (dialog inspected, not submitted, to keep the flagged state visible in reports).
- Deleting an organization with a published inventory (dialog inspected: it warns that runs are removed with it; I cancelled).
- Whether "Create correction" responds to a real mouse click (see F50).
- Performance with realistic volumes (thousands of records); the UI slowed noticeably at 30 records and full-page screenshots began timing out.
- Profile picture and resume upload on the profile page (not relevant to the inventory).

## 5. Top 10 priorities

1. F31: apply contractual instruments to the MWh they cover and compute the balance with residual mix or location-based factor; print both totals always (F34).
2. F17/F18/F19: make the factor library extensible with full provenance; fix the R-410A GWP and label; replace "Ecoriv factor library" and "(approx.)" sources with primary citations and years.
3. F35: remove hard delete of runs; void with reason; never reuse run numbers.
4. F38: export (PDF report, CSV lines with record and factor IDs, frozen boundary and factor set).
5. F9: period start and end on activity records with cut-off and pro-rating against membership windows.
6. F39/F40/F44: report tables by Scope 3 category, facility, entity; factor table with values and vintages; preparer, approver, date, version, assurance status.
7. F1: shared organizations with roles and per-action attribution.
8. F29: carry classifications, exclusions, and the Scope 3 declaration into new inventories and corrections.
9. F12/F13/F14/F22: scored data quality and uncertainty statement, evidence attachments printed on lines, correction reasons and history, record-level exclusion justifications.
10. F26/F27/F10: a source-stream register that drives factor candidates and scope, explicit scope choice for contractor fuel, scope override for "inherent" factors.
