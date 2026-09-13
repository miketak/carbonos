# Procedure 10: Factor pack maintenance

**Objective.** Confirm that a platform administrator can create a pack family
and a draft edition, clone a predecessor into a new draft, author its rows, and
read the live validation report; that a published edition is frozen; and that a
draft is invisible to every organization until it is published.

**Covers** [spec 02.5](../../specs/02.5-factor-pack-editions.md), the authoring
half. Publication, the evidence file, the separation-of-duties gate, the blast
radius and the adoption notices of
[spec 02.7](../../specs/02.7-adopting-a-new-edition.md) are not in this release,
and case B5 confirms that the console says so rather than doing half of it.

**Estimated time:** 45 minutes.

**Run this procedure** before a release, and after any change to the factor
pack console, the publication rules or the catalogue.

## Prerequisites

- An **ADMIN** account whose password you hold, and a second account that is
  **not** an administrator (any member account will do; procedure 1 creates
  one).
- **Sankofa Gold plc** as procedure 2 leaves it, with the DESNZ 2026 pack
  imported. Without it, case A4's holder count reads zero and the rest of the
  procedure still works.
- The ten seeded editions, which every environment carries from the
  migrations: `defra-2026`, `ember-grid-2025`, `epa-hub-2025`, `ghana`,
  `ipcc-2006-process`, `nga-2024-explosives`, `refrigerants-ar5`,
  `sector-construction`, `sector-mining` and `sector-oil-and-gas`.

## A. The catalogue

### A1. A family and a draft edition are created

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Sign in as the administrator and open **Factor packs** from the landing page or the header. | The catalogue lists ten families, each with one edition reading PUBLISHED. Every edition shows the date it applies from, its row count and how many organizations hold it. | | |
| 2 | Click **Add family**, type the key `QA-Pack`, the name "QA test publication", leave the kind as SOURCE, and submit. | The form stays put with "Use lowercase letters, digits, hyphens and dots, 2 to 60 characters, as 'defra' and 'defra-2026.r2' do. It is a citation key, so it never changes." under the key. | | |
| 3 | Change the key to `qa-pack` and submit. | The family appears at the foot of the list with "No editions yet", and a toast reads "The QA test publication family was created.". | | |
| 4 | On the new family click **New edition**, type the identifier `qa-pack-2027`, the source "QA test tables, 2027", the URL `https://example.test/qa-2027.xlsx`, the year 2027, leave AR5, set applies-from to 2027-01-01, and create. | The draft appears under the family reading DRAFT, 0 rows, "No organization". | | |
| 5 | Open `qa-pack-2027` and read the **Metadata** tab. | The curator is your name or your email address; the approver reads "Not recorded"; the provenance review reads REVIEWED. An edition authored in the console can never carry the seed's SEED_UNCHECKED exemption. | | |

### A2. A row is added, edited and deleted

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On the **Rows** tab click **Add row** and fill in: code `QA:fuels:diesel:litres`, name "Diesel", scope 1, stationary combustion, unit `litre`, kg CO2e per unit 2.66, CO2 2.66, publication "QA test tables, 2027", URL `https://example.test/qa-2027.xlsx`, publication year 2027, data year 2027, source category "Fuels", source activity "Liquid fuels / Diesel". Add. | The row is listed with its code, name, unit, value and "No" under Approved. The Rows tab count reads 1. | | |
| 2 | Click **Edit** on the row, change the kg CO2e per unit to 2.70, and save. | The row shows 2.7. | | |
| 3 | Click **Delete** on the row and confirm. | The dialog says the row goes from this draft and that nothing an organization holds changes. The row goes and the count returns to 0. | | |
| 4 | Add the row again with the values of step 1, so the later cases have something to read. | The row is listed. | | |

### A3. A predecessor is cloned into a new draft

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Back on the catalogue, find the **ghana** family and click **Clone** on the `ghana` edition. | The dialog is titled "Clone ghana" and says the draft starts with the 7 rows of `ghana`, copied. The name, source, URL, year and GWP basis are filled in from it. | | |
| 2 | Type the identifier `qa-ghana-2027` and create. | A toast reads "qa-ghana-2027 was created from ghana with its 7 rows.". The draft is listed under the ghana family reading DRAFT, 7 rows. | | |
| 3 | Open `qa-ghana-2027`, search for `td-losses`, edit `GHANA:td-losses` and change its kg CO2e per unit to 0.2. Save. | The draft's row reads 0.2. | | |
| 4 | Return to the catalogue, open the published `ghana` edition, and search for `td-losses`. | The published row still reads 0.117202. A clone is a copy, so correcting it leaves the published edition as it is. | | |

### A4. A published edition is frozen

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open `defra-2026` from the catalogue. | The header reads PUBLISHED and the page says "This edition is published, so its rows, metadata and values never change again: reports already rest on them. Clone it into a new draft to correct a row." There is no **Add row** button and no **Delete draft** button. | | |
| 2 | Read the row list. | Each row offers **Edit** but no **Delete**. | | |
| 3 | Click **Edit** on any row, change its value, and save. | The dialog stays open with "'defra-2026' is published. A published edition's rows, metadata and values never change, because reports already rest on them. Clone it into a new draft instead." | | |
| 4 | Open the **Metadata** tab. | Every field is disabled and there is no **Save metadata** button. The provenance review reads SEED_UNCHECKED, the approver "Not recorded", and the note explains that the checksum is over the shipped JSON rather than the publication and that the separation-of-duties record starts at the next edition. | | |
| 5 | Read the holder count on the catalogue beside `defra-2026`. | It counts the organizations that imported it: at least Sankofa Gold plc if procedure 2 was run. | | |

## B. The rules

### B1. The validation report names every broken rule

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open `qa-pack-2027` and add a row that breaks everything at once: code `nonamespace`, name "HCFC-22 (R-22)", scope 1, purchased electricity (choose scope 2 to reach it, then set the scope back to 1), untick scope-agnostic, unit `widgets`, kg CO2e per unit 100, CO2 1, and leave the publication, URL and years empty. Add. | The row is added: the rules are read on publication, not typed into the form, so a curator can save a half-finished row and come back to it. | | |
| 2 | Open the **Validation** tab. | Seven rules are listed, each with the row that breaks it: the code needs two or more segments; the provenance is missing the publication, an absolute URL and the years; `widgets` is not a registered unit; the gases come to 1 kg CO2e against the stated 100; a Montreal Protocol gas must report outside the scopes; PURCHASED_ELECTRICITY is not a scope 1 category; and a value was stated with no source. The tab's count matches the number of findings. | | |
| 3 | Edit the row: code `QA:refrigerant:hcfc-22`, unit `kg`, kg CO2e per unit 1760, CO2 empty, HFCs 1, category fugitive emissions, reporting basis OUTSIDE_SCOPES_NON_KYOTO, publication "QA test tables, 2027", URL `https://example.test/qa-2027.xlsx`, publication year 2027, data year 2027. Save, then read the Validation tab. | Every rule passes: the page reads "Every rule passes". An HFC mass with no recorded composition keeps the CO2e its source published, so the gas split does not apply to it. | | |

### B2. A code needs its namespace, and two segments are enough

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Add a row coded `tdlosses`, otherwise valid (name "T&D losses", scope 3, fuel and energy related, unit `kWh`, 0.12, CO2 0.12, the publication, URL and years of B1 step 3). Read the Validation tab. | One finding, on `tdlosses`: "The code needs two or more colon-separated segments naming the publication and the row, each of them filled in, as 'GHANA:td-losses' does." | | |
| 2 | Edit the code to `GHANA:td-losses` and read the report again. | The finding goes. Two segments are allowed because a derivation is not a row in a published table, and a code may never change once a published edition carries it. | | |

### B3. A zero is only a template naming the document to obtain

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Add a row coded `TEMPLATE:supplier:cement`, name "Cement purchased (supplier factor)", scope 3, purchased goods and services, unit `tonne`, kg CO2e per unit 0, tick "The row publishes a CO2e total with no gas split", leave it unapproved, publication "Supplier factor, to be obtained", note "Obtain the cement supplier's product carbon footprint or environmental product declaration.". Read the Validation tab. | No finding. A template names the document to obtain rather than a published URL and year, so the provenance rule does not apply to it. | | |
| 2 | Edit the row and tick **Approved**. Read the report. | Two findings on that row: "A zero CO2e per unit is approved. A zero is only allowed on an unapproved template, because an approved zero reads as a measured absence of emissions." and the provenance rule, because an approved zero is no longer a template. | | |
| 3 | Untick Approved, and change the note to "To do.". Read the report. | One finding: a zero is only allowed on an unapproved template whose note names the document to obtain. | | |
| 4 | Restore the note of step 1. | The finding goes. | | |

### B4. The gas split reconciles within one percent

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Edit `QA:fuels:diesel:litres` and set the kg CO2e per unit to 2.68, leaving CO2 at 2.66. Read the Validation tab. | No finding: 2.66 against 2.68 is 0.75% apart, inside the tolerance. | | |
| 2 | Set the kg CO2e per unit to 3.00. Read the report. | One finding: "The gases come to 2.66 kg CO2e under AR5, which is 11.33% from the stated 3.00. They must agree within one percent." | | |
| 3 | Set the CO2 to 2.66 and the CH4 to 0.0121, tick "The methane is fossil in origin", and set the kg CO2e per unit to 2.9988. Read the report. | No finding: 1 kg of fossil methane is 28 kg CO2e under AR5, so the split reconciles once the potentials are applied. | | |
| 4 | Set the CO2 to 2.00, the biogenic CO2 to 1.00, and the kg CO2e per unit to 3.00, clearing the methane. Read the report. | One finding: "The stated CO2e per unit includes the biogenic CO2. Chapter 9 reports biogenic CO2 beside the total, never inside it". Chapter 9 reports biogenic CO2 apart from the scopes. | | |
| 5 | Set the kg CO2e per unit back to 2.00. | The finding goes: the biogenic CO2 now sits beside the total rather than inside it. | | |

### B5. Publishing says it is not available yet

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open `qa-pack-2027`. | There is no **Publish** button: publication, the evidence file with its checksum, the approver who is not the curator, the frozen change log and the blast radius all arrive together in the next release. | | |
| 2 | If you can reach the API directly, POST to `/api/admin/factor-packs/editions/qa-pack-2027/publish`. | 409, with a detail that names what publication still needs. The edition stays a draft. (Skip this step if you cannot make an API call; the absence of the button in step 1 is what a tester checks.) | | |

## C. A draft belongs to the platform

### C1. A draft is invisible to an organization

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In a private window, sign in as a member of Sankofa Gold plc and open **Emission factors**, then the factor pack list. | Ten packs are listed. Neither `qa-pack-2027` nor `qa-ghana-2027` appears, and neither can be imported. | | |
| 2 | Still as the member, open `/admin/factor-packs` in the address bar. | The page refuses: a platform administrator's area is not reachable by a member. | | |

### C2. A draft that nobody imported is deleted

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the administrator, open `qa-ghana-2027` and click **Delete draft**. | The dialog says the draft and its 7 rows go for good, and that a draft that was never published is the only edition that can be deleted, because clause 8.2 requires the records behind a reported figure to be retained. | | |
| 2 | Confirm. | The browser returns to the catalogue and the draft is gone. | | |
| 3 | Delete `qa-pack-2027` the same way, so the environment is left as you found it. | The draft is gone; the ten seeded editions are untouched. | | |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** publication and everything that gates it (the evidence
file, the approver who is not the curator, the change log, the blast radius);
the adoption notice and the diff of spec 02.7; reordering the rows of an
edition; a bulk import into a draft, which spec 02.6 governs.
