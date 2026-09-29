---
owner: miketak
last_reviewed: 2026-09-29
description: Decide the access requests waiting in the console, add an account with a temporary password, send a password reset link, and deactivate or reactivate a user.
role: Administrator
minutes: 6
---


# Approve access requests and manage users

You decide access requests, add accounts, send reset links and disable accounts. Membership of an organization is its owner's to give.

<!-- sources: spec 01.1, 01.2, 01.5; the old page tasks/administration/approve-access-requests-and-manage-users.md (verified 2026-09-24); frontend/src/features/admin/AdminAccessRequestsPage.tsx and components/AccessRequestsSection.tsx (labels, outcomes, toasts); AdminUsersPage.tsx, components/UserTable.tsx, UserFormModal.tsx, ConfirmDeleteDialog.tsx and badges.tsx (labels, statuses); AdminDashboardPage.tsx (the lone-administrator line); AdminLayout.tsx (the badge); backend/src/main/java/com/carbonos/mail/internal/AccessRequestEmails.java (the two emails); backend/src/main/java/com/carbonos/user/internal/UserService.java (refusals); PasswordPolicy.java; spec 01.9, ConfirmPasswordResetDialog.tsx, AdminUsersPage.tsx (the reset toast) and PasswordService.java (the reset refusals) -->

## Before you start

- You hold the Admin platform role. The badge on **Access requests** counts the requests waiting.

## Decide an access request

1. Open **Access requests**. The page reads "Approving one creates the account at once in the pending state and sends a link to set a password. Nobody signs in until they have set it."
2. Under **Waiting for a decision**, read the name, company, email, date and any message.
3. Click **Approve** or **Deny**.

What you see: "*Name* approved; setup email sent." or "*Name* denied." The request moves to **Already decided** with the **Outcome** "Approved, waiting for the password to be set" or "Denied", and the account appears under **Users** as **Member** and **Pending activation**. The person's side is in [Set your password and sign in](../access/set-your-password-and-sign-in.md).

## Add a user directly

1. Open **Users** and click **Add user**.
2. Fill **Email** and **Display name**, and choose **Role**: "Member" or "Admin".
3. Fill **Temporary password**: "At least 12 characters, with a letter and a digit. Share it with the user out of band."
4. Click **Add user**.

What you see: "*Name* added." The row reads the role, **Active** and the date under **Added**. No email is sent; the person signs in with the temporary password and changes it on their profile.

## Reset a user's password

1. Open **Users** and click **Reset password** on an **Active** row.
2. Click **Send reset link**. The dialog says the link "is valid for 1 hour and works once" and "The current password keeps working until the link is used."

What you see: "Reset link sent to *email*." You never see the password; the person continues in [Reset a forgotten password](../access/reset-a-forgotten-password.md).

## Deactivate or reactivate a user

1. Open **Users** and find the row. Your own row is marked "(you)".
2. Click **Disable**: the account can no longer sign in, and its history stays. **Enable** reactivates it.

What you see: "*Name* disabled." or "*Name* enabled." **Edit** changes the name, role and status; **Delete** removes the account for good.

!!! note "You are the only active administrator"
    **Platform overview** warns under **Needs your attention**: "Nobody can publish a factor pack edition you curated, and nobody can cover for you." Two refusals protect the platform: "You cannot demote or disable your own account." and "At least one active administrator must remain."

## What happens next

A new account belongs to no organization until an owner adds it ([Add members and assign roles](../organization/add-members-and-assign-roles.md)). Statuses are in [Check an account or request status](check-an-account-or-request-status.md).
