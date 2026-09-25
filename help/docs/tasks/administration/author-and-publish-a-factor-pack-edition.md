---
owner: miketak
last_reviewed: 2026-09-24
---

# Author and publish a factor pack edition

**Role needed:** platform Admin. Two administrators are needed: the one
who builds the draft cannot publish it.

An edition is one dated release of a publication. "Only a draft can be
changed: once an edition is published its rows and values never move
again, because reports already rest on them. To correct a published
edition, clone it into a new draft."

<!-- sources: AdminFactorPacksPage.tsx; AdminFactorPackEditionPage.tsx; PackRowFormModal.tsx; PublishEditionDialog.tsx; BlastRadiusDrawer.tsx; specs 02.5, 02.6, 02.7; verified 2026-09-24 with ghana-2026 (PR #100 behaviour) -->

## Create a draft

1. Open **Factor packs** in the console. Each family lists its editions
   with status, applies-from date, row count and how many
   organizations hold it.
2. Either click **New edition** on the family for an empty draft, or
   **Clone** on a published edition: "The draft starts with the *N*
   rows of *edition*, copied. Correcting a copy leaves the published
   edition as it is." **Add family** starts a new publication.
3. Fill **Edition identifier**: "The citation a report prints, so it
   never changes: 'defra-2026', 'defra-2026.r2'." Fill **Name**,
   **Source publication**, **Source URL**, **Publication year**, **GWP
   basis** ("The set the publication states; the gas split is
   reconciled against it.") and **Applies from**.
4. Click **Create draft**.

What you see: "ghana-2026 was created from ghana with its 7 rows." and
the edition listed as DRAFT. Click its identifier to open it.

## Edit the rows

The edition page has the tabs **Rows**, **Metadata**, **Validation**
and **Changes**, and the actions **Add row**, **Publish**, **Delete
draft** and **Blast radius**.

1. Click **Edit** on a row, or **Add row**.
2. Fill the row: **Code** ("Two or more colon-separated segments naming
   the publication and the row. It never changes once published."),
   **Name**, **Default scope** and **Default category**, **Unit** ("One
   the registry knows; free text is refused."), **kg CO2e per unit**,
   and the gas split: "Leave a gas empty where the publication states
   nothing about it: that is not the same as a stated zero. Where any
   component is stated, the sum under the edition's GWP basis must come
   to the CO2e above within one percent, and the biogenic CO2 sits
   beside the total, never inside it." Tick "The row publishes a CO2e
   total with no gas split" where that is the case, and "The row is
   scope-agnostic" where the accountant chooses the scope. Fill the
   provenance fields (**Source publication**, **Source URL**,
   **Publication year**, **Data year**, **Source category**, **Source
   activity**, **Source detail**), **Reporting basis**, and untick
   **Approved for use in a calculation** for a derived row the
   organization must check itself.
3. Click **Save row**: "*code* was saved."

**Validation** lists every row that breaks a rule: "Each rule is a hard
failure, never a warning, because a published edition is a citation."
**Metadata** holds the edition's name, dates, source, licence and notes,
and shows the **Curator**, the **Approver** and the **Evidence
checksum**. **Blast radius** shows what publishing would move:
"Publishing itself changes no organization's data. This is what would
happen if every holder adopted the edition." For each holder it lists
the lineages that would move, the estimated movement from its last
completed run, the open drafts that would move, the rows inside a
locked period, the rows not approved, and the lineages the edition
drops.

## Publish

1. A second administrator, not the curator, opens the edition and
   clicks **Publish**.
2. The dialog lists four conditions, each **Met** or **Not met**:
   "Every publication rule passes."; a source document on file; "The
   edition applies from *date*, the vintage boundary an adoption is run
   from."; "The approver must not be the curator." For the curator the
   last reads "You built this draft, so another administrator checks it
   against the source document and publishes it." and **Publish** stays
   disabled.
3. Under **Source document** upload the publication the edition was
   transcribed from. The dialog shows "SHA-256 …, computed over the
   bytes stored." Fill **Source document as cited**.
4. Tick **This edition is an erratum** only when it corrects a wrong
   value: "Publishing it marks the predecessor as holding an error; its
   wrong values are never edited, because reports already rest on
   them."
5. Click **Publish**.

What you see: "ghana-2026 was published." The page reads PUBLISHED with
"This edition is published, so its rows, metadata and values never
change again". **Changes** now holds the change log computed against
the predecessor. Every organization holding the predecessor receives a
notice under its **Updates**; see
[Accept or decline an edition notice](../factor-updates/accept-or-decline-an-edition-notice.md).

## Withdraw

**Withdraw** on a published edition asks for a reason. The edition
stays readable, can no longer be imported, and every open notice for it
closes as "Withdrawn by the publisher". A draft that was never
published is removed with **Delete draft**.
