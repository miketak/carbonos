---
owner: miketak
last_reviewed: 2026-09-29
description: Change how long support access lasts, who may create an organization, and whether a published period blocks a factor pack edition, each change kept with its reason.
role: Administrator
minutes: 3
---

# Set platform settings

Three settings: how long a support access grant lasts, who may create an organization, and whether a published period blocks a factor pack edition. You change them rarely, and every change is kept with its reason.

<!-- sources: spec 01.5 (decisions D-02, D-03, and the amendment of 2026-09-29), spec 01.3, spec 02.6 rule 1 (amended 2026-09-29); the old page tasks/administration/set-platform-settings.md (verified 2026-09-24); frontend/src/features/admin/AdminSettingsPage.tsx (labels, hints, history); AdminDashboardPage.tsx (the settings line); frontend/src/features/ghg/OrganizationsPage.tsx (the button under restricted creation); backend/src/main/java/com/carbonos/platform/PlatformSettings.java and internal/PlatformSettingsService.java (1 to 72 hours, default 24); backend/src/main/java/com/carbonos/ghg/internal/SupportAccessService.java (the history line); the New organization dialog from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt, "1 new org dialog") -->

## Before you start

- You hold the Admin platform role.
- You have a reason of at least 10 characters ready. It is recorded with the change, and a verifier may ask to read it.

## Change a setting

1. Open **Platform settings** in the console. The page reads "Policy for the whole deployment. These settings govern clients' inventories, so every change is kept with its reason."
2. Set **Support access lasts**: "Hours, between 1 and 72. A grant keeps the window it was taken under, so changing this never moves access that is already live."
3. Set **Who may create an organization** to "Everyone signed in" or "Administrators only".
4. Set **Editions inside a published period** to "Blocked (default)" or "Allowed: published runs keep their factors".
5. Fill **Reason for this change**: "At least 10 characters. It is kept with the change, and a verifier may ask to read it."
6. Click **Save settings**.

What you see: "Platform settings saved.", and beside the button "Last changed by *email* on *moment*". **Every change** lists each saved change with its **Setting**, **From**, **To**, **Reason**, **Who**, and **When**. Until the first change it reads "Nothing has been changed; the deployment is running on the defaults.": 24 hours, everyone signed in, and editions blocked. **Platform overview** states the values in force in one line, "Support access lasts 24 hours, and everyone signed in may create an organization."

## Who may create an organization

The hint under the setting says what "Administrators only" changes: "With administrators only, the form asks for the client account that becomes the owner, and the administrator is not made a member." Under it, **New organization** on **GHG accounting** is offered to administrators alone; a member does not see the button.

The form's **Owner's email (optional)** field then names the client: "An existing account, which becomes the organization's owner. Leave it empty to own it yourself. Naming somebody else means you are not a member, so you will need support access to open it." The steps are in [Create an organization](../organization/create-an-organization.md).

## Editions inside a published period

The hint: "Whether an organization may import or accept a factor pack edition that applies from a date inside a published period. Published runs keep the factors they reported with either way. Frozen and final periods always block." A published period never reopens, so under "Blocked (default)" such an edition is refused for that organization for good. Under "Allowed: published runs keep their factors" it goes ahead: the published report keeps its figures, and an open correction moves from the applies-from date like any draft. Switching back undoes nothing already imported.

## What happens next

A grant taken after the change runs for the new window. A grant already live keeps the window it was taken under, and the history line it writes when it runs out states that window: "support access expired after 24 hours". See [Assume support access](assume-support-access.md).
