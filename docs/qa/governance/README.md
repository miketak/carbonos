# QA procedures: governance (Adansi Foods Ltd)

Manual test procedures for CarbonOS on the **qa** environment, which holds
the release candidate under test and moves only when a new candidate is
tagged. This is the **governance** persona: Adansi Foods Ltd, a small
Ghanaian food processor with three legal entities, three sites, three
source streams and ten activity records. Every object exists because one
rule needs it. The pack walks the customer journey from the first account
to a published report and a designated base year, and at each step enters
the least that makes a feature, a configuration point or a governance rule
fire. The mining persona under [`docs/qa`](../README.md) proves the
arithmetic of a full year; this one proves the rules.

The pack takes about four and a half hours end to end. Most of that is
reading what the product refuses, warns or records, not typing. The
activity data arrives from two fixture files uploaded once each.

## Before you start

- **App:** the qa frontend address in
  [Environments](../../environments.md). The line under a page's title
  names the candidate you are testing.
- **A clean slate.** From the repo root, `make db-wipe ENV=qa` rebuilds
  the qa database from the migrations and leaves only the seeded
  administrator. Procedure 1 assumes that state: it counts users and
  organizations, and procedure 7 publishes edition identifiers that can
  never be reused. Run the wipe before a full pass.
- **Accounts:** the seeded administrator's password, and one mailbox you
  can read. Every other account is created by the procedures. Plus-aliases
  of one Gmail address (`you+ama@gmail.com`) arrive in the base inbox.
- **Browsers:** a normal window and a private window, so an administrator
  and a member never share a session. Several cases ask you to switch
  between the two.
- **The fixture files** from `docs/qa/governance/fixtures/` in the
  repository. Download the folder from GitHub
  (https://github.com/miketak/carbonos/tree/main/docs/qa/governance/fixtures)
  or check out the repository. Do not edit the files: the procedures name
  their row numbers and totals.

## The accounts

| Account | Made by | Password used in the pack | What it proves |
| --- | --- | --- | --- |
| Admin A | the wipe (seeded) | yours | curates the pack edition; platform settings; support access |
| Admin B, `you+adminb@…` | procedure 1, **Add user**, role ADMIN | `AdminB-pass-2026` | publishes the edition (the approver is not the curator); the last-administrator refusals |
| Ama Owusu, `you+ama@…` | procedure 1, **Request access** and the approval email | `Ama-pass-2026` | the email path; owns Adansi Foods Ltd; enters the records and the factors |
| Kofi Mensah, `you+kofi@…` | procedure 1, **Add user** | `Kofi-pass-2026` | Reviewer: approves factors, designates the final run, publishes, decides adoptions |
| Esi Boateng, `you+esi@…` | procedure 1, **Add user** | `Esi-pass-2026` | Preparer: every "needs the Reviewer or Owner role" refusal |
| Yaw Darko, `you+yaw@…` | procedure 1, **Add user** | `Yaw-pass-2026` | Verifier: read-only; owns the scratch organization **Solo Ltd**, where a self-approval is recorded |

Replace `you+…@…` with aliases of the mailbox you read. Where a procedure
says "as Ama", sign in with that account in the window it names.

## The scenario

**Adansi Foods Ltd** reports under operational control for the calendar
year 2025 (inventory **FY2025**) and again for 2026 (**FY2026**). Its
entities, sites and streams are recorded in procedure 2.

| Object | Facts | Rule it exists for |
| --- | --- | --- |
| E0 Adansi Foods Ltd | the reporting company, there by definition | cannot be restructured or deleted |
| E1 Adansi Logistics Ltd | subsidiary, 100%, operated by the company, acquired 2025-07-01 | a membership window inside the period; the Table 1 prefill |
| E2 Coldstore Ghana Ltd | associate, 30%, not operated | 0% under operational control: outside the boundary, disabled checkbox, disclosed exclusion; 30% under equity share |
| S1 Kumasi Plant (E0), Ghana | streams **Boiler LPG** (stationary combustion, LPG) and **Plant grid supply** (purchased electricity, meter ECG-KSI-01) | the grid suggestion; a stream's default scope; the upstream rule; the instrument |
| S2 Tema Depot (E1), operating lease from 2025-07-01 | stream **Delivery fleet** (mobile combustion, diesel, operated by a contractor) | scope 3 by default; the lease inherited; the window exclusion; the divestment that flags the base year |
| S3 Takoradi Cold Store (E2) | no streams | the automatic outside-boundary exclusion; an entity with facilities cannot be deleted |

The activity data is in `fixtures/adansi-2025.csv`, ten rows. The
spreadsheet row is one more than the record number because the header is
row 1.

| Record | Facility, stream | Activity, quantity, period | Rule it feeds |
| --- | --- | --- | --- |
| 1 | Kumasi Plant, Boiler LPG | Boiler LPG, 2,400 litre, March 2025 | a plain scope 1 line; the well-to-tank rule |
| 2 | Kumasi Plant, Plant grid supply | Plant grid electricity, 120 MWh, June 2025 | the grid suggestion; the instrument; scope 2 both ways |
| 3 | Tema Depot, Delivery fleet | Delivery fleet diesel, 5,000 litre, August 2025 | a contractor's stream defaults to scope 3; the lease is inherited; the divestment share |
| 4 | Kumasi Plant | Forklift diesel, 3 tonne, May 2025 | the density prompt; the typical-density warning and final hold; the proxy route |
| 5 | Kumasi Plant | Chiller refrigerant top-up, 20 kg, 2025-09-10 | the DESNZ R-407C blend; the Montreal Protocol reason on a mass unit; the GWP-basis hold |
| 6 | Kumasi Plant | Year-end boiler LPG, 800 litre, 2025-12-15 to 2026-01-15 | a straddling record: pro-rated, then blocked; reviewed again in FY2026 for its 15 January days |
| 7 | Tema Depot | Depot grid electricity, 4,000 kWh, May 2025 | before E1's membership window: excluded on review |
| 8 | Takoradi Cold Store | Cold store diesel, 900 litre, October 2025 | outside the boundary under operational control; inside it under equity share |
| 9 | Kumasi Plant | Canteen waste, 12 tonne, November 2025, ESTIMATED tier 4 | a methodology exclusion, not estimated; the readiness pill |
| 10 | Kumasi Plant | Staff flights, 20,000 passenger-km, April 2025 | classified into a scope 3 category the declaration does not list |

## The fixture files

| File | Rows | Used in |
| --- | --- | --- |
| `fixtures/adansi-2025.csv` | the ten records of the scenario table | procedure 3 |
| `fixtures/adansi-2025-rejected.csv` | four rows the dry run refuses, one problem each | procedure 3 |
| `fixtures/adansi-2026.csv` | two January 2026 records for FY2026 | procedure 7 |
| `fixtures/source-document.txt` | a four-line supplier delivery note | procedures 3 and 7, as record evidence and as the edition's source document |
| `fixtures/not-evidence.zip` | an empty archive | procedure 3, the refused evidence type |

## How to read a procedure

Each case is a table with one row per step: the **Action** to take, the
**Expected result** to check, a **Pass/Fail** cell and a **Notes** cell.
Type `PASS` or `FAIL` in the Pass/Fail cell of every step that has an
expected result. A step with an empty expected result is setup. A case
fails when any of its steps fails; a failed case does not stop the
procedure unless the text says so. Product text is quoted in double quotes
and UI elements are in bold. A refusal the product makes by disabling a
control (with a tooltip, or until a reason is long enough) is described
as such; a refusal it makes with a message is quoted. Where an expected result quotes a message
with a value in it, the value is the one this scenario produces; a
different value is a failure worth a note.

The procedures name specs under `specs/`. When a case and a spec disagree,
the spec is the reference; report the difference. The pre-flight gates
are named as the panel prints them: **Reporting boundary**, **Activity
data completeness**, **Classification**, **Emission factors** and **Base
year**.

## Where to fill in your verdicts

The maintainer exports the procedures as Google Docs into the **CarbonOS
QA** Drive folder before a test round (`make qa-docs PERSONA=governance`,
then an upload). Make a copy of each document into your own Drive, named
`<document> - <your name> - <date>`, type your verdicts in the copy, file
one issue per failed case with the **QA failure** template at
https://github.com/miketak/carbonos/issues/new?template=qa-failure.yml,
and share the copy with the maintainer when the run is complete.

## The procedures

Run them in order. Each one starts where the previous one left the
environment, and its prerequisites say what it needs.

| # | Procedure | Objective | Time |
| --- | --- | --- | --- |
| 1 | [Accounts and the platform](001-accounts-and-the-platform.md) | Accounts are created by an administrator or through an approved request, the password rule holds on both paths, the platform settings are recorded with a reason, and no act removes the last administrator. | 30 min |
| 2 | [The organization](002-the-organization.md) | An owner records the organization's members, entities, sites, streams, units, densities and factors, and every refusal of a wrong structure is read; a factor is checked by someone other than its author. | 45 min |
| 3 | [Activity data](003-activity-data.md) | A rejected file imports nothing, a clean file imports with control totals, and a record is drafted, corrected, evidenced and removed with the reasons the record keeps. | 30 min |
| 4 | [Inventory, boundary and declaration](004-inventory-boundary-and-declaration.md) | An inventory starts from the approach, every operation is in the boundary or excluded with a reason, the declaration cross-checks the classification, and the freeze waits for a clean view. | 35 min |
| 5 | [Classification and the gates](005-classification-and-the-gates.md) | One record per rule: the stream's default, the density prompt, the grid suggestion, the blend, the departure, the proxy, the three exclusion answers, the straddle, the upstream rule, the instrument and the residual mix; then the freeze cuts a version. | 45 min |
| 6 | [Runs, final, publication and correction](006-runs-final-publication-and-correction.md) | A run is a numbered snapshot, a final run refuses a planning value and a blend on another GWP basis, only a reviewer or owner designates and publishes, a published report never changes, and a correction supersedes it. | 45 min |
| 7 | [The pack lifecycle end to end](007-the-pack-lifecycle-end-to-end.md) | An administrator clones a pack edition, changes one value and has a second administrator publish it; the organization sees the notice, reads the diff, refuses the preparer and the support-access administrator, accepts as a reviewer, and the next run cites the new vintage; an edition inside a reported period is refused; a withdrawal closes the notice. | 40 min |
| 8 | [Base year and the organization's record](008-base-year-and-the-record.md) | The base year is designated with its policy, the designation weighs the years already frozen, a divestment undone is superseded rather than raised twice, candidates are decided, and the organization is not deleted while its published record stands. | 30 min |

## Coverage

Every spec in [`specs/README.md`](../../../specs/README.md) is named in a
**Covers** line. The table maps each spec to the case that reaches it.

| Spec | Cases |
| --- | --- |
| 00 Principles and domain model | every procedure; 6 C reads the report's Chapter 9 elements |
| 01 Identity and access; 01.1 Access requests; 01.6 Landing and the account menu | 1 A to C, F |
| 01.2 Membership, roles and attribution; 01.4 Role-aware UI; 01.7 Organization settings | 2 A; 5 B6; 6 B4, E1; 7 D2; 8 F |
| 01.3 Confidentiality and deletion safeguards; 01.5 The platform administration panel | 1 D to F; 7 D3; 8 F |
| 02 Organization and facts; 02.1 Factor library; 02.9 DEFRA and Ghana; 02.10 One tier | 2 F; 5 B |
| 02.2 Units, densities and custom units | 2 E; 5 B4 |
| 02.3 Factor identity; 02.6 Versioned import; 02.8 Viewing a pack | 2 F; 7 D5, E |
| 02.4 Sector pack completeness (blends, Montreal Protocol gases) | 2 F3; 5 B5, C2 |
| 02.5 Factor pack editions; 02.7 Adopting a new edition | 7 A to G |
| 02.11 Approval as a control | 2 F4, G; 5 B7; 6 D |
| 03, 03.1, 03.3, 03.4 Legal entities, Table 1, facilities and pre-population | 2 B, C; 4 A |
| 03.2 Effective-dated membership | 4 B4; 5 A |
| 04, 04.1, 04.3 Scope as a decision, streams and proxies | 2 D; 5 B |
| 04.2 Periods and pro-rating | 5 D |
| 04.4 Data quality, evidence, corrections and exclusions; 04.8 Exclusions without a false zero | 3 D to F; 5 C |
| 04.5 Bulk import; 04.6 The register as a workspace | 3 A to C, G to I |
| 04.7 Derived fuel- and energy-related lines | 5 E2, E3; 6 A |
| 04.9 A correction's reason | not implemented (Draft); listed under known non-goals |
| 05, 05.1, 05.2 Inventories, lifecycle and run numbering | 4 D, E; 6 A, B |
| 05.3 Inheritance and the published record; 05.4 Copying a view | 6 E to G |
| 05.5 Review at scale; 05.6 The workbench | 4 D; 5 A, C3, F; 3 I |
| 05.7 What a final run refuses | 6 B |
| 06 Tracking over time; 06.1 Recalculation policy | 8 A to E; 7 D4 |
| 07, 07.1, 07.2, 07.4, 07.7, 07.8 Reporting, disclosures, tables, by-gas and the PDF | 6 A, C, D |
| 07.3, 07.6 Scope 2 instruments and the declaration cross-check | 4 C; 5 E4, E5 |
| 07.5 Report export | 6 D |
| 08 Form validation and UI polish | 1 B, D; 2 B, E; 3 F |

The rules the pack does not reach, and why, are listed under **Known
non-goals** at the foot of each procedure.

## Sign-off

Each procedure ends with this table. Copy it into your run notes.

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |
