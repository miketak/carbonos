---
status: accepted
date: 2026-09-11
decision-makers: miketak
owner: miketak
last_reviewed: 2026-09-11
---

# 0003: Promote one tagged commit through qa, staging and production

## Context and problem statement

Staging deployed on every merge to `main`, and the testers worked on
staging, so a merge moved the build under them. The activity register
(spec 04.6) could not land without disturbing a QA cycle. The question was
how to keep trunk-based development on `main` while giving the testers a
build that changes only when someone decides it should, and how production
fits in while it has no customers.

## Considered options

- A `develop` branch that collects work with CI only, merged to `main` when
  the testers are done. Cheap, but `main` and `develop` drift and the
  release becomes a big merge.
- Keep staging continuous and add a qa environment deployed from release
  candidate tags. Testers get a fixed build; the team keeps a live view of
  `main`; staging becomes a second copy of `main` with no distinct purpose.
- Deploy nothing from `main`; promote one tagged commit through qa (rc
  tag), staging (the version tag, cut by the QA sign-off) and production
  (an approval), with checks on every pull request and required on `main`.

## Decision outcome

Chosen option: promote one tagged commit, because every environment then
moves only on a human act, the same commit is what QA tested and what
production runs, and staging becomes a rehearsal of the production deploy
rather than a duplicate of `main`.

### Consequences

- Good: testers set the pace; a failed candidate costs one more rc tag;
  production practises the real release path before there are customers.
- Good: stacked pull requests are checked, and the ruleset finally enforces
  what the docs said.
- Bad: `main` has no live environment; the team sees trunk running only when
  a candidate is cut. Keep candidates frequent. A `dev` environment on push
  to `main` is a fourth workflow of the same shape if this hurts.
- Bad: a third Railway environment costs money and needs its own bucket and
  token; `make env-copy` seeds it from staging.
