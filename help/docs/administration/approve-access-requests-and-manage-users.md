---
owner: miketak
last_reviewed: 2026-09-29
description: Decide the access requests waiting in the console, add an account directly with a temporary password, and deactivate or reactivate a user without losing their history.
role: Administrator
minutes: 6
---

# Approve access requests and manage users

You decide access requests as they arrive, add an account directly when the person is already known to you, and disable one when they leave. Membership of an organization is given separately, by its owner.

<!-- sources: spec 01.1, 01.2, 01.5; the old page tasks/administration/approve-access-requests-and-manage-users.md (verified 2026-09-24); frontend/src/features/admin/AdminAccessRequestsPage.tsx and components/AccessRequestsSection.tsx (labels, outcomes, toasts); AdminUsersPage.tsx, components/UserTable.tsx, UserFormModal.tsx, ConfirmDeleteDialog.tsx and badges.tsx (labels, statuses); AdminDashboardPage.tsx (the lone-administrator line); AdminLayout.tsx (the badge); backend/src/main/java/com/carbonos/mail/internal/AccessRequestEmails.java (the two emails); backend/src/main/java/com/carbonos/user/internal/UserService.java (refusals); PasswordPolicy.java -->

## Before you start

- You hold the Admin platform role. **Access requests** carries a badge with the number waiting, and **Platform overview** lists "*N* access requests waiting" under **Needs your attention**.

## Decide an access request

1. Open **Access requests**. The page reads "Approving one creates the account at once in the pending state and sends a link to set a password. Nobody signs in until they have set it."
2. Under **Waiting for a decision**, read the **Name**, the company, the **Email**, the **Requested** date and any message the person left.
3. Click **Approve** or **Deny**.

What you see: "*Name* approved; setup email sent." or "*Name* denied." The request moves to **Already decided** with the **Outcome** "Approved, waiting for the password to be set" or "Denied", and the new account appears under **Users** as **Member** and **Pending activation**. For the person's side, see [Set your password and sign in](../access/set-your-password-and-sign-in.md).

## Add a user directly

1. Open **Users** and click **Add user**.
2. Fill **Email** and **Display name**, and choose **Role**: "Member" or "Admin".
3. Fill **Temporary password**: "At least 12 characters, with a letter and a digit. Share it with the user out of band."
4. Click **Add user**.

What you see: "*Name* added." The row reads the role, **Active** and the date under **Added**. No email is sent; the person signs in with the temporary password.

## Deactivate or reactivate a user

1. Open **Users** and find the row. Your own row is marked "(you)".
2. Click **Disable**. The account can no longer sign in, and its history stays.
3. Click **Enable** to reactivate it.

What you see: "*Name* disabled." or "*Name* enabled.", and the **Status** badge reads **Disabled** or **Active**. **Edit** changes the **Display name**, **Role** and **Status**; **Delete** removes the account for good.

!!! note "You are the only active administrator"
    When no other Admin account is active, **Platform overview** warns under **Needs your attention**: "Nobody can publish a factor pack edition you curated, and nobody can cover for you." Disabling or demoting yourself answers "You cannot demote or disable your own account.", and disabling, demoting or deleting the last active administrator answers "At least one active administrator must remain."

## What happens next

A new account belongs to no organization; an owner adds it under the organization's **Settings**, see [Add members and assign roles](../organization/add-members-and-assign-roles.md). The statuses are listed in [Check an account or request status](check-an-account-or-request-status.md).
