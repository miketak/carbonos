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
- [ ] **FU-03** The factor picker filters in the browser over the single
  per-page fetch. A register with thousands of factors will want the filter
  on the server (specs 02.3, 05.5).
- [ ] **FU-04** Stored runs calculated before spec 07.7 keep their old gas
  masses: pro-rated lines there still carry full-period gas figures. They are
  snapshots and are left as calculated. Decide whether any dev or QA run
  needs recalculating before it is shown to anyone.

## Emission factors still unsourced

No published factor exists for these, so a supplier or study factor is
entered by hand. The pack cards say so.

- [ ] **EF-01** Sodium cyanide (a material cat. 1 line at every Ghanaian gold
  plant). The mining pack ships a supplier-factor template, not a value.
- [ ] **EF-02** Tailings and mine water treatment methane.
- [ ] **EF-03** Grinding media wear.
- [ ] **EF-04** Composition and flare-efficiency inputs that would derive CO2
  and CH4 from a site gas analysis. The IPCC defaults ship; the site-specific
  path does not (spec 02.4).

## Next audit

The ten specs of the second backlog are implemented but have not been retested
through the UI by the officer. That retest is the real verification, in
particular the by-gas table footing to the total, the equity-share copy
rebuilding its boundary, the PDF, and support access.

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
