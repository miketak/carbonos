---
owner: miketak
last_reviewed: 2026-09-29
description: What a factor pack and its editions are, what the applies-from date does to a period already reported, and how lineage and approval keep every figure traceable.
---

# What is a factor pack edition?

A factor pack is the family of editions of one published table of emission factors, such as the DESNZ conversion factors. An edition is one dated release of it, named by an identifier a report cites, applying from a date, and never changing once published.

<!-- sources: specs 02.1, 02.5, 02.6, 02.7, 02.9, 02.11; the old page concepts/emission-factors-packs-and-editions.md (verified 2026-09-24); frontend/src/features/ghg/EmissionFactorsPage.tsx (packs card, versions); backend/src/main/java/com/carbonos/ghg/internal/FactorPackStatus.java; screen text from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt): "3 factors page", "3 toasts" -->

## What does the applies-from date do?

Importing an edition adds its factors with their citations. The date matters once you hold an earlier edition: "A later edition never overwrites a figure: it closes the version you hold and cuts a new one from the edition's applies-from date, so a period you have already reported keeps the factors it reported with." That is what a vintage means, and an edition whose date falls inside a frozen or final period cannot be imported until that inventory is reopened. A published period blocks it too unless the platform allows editions there; its report keeps its figures either way.

## What is a lineage?

A factor keeps its code across editions, so the same row in a 2025 and a 2026 edition is one lineage with two versions: **Emission factors** shows "2 versions of this factor", and an inventory's picker offers only the version live in its period. An edition can also drop a lineage; the import names it ("this edition drops, retired by nobody").

| Term | Meaning |
| --- | --- |
| Pack | A family of editions of one publication. |
| Edition | One dated release, with an identifier and an applies-from date. |
| Lineage | One factor code across editions. |
| Version | One lineage's value for one validity window. |
| Vintage | The edition a reported period calculated with. |

## What does the approval record hold?

Rows from a published edition arrive approved, checked by the platform's two-administrator publication. A derived pack row and any hand-entered factor arrive **Not approved**; the record then names who approved it and when, "by *email* on *date*", never the person who typed it while another member could. A run applies approved factors only, and the report prints the edition of every factor it used.

## Where next

- [Import a factor pack](import-a-factor-pack.md)
- [Accept or decline an edition notice](accept-or-decline-an-edition-notice.md)
- [Check an edition or notice status](check-an-edition-or-notice-status.md)
