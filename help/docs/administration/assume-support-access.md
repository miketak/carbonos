---
owner: miketak
last_reviewed: 2026-09-28
description: Take an owner's rights in an organization for a support case, with your reason on its record, work under the banner, and end the grant when the case is done.
role: Administrator
minutes: 5
---

# Assume support access

A grant gives you an owner's rights in one organization for the window the deployment sets, with your reason on the organization's record. You take one for a support case and end it when the case is done.

<!-- sources: specs 01.3, 01.5, 01.6, 01.8; the old page tasks/administration/assume-support-access.md (verified 2026-09-24 and 2026-09-26); frontend/src/features/admin/AdminOrganizationsPage.tsx (labels, dialog, toasts); AdminDashboardPage.tsx (the Support access section); frontend/src/features/ghg/components/SupportAccessBanner.tsx; frontend/src/features/ghg/OrganizationSettingsPage.tsx (the owner-only page and the history table); frontend/src/features/ghg/format.ts (history labels); backend/src/main/java/com/carbonos/ghg/internal/SupportAccessService.java (reason, expiry, refusals, history details); SupportAccess.java; GhgAccess.java (what a grant cannot do, the marker); backend/src/main/java/com/carbonos/platform/PlatformSettings.java (1 to 72 hours, default 24) -->

## Before you start

- You hold the Admin platform role and are not a member of the organization. A member needs no grant: "membership already gives you access, so support access does not apply."
- You have a reason of at least 10 characters. The owners read it.

## Take a grant

1. Open **Organizations** in the console. Each row shows the organization with its account number, its **Owners**, its **Members** and its **Support access**, "None" until you hold one.
2. Click **Assume access** on the organization.
3. Read the dialog. It states the window, and that "every act you record is attributed to you and marked as taken under support access."
4. Fill **Reason**: "At least 10 characters; the owners read it."
5. Click **Assume access**. The button stays disabled until the reason is long enough.

What you see: "Support access to *organization* assumed." The row reads "Until *moment*: *reason*" with **Open** and **End access**. The window is the deployment's **Support access lasts** setting, fixed on the grant when you take it.

## Work under the grant

Click **Open**. The organization appears under your **GHG accounting**, and every page in it carries the banner "You are in *organization* (ORG-*NNNN*) under support access until *moment*. Every act is recorded in this organization's history."

A grant is an owner's rights with three things held back: "It never carries deleting the organization, changing its membership, or adopting a factor pack edition." The sidebar has no **Settings** entry, and **Accept** on an update notice answers "Support access cannot adopt an edition for an organization."

## End the grant

1. Open **Organizations** and click **End access** on the row.

What you see: "Support access to *organization* ended." and the row returns to "None". Otherwise the grant expires at the moment shown, and CarbonOS closes it within a minute of that moment.

## What the owners see

The **History** at the foot of the organization's **Settings** records **Support access assumed** with your email, the moment and your reason, then **Support access ended** with "support access ended by the administrator" or **Support access expired** with "support access expired after 24 hours". Every act you recorded meanwhile carries "(under support access)" in its detail. The owners' side is explained in [What is support access?](../access/what-is-support-access.md).
