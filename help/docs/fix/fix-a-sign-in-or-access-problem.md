---
owner: miketak
last_reviewed: 2026-09-28
description: What CarbonOS says when a sign-in, an access link, a role or support access stops you, what each message means, and what to do about it.
---

# Fix a sign-in or access problem

The messages you meet while signing in, setting a password, or acting
without the role an action needs. Every message is quoted as the product
prints it.

<!-- sources: troubleshooting/index.md (verified 2026-09-24); spec 01.3 (support access), 01.4 (members), 01.5 (platform settings), 01.8 (account numbers); strings checked on 2026-09-28 in SetPasswordPage.tsx, LoginPage.tsx, OrganizationLayout.tsx, OrganizationSettingsPage.tsx, roles.ts, AdminSettingsPage.tsx, GhgAccess.java (TenantDecisionException), DuplicateAccessRequestException.java, PasswordPolicy.java -->

| You see | It means | Do this |
| --- | --- | --- |
| "Invalid email or password." | The address or the password is wrong, or the account does not exist yet. | Check both. If you never set a password, request access or ask an administrator to add you under **Users**. |
| "At least 12 characters, with a letter and a digit." | The password you chose does not meet the policy. | Choose a longer password that mixes letters and digits. |
| "An account or pending request already exists for '…'." | You requested access with an address CarbonOS already knows. | Sign in, or wait for an administrator to approve the earlier request. |
| "This link is invalid or has expired. Access links are valid for 7 days; you can always request access again." | The set-password link was used already or is older than 7 days. | Request access again, or ask an administrator to add you under **Users** with a temporary password. |
| "Organization not found" | Your account is not a member of the organization, and you have no support grant. | Ask an owner to add you under the organization's **Settings**. |
| A button is disabled with "Needs the Preparer, Reviewer or Owner role.", "Needs the Reviewer or Owner role." or "Needs the Owner role." | Your role does not allow the action. | Ask an owner to change your role. |
| "Settings are the owner's" | You opened **Settings** under support access. | Only an owner administers members and details. |
| "Support access cannot adopt an edition for an organization. That is the organization's own decision, so a reviewer or an owner of the organization has to make it." | Accepting or declining a notice under support access. | A reviewer or owner of the organization decides it. |
| **New organization** is not offered | The platform setting **Who may create an organization** is "Administrators only". | Ask an administrator to create it and name you as the owner. |
