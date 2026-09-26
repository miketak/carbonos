---
owner: miketak
last_reviewed: 2026-09-26
---

# Troubleshooting

What CarbonOS says, what it means, and what to do. Every message is
quoted as the product prints it.

<!-- sources: messages verified on screen on 2026-09-24; InventoryService.java refusals; GhgService.java; PublishEditionDialog.tsx; AdoptionDiffDrawer.tsx; spec 01.8 (account numbers, verified 2026-09-26) -->

## Signing in and access

| You see | It means | Do this |
| --- | --- | --- |
| "This link is invalid or has expired. Access links are valid for 7 days; you can always request access again." | The set-password link was used already or is older than 7 days. | Request access again, or ask an administrator to add you under **Users** with a temporary password. |
| "Organization not found" | Your account is not a member of the organization, and you have no support grant. | Ask an owner to add you under the organization's **Settings**. |
| A button is disabled with "Needs the Preparer, Reviewer or Owner role.", "Needs the Reviewer or Owner role." or "Needs the Owner role." | Your role does not allow the action. | Ask an owner to change your role. |
| "Settings are the owner's" | You opened **Settings** under support access. | Only an owner administers members and details. |
| "Support access cannot adopt an edition for an organization." | Accepting or declining a notice under support access. | A reviewer or owner of the organization decides it. |
| **New organization** is not offered | The platform setting **Who may create an organization** is "Administrators only". | Ask an administrator to create it and name you as the owner. |

## Inventories and runs

| You see | It means | Do this |
| --- | --- | --- |
| LAUNCH ON HOLD, "Reporting boundary is blocking." | An error in one of the first four gates. | Click **Resolve the findings** and read the gate; each finding says what clears it. See [Pre-flight gates and findings](../reference/pre-flight-gates-and-findings.md). |
| "The inventory is a draft. Freeze it to enable a run." | Runs need a boundary version. | **Freeze inventory**. |
| "*Entity* is excluded but holds a 100% share under this approach. Include it, or record why it emits nothing." | An entity in the approach was left out with a reason that does not say it emits nothing. | Choose "Non-GHG activity" or "Not applicable" as the reason, or include it. |
| "'*Record*' is classified in scope 3; its stream '*stream*' defaults to scope 1. Record why …" | A departure from the stream's default without a justification. | Fill the scope justification (10 characters or more), or take the default. |
| "'*Record*' uses '*factor*', which is not approved." | A factor entered by hand, or a derived pack row, has not been approved. | A reviewer or owner other than its author approves it under **Emission factors**. |
| "You entered '*factor*'. A factor is checked by someone other than the person who typed it …: ask *name* to approve it." | You tried to approve your own factor while another member could. | Ask the named member. |
| "Base year holds the final designation; runs stay available." | An undecided recalculation candidate above the threshold. | Decide it under **Base year**; runs can still be launched. |
| "The 2025 base year has a recalculation candidate above the significance threshold (…). An inventory that reports against the base year cannot be marked final until the recalculation is completed or declined." | **Mark as final** while a candidate is undecided. | Record a recalculated base or decline the candidate. |
| "Run *N* is designated final. Withdraw the designation, with a reason, before voiding it." | **Void…** on the final run. | **Withdraw final designation** first. |
| "A published inventory's runs are a record and cannot be voided." | **Void…** on a published inventory. | Create a correction instead. |
| "Changed since publication: quantity" on a record in a published view | The fact was corrected after publication; the report is unchanged. | Create a correction to restate the year. |
| The report header fields are disabled | The inventory is published. | A correction carries its own header. |
| A total on the **Overview** or a run tile differs from the table for a moment | The tile counts up when the page opens. | Read the table, or wait for the tile to settle. |

## Factors and updates

| You see | It means | Do this |
| --- | --- | --- |
| "0 added, 0 versioned, 0 tagged, 1928 unchanged." | The edition was already imported. | Nothing; importing twice is harmless. |
| "'*factor*' publishes CO2e only. Its emissions … appear in the by-gas table on the row 'CO2e from factors without a gas split'" | The source publishes no gas split. | Nothing; the report discloses it. A warning does not hold the run. |
| "was applied by a calculation run. Set its validity end to retire it instead of deleting it." | **Delete** on a factor a run used. | Set **Valid to** on the factor. |
| "A reported period keeps the factors it reported with, so this edition cannot be accepted until that inventory is reopened. Declining stays available." | The edition applies from a date inside a published period. | Decline, or reopen the period through a correction first. |
| The **Updates** table and the drawer show different estimated movements | The table estimates from the last completed run; the drawer from the inventory the edition would apply to. | Weigh the decision on the drawer's figure. |
| "Withdrawn by the publisher" | The platform withdrew the edition. | Nothing to decide. |
| The **Publish** button is disabled with "You built this draft, so another administrator checks it against the source document and publishes it." | You are the curator of the draft. | Another administrator publishes it. |

## Organization settings

| You see | It means | Do this |
| --- | --- | --- |
| **History** on **Settings** does not show the member you just added | The card does not refresh on its own after **Add member**. | Reload the page. |
| "An organization named '…' already exists: … (ORG-*NNNN*). Confirm to use the name anyway." | Another organization carries the name you typed. | Check its account number. If yours is a different organization, click **Create anyway** or **Save anyway**; otherwise change the name. |
| "still has facilities. Move them to another entity before deleting it." | **Remove** on an entity with facilities. | Edit each facility's **Legal entity** first. |
| "a parent chain cannot loop." | **Held through** would make an entity its own ancestor. | Choose another parent. |
