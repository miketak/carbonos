---
owner: miketak
last_reviewed: 2026-09-11
---

# Ship a change

CarbonOS is trunk-based: short-lived branches, a pull request into `main`,
green checks, a squash merge. The merge deploys nothing; the change reaches
the testers with the next release candidate tag. This guide takes one
change through that path.

```mermaid
flowchart LR
    accTitle: How a change reaches main and then qa
    accDescr: A branch becomes a pull request, CI runs the checks, a squash merge lands on main, and the next release candidate tag deploys main to qa.
    branch[Branch from main] --> pr[Pull request] --> ci{Checks green?}
    ci -- no --> fix[Fix and push] --> ci
    ci -- yes --> merge[Squash merge] --> rc[Next rc tag deploys qa]
```

## Before you begin

- A non-trivial feature needs an approved spec first. See
  [Write a spec](write-a-spec.md).
- Know which checks your change needs: the backend half, the frontend
  half, the docs half, or all three. See [Run the checks](run-the-checks.md).

## Make the change

1. Start from an up-to-date `main`:

    ```bash
    git switch main && git pull --ff-only
    git switch -c feat/short-description
    ```

    Branch prefixes follow the commit type: `feat/`, `fix/`, `chore/`,
    `docs/`, `refactor/`, `test/`.

2. Make the change, with tests. New behavior gets a test; a bug fix gets a
   regression test.
3. If the change adds or alters a table, add a Flyway migration. See
   [Add a migration](add-a-migration.md).
4. If the change alters how engineers build, run, verify or ship the
   system, update the affected page under `docs/` in the same branch.
5. Run the checks locally.

## Commit

- Write a conventional commit:

    ```text
    feat: scope the recalculation hold to inventories that report against the base year
    ```

    The type is one of `feat`, `fix`, `chore`, `docs`, `refactor`,
    `test`. The subject is a sentence fragment in the imperative, in
    sentence case, without a trailing period. The body says what changed
    and why, not how. No em-dashes anywhere.

## Open the pull request

1. Push the branch and open a pull request against `main`:

    ```bash
    git push -u origin feat/short-description
    gh pr create --base main --fill
    ```

2. In the description, say what the change does, which spec it implements,
   and how you verified it.
3. Wait for the checks. The backend check takes the longest, about ten
   minutes. Checks run on every pull request, whichever branch it targets,
   so a stacked pull request is checked too.

    A red check blocks the merge: the ruleset on `main` requires both
    check jobs. Fix the cause and push; the checks run again.

## Merge

1. Squash-merge the pull request. The squash keeps `main` at one commit
   per change. `CI` runs once more on `main`; nothing deploys.
2. The change reaches the testers when the next release candidate is
   tagged, and reaches staging and production when that candidate is
   approved. See [Deploy and release](deploy-and-release.md).
