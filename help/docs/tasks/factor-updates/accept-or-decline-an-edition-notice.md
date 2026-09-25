---
owner: miketak
last_reviewed: 2026-09-24
---

# Accept or decline an edition notice

**Role needed:** Reviewer or Owner. A preparer can read the notice;
support access cannot decide it.

When the platform publishes a new edition of a pack the organization
holds, CarbonOS raises one notice under **Updates**. "Publishing one
changes none of your numbers: moving to a new factor vintage is your
decision, and it is recorded here."

<!-- sources: FactorPackUpdatesPage.tsx; AdoptionDiffDrawer.tsx; OrganizationSettingsPage.tsx history; specs 02.7, 02.9; verified 2026-09-24 with ghana-2026 -->

## Read the notice

1. The sidebar entry **Updates** carries a badge and the line "1 factor
   pack update waiting". Open it.
2. The table lists each notice: the edition "in place of" its
   predecessor, when it was raised, the rows affected, how many move by
   more than 5%, the estimated movement from your last completed run,
   and the status **Waiting on you**. Click **Review**.
3. Read the drawer:
    - **Rows moving**, **Over five percent**, and **Estimated
      movement**: "The movement is an estimate over *inventory*, using
      the activity data already recorded. That data can change before
      the next run." It is also stated as a share of base-year
      emissions against your significance threshold.
    - **What moves** lists every lineage with **Now**, **New**,
      **Change** and the estimated movement, and marks a row whose
      source changed with "Provenance changed".
    - **Earlier periods** lists the reported periods that end before
      the applies-from date: "These end before 2026-01-01, so they will
      raise coverage warnings once the edition is accepted. The warning
      is correct and is what a vintage means."
    - **Diff hash**: the fingerprint of what you are deciding on.

The table's estimate comes from the last completed run and the drawer's
from the inventory the edition would apply to, so the two figures can
differ; the drawer's is the one the decision is weighed on.

## Accept

1. Answer **How does chapter 5 treat this adoption?**: "Vintage
   progression: the edition applies to the next reporting year
   forward", "Retrospective adoption: the edition is applied to a year
   already reported", or "Erratum: the edition corrects a wrong value in
   a year already reported". The answer is "Required on acceptance, and
   kept whatever the answer, so a verifier can see the question was
   asked."
2. Fill **Note (optional)**. It is "Required when a vintage progression
   is at or above your significance threshold, because that is the case
   a verifier questions."
3. Click **Accept**.

What you see: "Adopted ghana-2026: 1 version cut, 0 lineages added."
The row reads **Accepted** "by *email*". Under **Emission factors** the
affected factor shows "2 versions of this factor": the one you held,
now valid to the day before the edition applies, and the new one from
that date. The organization's history on **Settings** records "Factor
pack adopted … as a vintage progression; no base-year candidate raised"
with your note.

If the organization has a base year, accepting an erratum or a
retrospective adoption, or a progression at or above the significance
threshold, raises a recalculation candidate, and the drawer says so
before you accept.

## Decline

Click **Decline**. The row reads **Declined** and nothing moves; the
organization keeps the versions it holds.

## When acceptance is refused

- An edition that applies from a date inside a published period: "A
  reported period keeps the factors it reported with, so this edition
  cannot be accepted until that inventory is reopened. Declining stays
  available."
- Under support access: "Support access cannot adopt an edition for an
  organization. That is the organization's own decision, so a reviewer
  or an owner of the organization has to make it."
- An edition the publisher has withdrawn: the notice reads "Withdrawn
  by the publisher" and there is nothing to decide.
