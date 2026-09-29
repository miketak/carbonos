---
owner: miketak
last_reviewed: 2026-09-29
description: The statuses of a factor pack edition in the platform catalogue and of an update notice under Updates, with what each means and what moves it.
role: Anyone
---

# Check an edition or notice status

An edition's status says whether an organization can import it. A notice's status says whether the organization has decided on the edition it announces. You read the first on the **Factor packs** card and in the administration console, and the second under **Updates**.

<!-- sources: specs 02.5, 02.7; the old page reference/statuses-and-transitions.md (verified 2026-09-24); backend/src/main/java/com/carbonos/ghg/internal/FactorPackStatus.java; backend/src/main/java/com/carbonos/ghg/internal/FactorPackNotice.java (Status); backend/src/main/java/com/carbonos/ghg/internal/FactorPackAdoptionService.java and GhgAccess.java (refusals); EditionLock.java (the published-period setting, spec 02.6 amendment 2026-09-29); frontend/src/features/admin/AdminFactorPacksPage.tsx (status hints); frontend/src/features/ghg/FactorPackUpdatesPage.tsx and components/AdoptionDiffDrawer.tsx (status labels); frontend/src/features/ghg/format.ts (history labels) -->

## Factor pack editions

Platform administrators maintain editions under **Factor packs** in the administration console, where each status carries the hint quoted here. An organization never sees a draft; the **Factor packs** card on **Emission factors** lists published editions with **Import pack**.

| Status | Meaning | What moves an edition here | Who |
| --- | --- | --- | --- |
| DRAFT | "Invisible to organizations, rows mutable." | **New edition** or **Clone** | Platform administrator |
| PUBLISHED | "Importable; its rows and values never change again." | **Publish**, with every rule passing, a source document on file, an applies-from date, and an approver who is not the curator | A second platform administrator |
| SUPERSEDED | "A successor was published: readable, not importable." | Publishing a later edition of the same family | Follows from the later publication |
| WITHDRAWN | "Withdrawn with a reason: readable, not importable." | **Withdraw**, with a reason of at least 10 characters | Platform administrator |

A draft that was never published can be deleted with **Delete draft**; no other edition can. Publishing changes no organization's figures: it raises a notice.

## Factor pack update notices

An organization holds one notice per published edition that succeeds an edition it holds, under **Updates**. The table's **Status** column prints the label, with "by *email*" under a decided one, and the drawer repeats the decision with its date.

| Status on screen | Meaning | What moves a notice here | Who |
| --- | --- | --- | --- |
| Waiting on you | Raised by a publication and not yet decided. **Review** opens the drawer. | The platform publishes a successor of an edition the organization holds | Platform administrator |
| Accepted | The edition's versions were cut into the organization's factors from its applies-from date. The drawer reads "Accepted by *email* on *date*" and "Answered as" the chapter 5 case. | **Accept**, after answering **How does chapter 5 treat this adoption?** | Reviewer, Owner |
| Declined | Nothing changed; the organization keeps the versions it holds. | **Decline** | Reviewer, Owner |
| Withdrawn by the publisher | The publisher withdrew the edition and the decision fell away. The reason prints under the label, and the drawer reads "The publisher withdrew this edition, so there is nothing to decide." | **Withdraw** on the edition | Platform administrator |

A decision is made once. A second attempt on a decided notice answers "This notice is already accepted. A decision on an edition is made once." (or "already declined"). The organization's history on **Settings** records **Factor pack adopted** or **Factor pack declined**, with the note given.

## What blocks a move

| Attempt | What CarbonOS answers |
| --- | --- |
| Accept while the applies-from date falls inside a frozen or final period | "A reported period keeps the factors it reported with, so this edition cannot be accepted until that inventory is reopened. Declining stays available." |
| Accept while it falls inside a published period, with the platform setting **Editions inside a published period** at "Blocked (default)" | "… cannot be accepted while the platform blocks editions inside a published period. Declining stays available." Under "Allowed: published runs keep their factors" nothing blocks. |
| Accept under support access | "Support access cannot adopt an edition for an organization. That is the organization's own decision, so a reviewer or an owner of the organization has to make it." Declining answers the same, for "decline an edition". |
| Accept an edition that moves the GWP basis as a vintage progression | A message on the answer field naming the two bases: "chapter 1 requires one basis across the inventory and across years. Answer it as a retrospective adoption or an erratum." |
| Accept a vintage progression at or above the significance threshold without a note | A message on the note field naming the percentages: "so this is a methodology change under chapter 5. Say why it is still recorded as a vintage progression." |
| Accept or decline without the Reviewer or Owner role | **Accept** and **Decline** cannot be clicked, and their tooltip reads "Needs the Reviewer or Owner role." |
