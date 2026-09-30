# Procedure 1: Accounts and the platform

**Objective.** Confirm that a platform administrator creates accounts
directly and approves a request that arrives by email, that the password
rule holds on both paths, that a platform setting is recorded with a reason
and takes effect for members at once, that an administrator cannot
demote, disable or delete their own account, and that a password is
changed on the profile, reset by email, or reset by a link an
administrator sends.

**Covers** [spec 01](../../../specs/01-identity-and-access.md),
[spec 01.1](../../../specs/01.1-access-requests.md),
[spec 01.5](../../../specs/01.5-the-platform-administration-panel.md),
[spec 01.6](../../../specs/01.6-landing-the-account-menu-and-retiring-the-resume-upload.md),
[spec 01.9](../../../specs/01.9-password-change-and-reset.md),
the platform setting of [spec 02.6](../../../specs/02.6-versioned-pack-import.md)
and the form rules of [spec 08](../../../specs/08-form-validation-and-ui-polish.md).
Support access is in [procedure 7](007-the-pack-lifecycle-end-to-end.md),
case D3, where it meets a decision it cannot make.

**Estimated time:** 45 minutes.

**Procedure version:** 3 (2026-09-29). The change notes are at the foot.

**Run this procedure** first. Every later procedure signs in with the
accounts it creates.

## Prerequisites

- Admin A: the administrator account the engineering team created for
  you, and its password.
- The mailbox the aliases in the [README](README.md) point at.
- A normal window for Admin A and a private window for everyone else.

## A. Your administrator account

### A1. At the start, no organization exists

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Sign in as Admin A. | An administrator lands on the platform dashboard (spec 01.6). Note the number on **Users**: the engineering team's accounts and yours, with "0 pending". **Organizations** reads 0; **Factor pack editions** counts the three shipped editions; **Open adoption notices** reads 0. No tile carries a client's emissions figure. | | |
| 2 | Open **Users**. | Your row: your email, role Admin, status Active. | | |

## B. Accounts created by an administrator

### B1. The password rule holds on the administrator's form

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Add user**. Fill in the Admin B alias, the display name "Admin B", the role **Admin**, and the temporary password `short1`. Submit. | The dialog stays open with "At least 12 characters, with a letter and a digit." under the password. Nothing is created. | | |
| 2 | Change the password to `AdminB-pass-2026` and submit. | The dialog closes and Admin B is listed as Admin, Active. | | |

### B2. Three member accounts, and a duplicate is refused

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Add Kofi Mensah (the Kofi alias, role **Member**, `Kofi-pass-2026`), Esi Boateng (`Esi-pass-2026`) and Yaw Darko (`Yaw-pass-2026`) the same way. | Each appears as Member, Active. The list holds four accounts more than in case A1. | | |
| 2 | Click **Add user** once more with the Kofi alias and any valid password. | Refused: "A user with email '<the Kofi alias>' already exists.". The count is unchanged. The public request path of case C1 says less on purpose: an administrator may learn that an account exists, a visitor may not. | | |
| 3 | Open the dashboard. | **Users** reads four more than in case A1, all active, with "0 pending". | | |

## C. An account requested by email

### C1. A visitor requests access, once

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the private window, open the app signed out and click **Request access**. | A dialog titled "Request access" asks for a name, an email address and an optional company. | | |
| 2 | Enter "Ama Owusu", the Ama alias and "Adansi Foods Ltd". Submit. | The dialog thanks Ama by name and says the request is with the team. | | |
| 3 | Submit the same request again. | Refused as a duplicate. | | |
| 4 | Submit a request with the Kofi alias, which already has an account. | Refused with the same wording as step 3. The message does not say whether the address holds an account or a request. | | |
| 5 | Try to sign in as Ama with any password. | Refused. A request is not an account. | | |

### C2. The administrator approves

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin A, open the dashboard. | A line reads "1 access request waiting". | | |
| 2 | Open the access requests and click **Approve** on Ama's. | A toast confirms the approval and the email. The list reads "No pending requests.". | | |
| 3 | Open **Users**. | Ama is listed with the status **Pending activation**. | | |
| 4 | Read the mailbox. | An email with the subject "Your CarbonOS access is approved" holds a link to `/set-password?token=…` on the qa address, never localhost or production. | | |

### C3. The link sets the password once

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open the link in the private window. | The page states the rule before you type: at least 12 characters, with a letter and a digit. | | |
| 2 | Try `Ama-pass` and then `twelvelettersx`. | Each is refused inline. The first is short, the second has no digit. | | |
| 3 | Enter `Ama-pass-2026` twice and submit. | Ama lands on the **GHG accounting** page, signed in, with no organizations. The empty state offers **New organization**. | | |
| 4 | Open the emailed link again in a new tab. | "This link is invalid or has expired.", with a way back to the landing page. | | |
| 5 | Open `/set-password?token=` followed by 64 zeros. | The same state as step 4. A forged token is not told apart from a used one. | | |
| 6 | As Admin A, refresh **Users**. | Ama reads Active. Five accounts more than in case A1. | | |

## D. Platform settings

Settings are on the qa environment for every tester. Cases D2 and D3 put
each value back.

### D1. A setting needs a value in range, a change and a reason

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin A, open **Platform settings** in the administration sidebar. | **Support access lasts** reads 24 hours, **Who may create an organization** reads "Everyone signed in" and **Editions inside a published period** reads "Blocked (default)". A **Reason for this change** field sits under them. | | |
| 2 | Set the window to 0, type a reason of 10 characters or more, and save. | Refused: "Support access lasts between 1 and 72 hours.". | | |
| 3 | Set it to 100 and save. | The same refusal. | | |
| 4 | Set it back to 24 and save with the reason still filled in. | Refused: "Nothing changed, so there is nothing to record.". | | |
| 5 | Set it to 2 with the reason `short` and save. | Refused: "Give a reason of at least 10 characters.". | | |
| 6 | Keep 2 and give the reason "Governance pack: a shorter support window". Save. | Saved. Under **Every change** an entry reads "Support access window" from "24 hours" to "2 hours", with the reason, your email and the moment. | | |
| 7 | Open the dashboard. | The **Support access** section reads "Support access lasts 2 hours". | | |

### D2. Reserving organization creation takes effect at once

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Platform settings**, set **Who may create an organization** to **Administrators only** with the reason "Governance pack: creation reserved". Save. | Saved and listed under **Every change** from "Everyone signed in" to "Administrators only". | | |
| 2 | As Ama in the private window, reload the **GHG accounting** page. | **New organization** is gone. The empty state reads "You are not a member of any organization yet. Ask an owner to add you, or a platform administrator.". | | |
| 3 | As Admin A, set it back to **Everyone signed in** with the reason "Governance pack: creation opened again". Set the support window back to 24 with a reason. | Both changes are listed. The log now holds four entries, the newest first. | | |
| 4 | As Ama, reload. | **New organization** is back and the empty state reads "No organizations yet" over "Create your first reporting organization to start the GHG Protocol workflow.". Leave it: procedure 2 creates the organization. | | |

### D3. The third setting is recorded like the others

What the setting does to an import is in the mining pack, procedure 10
case E5: every reported year of this pack has a frozen correction beside
it, which blocks under either value.

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin A, read **Editions inside a published period**. | Its options are "Blocked (default)" and "Allowed: published runs keep their factors". The hint says published runs keep the factors they reported with either way, and that frozen and final periods always block. | | |
| 2 | Set it to **Allowed: published runs keep their factors** with the reason "Governance pack: reading the third setting". Save. | Saved. **Every change** reads "Editions inside a published period" from "Blocked (default)" to "Allowed: published runs keep their factors". | | |
| 3 | Set it back to **Blocked (default)** with the reason "Governance pack: the default again". Save. | Listed. The log now holds six entries, the newest first. | | |

## E. An administrator's own account

### E1. Self-demotion, self-disabling and self-deletion are refused

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin B in the private window, open **Administration**, then **Users**, and edit your own row to the role **Member**. | Refused: "You cannot demote or disable your own account.". | | |
| 2 | Click **Disable** on your own row. | The same refusal. | | |
| 3 | Click **Delete** on your own row and confirm. | Refused: "You cannot delete your own account.". | | |
| 4 | Sign out of the private window. | | | |

### E2. A disabled account cannot sign in, and is re-enabled

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin A, click **Disable** on Yaw's row. | Yaw reads Disabled; the button now reads **Enable**. | | |
| 2 | In the private window, sign in as Yaw. | Refused. | | |
| 3 | As Admin A, click **Enable** on Yaw's row. | Yaw reads Active. | | |
| 4 | Sign in as Yaw again. | Yaw lands on the **GHG accounting** page with no organizations. Sign out. | | |

## F. The account menu

### F1. The menu carries the profile, and the administrator's entry

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Ama, open the account menu. | It lists the Ama alias, **Edit profile**, **Help** and **Sign out**. There is no **Administration** entry. | | |
| 2 | Choose **Edit profile**, change the display name to "Ama Owusu (Owner)" and save. | The name at the top right changes. Change it back to "Ama Owusu". | | |
| 3 | As Admin A, open the menu from the **GHG accounting** page. | It also lists **Administration**. Inside `/admin` the entry is absent: the sidebar is the navigation there. | | |
| 4 | As Ama, open `/admin/users` in the address bar. | Refused: a member does not reach the platform area. | | |

## G. Passwords

### G1. A member changes their password on the profile

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Sign in as Yaw in the private window. In the normal window, sign Admin A out and sign in as Yaw as well. | Two sessions of one account. | | |
| 2 | In the normal window, open **Edit profile** and find **Change password**. Type a wrong current password and `Yaw-pass-2027` twice, and click **Change password**. | The section reads "You stay signed in here; every other session of your account is signed out.". Refused: "The current password is not correct.". | | |
| 3 | Type `Yaw-pass-2026` as the current password and `Yaw-pass-2026` as the new one, twice. Submit. | Refused: "Choose a password different from your current one.". | | |
| 4 | Type `Yaw-pass-2027` as the new password, twice. Submit. | The toast reads "Password changed. Your other sessions are signed out.". The normal window stays signed in. The mailbox receives "Your CarbonOS password was changed". | | |
| 5 | In the private window, reload the page. | The sign-in page: that session ended with the change. | | |

### G2. A forgotten password is reset by email

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the private window, click **Forgot your password?**. Send a link for `nobody@example.test`, then go back and send one for the Yaw alias. | Both answers read the same: "If <the address> belongs to an active CarbonOS account, a reset link is on its way. The link is valid for 1 hour and works once.". The page does not say which address holds an account. | | |
| 2 | Read the mailbox. | One email, "Reset your CarbonOS password", starting "Somebody, probably you, asked to reset your password", with a link to `/reset-password?token=…` on the qa address. | | |
| 3 | Open the link. Type `Yaw-pass-2026` and confirm with `Yaw-pass-2025`. Click **Set new password**. | The page reads "Choose a new password for <the Yaw alias>. Every session of the account is signed out when you save it.". Refused: "Passwords do not match.". | | |
| 4 | Type `Yaw-pass-2026` in both fields and submit. | The sign-in page reads "Your password is reset. Sign in with your new password.". `Yaw-pass-2027` is refused and `Yaw-pass-2026` signs in: the pack's password for Yaw holds again. The normal window's session has ended too. | | |
| 5 | Open the same link again. | "This reset link has already been used." followed by "Ask for a new link and use the latest email." and **Ask for a new link**. | | |
| 6 | Open `/reset-password?token=` followed by 64 zeros. | "This reset link is not valid.", with the same sentence and button. | | |

### G3. An administrator sends a reset link

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Sign in as Admin A in the normal window and open **Users**. Click **Reset password** on Esi's row. | A dialog "Reset the password of Esi Boateng?" reads "CarbonOS emails <the Esi alias> a link to choose a new password. The link is valid for 1 hour and works once. The current password keeps working until the link is used.". | | |
| 2 | Click **Send reset link**. | The toast reads "Reset link sent to <the Esi alias>.". The mailbox receives "Reset your CarbonOS password", saying "A CarbonOS administrator sent you this link". | | |
| 3 | Sign in as Esi in the private window with `Esi-pass-2026`, then sign out. | Accepted. Leave the link unused: it expires in an hour, and Esi's password stands. | | |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** the refusal "At least one active administrator must
remain.", which the self-account rule reaches first for any administrator
acting on their own row; a request approved and then rejected; the expiry
of a set-password link by time; the expiry of a reset link and the limit
on reset requests (the mining pack, procedure 1, cases A11 and A12); the
limit on password changes.

## Change notes

- **Version 2, 2026-09-29.** Section D reads the third setting,
  **Editions inside a published period** (new case D3, PR #122), and
  **Every change** with the form's labels ("24 hours", "Everyone signed
  in"; PR #124). New section G: a password changed on the profile, reset
  by email, and reset by a link an administrator sends (spec 01.9, PR
  #123). Every account keeps the password the README lists.
- **Version 3, 2026-09-29.** F1 step 1 lists **Help** in the account menu (help centre, PR #117). Found by the governance walkthrough of 2026-09-29.
