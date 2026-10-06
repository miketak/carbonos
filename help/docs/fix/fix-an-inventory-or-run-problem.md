---
owner: miketak
last_reviewed: 2026-10-06
description: What CarbonOS says when a freeze, a classification, a run, a final designation or a publication is refused, what each message means, and what clears it.
---

# Fix an inventory or run problem

The messages an inventory raises between its first draft and its
published report: the pre-flight gates, freezing, classifying, running,
designating a final run, and publishing. Every message is quoted as the
product prints it.

<!-- sources: spec 05.8 (the sign-off workflow); troubleshooting/index.md (verified 2026-09-24); specs 02.1, 05.1, 05.4, 05.5, 06.1, 07.2; strings checked on 2026-09-28 in InventoryService.java (gate findings and refusals), GhgService.java (factor approval), PreflightChip.tsx (spec 10), AssignmentsSection.tsx, ReportMetadataCard.tsx, AnimatedCo2e.tsx; "Launch on hold" and "Reporting boundary is blocking." seen in the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt) -->

| You see | It means | Do this |
| --- | --- | --- |
| **Launch on hold · 1 blocking** on the pre-flight chip beside the inventory's title; its popover reads "Reporting boundary is blocking." | An error in one of the first four gates. | Click the chip, read the gate on **Hold**, and follow **Resolve the findings →**; each finding says what clears it. See [Pre-flight gates and findings](../inventories/freeze-and-launch-a-run.md). |
| "The inventory is a draft. Freeze it to enable a run." | Runs need a boundary version. | **Freeze inventory**. |
| "The organizational boundary is empty. Add at least one facility before freezing it." | **Freeze inventory** on an inventory whose boundary holds no facility. | Add a facility under **Facilities**, or tick one in on the **Boundary** tab. |
| "The inventory is frozen. Reopen it as a draft to change it." | An edit to the boundary, the classification or the method while the inventory is frozen. | **Reopen as draft** with a reason, change it, and freeze again; the earlier boundary version is kept. |
| "*Entity* is excluded but holds a 100% share under this approach. Include it, or record why it emits nothing." | An entity in the approach was left out with a reason that does not say it emits nothing. | Choose "Non-GHG activity" or "Not applicable" as the reason, or include it. |
| "'*Record*' is classified in scope 3; its emission source '*source*' defaults to scope 1. Record why (a justification of at least 10 characters), or classify it in scope 1." | A departure from the emission source's default without a justification. | Fill the scope justification (10 characters or more), or take the default. |
| "'*Record*' uses '*factor*', which is not approved. Approve it under Emission factors, or choose another." | A factor entered by hand, or a derived pack row, has not been approved. | A reviewer or owner other than its author approves it under **Emission factors**. |
| "You entered '*factor*'. A factor is checked by someone other than the person who typed it (Corporate Standard chapter 7): ask *name* to approve it." | You tried to approve your own factor while another member could. | Ask the named member. |
| "Run *N* cannot be designated final. '*Record*' uses '*factor*', which is not approved. Approve it under Emission factors, or choose another." | **Submit for review** or **Mark as final** while the factor is unapproved. | Approve the factor, or reopen, reclassify and launch a new run. |
| "Run *N* has not been submitted for review. Submit it before marking it final." | **Mark as final** after someone withdrew the submission, for example with a new run. | Reload; the run must be submitted again. |
| "Run *N* was submitted by *name*, who cannot also sign it off. Ask *name* or another reviewer or owner to mark it final." | You submitted the run and someone else in the organization may approve. | Ask the named member. |
| "*Name* is this inventory's preparer; only they submit it for review." or "*Name* is this inventory's approver; only they return it or sign it off." | The inventory names its preparer or approver under **Sign-off**. | Ask the named member, or have a reviewer or owner change **Sign-off**. |
| "Base year holds the final designation; runs stay available." in the pre-flight popover | An undecided recalculation candidate above the threshold. | Decide it under **Settings**, **Baseline and targets**; runs can still be launched. |
| "The 2025 base year has a recalculation candidate above the significance threshold (…). An inventory that reports against the base year cannot be marked final until the recalculation is completed or declined." | **Mark as final** while a candidate is undecided. | Record a recalculated base or decline the candidate. |
| "Designate a final run before publishing the inventory." | **Publish** on an inventory with no final run. | **Submit for review** on the run, then have it marked final. |
| "Run *N* is designated final. Withdraw the designation, with a reason, before voiding it." | **Void…** on the final run. | **Withdraw final designation** first. |
| "A published inventory's runs are a record and cannot be voided." | **Void…** on a published inventory. | Create a correction instead. |
| "Changed since publication: quantity" on a record in a published view | The fact was corrected after publication; the report is unchanged. | Create a correction to restate the year. |
| The report header fields are disabled | The inventory is published. | A correction carries its own header. |
| A total on the **Overview** or a run tile differs from the table for a moment | The tile counts up when the page opens. | Read the table, or wait for the tile to settle. |
