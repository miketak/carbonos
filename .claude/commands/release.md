---
description: Cut a release candidate from main and promote it to production
---
Release CarbonOS: $ARGUMENTS

The argument is the version to release (`v0.10.2`) or empty, in which case
use the next patch version after the newest `vX.Y.Z` tag on origin. If the
argument names an open PR number as well (`v0.10.2 #192`), merge that PR
first with `gh pr merge <n> --squash --delete-branch`, only once its checks
are green.

Then, without asking for confirmation at each step:

1. `git fetch --tags origin` and confirm `origin/main` has a green `CI` run
   (`gh run list --workflow ci.yml --branch main --limit 1`). Stop if it is
   red or still running.
2. Pick the rc number: `rc.1`, or one more than the highest existing
   `vX.Y.Z-rc.N` for this version. Refuse if `vX.Y.Z` already exists; a
   version is released once.
3. Tag the tip of `origin/main`: `git tag -a vX.Y.Z-rc.N -m "Release
   candidate vX.Y.Z-rc.N: <one line from the commits since the last tag>"`
   and push it with `git push origin refs/tags/vX.Y.Z-rc.N`.
4. Run `scripts/promote-release.sh vX.Y.Z-rc.N` in the background and
   follow its log. It waits for the QA run, approves the `qa-signoff` gate,
   waits for the Release run, approves the `production` gate and waits for
   the deploy. A failed job stops it with the run URL: report that, do not
   retry or approve anything by hand.
5. When it finishes, confirm production health reports `UP` (the URL is in
   `docs/reference/environments.md`) and reply with: the version, the commit,
   what shipped (the merged PRs since the previous version, one line each),
   and the Release run URL.

Before approving production, skim the candidate's new Flyway migrations
under `backend/src/main/resources/db/migration` and name any that rewrite
data rather than add structure.
