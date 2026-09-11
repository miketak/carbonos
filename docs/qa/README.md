# QA procedures

Manual test procedures for CarbonOS on the **qa** environment, which holds
the release candidate under test (`v0.7.0-rc.1` and so on) and moves only
when a new candidate is tagged. Each procedure has one objective, takes a
human 30 to 90 minutes, and can be run on its own. Run them in order when
you test a candidate; run one on its own after a change to the area it
covers.

## Before you start

- **App:** the qa frontend address in
  [Environments](../environments.md); the line under a page's
  title names the candidate you are testing.
- **Accounts:** an ADMIN account whose password you hold, and two or three
  email addresses you can read (a Gmail address with plus-aliases such as
  `you+qa1@gmail.com` works; mail arrives in the base inbox).
- **Browsers:** a normal window and a private window, so two sessions never
  collide.
- **A calculator.** Several procedures check arithmetic against figures you
  compute by hand.
- **A clean slate, if you want one.** From the repo root,
  `make db-wipe ENV=qa` rebuilds the qa database from the
  migrations and leaves only the seeded admin. Without it, the procedures
  still work: every organization is tenant-scoped and invisible to other
  users, so old test data does not get in the way.

## How to read a procedure

Each case is a table with one row per step: the **Action** to take, the
**Expected result** to check, a **Pass/Fail** cell and a **Notes** cell.
Type `PASS` or `FAIL` in the Pass/Fail cell of every step that has an
expected result (a step with an empty expected result is setup: do it and
move on). Write a note on any step where you saw something odd, even a
passing one. A case fails when any of its steps fails; a failed case does
not stop the procedure unless the text says so. At the end, fill in the
sign-off table and file one issue per failed case.

The procedures name specs under `specs/`. When a case and a spec disagree,
the spec is the reference; report the difference. Pre-flight gates are
named as the panel prints them: **Reporting boundary**, **Activity data
completeness**, **Classification**, **Emission factors** and **Base year**.

## Where to fill in your verdicts

The maintainer exports the procedures as Google Docs into the **CarbonOS
QA** Drive folder before a test round (`make qa-docs`, then an upload; see
the how-to "Publish the QA procedures" in the engineering docs). Ask for the
link.

1. Open the procedure and choose **File > Make a copy** into your own Drive,
   named `<document> - <your name> - <date>`.
2. Type `PASS` or `FAIL` and your notes in the table cells of the copy. The
   pages are landscape so the cells have room. The line under the title
   ("Version v0.6.0 (5b27661), built ...") is the value for "Procedure and
   version tested" in the sign-off table.
3. File one issue per failed case with the **QA failure** template at
   https://github.com/miketak/carbonos/issues/new?template=qa-failure.yml.
4. Share the filled copy with the maintainer when the run is complete.

Keep the published documents as they are; make your copy rather than
editing them.

## The procedures

| # | Procedure | Objective | Time |
| --- | --- | --- | --- |
| 1 | [Access and roles](001-access-and-roles.md) | A newcomer gets an account, joins an organization with a role, and can do only what the role allows. | 60 min |
| 2 | [Organization setup](002-organization-setup.md) | The organization's structure, sites, source streams, units and emission factors are recorded with the provenance a verifier expects. | 75 min |
| 3 | [Activity data](003-activity-data.md) | Facts are recorded one by one and in bulk, corrected with a reason, removed with a reason, and backed by evidence. | 60 min |
| 4 | [Boundary and inventory lifecycle](004-boundary-and-lifecycle.md) | An inventory starts from the approach, its boundary and exclusions are frozen as a version, and the lifecycle refuses what it must. | 60 min |
| 5 | [Classification and pre-flight](005-classification-and-preflight.md) | Every record is classified as an accounting decision, every departure is justified, and the gates block a run that would misstate. | 90 min |
| 6 | [Scope 2 instruments](006-scope2-instruments.md) | Market-based scope 2 rests on instruments that pass the Quality Criteria, and the report says so either way. | 45 min |
| 7 | [Runs, reports and exports](007-runs-reports-and-exports.md) | A run is a reproducible snapshot, the report carries every Chapter 9 element, and the exports match the page. | 75 min |
| 8 | [Publication and corrections](008-publication-and-corrections.md) | A published report never changes, what came after is shown apart, and a correction inherits the view with a reason. | 45 min |
| 9 | [Base year and recalculation](009-base-year.md) | The base year is designated with its policy, structural changes are detected, and manual candidates are weighed. | 60 min |

## Shared scenario

Procedures 2 to 9 use one company, **Sankofa Gold plc**, a Ghanaian gold
miner. Procedure 2 sets it up; the later procedures assume it exists. If you
skip procedure 2, create the entities, facilities and streams its section B
lists before you continue.

## Sign-off template

Copy this table to the end of your notes for each procedure.

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |
