---
owner: miketak
last_reviewed: 2026-09-24
---

# Import a factor pack

**Role needed:** Preparer, Reviewer or Owner.

A factor pack edition is a dated release of one publication, held by the
platform. Importing it adds its factors to the organization with their
citations, approved, because the platform's two-administrator
publication already checked them.

<!-- sources: EmissionFactorsPage.tsx (packs card, importNote); specs 02.5, 02.6, 02.9; verified 2026-09-24 -->

## Steps

1. Open **Emission factors**. The **Factor packs** card lists every
   published edition with its row count, source, GWP basis and
   retrieval date.
2. Click **View factors** to read an edition's rows before importing.
3. Click **Import pack** on the edition.

## What you see

A message such as "defra-2025, applying from 2025-01-01: 1928 added, 0
versioned, 0 tagged, 0 unchanged." **This organization's factors**
counts the rows.

The four numbers mean:

| Number | Meaning |
| --- | --- |
| added | Lineages the organization did not hold: new factors. |
| versioned | Lineages it already held from an earlier edition: the version you hold is closed the day before the edition applies, and a new version starts from that date. Reported periods keep the version they reported with. |
| tagged | Rows it already held with the same value, now also tagged with this edition. |
| unchanged | Rows already held from this edition. Importing again changes nothing. |

An edition that drops lineages its predecessor carried says so ("445
lineages this edition drops, retired by nobody") and names them.

## Two kinds of row to check

- A derived row a pack ships for you to check arrives **Not approved**:
  the Ghana pack's "Grid electricity T&D losses, Ghana (derived)" is
  computed from the grid intensity and a loss rate, and its row says
  "approve it after checking the year's loss rate with the Energy
  Commission statistics, or replace it with the utility's figure."
  Tick **Show unapproved** to see it, and click **Approve** once
  checked. See [Add and approve a factor](add-and-approve-a-factor.md).
- UK Government (DESNZ) rows carry the note "UK factors apply to
  Ghanaian activity by analogy; say so in the report."

## What changed elsewhere

- The factors are offered in the classification picker of every
  inventory whose period they are valid for.
- When the platform later publishes a successor edition, the
  organization receives a notice under **Updates**. See
  [Accept or decline an edition notice](../factor-updates/accept-or-decline-an-edition-notice.md).
