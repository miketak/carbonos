---
owner: miketak
last_reviewed: 2026-09-28
description: The statuses of a user account under Users and of an access request under Access requests, with what each means, what moves it and what CarbonOS refuses.
role: Administrator
---

# Check an account or request status

An account's status says whether the person can sign in; an access request's status says where a visitor's request stands. Read the first under **Users** and the second under **Access requests** in the administration console.

<!-- sources: specs 01.1, 01.2, 01.5; the old page reference/statuses-and-transitions.md, section "Access requests and accounts" (verified 2026-09-24); backend/src/main/java/com/carbonos/user/internal/UserStatus.java (ACTIVE, DISABLED, PENDING); AccessRequestStatus.java (PENDING, APPROVED, DENIED, COMPLETED); AccessRequestService.java and UserService.java (transitions and refusals); DuplicateAccessRequestException.java; InvalidSetupTokenException.java; backend/src/main/java/com/carbonos/mail/internal/AccessRequestEmails.java (7 days); frontend/src/features/admin/components/badges.tsx and UserTable.tsx (account labels); AdminAccessRequestsPage.tsx and components/AccessRequestsSection.tsx (request labels) -->

## Account statuses

The **Status** column under **Users** prints one of three badges. Deleting is not a status: **Delete** removes the account for good ("If you only want to block access, disable the account instead.").

| Status on screen | Meaning | What moves an account here | Who |
| --- | --- | --- | --- |
| Active | The person can sign in. | **Add user**; the person setting their password from the approval email; **Enable**, or **Edit** with **Status** "Active" | Administrator; the person |
| Pending activation | Created by an approval; the person cannot sign in until they set their password. | **Approve** on an access request | Administrator |
| Disabled | The person cannot sign in until an administrator enables the account; its history stays. | **Disable**, or **Edit** with **Status** "Disabled" | Administrator |

## Access request statuses

A request still open sits under **Waiting for a decision**; a decided one under **Already decided** with its **Outcome**.

| Status on screen | Meaning | What moves a request here | Who |
| --- | --- | --- | --- |
| Waiting for a decision | A visitor asked for access, and no administrator has decided. | The landing page's form | The visitor |
| Approved, waiting for the password to be set | The account exists as Pending activation, and the email "Your CarbonOS access is approved" was sent with a link valid for 7 days. | **Approve** | Administrator |
| Approved, account active | The person set their password; the account is Active. | The link in the approval email | The person |
| Denied | The email "Your CarbonOS access request" told the person they "are welcome to request access again in the future." | **Deny** | Administrator |

A decided request is never reopened; a person denied, or whose link expired, requests access again.

## What blocks a move

| Attempt | What CarbonOS answers |
| --- | --- |
| Approve or deny a request already decided | "This request was already decided (*STATUS*)." |
| Request access with an email that has an account or an open request | "An account or pending request already exists for '*email*'." |
| Set a password from a used link, or one older than 7 days | "This link is invalid or has expired." |
| Set a password that breaks the rule | "At least 12 characters, with a letter and a digit." |
| Disable or demote your own account | "You cannot demote or disable your own account." |
| Delete your own account | "You cannot delete your own account." |
| Disable, demote or delete the last active administrator | "At least one active administrator must remain." |

The steps are in [Approve access requests and manage users](approve-access-requests-and-manage-users.md); what the person sees is in [Request access](../access/request-access.md) and [Set your password and sign in](../access/set-your-password-and-sign-in.md).
