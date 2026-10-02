# QA scenario DSL: pure domain steps, projected four ways

## Context

The QA packs under `docs/qa/` (governance: 8 procedures, mining: 11) are hand-written Markdown. Each governance procedure has been walked by hand-rolled Playwright scripts four times; those scripts lived in session scratchpads and are gone. Every walkthrough re-derived locators, waits and expectations from the prose, and every product change had to be propagated into the prose by hand. Nothing checks that a quoted product string still exists, that a help page's `QA governance 002 A3` citation resolves, or that the procedure and the thing that drives it agree.

The goal: one declarative representation of a QA procedure, written as **domain actions and domain outcomes with no UI semantics**, from which everything else is generated: (1) the tester-facing procedure Markdown that mkdocs and the pandoc/Google Docs pipeline already consume, (2) a runnable **API script** per procedure that drives the backend and verifies outcomes by querying the API, (3) a runnable **UI script** per procedure that drives the browser and verifies outcomes by seeing them on screen, and (4) a run record per procedure and driver. A specialist runs each generated script once by hand on a prepared stack; on green, the script and its record are committed. At the end, both drivers run the whole governance pack end to end.

Decisions taken with the owner:
- Scenario files are **YAML data**, validated by a **TypeScript closed vocabulary** (zod), with a generated JSON Schema for editor validation. No Gherkin, no code in scenarios.
- **The scenario is pure.** A step is an actor, a domain action and the domain outcomes that must hold afterwards ("Ama adds an activity record; the record exists"). How the action is performed (page, button, field) and how an outcome is observed (API call, list on screen) belong to the vocabulary's projections, never to the scenario. Buttons, dialogs, tabs, toasts, banners, rows, windows and quoted screen text do not appear in a procedure file.
- Exported Markdown keeps today's **structure** (file names, headings, case ids, five-column tables, Covers, versions, sign-off, known non-goals) with wording the narrator produces from the projections.
- Scope: **all eight governance procedures**, transliterated in chain order, each taken through all projections and a green run of both drivers before the next.
- The committed per-procedure scripts are **generated runnable files**, pure projections of the YAML, not hand-finished.
- Twelve enhancements accepted (all): rule ids in problem details, a reset endpoint, a controllable clock, a version endpoint, checkpoints, implied postconditions, `qa doctor`, `qa dev`, state digest equivalence, a UI surface map lint, fixtures from data, UI cross-check mode.

Established facts the plan relies on (from exploration):
- Procedure format: `docs/qa/governance/README.md` ("How to read a procedure"); `007-the-pack-lifecycle-end-to-end.md` lines 94-114 as the style probe. Five columns; `scripts/qa-docs/step-tables.lua` matches that header; `mkdocs.yml` nav lists every procedure; `scripts/publish_qa_docs.py` globs `NNN-*.md`. Procedures chain state strictly; freeze and run numbers shift if a step is driven twice; edition ids are burned per database (007).
- Backend: session cookie plus CSRF (`GET /api/auth/me` seeds `XSRF-TOKEN`, echo as `X-XSRF-TOKEN`), RFC 9457 problem details via `shared/web/GlobalExceptionHandler.java`; refusals are `ErrorResponseException` subclasses with string-literal details at the throw site (93 `GhgRuleViolationException`, 66 `GhgFieldException`, 7 `UserRuleViolationException`, 4 `RoleRequiredException`, a handful more); audit events at `GET /api/ghg/organizations/{id}/events` and `/inventories/{id}/events`; Mailpit on `:8025`. No OpenAPI, no build-info plugin, no shared `Clock` bean (22 `now()` call sites: 16 ghg, 3 user, 2 help, 1 platform; the two rate limiters already take a `Clock`). `media/MediaStorage.java` is the object store's public interface. Modules are checked by `ModularityTests`. Profiles: `application.yaml` and `application-local.yaml`.
- Frontend: `@playwright/test` 1.63 devDependency, no config; `frontend/e2e/help-walkthrough.mjs` holds the working helpers. Locators are role and label based (`components/Field.tsx`, `Drawer.tsx`, `Modal.tsx`, `Tabs.tsx`); `data-testid` unused. `refusalMessage()` in `src/lib/api.ts` rewrites 403 and 404 details on screen.
- Generator model to copy: `frontend/scripts/compile-help.mjs` (`--check`, `--strict`, `fail()`/`warn()`).

## Design

### 1. The scenario files (the single source)

```
qa/packs/governance/pack.yaml                 persona, actors (name, email alias, password, platform role, org role),
                                              fixtures AS ROWS, the scenario table, docs prose, ui window assignment
qa/packs/governance/001-accounts-and-the-platform.yaml ... 008-base-year-and-the-record.yaml
```

A procedure file has a **scenario body** (pure) and a **docs block** (document metadata, never read by the drivers). Excerpts, governance 3 A2 and 7 C3 as probes:

```yaml
procedure: 3
slug: activity-data
title: Activity data
after: 2
covers: ["04", "04.4", "04.5", "04.6", "08"]
let: { org: Adansi Foods Ltd }
prerequisites:
  state: [ organizationExists: { name: ${org}, facilities: 3, streams: 3 } ]   # also the silent setup when the chain starts here
  fixtures: [adansi-2025.csv, adansi-2025-rejected.csv, source-document.txt, not-evidence.zip]
sections:
  - id: A
    title: The clean file
    cases:
      - id: A2
        title: The import, and the same file again
        steps:
          - as: ama
            do: { importActivities: { organization: ${org}, file: adansi-2025.csv } }
            expect:
              - activityRefs: { organization: ${org}, from: ACT-0001, to: ACT-0010 }
              - activityOrder: { organization: ${org}, newestPeriodFirst: true, first: ACT-0006, last: ACT-0001 }
          - do: { importActivities: { organization: ${org}, file: adansi-2025.csv } }
            expect:
              - importRejected: { rule: activity.import.duplicate-row, rows: all }
              - activityCount: { organization: ${org}, count: 10 }
                why: a file imports whole or not at all
```

```yaml
      - id: C3
        title: Support access reads everything and cannot decide
        steps:
          - as: adminB
            expect: [{ notMemberOf: { organization: ${org} }, why: an administrator is an outsider }]
          - do: { assumeSupportAccess: { organization: ${org}, reason: short } }
            expect: [{ refused: { rule: platform.reason-too-short } }]
          - do: { assumeSupportAccess: { organization: ${org}, reason: "Ticket 118: the owner asked what the notice means" } }
          - do: { decideNotice: { organization: ${org}, edition: ${edition}, decision: accept, treatment: VINTAGE_PROGRESSION } }
            expect:
              - refused: { rule: adoption.support-access-cannot-decide }
              - notice: { organization: ${org}, edition: ${edition}, state: OPEN }
          - do: { decideNotice: { organization: ${org}, edition: ${edition}, decision: decline } }
            expect: [{ refused: { rule: adoption.support-access-cannot-decline } }]
          - do: { endSupportAccess: { organization: ${org} } }
          - as: ama
            expect:
              - historyHas: { organization: ${org}, event: SUPPORT_ACCESS_ASSUMED, actor: adminB, reason: "Ticket 118: the owner asked what the notice means" }
              - historyHas: { organization: ${org}, event: SUPPORT_ACCESS_ENDED, actor: adminB }
docs:
  version: 3
  estimatedMinutes: 40
  objective: ...
  runNote: ...
  prerequisitesText: [...]
  knownNonGoals: ...
  rationale: { C3: "..." }
  changeNotes: [{ version: 2, date: 2026-09-29, text: "..." }]
```

Rules of the shape:
- A step is `{ as?, do?, expect?, capture?, why?, continueOnFail? }`. `as` persists until changed. A step with `expect` and no `do` is an observation: the drivers verify, the narrator tells the tester where to look.
- `do` is one verb with **domain arguments only**: names of things, values with units, periods, enum values that are the API truth. Never ids, never screen elements.
- `expect` lists **outcome kinds**: statements about state after the action (exists, count, status, history event, email arrived, session ended, refused by rule R). Each kind is verified by the API projection (query) and by the UI projection (see it), and narrated by the exporter.
- **Implied postconditions.** Every verb declares the outcomes that must hold after it succeeds (`assumeSupportAccess` implies `supportAccess { active: true }`; `addEntity` implies `entityExists`). The drivers verify them on every step without the scenario saying so, and the narrator folds them into the Expected result cell when the scenario lists nothing else. Scenarios list only what is interesting beyond the postconditions (C3 step 3 above lists nothing).
- Refusals name a **rule**, never a message. The rule catalogue (§2) comes from the backend.
- Expression holes: `${name}` from `let`, `params` and captures; typed tokens `{time}`, `{date}`, `{email:actor}`. With the controllable clock, `{time}` resolves to an exact value in both drivers. No regex in scenarios.
- `why:` is prose only. `observe:` is the only escape hatch (a sentence a human must judge; recorded MANUAL; lint reports the share).
- `params` (an edition id suffix) and `capture` (a value with no name) are the only run-time variability.

Consequence to state plainly: presentational sentences in today's pack ("the dialog is titled 'Import activity data' under the eyebrow 'BULK ENTRY'", "the address bar carries the search") become an outcome if they state a domain fact (`canCreateOrganization: false`), an invariant inside the verb's UI projection if they are how the product performs the action (the dialog title is asserted by the `importActivities` UI op), or a dropped line recorded in the change notes. Each transliterated procedure bumps its version.

### 2. The vocabulary (closed; every entry carries both projections and its narration)

```
qa/src/vocabulary/
  contract.ts          Verb, Outcome interfaces; defineVerb(), defineOutcome()
  index.ts             registry; zod discriminated unions; emits qa/schema/scenario.schema.json
  verbs/{auth,admin,packs,org,activity,inventory}/*.ts     one file per verb, sibling *.test.ts
  outcomes/*.ts        userExists, userStatus, settingValue, settingHistoryHas, memberOf, notMemberOf, organizationExists,
                       entityExists, facilityExists, streamExists, factorStatus, factorVersions, activityExists, activityCount,
                       activityRefs, activityOrder, activityHistoryHas, evidenceAttached, importRejected, inventoryStatus,
                       boundaryVersion, assignment, gate, runNumber, runTotal, reportLine, notice, supportAccess, historyHas,
                       emailReceived, sessionEnded, canCreateOrganization, refused, observe ...
  rules/catalogue.json pulled from the backend (`make qa-rules`), committed; rules/index.ts types it
  ui/surface.ts        every navigation label, button, field label and dialog title the UI projections use, as constants
  ui/{ops.ts,checks.ts,narrate.ts,locators.ts}
```

```ts
export interface Verb<N extends string, A> {
  name: N; args: z.ZodType<A>
  api: (ctx: ApiContext, args: A) => Promise<ApiOutcome>
  ui:  (args: A, ctx: UiContext) => UiOp[]                      // ONE plan: executed by the UI script, narrated by the exporter
  postconditions: (args: A) => OutcomeRef[]                     // verified by both drivers after every successful call
}
export interface Outcome<N extends string, A> {
  name: N; args: z.ZodType<A>
  api: (ctx: ApiContext, args: A, last: ApiOutcome) => Promise<CheckResult>
  ui:  (args: A, ctx: UiContext) => UiCheck[]
  narrate: (args: A, ctx: NarrationContext) => string
}
```

- A verb or outcome without both projections does not compile; without a sibling test or a registry entry it fails lint. An unknown verb or outcome is a schema error.
- `refused` is generic: it looks the rule up in the catalogue and checks the `rule` member of the problem detail (API) and the surface the catalogue declares (UI: a toast through the product's `refusalMessage()`, a `role=alert` under the field, or a control disabled until a condition). The exported document quotes the catalogue's message.
- `ui/surface.ts` is the only place a screen string may be written; verbs and outcomes reference its constants. Lint greps every constant's value in `frontend/src`.
- Screenplay mapping for the docs: Actor = pack account; Ability = API session or browser context; Task = verb; Interaction = UiOp; Question = outcome; Answer = CheckResult.

### 3. Backend QA hooks: module `com.carbonos.qa`, local profile only

A new Spring Modulith module, enabled by `carbonos.qa.endpoints=true` (set in `application-local.yaml` and in the Testcontainers test profile, never on Railway), with every endpoint under `/api/qa/**` requiring the ADMIN role. `ModularityTests` gains `qaDependsOnlyOnPublicApis` and a context test proves the module's beans are absent without the property. Depends on the public APIs of `media` (`MediaStorage`), `user` (admin bootstrap) and `shared`.

- **Rule ids.** `shared/web/Rule.java`: `record Rule(String id, HttpStatus status, String message, String field)`. `shared/web/RuleViolation.java`: an `ErrorResponseException` built from a `Rule`, setting title, detail, `errors.<field>` when present, and the extension member `rule` on the problem body. Each module declares its rules as constants in its root package (`ghg/GhgRules.java`, `user/UserRules.java`, `platform/PlatformRules.java`, `help/HelpRules.java`) and registers a `RuleSource` bean the `qa` module aggregates into `GET /api/qa/rules`. Migration is incremental: the existing exception classes get a constructor taking a `Rule`; throw sites move to a rule as their procedure is transliterated, message-only throws stay valid. A backend unit test asserts ids are unique and messages non-blank. `make qa-rules` pulls the catalogue into `qa/src/vocabulary/rules/catalogue.json`; `qa doctor` compares the live catalogue's hash with the committed one.
- **Reset.** `POST /api/qa/reset`: truncates every table except `flyway_schema_history` and the Modulith event publication table (one `TRUNCATE ... CASCADE` over the public schema listed from `information_schema`), clears the object store through a new `MediaStorage.deleteAll()`, invalidates every session, re-runs the admin bootstrap, and resets the clock. Replaces `make db-reset` plus a backend restart in the authoring loop; sessions survive because the backend does not restart.
- **Clock.** `shared/time/ClockConfig.java` provides a `Clock` bean (`systemUTC` by default); under `carbonos.qa.endpoints=true` it is a `MutableClock`. `PUT /api/qa/clock { at }` pins it, `DELETE` resumes. The 22 `now()` call sites are moved to the injected `Clock` incrementally, support access expiry, link expiry and audit timestamps first (procedures 1 and 7). SQL `DEFAULT now()` columns are listed in the ADR as the known remainder.
- **Version.** `spring-boot-maven-plugin` `build-info` goal plus `git-commit-id-maven-plugin`; `GET /api/version` (public, in `platform`) returns version, sha and build time. Run records stamp from it.
- **Digest.** `GET /api/qa/digest?organization=<name>`: a deterministic JSON of the organization's state (counts per table, statuses, boundary and run numbers, run totals, the last history entry per inventory) and its sha256. Used by the state-digest equivalence check (§7).

### 4. UI projection and the narrator

UiOp set (closed): `goto`, `open {nav}`, `tab`, `click {button, within?}`, `fill {label, value, within?}`, `choose {label, option}`, `upload {label, fixture}`, `toggle {label}` (click and poll; checkboxes are server-controlled), `confirm {dialog, button}`, `press`, `waitFor`, `assertDialog {title}`. Each has one Playwright executor in `runtime/ui/execute.ts` and one phrase in `narrate.ts`; every label comes from `surface.ts`.

UiCheck set: `at {nav}` (where to look), `textVisible`, `textAbsent`, `toast`, `fieldError`, `disabled {button, until}`, `rowHas`, `badge`, `tabsAre`, `drawerShows`, `url`, `figure` (the product's formatter), `screenshot`.

Narration (snapshot-tested): the Action cell is the verb's UiOp plan in the house style, prefixed "As Kofi in the private window" only when the actor changes (windows assigned per actor in `pack.yaml` under `ui:`); ops grouped into clauses; bold for UI elements, backticks for typed values, double quotes for product text with the stop after the closing quote; `<time>` for `{time}`. The Expected result cell is each outcome's `narrate` (postconditions included when the scenario lists nothing else), `why` appended as ": why"; `refused` narrates from the rule's surface. An observation step narrates the `at` of its first outcome as the Action. Never an em-dash.

Two small frontend extractions: move `refusalMessage`, `fieldErrors`, `problemDetail` from `frontend/src/lib/api.ts` into a dependency-free `frontend/src/lib/refusal.ts` (re-exported from `api.ts`); expose the number formatter in `frontend/src/features/ghg/format.ts` the same way. `qa/tsconfig.json` aliases both.

### 5. The generated scripts (projections 2 and 3)

`qa compile` walks the same loaded tree as the exporter and emits two **Playwright test files** per procedure, calling a thin runtime. The `api` project has no browser and uses `APIRequestContext`; the `ui` project uses one `BrowserContext` per actor. One runner, `test.step` per step, traces and screenshots, `--grep` for a single case.

```
qa/generated/governance/api/007-the-pack-lifecycle-end-to-end.api.spec.ts
qa/generated/governance/ui/007-the-pack-lifecycle-end-to-end.ui.spec.ts
```

```ts
// generated from qa/packs/governance/007-the-pack-lifecycle-end-to-end.yaml (sha256 3f1c...); edit the YAML, then `make qa-compile`
import { procedure, test } from '@qa/runtime/api'
const P = procedure('governance', 7)
test.describe.configure({ mode: 'serial' })
test.describe('Procedure 7: The pack lifecycle end to end', () => {
  test.beforeAll(P.start)      // actors, resolver state, prerequisites.state when the chain starts here
  test('C3. Support access reads everything and cannot decide', async () => {
    await test.step('7.C3.2', async () => {
      const out = await P.as('adminB').do('assumeSupportAccess', { organization: 'Adansi Foods Ltd', reason: 'short' })
      await P.expect(out, [{ refused: { rule: 'platform.reason-too-short' } }])   // postconditions are checked inside do() on success
    })
  })
  test.afterAll(P.finish)      // state digest, qa/.state save
})
```

- `qa/src/runtime/api/`: `session.ts` (one `APIRequestContext` per actor, CSRF seed, lazy login, one re-login on 401), `http.ts` (never throws on 4xx), `mailpit.ts` (search by recipient and subject, extract links, poll with backoff), `resolve.ts` (name to id, cached per run, invalidated by creating and deleting verbs), `poll.ts` (`until(condition)`; no bare sleeps), `evidence.ts`, `qa.ts` (the `/api/qa/*` client: reset, clock, rules, digest).
- `qa/src/runtime/ui/`: `browser.ts` (one context per actor at 1440 by 900, lazy login, the toast collector from `help-walkthrough.mjs`, contexts recycled after 45 minutes), `execute.ts` (UiOp interpreter: `getByRole`/`getByLabel({exact: true})` first, scoped to dialogs and rows; any CSS selector lives in `locators.ts` with a comment), `checks.ts`. Waits are conditions. Screenshot on every failure.
- **Cross-check mode.** `QA_CROSS_CHECK=1` makes the UI runtime run each outcome's `api` check after its `ui` check and report a distinct failure class: "UI stale" (API true, screen not) versus "backend" (API false). Default on for the specialist's runs.
- `qa/playwright.config.ts`: projects `api` (`QA_API_URL`, default `:8080`) and `ui` (`QA_APP_URL`, default `:5173`); `workers: 1`, serial, files ordered by procedure number, `retries: 0`, reporters `list` plus `json` into `qa/out/<run-id>/`.
- Step states: PASS, FAIL, SKIP (later steps of a failed case), N/A (an outcome kind this driver cannot observe, declared on the kind, rare), MANUAL (`observe`). N/A and MANUAL are annotations, never passing assertions.
- `P.start` establishes `prerequisites.state` (each state kind has an `ensure` through the API) and loads `qa/.state/<persona>.json`; `P.finish` fetches the digest and saves state. Params come from the environment (`QA_PARAM_suffix=b`). `qa compile --check` diffs against the committed files; generated files carry the YAML's sha256.

### 6. The exporter (projection 1) and fixtures from data

- `qa/src/export/render.ts`: `renderProcedure(procedure, results?)` writes the header comment `<!-- generated from qa/packs/governance/NNN-*.yaml by make qa-export; edit the YAML -->` then today's layout: H1, Objective, Covers (spec file names from `specs/`), Estimated time, Procedure version line when `version > 1`, "Run this procedure after procedure N" plus `runNote`, Prerequisites (`prerequisitesText`, actors with windows, fixtures), sections and cases with optional rationale, the five-column table, Sign-off, Known non-goals, Change notes. With `results` it fills Pass/Fail and Notes.
- `qa/src/export/readme.ts`: regenerates the pack README's accounts, scenario, fixtures, procedures (with the last green date per driver from the run records) and coverage tables; the README's prose lives in `pack.yaml` under `docs:`.
- **Fixtures from data.** `pack.yaml` declares each CSV fixture's rows (and for the rejected file, each row's `rule`). `qa export` writes `docs/qa/governance/fixtures/*.csv` from them, derives the README's record table and the `importPreview` control totals (the per-stream litres and MWh, the ten refs, the rejected row numbers), and lint fails when a scenario's typed total disagrees with the rows. `source-document.txt` and `not-evidence.zip` stay as files.
- `--check`: render to memory, diff against the committed files, fail with a unified diff. Generated Markdown and fixtures **are committed**; `mkdocs.yml` and `publish_qa_docs.py` stay untouched.
- Version rule: a rendered body change without a `docs.version` bump fails; the last change note's version must equal `docs.version`.

### 7. Run records (projection 4), checkpoints, and the specialist workflow

```
qa/runs/governance/007.api.json    { procedure, driver, yamlSha256, productVersion (from /api/version), gitSha, date, specialist,
qa/runs/governance/007.ui.json       params, clock, digestSha256, counts: {pass, na, manual}, steps: [{id, status, note?}] }
```

- `make qa-record PROC=7 DRIVER=api` converts the last Playwright JSON report into the record. It refuses on any FAIL or SKIP, on a YAML sha that differs from the script's header, or when the product version is missing. Evidence stays in `qa/out/`, gitignored.
- **State digest equivalence.** The record stores the end-of-procedure digest. `qa record` for the second driver refuses when its digest differs from the first driver's record for the same YAML sha, printing the two digests' diff: the projections must leave the product in the same state. A later run whose digest differs from the committed one, with every step green, is reported as "unasserted drift" for the specialist to read.
- **Checkpoints.** `make qa-checkpoint PROC=4` stores `pg_dump` of the compose Postgres, a mirror of the MinIO bucket, the pinned clock and `qa/.state` under `qa/.checkpoints/<persona>/004/` (gitignored). `make qa-restore PROC=4` puts them back through `/api/qa/reset` and `pg_restore`, so procedure 5 reruns without replaying 1 to 4 and freeze and run numbers match the recorded run.
- **`qa doctor`.** Checks the backend and `/api/version`, the `qa` endpoints and the catalogue hash, Mailpit, the seeded admin, the Vite server, the Playwright browser, the loaded checkpoint and the clock, and prints a one-screen status before a run.
- **`qa dev`.** Watches `qa/packs/**` and `qa/src/vocabulary/**`; on save runs lint, export and compile and prints the rendered case that changed.
- Workflow per procedure: transliterate the YAML; `qa dev` running; `make qa-restore PROC=N-1` (or `qa reset` for 001); `make qa-run-api PROC=N`, fix until green, `make qa-record`; `make qa-restore PROC=N-1` again; `make qa-run-ui PROC=N` with cross-check on, `make qa-record` (digest must match); `make qa-checkpoint PROC=N`; one PR with the YAML, the Markdown, the fixtures, the catalogue if rules were added, both scripts and both records.
- Lint reads the records: a procedure whose YAML sha differs from its last green record is "unverified since <date>" (warning by default, failure under `--strict`, which the release-candidate workflow uses).
- Honest full run: `make qa-run-api PERSONA=governance` resets through the endpoint and runs 001 to 008 in order; `make qa-run-ui` the same. The end state of this plan is both green with matching digests per procedure.

### 8. Lint (`qa lint`)

Schema; unique ids; `${}` references resolve; `covers` specs exist and are Approved; fixtures exist or are generated; actors exist; `after` has no cycles; every referenced rule exists in the catalogue; every `surface.ts` constant appears verbatim in `frontend/src`; fixture-derived totals agree with typed values; no em-dash outside quoted strings; every help page `<!-- sources: ... QA governance 002 A3 -->` resolves to a real case; every verb and outcome is registered and tested; procedure files are in `mkdocs.yml` nav; generated scripts, Markdown and fixtures current; run records current. Prints per procedure: steps, outcomes by kind, postconditions verified, `observe` count, N/A per driver.

### 9. Repo layout, Makefile, CI, docs

```
qa/
  package.json          tsx, zod, zod-to-json-schema, yaml, chokidar, @playwright/test 1.63, vitest, typescript ~6
  tsconfig.json         strict; paths @qa/* and to ../frontend/src/lib/refusal.ts, ../frontend/src/features/ghg/format.ts
  playwright.config.ts  projects api and ui, workers 1, serial, json reporter
  schema/scenario.schema.json       generated, committed
  packs/governance/*.yaml
  generated/governance/{api,ui}/*.spec.ts   generated, committed after a green run
  runs/governance/*.json                     run records, committed
  src/{cli.ts,load.ts,lint/,vocabulary/,runtime/{api,ui}/,compile/,export/,record/,doctor.ts,dev.ts,checkpoint.ts}
  src/**/*.test.ts      vitest: schema, narrator snapshots, renderer and compiler goldens on a tiny synthetic pack
  .state/, .checkpoints/, out/   gitignored
backend/src/main/java/com/carbonos/qa/            QaController (reset, clock, rules, digest), QaProperties, package-info
backend/src/main/java/com/carbonos/shared/web/{Rule,RuleViolation,RuleSource}.java
backend/src/main/java/com/carbonos/shared/time/ClockConfig.java
backend/src/main/java/com/carbonos/{ghg/GhgRules,user/UserRules,platform/PlatformRules,help/HelpRules}.java
backend/src/main/java/com/carbonos/platform/internal/web/VersionController.java
```

- Makefile: `qa-lint`, `qa-export`, `qa-export-check`, `qa-compile`, `qa-compile-check`, `qa-rules`, `qa-doctor`, `qa-dev`, `qa-reset`, `qa-checkpoint PROC=`, `qa-restore PROC=`, `qa-run-api [PERSONA=] [PROC=]`, `qa-run-ui [...]`, `qa-record PROC= DRIVER=`, `qa-report`. `docs-check` gains `qa-export-check`; `verify` gains `qa-lint` and `qa-compile-check`.
- CI: `ci.yml` gets a `qa-scenarios` job (`npm ci` in `qa/`, lint, `export --check`, `compile --check`, vitest). The backend job already covers the `qa` module's tests. The drivers do not run in CI in this plan; the records are the gate. A nightly workflow running both chains against the compose stack is a later option the config supports.
- Docs: ADR `docs/adr/0007-qa-procedures-as-pure-scenarios-with-generated-projections.md` (options: hand-written Markdown plus separate Playwright specs; Gherkin with step definitions; UI-flavoured scenario data; pure domain scenarios with a closed vocabulary; consequences: presentational assertions move into verbs or are dropped, generated files are committed, the catalogue is the message oracle, N/A and MANUAL are visible); ADR `0008-a-qa-module-for-local-test-hooks.md` (rule ids, reset, clock, digest; why a module and not test code; why ADMIN-gated behind a property); `docs/how-to/write-a-qa-scenario.md`; `docs/how-to/run-a-qa-procedure.md` (doctor, restore, run, record, checkpoint); `docs/reference/qa-dsl.md` generated from the registry; updates to `docs/how-to/publish-qa-procedures.md`, the Makefile and CI reference pages, `docs/qa/README.md`, `mkdocs.yml` nav, `CLAUDE.md` (edit the YAML, never the generated files; `make qa-lint` and `make qa-compile-check` join the DoD; a new refusal is a `Rule`, a reworded one updates the catalogue and regenerates the pack in the same PR).

## Phases

1. **Tooling skeleton.** `qa/` package, contract types, registry, zod and JSON schema, loader, lint, renderer, narrator, compiler, record tool, `doctor`, `dev`, with a synthetic two-step pack and golden tests; Playwright config; Makefile targets; the CI job; ADR 0007 proposed. Extract `refusal.ts` and the formatter. Exit: the three `--check` targets green on an empty governance pack.
2. **Backend hooks.** `Rule`, `RuleViolation`, `RuleSource`, the `qa` module with reset, clock, rules and digest, `ClockConfig`, `/api/version`, `MediaStorage.deleteAll()`, ModularityTests additions, ADR 0008. Rules for procedure 1 (user, platform) get ids; the rest stay message-only until their procedure. `make qa-rules`, `qa-reset`, `qa-checkpoint`, `qa-restore` working on the local stack. Exit: `./mvnw verify` green; `qa doctor` green.
3. **Procedure 001** (accounts and the platform): several actors, Mailpit, platform settings and their history, admin versus member refusals, the password rule, the clock pinned for link expiry. Roughly 15 verbs, 12 outcome kinds, 10 rules. Exit: Markdown diff reviewed, both scripts green, digests match, records and checkpoint committed.
4. **Procedure 002** (the organization): members, entities, facilities, streams, units, densities, factors, approval, structure history; the bulk of the CRUD verbs with postconditions, the resolver; ghg rules get ids as they are reached.
5. **Procedure 003** (activity data): fixtures from rows, multipart import, dry-run totals derived from the rows, rejections by rule, evidence, drafts, corrections, removals, the evidence index CSV. The first presentational lines moved into verbs or dropped with a change note.
6. **Procedures 004 and 005** (inventory, boundary, declaration, classification, gates, freeze).
7. **Procedure 006** (runs, final, publication, correction): `runTotal` and `reportLine` through the product formatter, exports, supersession.
8. **Procedure 007** (pack lifecycle, support access, clock-pinned expiry, `params.suffix` proven by a second API pass).
9. **Procedure 008** (base year and the record). Then the two honest full runs from `qa reset` (001 to 008, API and UI) green with matching digests; records refreshed; README regenerated.
10. **Close-out**: help-comment lint, `docs/reference/qa-dsl.md`, how-to pages, both ADRs accepted, `CLAUDE.md`. The remaining message-only throw sites are listed as follow-up; the mining pack follows the same route later. New verbs and outcomes per procedure during phases 4 to 9 is the signal that the vocabulary has converged.

Each of phases 3 to 9 ends with one PR carrying the YAML, the regenerated Markdown and fixtures, the catalogue if rules were added, both generated scripts and both run records.

## Best practices folded in

- The scenario is the domain, nothing else; a tester could name every verb and outcome without looking at the screen. Postconditions make the common outcome implicit and always verified.
- Closed vocabulary; adding a verb or outcome means a registry entry, both projections, narration, postconditions and a test, in one PR. Screen strings live only in `surface.ts`; refusal messages live only in the backend.
- One UI plan per verb and one UI check per outcome feed both the browser script and the prose; the compiler and the exporter walk the same tree.
- Rule ids make the message a display concern; the catalogue is generated from the backend, never typed.
- Honest results: N/A and MANUAL visible per driver, cross-check separates stale UI from backend faults, digests prove the two drivers agree and catch unasserted drift, a record is refused on any FAIL or SKIP.
- No sleeps, no regex, no ids, no retries, no hand edits to generated files, no wall-clock dependence (pinned clock).
- Reruns are cheap and explicit: reset endpoint, checkpoints per procedure, params and clock in the record.
- Numbers come from fixture rows and the product's formatter, compared with zero tolerance.
- Document metadata stays in `docs:` blocks the drivers never read; the exporter enforces the version bump.

## Verification

- Unit: `cd qa && npm test`; backend `./mvnw verify` (rule uniqueness, `qa` module absent without the property, reset leaves only the schema history and the admin, digest deterministic across two calls, clock pin and resume).
- Static: `make qa-lint`, `make qa-export-check`, `make qa-compile-check`, `make docs-check`.
- Export review per procedure: `make qa-export`, read `git diff docs/qa/governance/` case by case for lost facts.
- API, per procedure and for the whole pack: `make qa-doctor`, `make qa-restore PROC=N-1` or `make qa-reset`, `make qa-run-api PROC=N`; every step PASS, N/A or MANUAL; `make qa-record` succeeds.
- UI: the same with `make qa-run-ui` and cross-check on; `make qa-record` succeeds and the digest matches the API record.
- Drift: reword one refusal in the backend and confirm `make qa-rules` changes the catalogue and the pack export diff shows it; rename one button and confirm lint fails on `surface.ts`; edit a generated file by hand and confirm `--check` fails; change a YAML step and confirm lint reports the procedure unverified; change an unasserted value by hand in the database and confirm the next run reports unasserted drift.
- Frontend DoD after the extractions: `npm run lint && npm run format:check && npm test && npm run build`.
- `make qa-docs` still produces the same DOCX layout from the generated Markdown and fixtures.
