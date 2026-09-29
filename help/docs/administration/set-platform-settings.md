---
owner: miketak
last_reviewed: 2026-09-28
description: Change how long a support access grant lasts and who may create an organization, with the reason every change is kept under for a verifier to read.
role: Administrator
minutes: 3
---

# Set platform settings

Two settings govern access to clients' inventories: how long a support access grant lasts, and who may create an organization. You change them rarely, and every change is kept with its reason.

<!-- sources: spec 01.5 (decisions D-02, D-03), spec 01.3; the old page tasks/administration/set-platform-settings.md (verified 2026-09-24); frontend/src/features/admin/AdminSettingsPage.tsx (labels, hints, history); AdminDashboardPage.tsx (the settings line); frontend/src/features/ghg/OrganizationsPage.tsx (the button under restricted creation); backend/src/main/java/com/carbonos/platform/PlatformSettings.java and internal/PlatformSettingsService.java (1 to 72 hours, default 24); backend/src/main/java/com/carbonos/ghg/internal/SupportAccessService.java (the history line); the New organization dialog from the Gye Nyame Gold walkthrough of 2026-09-28 (replay-log.txt, "1 new org dialog") -->

## Before you start

- You hold the Admin platform role.
- You have a reason of at least 10 characters ready. It is recorded with the change, and a verifier may ask to read it.

## Change a setting

1. Open **Platform settings** in the console. The page reads "Policy for the whole deployment. Both settings govern access to clients' inventories, so every change is kept with its reason."
2. Set **Support access lasts**: "Hours, between 1 and 72. A grant keeps the window it was taken under, so changing this never moves access that is already live."
3. Set **Who may create an organization** to "Everyone signed in" or "Administrators only".
4. Fill **Reason for this change**: "At least 10 characters. It is kept with the change, and a verifier may ask to read it."
5. Click **Save settings**.

What you see: "Platform settings saved.", and beside the button "Last changed by *email* on *moment*". **Every change** lists each saved change with its **Setting**, **From**, **To**, **Reason**, **Who**, and **When**. Until the first change it reads "Nothing has been changed; the deployment is running on the defaults.": 24 hours, and everyone signed in. **Platform overview** states the values in force in one line, "Support access lasts 24 hours, and everyone signed in may create an organization."

## Who may create an organization

The hint under the setting says what "Administrators only" changes: "With administrators only, the form asks for the client account that becomes the owner, and the administrator is not made a member." Under it, **New organization** on **GHG accounting** is offered to administrators alone; a member does not see the button.

The form's **Owner's email (optional)** field then names the client: "An existing account, which becomes the organization's owner. Leave it empty to own it yourself. Naming somebody else means you are not a member, so you will need support access to open it." The steps are in [Create an organization](../organization/create-an-organization.md).

## What happens next

A grant taken after the change runs for the new window. A grant already live keeps the window it was taken under, and the history line it writes when it runs out states that window: "support access expired after 24 hours". See [Assume support access](assume-support-access.md).
