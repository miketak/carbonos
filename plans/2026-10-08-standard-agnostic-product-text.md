# Make the product's text standard-agnostic: drop chapter, table and appendix citations

**Status:** approved 2026-10-08, not yet implemented. Reviewed by the GHG officer and a product manager before approval.

## Context

Screens, hints, refusal messages, the PDF report and the help cite the GHG Protocol by chapter, table and appendix ("Chapter 5 wants the reason stated", "Follows the Table 1 row", "Appendix F sets their scope", "Scope 2 Guidance, chapter 4"). The owner wants the platform's user-facing text agnostic to any one standard. Decisions taken on 8 October 2026:

- Remove chapter, table, appendix and section numbers of a standard from everything a user reads: UI strings, backend messages and field errors, the report (JSON and PDF), the help articles.
- The standards may still be **named** where a verifier needs the citation: the report's methodology statement, the landing page, and help articles that explain where a concept comes from. "GHG Protocol workflow" on the empty organizations page goes, since it is a screen.
- Code comments, JSDoc and specs keep their citations (engineering rationale).

The plan was reviewed by the GHG officer (verification readiness, wording accuracy) and a product manager (comprehension, consistency, delivery); their findings are folded in below.

**Goal:** no user-visible string contains "Chapter N", "Table 1", "Table N.M", "Appendix X", "section N.M" or "clause N" of a standard; each is reworded as the rule it states, and the report's methodology statement names the standards once.

**Not citations, left alone:** "section 04" in `RunDetailPage.tsx` (the report's own section numbering); "IPCC AR6, Table 7.15 and Table 7.SM.7" (a factor-source citation); "IFRS 10", "Kyoto", "Montreal Protocol" (names); the landing page's "GHG Protocol and ISO 14064".

## Inventory (what changes)

Counts from grep on 8 October 2026; the implementer re-runs the grep in the Verification section and enumerates every string with its replacement in the PR description, so wording is reviewed once.

| Where | Strings | Files |
|---|---|---|
| Frontend UI text | ~32 | `EntityFormPage.tsx` (6), `BaseYearPage.tsx` (4), `RunDetailPage.tsx` (3), `AdoptionDiffDrawer.tsx` (2), `InventoryFormPage.tsx` (3, incl. Appendix F), `BoundarySection.tsx` (2), `EmissionFactorsPage.tsx` (2), `InventoryDetailPage.tsx` (2), `EntitiesPage.tsx`, `EmissionSourcesPage.tsx`, `OrganizationsPage.tsx`, `LifecycleBar.tsx`, `UpstreamRulesCard.tsx`, `ReportMetadataCard.tsx`, `FacilityFormPage.tsx` (Appendix F), `AssignmentDetail.tsx` (Appendix F) |
| Backend messages | 2 rules, 7 messages | `GhgRules.java` 98 and 307; `FactorPackAdoptionService.java` 440 and 451; `InventoryService.java` 2029, 2073 (Appendix F), 2131, 2532; `FactorPackValidation.java` 237; `GhgService.java` 490; `StructureChanges.java` 247 |
| Report | 6 + 4 | `ReportResponse.java` methodology sentences (524, 529, 546, 767; 491 stays); `ReportPdf.java` `OUTSIDE_SCOPES_RULE` (59), boundary sentence (126), column head "Table 1 row" (133) |
| QA vocabulary and packs | ~10 | `qa/src/vocabulary/ui/surface.ts` (100, 496), `outcomes/inventories.ts` 120, `qa/packs/governance/002`, `003`, `004`, `005`, `007` (`why` and `formHint` texts) |
| Help | 22 articles | the grep over `help/docs` for the pattern in Verification; notably `organization/record-legal-entities.md`, `glossary.md`, `reporting/designate-the-base-year.md` (quotes the base-year hint), `fix/check-the-validation-rules-and-limits.md` (quotes rule messages), `inventories/what-is-scope-classification.md`, `inventories/clear-the-pre-flight-findings.md`, `inventories/freeze-and-launch-a-run.md` |

## Approach

### 1. One vocabulary, pinned before any edit

One word per concept, used identically on screens, in refusals, in the PDF and in the help.

**Table 1 → "relationship"** (already the form's field label and the help's step 3). No new glossary term.
- Entity form hint: "The relationship and the approach together set the accounting share."
- Financial control default option and `StructureChanges.java:247`: **"Set by the relationship and the approach"** (the officer's correction: the share is not the relationship alone).
- Entities page subtitle and `EntityFormPage.tsx:69`: "...the relationship and economic interest set an accounting share under each approach."
- Boundary tab (`BoundarySection.tsx:107, 278`) and `outcomes/inventories.ts:120`: "...the share of each under the consolidation approach"; "0% share from its relationship under {approach}".
- Inventory form and detail banners: "Boundary rebuilt from the entities' relationships under {approach}".
- `GhgService.java:490`: "Control for a {relationship} is set by the relationship; only a franchise records it."
- PDF column head: **"Basis of share"** (the cell holds text such as "joint venture under joint financial control; operational control: 100% (operator)", which "Relationship" understates).
- Glossary: delete the "Table 1" row; rows "Consolidation approach" and "Legal entity" drop "Table 1" ("...turn each entity's relationship into an accounting share").

**Chapter 5 → the recalculation policy, stated.** The three recalculation cases keep their product names (vintage progression, retrospective adoption, erratum on a reported year; spec 02.7). The officer proposed renaming them to "routine factor update / methodology change / correction of a significant error"; that is a separate decision, not this change (see Follow-ups).
- Drawer question (`AdoptionDiffDrawer.tsx:341`, `surface.ts:496`): **"What is this adoption for the base year?"**
- `GhgRules.java:307`: "Say what this adoption is for the base year: a vintage progression, a retrospective adoption, or an erratum on a reported year." (also stops exposing enum tokens)
- `FactorPackAdoptionService.java:440` and `AdoptionDiffDrawer.tsx:208`: "...so it cannot be a vintage progression: an inventory uses one GWP basis across all its years."
- `:451`: "...so this counts as a methodology change, which triggers a recalculation. Say why it is still recorded as a vintage progression."
- `BaseYearPage.tsx:87`: "Structural changes, methodology changes and significant errors each trigger a recalculation, on their own or together, so the policy sets a threshold..."; `:304`: "A structural change is recalculated for the entire year, in the base year and the current year, not from the transaction date. Membership windows account from the transaction date instead; the report prints which convention was used."; `:315, :538`: "mandatory triggers under the recalculation policy".
- `LifecycleBar.tsx:458`: "The reason is required; the correction's report prints it with what changed."

**Chapter 9 → the requirement, stated.**
- `InventoryService.java:2131`, `InventoryFormPage.tsx` hint, pack 004 `formHint`: "An inventory normally covers twelve months; keep this period only if it is deliberate."
- `FactorPackValidation.java:237`: "Biogenic CO2 is reported beside the total, never inside it: state..."
- `RunDetailPage.tsx:50` and `ReportPdf.OUTSIDE_SCOPES_RULE`: "Not among the seven gas groups the inventory accounts for; reported separately as optional information and included in no scope."

**Chapter 4, Chapter 3, Chapter 1, Chapter 7.**
- `EmissionSourcesPage.tsx:71`: "...a contractor-operated source defaults to scope 3 unless the company controls its operation".
- `EmissionFactorsPage.tsx:1133`: "The inventory accounts for the seven gas groups. A Montreal Protocol gas..."
- `InventoryFormPage.tsx:311`: "Under a control approach every controlled operation is in by definition."
- `EntityFormPage.tsx:301`: "Control is the ability to direct policies, not a percentage. A decision here overrides the share the relationship gives under the financial-control approach."; `:325`: "The parent the company holds this entity through. The consolidation policy applies at every level: the share is this row times the parent's."
- `GhgRules.java:98` (approval): "You entered '{name}'. A factor is checked by someone other than the person who typed it: ask {checker} to approve it."
- `RunDetailPage.tsx:295`: "...as it stood when frozen."; `:508`: "...as dual reporting requires of any company in a market with instruments."
- `OrganizationsPage.tsx:66`, `surface.ts:100`: "Create your first reporting organization to start."

**Appendix F → "the lease".**
- `FacilityFormPage.tsx:208`: "Records at a leased site inherit the lease; the lease type sets their scope under each approach."
- `InventoryService.java:2029, 2073`, `InventoryFormPage.tsx:295`, `InventoryDetailPage.tsx:171`, `AssignmentDetail.tsx:768`: "...but the lease type under {approach} puts it in {scope}"; "is a leased asset whose stored scope disagrees with its lease type"; "leased assignments take the scope their lease type sets under this approach"; "(leased asset)".

**Report methodology (the one place the standards are named).** `ReportResponse.java` opens the methodology with: "Prepared in accordance with the GHG Protocol Corporate Accounting and Reporting Standard (revised edition) and the GHG Protocol Scope 2 Guidance; scope 3, where reported, follows the Corporate Value Chain (Scope 3) Standard." Then: consolidation "...accounting share of the facility's legal entity under the {approach} approach, applied at every level of the group."; scope 2 "Scope 2 is reported location-based and market-based, each labeled, as the Scope 2 Guidance requires."; FERA "Fuel- and energy-related activities (scope 3, category 3) are quantified by upstream rules..."; data quality "Data quality is graded on five tiers, 1 (metered or invoiced primary data) to 5 (assumption), after the Scope 3 Standard's data quality indicators." (the current sentence misattributes a tier ladder to the Standard). `ReportPdf.java:126` drops "(Corporate Standard, chapter 3)".

### 2. Backend
Reword the rules and messages; `make qa-rules` regenerates `qa/src/vocabulary/rules/catalogue.json` (needs the local stack with `carbonos.qa.endpoints=true` and a QA admin). Update the report sentences, the PDF constant and column head; the backend tests that assert these strings change with them.

### 3. Frontend
Reword the strings; keep comments. Update the test files that quote them (`EntityFormPage`, `EntitiesPage`, `InventoryFormPage`, `InventoryDetailPage`, `RunDetailPage`, `AdoptionDiffDrawer`, `EmissionFactorsPage`, `FacilityFormPage` tests).

### 4. QA
Update `surface.ts`, `outcomes/inventories.ts` and the pack `why`/`formHint` texts; `make qa-export` regenerates `docs/qa/governance/*.md`. After the release, rebuild the workbook (`make qa-workbook`) from the rc tag and re-upload it to Drive by hand (the pipeline memory): the testers' sheet quotes strings that change.

### 5. Help
Reword the 22 articles under the table above. Every quoted product string is re-read from the running product after steps 2 and 3, never from memory; `fix/check-the-validation-rules-and-limits.md` and `fix/fix-an-inventory-or-run-problem.md` quote rule messages verbatim and are re-read after `make qa-rules`.

### 6. Spec note
One paragraph in `specs/08-ui-conventions*.md` (or `specs/00-principles-and-domain-model.md` if 08 is the wrong home): user-facing text names a standard only in the report's methodology statement and where the help explains a concept's origin, never a chapter, table, appendix or clause. This stops the citations coming back.

### 7. Guard
A Vitest test under `frontend/src` (next to the spec 10 token guard) that reads every non-test file under `src/features`, strips `//`, `/* */` and `{/* */}` comments, and fails on `/\b[Cc]hapter \d|\bTable 1\b|\bAppendix [A-Z]\b|\bclause \d|§/`, with an allow-list for the report's "section 04". A `qa-lint` check applies the same pattern to the messages in `catalogue.json`, which covers the backend rules. No Vale rule.

### Delivery
**One PR.** `surface.ts` quotes the drawer question and pack 004's hint quotes the inventory page, so a backend-only PR would leave the UI driver and `qa-lint` out of step with the deployed UI. Release note to testers lists the strings they look for that change: "Follows the Table 1 row", the eighteen-month hint, the drawer question, the approval refusal, the PDF column head.

### Follow-ups (not in this change)
- Officer's proposal: rename the recalculation cases to "routine factor update / methodology change / correction of a significant error", with the rule and option labels to match. Needs an owner decision and a spec 02.7 change; ticket it.

## Files touched

- `backend/.../ghg/GhgRules.java`, `internal/FactorPackAdoptionService.java`, `InventoryService.java`, `FactorPackValidation.java`, `GhgService.java`, `StructureChanges.java`: message wording.
- `backend/.../internal/web/dto/ReportResponse.java`, `internal/export/ReportPdf.java`: methodology opener and sentences, outside-scopes rule, column head.
- `frontend/src/features/ghg/*.tsx`, `components/*.tsx` listed above and their `*.test.tsx`; the new guard test.
- `qa/src/vocabulary/ui/surface.ts`, `outcomes/inventories.ts`, `qa/packs/governance/002,003,004,005,007-*.yaml`; regenerated `catalogue.json` and `docs/qa/governance/*.md`; the `qa-lint` message check.
- `help/docs/**` 22 articles, including `glossary.md`; `help/tree.yaml` unchanged.
- One spec paragraph.

## Risks

- A reworded rule message that a help article quotes verbatim: `help-check` does not catch a stale quote, so every quote is re-read from the product.
- Testers mid-cycle on qa see wording change; the release note and the re-uploaded workbook cover it.
- `make qa-rules` must run in the same PR as the rule wording or `qa-export-check` fails.
- "Set by the relationship and the approach" is longer than the option it replaces; check the select's width in the entity form.

## Verification

- Grep returns only comments:
  `grep -rn -i -E 'chapter [0-9]|Table 1\b|Table [0-9]\.[0-9]|Appendix [A-Z]\b|clause [0-9]' frontend/src --include=*.tsx --include=*.ts | grep -v '\.test\.' | grep -v 'features/help/generated'` shows only lines starting with `//`, `*` or `/**`; the same pattern over `backend/src/main/java` restricted to lines containing `"` returns only the IPCC table citation; over `help/docs`, `qa/src/vocabulary/ui`, `qa/packs` it returns nothing.
- Backend `./mvnw verify`; frontend `npm run lint && npm run format:check && npm test && npm run build` (the guard test included).
- `make qa-lint qa-compile-check qa-export-check`, `make help-check`, `make docs-check`.
- Browser spot-check on a reset stack (`make db-reset`, `make admin`): the entity form hints and the Financial control default, the boundary tab, the edition drawer question and its two field errors, the base-year card, the eighteen-month hint, a run's report page and its PDF (methodology opener, boundary table head, gases outside the scopes) read without a chapter.
- `make qa-run-ui QA_PROC=2` and `QA_PROC=7` pass against the stack (they quote the changed strings).
