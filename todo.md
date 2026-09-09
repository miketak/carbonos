# CarbonOS backlog from the GHG officer audit

Source: [docs/reviews/2026-09-08-ghg-officer-ui-audit.md](docs/reviews/2026-09-08-ghg-officer-ui-audit.md)
(51 findings, F1 to F51, from a first-engagement walkthrough of v0.5.0 through
the UI, scenario: Asante Gold Resources, FY2025, operational control, AR5).

The audit's verdict: not adoptable for a client inventory today, but the
skeleton is right. What blocks a verifiable inventory is a short list of
accounting errors and gaps, not a redesign.

## How to use this file

- One ticket per checkbox. Tick it when the work is merged to `main` and the
  finding can no longer be reproduced through the UI.
- Every ticket lists the findings it closes. The
  [traceability matrix](#traceability-matrix) at the end maps all 51 findings
  to a ticket, so nothing from the audit is lost in consolidation.
- Priority: **P0** blocks a verifiable inventory (the audit's blockers and the
  Top 10), **P1** is a gap a verifier will raise, **P2** is usability or
  credibility.
- Non-trivial tickets need a spec in `specs/` before implementation (see
  `CLAUDE.md`). The "Spec" line says whether one exists; most do not yet.
- "Done when" is the acceptance test, written the way the officer would retest
  it: through the UI, with the same scenario where the numbers matter.

Status summary (update as tickets close):

| Priority | Tickets | Done |
|---|---|---|
| P0 | 9 | 9 |
| P1 | 13 | 11 |
| P2 | 4 | 0 |

## Theme 1: Scope 2 accounting

- [x] **T-01 (P0) Apply contractual instruments to the MWh they cover, and always report both Scope 2 methods**
  - Findings: F31, F34
  - Problem: an instrument (PPA, REC, supplier contract) is applied to a facility's entire electricity consumption. In the audit a PPA covering 20,000 MWh of 46,500 MWh zeroed the whole facility; market-based Scope 2 came out at 1,475 tCO2e against a correct figure of about 13,162 tCO2e (the uncovered 26,500 MWh at 0.441 kg/kWh is 11,686.5 tCO2e). When no instruments exist, the report prints location-based only.
  - Standard: Scope 2 Guidance sections 6.2 and 7.4 (instruments apply to the MWh they cover, balance at residual mix or grid average); Scope 2 Guidance chapter 4 and Corporate Standard chapter 9 as amended in 2015 (dual reporting is required for any company with operations in a market with contractual instruments; Ghana has I-RECs).
  - Done when: an instrument has a covered quantity (MWh) and a period; the run applies it to that quantity, computes the balance at residual mix (or location-based when no residual mix is disclosed), and prints the split on the line; the report prints location-based and market-based totals on every run, and says "no instruments, market-based equals residual mix / grid average" when that is the case. Retest with the Obuom PPA figures.
  - Spec: 07.3 (instrument coverage and dual reporting), migration V21.

- [ ] **T-02 (P1) Capture the Scope 2 Quality Criteria one criterion at a time**
  - Findings: F32
  - Problem: "Meets the eight Scope 2 Quality Criteria" is one checkbox plus free text. Nothing captures certificate serial numbers, registry, vintage, retirement date, or market boundary. The fallback to location-based when unticked already works and is disclosed.
  - Standard: Scope 2 Guidance section 7.1 lists the criteria individually; verifiers test retirement statements and vintage matching per instrument.
  - Done when: each criterion is a separate answer; instrument records hold certificate ID, registry, vintage, retirement date, and an optional attachment (see T-15); "met" is blocked while any criterion is unanswered; the report lists the criteria outcome per instrument.
  - Spec: none yet; extend 06.1.

## Theme 2: Emission factors and GWP

- [x] **T-03 (P0) Extensible emission factor library with full provenance and sector packs**
  - Findings: F17, F19, F20, F51
  - Problem: the library is 17 seeded, read-only factors. The audit could not quantify R-22, R-134a, R-407C, R-404A, emulsion explosives, HFO, kerosene, coal, LPG per tonne, diesel per tonne, well-to-tank, T&D losses, any grid other than Ghana, upstream transport, cement, steel, grinding media, cyanide, waste types, flight classes, commuting modes, or hotel nights. Seven of the fifteen Scope 3 categories cannot be quantified at all. Provenance is weak: "Ecoriv factor library 2025" is not a primary source for the Ghana grid factor (a third of the test inventory) and carries no data year; "IPCC 2006 Vol. 3 (approx.)" for ANFO and "DEFRA 2025 (approx.)" for district cooling cite sources that do not publish those figures; "Diesel 2.66" does not say it is DEFRA 100% mineral diesel and its CO2 component (2.6307) differs from DEFRA's (2.628); "Waste to landfill 446.2" is unlabelled by waste type. The grid factor is CO2 only, so the by-gas table omits CH4 and N2O from electricity. No factor has a vintage, validity period, uncertainty, or URL.
  - Standard: Corporate Standard chapter 6 and chapter 9 (factor sources must be documented); Scope 2 Guidance section 6.4 (supplier-specific factors top the market-based hierarchy); Scope 3 Standard prefers supplier data.
  - Done when: an organization can add factors with source, URL, publication and data year, GWP set, unit, per-gas values, fossil or biogenic CH4 flag (see T-04), validity dates, and an approval flag; seeded factors cite the exact publication, table, and data year, with "(approx.)" removed and the Ecoriv citation replaced by the underlying source; importable packs exist for DEFRA/DESNZ, EPA Hub, IPCC 2006 process defaults, and a Ghana pack (Energy Commission generation mix, T&D losses); sector packs for mining, oil and gas, and construction cover the streams listed in F51; per-gas values are carried where the source publishes them and the report says when a source does not.
  - Spec: 02.1 (emission factor library, provenance and packs), migration V27, packs under `backend/src/main/resources/factor-packs/` generated by `scripts/gen-factor-packs.py`. Seeded values are kept and cited exactly; the packs carry the unrounded published rows. Cyanide, tailings and grinding media still have no published factor (entered by hand).

- [x] **T-04 (P0) Fix the refrigerant GWP values and derive CO2e from the inventory's GWP set**
  - Findings: F18, F37
  - Problem: R-410A is seeded at 2,088 kg CO2e/kg, which is the AR4 blend value, but labelled "IPCC AR5 GWP100". An 85 kg top-up reported 177.48 tCO2e where AR5 gives 163.54 tCO2e (8.5% overstatement). The AR6 inventory kept 2,088 and its report says the blends "keep the potentials of IPCC AR5", compounding the mislabel. Separately, AR6 applies CH4 at 27.9 (the non-fossil value) to fossil fuel combustion; AR6 gives 29.8 for fossil-origin methane.
  - Standard: 2013 required-gases amendment and Corporate Standard chapter 9 (GWP source stated and used consistently).
  - Done when: refrigerant factors are stored as gas mass with per-component composition (R-410A: 50% HFC-32, 50% HFC-125) and CO2e is computed from the inventory's GWP set (AR5: HFC-32 677, HFC-125 3,170; AR6: 771 and 3,740); the 85 kg line reports about 163.5 tCO2e under AR5 (1,923.5 kg CO2e/kg) and about 191.7 tCO2e under AR6 (2,255.5 kg CO2e/kg); CH4 carries a fossil or biogenic flag and AR6 uses 29.8 for fossil combustion; a migration corrects the seeded R-410A row and its label. Regression test on both numbers.
  - Spec: 07.2 (Gas masses, Methane origin), migration V20.

## Theme 3: Runs, reports, and export

- [x] **T-05 (P0) Replace run deletion with voiding; never reuse run numbers**
  - Findings: F35
  - Problem: "Delete" on a run removes it instantly, with no confirmation, no undo, and no log entry, on an inventory whose page describes runs as immutable. The next run is numbered 001 again, so the history does not even show that a run existed. Delete remains available on a FINAL run until publication.
  - Standard: ISO 14064-1 section 8.3 (records) and the Corporate Standard transparency principle.
  - Done when: hard delete is gone; a run can be voided with a required reason and stays listed with its number and a VOIDED state; run numbers are never reused; FINAL runs cannot be voided without first withdrawing final status, with a reason.
  - Spec: 05.2 (run numbering and voiding), migration V22; 05 and 05.1 updated.

- [x] **T-06 (P0) Export: PDF report, CSV of snapshot lines, and a frozen boundary and factor set**
  - Findings: F38
  - Problem: the run page has no export. The report cannot leave the browser except by copy and paste. Board packs, lender covenants, and Ghana EPA submissions need a document; verifiers need a calculation file to re-perform a sample.
  - Standard: ISO 14064-3 (re-performance of a sample); Corporate Standard chapter 9 (the report is the deliverable).
  - Done when: a run offers a PDF following the chapter 9 structure (with the tables from T-08), a CSV or XLSX of snapshot lines carrying record ID, evidence reference, factor ID, factor version, quantity, converted quantity, share, and result, and a JSON of the frozen boundary version and factor set; exports are identical for the same run on repeated download.
  - Spec: 07.5 (report export), migration V25.

- [x] **T-07 (P0) Activity records carry a period, with cut-off and pro-rating**
  - Findings: F9, F24
  - Problem: a record has one date. Annual totals dated 31 December are included 100% even when the entity joined the boundary on 1 July; a record dated 2024-11-15 silently falls out of the FY2025 view; meter reads straddling year-end, quarterly invoices, and mid-year acquisitions cannot be represented. An 18-month inventory was created without any warning and fiscal years are not supported (the base-year page labels by calendar year only).
  - Standard: Corporate Standard chapter 5 and chapter 7 (data attributable to the reporting period, pro-rated across structural changes). Verifiers test period cut-off first.
  - Done when: records have a period start and end; a record that straddles a membership window or the inventory period is either pro-rated (with the rule printed on the line) or blocked at pre-flight, per an explicit setting; the activity view shows period coverage per facility per stream (which months have data); creating an inventory whose period is not 12 months warns; fiscal-year labels are supported.
  - Spec: 04.2 (activity periods, cut-off and pro-rating), migration V23; 02 and 05 updated.

- [x] **T-08 (P0) Report tables, factor table, and report metadata**
  - Findings: F39, F40, F43, F44
  - Problem: section 04 gives Scope 1, Scope 2 (both methods), Scope 3, and total, with nothing per Scope 3 category, facility, legal entity, or country. Section 08 lists factors by name only, with no values, units, per-gas split, vintages, or sources. There is no preparer, approver, date prepared, contact, assurance status, or version header. Wording issues: "The HFC and PFC blends used the same report" is unintelligible; the methodology paragraph cites "spec 03" and "spec 07.1" instead of Standard chapters.
  - Standard: Corporate Standard chapter 9 (Scope 3 by category is required information when Scope 3 is reported; breakdowns by business unit, facility, and country are recommended; factor sources are required).
  - Done when: the report has tables by Scope 3 category, by facility, by legal entity, and by country; a factor table with name, value, unit, per-gas split, GWP set, source, publication year, and retrieval date; a header block with reporting entity address, contact, prepared by, approved by, publication date, version with supersession chain, and assurance level and provider or "unverified"; optional intensity KPIs (tCO2e per ounce, per tonne milled); internal spec references replaced with chapter citations and the HFC sentence rewritten.
  - Spec: 07.4 (report tables, factor table and report metadata), migration V24.

- [ ] **T-09 (P1) Cross-check the Scope 3 declaration against calculated lines**
  - Findings: F23
  - Problem: the declaration is printed verbatim. Categories 3, 4, and 15 were declared as covered and had zero lines (no factors exist for them); category 15 was the stated treatment of the associate and evaluated to nothing. A reader takes "covered" to mean quantified.
  - Standard: Scope 3 Standard chapter 11 (reported categories are quantified or the report says why not).
  - Done when: pre-flight warns on every declared category with no lines and on every category with lines that is not declared; the report prints per-category totals beside the declaration, including "declared, not quantified: reason".
  - Spec: update 03.x (operational boundary) and 07.1.

- [x] **T-10 (P1) Freeze the published report and the published inventory view; require a reason on corrections**
  - Findings: F41, F49
  - Problem: after publication, the published run's base-year section changed to show a recalculation candidate raised later and an "Emissions profile over time" table listing inventories created afterwards. The published inventory page reflects fact corrections made at organization level after publication (the LPG record now shows 23,530 litre beside its original, now meaningless, exclusion) with no "changed since publication" marker. "Create correction" asks only for a name.
  - Standard: Corporate Standard chapter 5 (restatements need a stated reason and the change must be visible); a published report is a point-in-time document that the verifier's opinion attaches to.
  - Done when: the whole report is snapshotted at publication (at the latest at final run) and later events appear only in a separate "since publication" block; the published inventory page renders facts as they were at the snapshot, with a diff panel for later corrections; a correction requires a reason and prints an affected-lines summary.
  - Spec: update 05 (lifecycle) and 07.1.

## Theme 4: Activity data and classification

- [x] **T-11 (P0) Source-stream register per facility, explicit scope choice, and scope override**
  - Findings: F10, F26, F27, F30
  - Problem: "Activity" is free text and factor candidates are filtered by unit dimension only, so genset diesel offers Petrol and Water supply, and nothing prevents "Waste to landfill" for cyanide. Selecting a factor classifies the record immediately with the factor's suggested scope, so contractor-owned fleet diesel lands in Scope 1 and the pre-flight warns "'Diesel' suggests scope 1" on every contractor line forever. For Scope 2 and Scope 3 factors the scope is locked as "inherent", although mines run their own landfills (Scope 1 CH4), sell electricity, and host contractor consumption. A proxy factor (ANFO for emulsion, calcination for purchased lime) cannot be flagged and the record's own description is dropped from the snapshot line.
  - Standard: Corporate Standard chapter 4 and Scope 3 Standard category 1 guidance (contractor equipment is Scope 3 unless the company directs its operation); ISO 14064-1 section 9.3.3 and Corporate Standard chapter 7 (completeness needs a controlled list of source streams).
  - Done when: each facility has a register of source streams (type, fuel, meter or supplier, owned or contractor) and factor candidates derive from the stream; scope is an explicit choice, defaulted from the stream, with the "suggests scope" warning suppressed once a reason is documented; scope override with required justification is allowed on any factor; a "proxy factor" flag with justification exists and the record description prints on every snapshot line.
  - Spec: 04.3 (source streams, explicit scope choice and proxy factors), migration V26; 04.1 updated.

- [x] **T-12 (P1) Carry classifications, exclusions, lease flags, and the Scope 3 declaration into new inventories and corrections**
  - Findings: F29
  - Problem: a second inventory over the same period and a correction of a published inventory both came back with all 30 records "Unclassified"; every factor, scope, category, lease flag, and record exclusion had to be re-entered. The correction carried the boundary and instruments but not the classification or declaration text. Each re-entry is a chance for the correction to diverge from what was published.
  - Standard: consistency principle (Corporate Standard chapter 1).
  - Done when: creating an inventory offers "copy the activity view from" another inventory (same organization) with a diff of records that have no source classification; a correction always inherits the source inventory's classifications, exclusions, lease flags, and declaration and shows what changed.
  - Spec: update 05 (lifecycle) and 04.

- [x] **T-13 (P1) Units: per-tonne fuel factors, density conversions, and defined custom units**
  - Findings: F11
  - Problem: conversions within a dimension work and print on the line (m3 to litre, MWh and GWh to kWh). LPG entered in kg could only match per-tonne factors for ANFO, quicklime, and waste; there is no density table and no LPG per-tonne factor. A custom unit ("drum (200 L)") is told it "won't auto-convert", no factor matched, and the record had to be excluded and later corrected after publication. LPG, HFO, and coal are invoiced by mass in Ghana; diesel comes in drums or tonnes at remote sites.
  - Done when: DEFRA-style per-tonne, per-litre, and per-kWh values exist for every fuel (depends on T-03); a density table converts mass to volume with the density printed on the line; a custom unit can be defined as a multiple of a base unit (1 drum = 200 litre) and converts.
  - Spec: update 04.

- [x] **T-14 (P1) Data quality tiers and an uncertainty statement**
  - Findings: F12
  - Problem: data quality is "Measured / Estimated / Calculated" only; pre-flight lists estimated and calculated records as information; the report says nothing about data quality or uncertainty.
  - Standard: ISO 14064-1 section 9.3.1 (uncertainty description); Corporate Standard chapter 7 (data quality assessment); Scope 3 Standard chapter 7 (five-tier data quality scoring).
  - Done when: each record or stream has a scored tier and an optional percentage uncertainty; the report prints a data-quality table (share of each scope by tier) and a qualitative uncertainty statement.
  - Spec: update 04 and 07.1.

- [x] **T-15 (P1) Evidence attachments printed on report lines**
  - Findings: F13
  - Problem: evidence is an optional free-text reference ("Invoice #2938"); no upload, no link, and the reference does not print on snapshot lines. Every verifier sample becomes a manual chase.
  - Standard: ISO 14064-3 sampling traces from a report line to the primary document.
  - Done when: a record accepts file attachments or document links (reuse the existing object storage); the evidence reference and record ID print on each snapshot line and in the CSV export (T-06); instruments accept attachments too (T-02).
  - Spec: update 04.

- [x] **T-16 (P1) Fact corrections with reason and history; confirmations and soft delete for facts, facilities, and entities**
  - Findings: F14, F8
  - Problem: "Correct" opens the entry form with no reason field; after saving, the row shows the new value with no marker and no way to see the previous value. "Remove" deletes a record instantly with no confirmation. Facilities without records and entities without facilities are also removed instantly. Blocking removal when dependencies exist already works and the messages are good.
  - Standard: ISO 14064-1 section 8.3 (records); Corporate Standard transparency principle.
  - Done when: a correction requires a reason and the record shows its value history (who, when, old, new, why); removals ask for confirmation and leave a tombstone with an audit entry; the same applies to facilities and entities.
  - Spec: update 04 and 02 (organization).

- [x] **T-17 (P1) Record-level exclusions need a justification and a magnitude**
  - Findings: F22
  - Problem: entity and facility exclusions capture a picklist plus "Detail for the verifier" and print well. Record exclusions offer seven reasons as a menu with no text; the report lists excluded records under the reason heading only. "Methodology exclusion" is a category, not a justification.
  - Standard: Corporate Standard chapter 9 and Scope 3 Standard chapter 11 (exclusions disclosed and justified).
  - Done when: a record exclusion requires free-text justification and an estimated magnitude; the report totals the excluded quantity per reason and prints each justification.
  - Spec: update 04 and 07.1.

- [x] **T-18 (P1) Bulk import, search, filter, sort, pagination, and volume performance for activity data**
  - Findings: F15; also the "Not exercised" note that the UI slowed at 30 records
  - Problem: the only entry route is one modal per record; 30 records display as an unsorted list. A mine site generates thousands of dispensing lines a year and practitioners work from spreadsheets.
  - Done when: CSV or XLSX import with a downloadable template and a validation report that names each rejected row; column sort, facility and stream filters, pagination; a monthly completeness matrix per facility and stream (depends on T-07 and T-11); the activity page and pre-flight stay responsive at 5,000 records.
  - Spec: update 04.

## Theme 5: Organization, entities, facilities, boundary

- [x] **T-19 (P1) Legal entity effective dates, jurisdiction, and a financial-control override**
  - Findings: F5, F47
  - Problem: the entity record has no acquisition or disposal date, no country, and no way to record that a minority holding is consolidated under IFRS 10 (financial control without majority). The acquisition date can only be entered as "Member from" per inventory, after ticking the entity into a boundary, and must be repeated in every inventory. Structural-change detection therefore depends on that manual entry, and the affected share for a manual recalculation candidate is typed rather than computed.
  - Standard: Corporate Standard chapter 3 (financial control is the ability to direct policies, not a percentage); chapter 5 (structural changes must be dated for base-year recalculation).
  - Done when: entities carry effective-from and effective-to dates, jurisdiction, and a "financially controlled" override with a note; each inventory defaults "Member from" and "Member to" from those dates; the affected share for a recalculation candidate is computed from the runs where possible, with a manual override and note.
  - Spec: update 03.1 (legal entities) and 06 (base year).

- [x] **T-20 (P1) Facility country, grid region, facility type, and lease flags**
  - Findings: F7
  - Problem: a facility is name, free-text location, and legal entity. Nothing drives the grid factor ("Grid electricity (UK)" is offered for a mine in Ghana). Lease status has to be re-declared per record per inventory although it is a property of the site.
  - Standard: Scope 2 Guidance section 6.3 (location-based factor for the grid where the facility sits); Corporate Standard Appendix F (lease treatment).
  - Done when: facilities have country, grid region (which pre-selects the location-based factor), facility type, and lease-in or lease-out flags with dates; records inherit these and the classification shows the inherited lease treatment.
  - Spec: update 02 (organization) and 04.

- [x] **T-21 (P1) Pre-populate the boundary from the consolidation approach**
  - Findings: F21
  - Problem: every entity and facility starts unticked; the officer had to tick each of seven entities and seven facilities. The associate with a 0% operational-control share could still be ticked (with a warning). Under a control approach, every controlled operation is in by definition; opt-in inclusion invites omissions and doubles the work per inventory.
  - Standard: Corporate Standard chapter 3.
  - Done when: creating an inventory pre-ticks every entity and facility with a non-zero share under the chosen approach; unticking is treated as the exclusion that needs a reason (the existing exclusion flow); entities with a 0% share are shown as "outside the boundary under this approach" rather than tickable.
  - Spec: update 03.x (boundary).

## Theme 6: Access, roles, and audit trail

- [x] **T-22 (P0) Shared organizations with membership, roles, and per-action attribution**
  - Findings: F1, F2
  - Problem: an organization is visible only to the user who created it. A second approved user sees "No organizations yet" and a direct URL sends them to login. Roles are Member and Admin only. A client team would have to share one login, so every action shows the same email. Also: an approved user does not appear in the Users list until they set a password, and the password policy is a minimum of 8 characters.
  - Standard: ISO 14064-1 section 8 (inventory quality management) and Corporate Standard chapter 7 assume defined roles and a review step.
  - Done when: organizations are tenant-level with membership; roles cover preparer, reviewer or approver, and read-only verifier; every classification, freeze, final, publish, and correction records who did it and when, and the report prints preparer and approver (T-08); pending-activation users appear in the Users list with their state; the password policy is strengthened or SSO is offered.
  - Spec: 01.2 (organization membership, roles and attribution), migration V28; 01 updated. Password policy strengthened (12+ characters, letter and digit); SSO stays a non-goal.

## Theme 7: Base year

- [ ] **T-23 (P2) Scope the recalculation hold to inventories that report against the base year; filter the emissions profile**
  - Findings: F46, F42
  - Problem: a pending recalculation candidate blocks runs on unrelated inventories (an FY2024 draft and a financial-control view both showed "Base year: HOLD"). The "Emissions profile over time" table lists four 2025 rows, one per inventory, including equity-share and financial-control views, as if they were years.
  - Done when: the hold blocks only inventories with the base year's approach and a later period, and warns elsewhere; the profile shows only inventories matching the base year's approach and GWP set, with other views listed separately.
  - Spec: update 06 (base year).

## Theme 8: Validation and UI polish

- [ ] **T-24 (P2) Inline validation messages for out-of-range inputs**
  - Findings: F6, F33
  - Problem: an economic interest of 150% leaves the dialog open with no message (only the browser's native range check); a market instrument at -0.1 kg/kWh is dropped silently.
  - Done when: legal ownership and economic interest are validated between 0 and 100 with an inline message, and a warning appears when they differ materially; instrument factors reject negatives with a message; the same treatment applies to every numeric field on the entity, facility, record, and instrument forms.

- [ ] **T-25 (P2) Remove the assurance-sounding splash copy**
  - Findings: F3
  - Problem: the post-login loader shows "Verifying audit trail integrity" and "Calibrating consolidation models". Nothing is verified; a verifier will ask what was.
  - Done when: the loader is neutral (a progress indicator or nothing).

- [ ] **T-26 (P2) "Create correction" does not respond to a pointer click under automation**
  - Findings: F50
  - Problem: Playwright reported the dialog backdrop or sticky header intercepting pointer events and no request was sent; a dispatched DOM click worked. Unconfirmed for a human click; animated glass overlays are the likely cause.
  - Done when: a real pointer click on "Create correction" on a published inventory opens the dialog and submits; z-index and pointer-events on the backdrop and header are checked.

## Keep: behaviour the audit confirmed as correct

These findings need no work. They are listed so nobody regresses them and so
each gets a regression test if it does not already have one.

- [ ] **K-01** Table 1 consolidation logic for every relationship type, ownership chains, and all three approaches (F4).
- [ ] **K-02** Quantity and date validation on activity records (F16).
- [ ] **K-03** Pre-flight gates: empty boundary, unticked facilities, pre-acquisition records, unclassified records, missing evidence, estimated data, entity drift from the frozen treatment, failed Quality Criteria, GWP mismatch with the base year, pending recalculation (F25).
- [ ] **K-04** Appendix F lease treatment switching between operational control and equity share (F28).
- [ ] **K-05** Transparent, reconciling arithmetic: converted quantity, factor, share, and result on every line; by-gas totals reconcile to scope totals; equity weighting and biogenic CO2 applied consistently (F36).
- [ ] **K-06** Base-year policy: threshold, rationale, structural-change convention, candidate workflow with FLAGGED above threshold (F45).
- [ ] **K-07** Freeze, boundary version, final, publish, supersede; frozen shares survive later entity edits (F48).

Tick a K item once a regression test covers it end to end.

## Follow-up audit

Ask the GHG officer to rerun the walkthrough after the P0 tickets close, and
to cover what the first pass could not:

- Concurrency: two users on one inventory (after T-22).
- Downstream Scope 3 categories 9 to 14 and the franchise relationship (after T-03).
- "Record recalculated base" and "Decline" outcomes on a candidate.
- Deleting an organization that has a published inventory.
- Steam, heat, and cooling Scope 2 lines.
- Real mouse click on "Create correction" (T-26).
- Volume: thousands of records (T-18).
- Email deliverability beyond Mailpit, password reset, and the effect of disabling a user on the audit trail.

## Traceability matrix

| Finding | Severity | Ticket |
|---|---|---|
| F1 | Blocker | T-22 |
| F2 | Minor | T-22 |
| F3 | Minor | T-25 |
| F4 | Works | K-01 |
| F5 | Major | T-19 |
| F6 | Minor | T-24 |
| F7 | Major | T-20 |
| F8 | Minor | T-16 |
| F9 | Blocker | T-07 |
| F10 | Major | T-11 |
| F11 | Major | T-13 |
| F12 | Major | T-14 |
| F13 | Major | T-15 |
| F14 | Major | T-16 |
| F15 | Major | T-18 |
| F16 | Works | K-02 |
| F17 | Blocker | T-03 |
| F18 | Blocker | T-04 |
| F19 | Major | T-03 |
| F20 | Minor | T-03 |
| F21 | Major | T-21 |
| F22 | Major | T-17 |
| F23 | Major | T-09 |
| F24 | Minor | T-07 |
| F25 | Works | K-03 |
| F26 | Major | T-11 |
| F27 | Major | T-11 |
| F28 | Works | K-04 |
| F29 | Major | T-12 |
| F30 | Minor | T-11 |
| F31 | Blocker | T-01 |
| F32 | Major | T-02 |
| F33 | Minor | T-24 |
| F34 | Major | T-01 |
| F35 | Blocker | T-05 |
| F36 | Works | K-05 |
| F37 | Minor | T-04 |
| F38 | Blocker | T-06 |
| F39 | Blocker | T-08 |
| F40 | Major | T-08 |
| F41 | Major | T-10 |
| F42 | Minor | T-23 |
| F43 | Minor | T-08 |
| F44 | Major | T-08 |
| F45 | Works | K-06 |
| F46 | Minor | T-23 |
| F47 | Minor | T-19 |
| F48 | Works | K-07 |
| F49 | Major | T-10 |
| F50 | Minor | T-26 |
| F51 | Major | T-03 |

## Audit Top 10 to ticket

| Audit priority | Findings | Tickets |
|---|---|---|
| 1 | F31, F34 | T-01 |
| 2 | F17, F18, F19 | T-03, T-04 |
| 3 | F35 | T-05 |
| 4 | F38 | T-06 |
| 5 | F9 | T-07 |
| 6 | F39, F40, F44 | T-08 |
| 7 | F1 | T-22 |
| 8 | F29 | T-12 |
| 9 | F12, F13, F14, F22 | T-14, T-15, T-16, T-17 |
| 10 | F26, F27, F10 | T-11 |
