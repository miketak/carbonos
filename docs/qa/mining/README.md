# QA procedures: mining (Sankofa Gold plc)

Manual test procedures for CarbonOS on the **qa** environment, which holds
the release candidate under test (`v0.7.0-rc.1` and so on) and moves only
when a new candidate is tagged. This is the **mining** persona: a Ghanaian
gold producer with an open pit, a joint-venture plant, an associate's port
and leased sites; the other personas live beside it under
[`docs/qa`](../README.md). Each procedure has one objective, takes a
human 30 to 90 minutes, and can be run on its own. Run them in order when
you test a candidate; run one on its own after a change to the area it
covers.

## Before you start

- **App:** the qa frontend address in
  [Environments](../../environments.md); the line under a page's
  title names the candidate you are testing.
- **Accounts:** an administrator account on qa, and two or three email
  addresses you can read (a Gmail address with plus-aliases such as
  `you+qa1@gmail.com` works; mail arrives in the base inbox). Ask the
  engineering team to create the administrator account for your email
  address; they send you its password. You create every other account
  yourself in the procedures.
- **Browsers:** a normal window and a private window, so two sessions never
  collide.
- **A calculator.** Several procedures check arithmetic against figures you
  compute by hand.

## How to read a procedure

Each case is a table with one row per step: the **Action** to take, the
**Expected result** to check, a **Pass/Fail** cell and a **Notes** cell.
Type `PASS` or `FAIL` in the Pass/Fail cell of every step that has an
expected result (a step with an empty expected result is setup: do it and
move on). Write a note on any step where you saw something odd, even a
passing one. A case fails when any of its steps fails; a failed case does
not stop the procedure unless the text says so. At the end, fill in the
sign-off table and file one issue per failed case with the **QA failure**
template at https://github.com/miketak/carbonos/issues/new?template=qa-failure.yml. The line under the document's title
("Version v0.6.0 (5b27661), built ...") is the value for "Procedure and
version tested".

The procedures name specs under `specs/`. When a case and a spec disagree,
the spec is the reference; report the difference. Pre-flight gates are
named as the panel prints them: **Reporting boundary**, **Activity data
completeness**, **Classification**, **Emission factors** and **Base year**.

## The procedures

| # | Procedure | Objective | Time |
| --- | --- | --- | --- |
| 1 | [Access and roles](001-access-and-roles.md) | A newcomer gets an account, joins an organization with a role, and can do only what the role allows; a platform administrator is an outsider until they assume a logged support access, and an organization is not deleted while a record stands. | 75 min |
| 2 | [Organization setup](002-organization-setup.md) | The organization's structure, sites, source streams, units and emission factors are recorded with the provenance a verifier expects. | 75 min |
| 3 | [Activity data](003-activity-data.md) | Facts are recorded one by one and in bulk, corrected with a reason, removed with a reason, and backed by evidence. | 60 min |
| 4 | [Boundary and inventory lifecycle](004-boundary-and-lifecycle.md) | An inventory starts from the approach, its boundary and exclusions are frozen as a version, and the lifecycle refuses what it must. | 60 min |
| 5 | [Classification and pre-flight](005-classification-and-preflight.md) | Every record is classified as an accounting decision, every departure is justified, and the gates block a run that would misstate. | 90 min |
| 6 | [Scope 2 instruments](006-scope2-instruments.md) | Market-based scope 2 rests on instruments that pass the Quality Criteria, and the report says so either way. | 45 min |
| 7 | [Runs, reports and exports](007-runs-reports-and-exports.md) | A run is a reproducible snapshot, the report carries every Chapter 9 element, and the exports match the page. | 75 min |
| 8 | [Publication and corrections](008-publication-and-corrections.md) | A published report never changes, what came after is shown apart, and a correction inherits the view with a reason. | 45 min |
| 9 | [Base year and recalculation](009-base-year.md) | The base year is designated with its policy, structural changes are detected, and manual candidates are weighed. | 60 min |
| 10 | [Factor pack maintenance](010-factor-pack-maintenance.md) | A platform administrator authors a factor pack edition: a family, a draft, a clone of a predecessor, its rows, and the validation report; a published edition is frozen and a draft is invisible to every organization; and the organization, not the platform, decides whether to adopt a published edition. | 100 min |
| 11 | [Platform administration](011-platform-administration.md) | An administrator lands in a panel that says what is waiting and carries no client inventory data; the support-access window governs new grants without moving live ones; and reserving organization creation to administrators seats the client as owner, not the administrator. | 50 min |

## Shared scenario

Procedures 2 to 9 use one company, **Sankofa Gold plc**, a Ghanaian gold
miner. Procedure 2 sets it up; the later procedures assume it exists. If you
skip procedure 2, create the entities, facilities and streams its section B
lists before you continue.

Procedure 10 is a platform procedure rather than a client one: it works on the
shared factor pack catalogue, and only reads Sankofa Gold plc to check a holder
count and that a draft stays invisible to an organization.

## Sign-off

Each procedure ends with this table. Fill it in when you finish.

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |
