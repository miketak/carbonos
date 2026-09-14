# CarbonOS backlog from the GHG officer audits

Both audit backlogs are closed. What remains here is the work that was never
part of them: decisions the owner still owes, follow-ups noticed while
implementing, and what the next audit should cover.

| Audit | Report | Backlog |
|---|---|---|
| 2026-09-08, 51 findings | [reviews/2026-09-08](docs/reviews/2026-09-08-ghg-officer-ui-audit.md) | 26 tickets, all merged; closed 2026-09-09 |
| 2026-09-11, 56 findings | [reviews/2026-09-11](docs/reviews/2026-09-11-ghg-officer-ui-audit.md) | 10 specs, all merged as PRs #57 to #61; closed 2026-09-12 |

The ticket text of the first backlog and the Top 10 tables of the second are
in the git history of this file. Each report's own findings list is the
permanent record, and every spec names the findings it closes.

## How to use this file

- One item per checkbox. Tick it when the work is merged to `main`.
- An item here is open work or an open question, never a record of something
  finished. Delete an item when it closes; the reports and the specs keep the
  history.
- Non-trivial work needs a spec in `specs/` before implementation (see
  `CLAUDE.md`).

## Decisions the owner owes

Each is an open question written into the spec that raised it. None blocks
anything today; each will be asked again the first time a client hits it.

- [ ] **D-01** May an organization owner revoke an administrator's active
  support access? Today only the administrator can end it early, and it
  expires on its own after 24 hours (spec 01.3).
- [ ] **D-02** Should the 24-hour support window be shorter or configurable
  per deployment? It is currently fixed (spec 01.3).
- [ ] **D-03** Should **New organization** stay open to every signed-in user,
  or be reserved to administrators on a hosted deployment (spec 01.4)?
- [ ] **D-04** Should freezing an inventory also wait for COMPLETENESS
  warnings (straddling records, months with no data), or only for
  CLASSIFICATION errors as it does now (spec 05.5)?
- [ ] **D-05** Should an upstream rule fire for a primary line in scope 3
  category 8 (a leased asset under equity share)? It does not today, and the
  category 8 line says upstream emissions are optional under the Technical
  Guidance (spec 04.7).
- [ ] **D-06** Should a Montreal Protocol gas exclusion carry a CO2e figure
  for information, or the gas mass alone as it does now (spec 04.8)?

## Follow-ups noticed while implementing

- [ ] **FU-01** Entity and facility removal refusals show a toast instead of
  holding the dialog open with the typed reason. The shared `RemoveDialog`
  has no error slot. Every other refusal surfaces in place (spec 01.4).
- [ ] **FU-02** Field-level disables on the boundary ticks, the operational
  boundary declaration, the report metadata fields and the classify controls
  fold the role into the existing `editable` flag, so they carry no per-field
  tooltip naming the role. Every button does (spec 01.4).
- [ ] **FU-04** Stored runs calculated before spec 07.7 keep their old gas
  masses: pro-rated lines there still carry full-period gas figures. They are
  snapshots and are left as calculated. Decide whether any dev or QA run
  needs recalculating before it is shown to anyone.

## Questions the factor pack specs left open

Each sits in the non-goals of the spec named beside it. They are listed here
because this file is where open work lives. The first three are what the GHG
officer said a verifier would ask for.

- [ ] **PK-01** A data quality or pedigree score on a pack row, along the
  lines of the indicators the Scope 3 Standard defines (spec 02.5).
- [ ] **PK-02** A record of who checked each row's transcription against the
  source document, which is a different act from approving the edition
  (spec 02.5).
- [ ] **PK-03** One retrievable recalculation log joining adoption decisions
  to base-year candidates. Today the answer lives on the notice and the
  candidate lives in the base year (spec 02.7).
- [ ] **PK-04** Whether an approver must re-confirm when a draft changes
  after they have read the blast radius (spec 02.5).
- [ ] **PK-05** Whether a declined notice can be re-opened, or whether the
  organization imports the edition directly instead (spec 02.7).

## Emission factors still unsourced

No published factor exists for these, so a supplier or study factor is
entered by hand. The pack cards say so. Sourcing one is now an authoring job
rather than an engineering one: a curator adds the row to a draft edition in
the admin console and an approver publishes it (spec 02.5). Nothing is
generated from a script and no release is needed.

- [ ] **EF-01** Sodium cyanide (a material cat. 1 line at every Ghanaian gold
  plant). The mining pack ships a supplier-factor template, not a value.
- [ ] **EF-02** Tailings and mine water treatment methane.
- [ ] **EF-03** Grinding media wear.
- [ ] **EF-04** Composition and flare-efficiency inputs that would derive CO2
  and CH4 from a site gas analysis. The IPCC defaults ship; the site-specific
  path does not (spec 02.4).

## Next audit

Two bodies of work are implemented and neither has been walked through the UI
by the officer. That walkthrough is the real verification; the tests prove the
rules, not the experience.

From the second backlog: the by-gas table footing to the total, the
equity-share copy rebuilding its boundary, the PDF, and support access.

From the factor pack console, none of which any pass has seen:

- [ ] Authoring a draft edition, and the nine publication rules refusing a bad
  row. Try a value with no source, a zero that is not a template, a code
  outside the namespace, and a gas split that does not reconcile.
- [ ] Publication with two people: the approver refused when they are the
  curator, the evidence checksum, and the change log against the predecessor.
- [ ] The blast radius before publishing and before withdrawing, read as a
  maintainer would read it before deciding.
- [ ] Versioned import: a later edition cutting a new version, a locally
  edited row reported as a conflict rather than overwritten, and a locked
  period refusing the import.
- [ ] The adoption inbox: the per-row diff, the estimated tonnage movement,
  the recalculation question, and that accepting holds **Mark as final** and
  **Publish** while never blocking a run.
- [ ] That a published edition cannot be edited, and that a superseded or
  withdrawn one is still readable but not importable.

Ask the officer to cover what neither pass has exercised:

- [ ] Preparer and Reviewer roles end to end in a second browser; whether
  **Mark as final** and **Publish** are refused to a Preparer. Only Verifier
  was tested on 11 September.
- [ ] Concurrency: two members editing one inventory at the same time.
- [ ] "Record recalculated base" and "Decline" on a recalculation candidate.
- [ ] Deleting an organization and a facility, now that both are guarded.
- [ ] Steam, heat and cooling scope 2 lines; the franchise relationship;
  downstream categories 9 to 14; the construction pack's rows in a run.
- [ ] Volume: thousands of records, beyond the 36 records and 182 factors of
  the second pass.
- [ ] Whether a facility's grid region pre-selects a factor anywhere.
- [ ] The PDF of an equity-share run and of a correction run. Only Run 001's
  PDF was read.
- [ ] Password reset, disabling a user, and the effect on attributed history.
- [ ] Email deliverability beyond Mailpit.

## Keep: behaviour both audits confirmed as correct

Listed so nobody regresses it. Each now has a named regression test.

- [x] **K-01** Table 1 consolidation for every relationship type, ownership
  chains and all three approaches (`Table1Test`).
- [x] **K-02** Quantity and date validation on activity records
  (`futureDatedFactsAreRejected`, `validationBlocksUnclassifiedIncludedActivitiesAndUnitMismatches`).
- [x] **K-03** Pre-flight gates, including the boundary, classification,
  evidence, base-year and Quality Criteria gates
  (`runCreationIsRefusedWhileValidationBlocks`, `freezingAnEmptyBoundaryIsRefused`,
  `theBaseYearGateWarnsOnAGwpMismatchAndOnWindowsUnderTheWholeYearConvention`).
- [x] **K-04** Appendix F lease treatment switching between operational
  control and equity share (`Table1Test.leasedAssetsFollowAppendixF`, and
  spec 05.4 re-derives it on a copy).
- [x] **K-05** Transparent, reconciling arithmetic: converted quantity,
  factor, share and result on every line, and a by-gas table that foots to
  the total (spec 07.7's footing assertion).
- [x] **K-06** Base-year policy: threshold, rationale, structural-change
  convention and the candidate workflow
  (`structuralChangesAreFlaggedAgainstTheBaseYearThreshold`).
- [x] **K-07** Freeze, boundary version, final, publish, supersede, with
  frozen shares surviving later entity edits
  (`aFinalDesignationMustBeWithdrawnBeforeReopeningAndPublishingMakesARecord`,
  `thePublishedReportIsFrozenAndLaterChangesAppearSeparately`).
