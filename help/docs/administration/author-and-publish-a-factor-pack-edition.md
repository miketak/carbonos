---
owner: miketak
last_reviewed: 2026-09-28
description: Build a draft edition row by row, upload the source document it was transcribed from, have a second administrator publish it, and withdraw one that must leave the catalogue.
role: Administrator
minutes: 20
---

# Author and publish a factor pack edition

An edition is one dated release of a publication's factors, cited by every report that uses it. One administrator builds the draft; a second checks it against the source document and publishes it, because a published edition never changes again.

<!-- sources: specs 02.5, 02.6, 02.7; the old page tasks/administration/author-and-publish-a-factor-pack-edition.md (verified 2026-09-24 with ghana-2026, PR #100 behaviour); frontend/src/features/admin/AdminFactorPacksPage.tsx (family and edition forms, status hints, toasts); AdminFactorPackEditionPage.tsx (tabs, actions, withdraw and delete dialogs); components/PackRowFormModal.tsx (row fields and hints); components/PublishEditionDialog.tsx (the four conditions, checksum, erratum); components/BlastRadiusDrawer.tsx; AdminDashboardPage.tsx (the drafts line); backend/src/main/java/com/carbonos/ghg/internal/FactorPackPublication.java (separation of duties, withdrawal reason) -->

## Before you start

- You hold the Admin platform role, and a second administrator is available to publish: "The approver must not be the curator."
- You have the publication to upload as the source document, and the date the edition applies from.

## Create the draft

1. Open **Factor packs** in the console.
2. Click **New edition** on the family, or **Clone** on a published edition to correct a copy.
3. Fill **Edition identifier**: "The citation a report prints, so it never changes: 'defra-2026', 'defra-2026.r2'."
4. Fill **Name**, **Source publication**, **Source URL**, **Publication year**, **GWP basis** and **Applies from**.
5. Click **Create draft**.

What you see: "*identifier* was created as an empty draft." The edition is listed as DRAFT: "Invisible to organizations, rows mutable." Click its identifier to open it.

## Edit the rows

1. Click **Add row**, or **Edit** on a row.
2. Fill **Code**: "Two or more colon-separated segments naming the publication and the row. It never changes once published."
3. Fill **Name**, **Default scope**, **Default category** and **Unit**: "One the registry knows; free text is refused."
4. Fill **kg CO2e per unit** and the gas split, or tick "The row publishes a CO2e total with no gas split".
5. Fill the provenance fields, from **Source publication** to **Source detail**, and **Reporting basis**.
6. Untick **Approved for use in a calculation** for a derived row the organization must check itself, then click **Save row**.

What you see: "*code* was saved." **Validation** lists every row that breaks a rule, and **Blast radius** what publishing would move for each holder.

## Publish the edition

1. As the second administrator, open the edition and click **Publish**.
2. Read the four conditions, each ticked or crossed: the rules, the source document, the applies-from date and the approver.
3. Under **Source document**, upload the publication the edition was transcribed from. The dialog shows "SHA-256 *checksum*, computed over the bytes stored."
4. Fill **Source document as cited** and **Applies from**.
5. Tick **This edition is an erratum** only when it corrects a wrong value, and fill **What was wrong**.
6. Click **Publish**.

!!! note "The curator cannot publish"
    For the administrator who built the draft the last condition reads "You built this draft, so another administrator checks it against the source document and publishes it.", and **Publish** stays disabled.

What you see: "*identifier* was published." The page reads PUBLISHED: "This edition is published, so its rows, metadata and values never change again: reports already rest on them." **Metadata** names the **Curator**, the **Approver**, and the **Evidence checksum**. Each holder of the predecessor receives a notice under **Updates**; see [Accept or decline an edition notice](../factors/accept-or-decline-an-edition-notice.md).

## Withdraw a published edition

1. Open the edition and click **Withdraw**.
2. Fill **Why it is withdrawn**, in at least 10 characters. "The rows organizations already hold stay exactly as they are."
3. Click **Withdraw edition**.

What you see: "*identifier* was withdrawn." The status reads WITHDRAWN, "Withdrawn with a reason: readable, not importable.", and every open notice closes as "Withdrawn by the publisher". A draft that was never published is removed with **Delete draft** instead: "The draft and its *N* rows go for good." The statuses are listed in [Check an edition or notice status](../factors/check-an-edition-or-notice-status.md).
