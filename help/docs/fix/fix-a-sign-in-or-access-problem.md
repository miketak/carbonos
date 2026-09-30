---
owner: miketak
last_reviewed: 2026-09-29
description: What CarbonOS says when a sign-in, a password change, an access or reset link, a role or support access stops you, what each message means, and what to do.
---

# Fix a sign-in or access problem

The messages you meet while signing in, setting, changing or resetting a password, or acting
without the role an action needs. Every message is quoted as the product
prints it.

<!-- sources: troubleshooting/index.md (verified 2026-09-24); spec 01.3 (support access), 01.4 (members), 01.5 (platform settings), 01.8 (account numbers); strings checked on 2026-09-28 in SetPasswordPage.tsx, LoginPage.tsx, OrganizationLayout.tsx, OrganizationSettingsPage.tsx, roles.ts, AdminSettingsPage.tsx, GhgAccess.java (TenantDecisionException), DuplicateAccessRequestException.java, PasswordPolicy.java; spec 01.9 strings checked on 2026-09-29 in ResetPasswordPage.tsx, ChangePasswordSection.tsx, InvalidResetLinkException.java, WrongCurrentPasswordException.java, PasswordRateLimiter.java and PasswordService.java -->

| You see | It means | Do this |
| --- | --- | --- |
| "Invalid email or password." | The address or the password is wrong, or the account does not exist yet. | Check both. If you forgot the password, click **Forgot your password?**; see [Reset a forgotten password](../access/reset-a-forgotten-password.md). If you never set one, request access. |
| "At least 12 characters, with a letter and a digit." | The password you chose does not meet the policy. | Choose a longer password that mixes letters and digits. |
| "The current password is not correct." | On **Change password**, the current password you typed is wrong. You stay signed in. | Type it again, or reset it from the sign-in page. |
| "This reset link has already been used." | The reset link, or another reset link of your account, has already set a password. | Ask for a new link and use the latest email. |
| "This reset link has expired. Reset links are valid for 1 hour." | The reset link is more than an hour old. | Ask for a new link from **Forgot your password?** |
| "This reset link is not valid." | The link is incomplete, or CarbonOS never issued it. | Copy the whole link from the email, or ask for a new one. |
| "Too many password reset requests. Try again in 15 minutes." or "Too many attempts to change the password. Try again in 15 minutes." | Three reset requests for one address or ten from one network address, or five password changes, within 15 minutes. | Wait 15 minutes. |
| Signed out after someone changed your password | A new password signs out every other session of the account. | Sign in with the new password. If you did not change it, reset it at once. |
| "An account or pending request already exists for '…'." | You requested access with an address CarbonOS already knows. | Sign in, or wait for an administrator to approve the earlier request. |
| "This link is invalid or has expired. Access links are valid for 7 days; you can always request access again." | The set-password link was used already or is older than 7 days. | Request access again, or ask an administrator to add you under **Users** with a temporary password. |
| "Organization not found" | Your account is not a member of the organization, and you have no support grant. | Ask an owner to add you under the organization's **Settings**. |
| A button is disabled with "Needs the Preparer, Reviewer or Owner role.", "Needs the Reviewer or Owner role." or "Needs the Owner role." | Your role does not allow the action. | Ask an owner to change your role. |
| **Settings** opens on **Baseline and targets**, with no **Organization** tab | You are not an owner by membership, or you are inside under support access. | Only an owner administers members and details. Ask an owner. |
| "Support access cannot adopt an edition for an organization. That is the organization's own decision, so a reviewer or an owner of the organization has to make it." | Accepting or declining a notice under support access. | A reviewer or owner of the organization decides it. |
| **New organization** is not offered | The platform setting **Who may create an organization** is "Administrators only". | Ask an administrator to create it and name you as the owner. |
