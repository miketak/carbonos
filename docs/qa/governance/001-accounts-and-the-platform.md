<!-- generated from qa/packs/governance/001-accounts-and-the-platform.yaml by make qa-export; edit the YAML -->
# Procedure 1: Accounts and the platform

**Objective.** Confirm that a platform administrator creates accounts directly and approves a request that arrives by email, that the password rule holds on both paths, that a platform setting is recorded with a reason and takes effect for members at once, that an administrator cannot demote, disable or delete their own account, and that a password is changed on the profile, reset by email, or reset by a link an administrator sends.

**Covers** [spec 01](../../../specs/01-identity-and-access.md), [spec 01.1](../../../specs/01.1-access-requests.md), [spec 01.5](../../../specs/01.5-the-platform-administration-panel.md), [spec 01.6](../../../specs/01.6-landing-the-account-menu-and-retiring-the-resume-upload.md), [spec 01.9](../../../specs/01.9-password-change-and-reset.md), [spec 02.6](../../../specs/02.6-versioned-pack-import.md) and [spec 08](../../../specs/08-form-validation-and-ui-polish.md). Spec 02.6 for the platform setting and spec 08 for the form rules. Support access is in procedure 7, case D3, where it meets a decision it cannot make.

**Estimated time:** 45 minutes.

**Procedure version:** 4 (2026-10-02). The change notes are at the foot.

**Run this procedure** first. Every later procedure signs in with the accounts it creates.

## Prerequisites

- Admin A: the administrator account the engineering team created for you, and its password.
- The mailbox the aliases in the README point at.
- A normal window for Admin A and a private window for everyone else.

## A. Your administrator account

### A1. At the start, no organization exists

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin in the normal window, sign in as "Admin". | **Organizations** reads 0; **Factor pack editions** counts the three shipped editions; **Open adoption notices** reads 0. No tile carries a client's emissions figure. No access request is waiting. Note the number on **Users**. |  |  |
| 2 | Open **Users**. | Admin is listed as Admin, Active. |  |  |

## B. Accounts created by an administrator

### B1. The password rule holds on the administrator's form

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Add user**. Fill in the Admin B alias, the display name "Admin B", the role **Admin** and the temporary password `short1`. Submit. | Refused inline: "At least 12 characters, with a letter and a digit.". Admin B is not listed; nothing was created. |  |  |
| 2 | Click **Add user**. Fill in the Admin B alias, the display name "Admin B", the role **Admin** and the temporary password `AdminB-pass-2026`. Submit. | Admin B is listed as Admin, Active. |  |  |

### B2. Three member accounts, and a duplicate is refused

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Click **Add user**. Fill in the Kofi alias, the display name "Kofi Mensah", the role **Member** and the temporary password `Kofi-pass-2026`. Submit. | Kofi Mensah is listed as Member, Active. |  |  |
| 2 | Click **Add user**. Fill in the Esi alias, the display name "Esi Boateng", the role **Member** and the temporary password `Esi-pass-2026`. Submit. | Esi Boateng is listed as Member, Active. |  |  |
| 3 | Click **Add user**. Fill in the Yaw alias, the display name "Yaw Darko", the role **Member** and the temporary password `Yaw-pass-2026`. Submit. | **Users** reads four more than in case A1. |  |  |
| 4 | Click **Add user**. Fill in the Kofi alias, the display name "Kofi Mensah", the role **Member** and the temporary password `Kofi-pass-2026`. Submit. | Refused: "A user with email 'the Kofi alias' already exists.". **Users** reads four more than in case A1: an administrator may learn that an account exists, a visitor may not (case C1 says less on purpose). |  |  |
| 5 | Open **Dashboard**. | No access request is waiting. **Users** reads four more than in case A1. |  |  |

## C. An account requested by email

### C1. A visitor requests access, once

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Signed out, in the private window, open `/` in the address bar, then click **Request access**. Fill in **Full name** with "Ama Owusu", fill in **Work email** with the Ama alias, fill in **Company (optional)** with `Adansi Foods Ltd`, then click **Request access**. | The dialog thanks Ama by name and says the request is with the team. |  |  |
| 2 | Open `/` in the address bar, then click **Request access**. Fill in **Full name** with "Ama Owusu", fill in **Work email** with the Ama alias, fill in **Company (optional)** with `Adansi Foods Ltd`, then click **Request access**. | Refused: "An account or pending request already exists for 'the Ama alias'.". |  |  |
| 3 | Open `/` in the address bar, then click **Request access**. Fill in **Full name** with "Kofi Mensah", fill in **Work email** with the Kofi alias, then click **Request access**. | Refused: "An account or pending request already exists for 'the Kofi alias'.": the message does not say whether the address holds an account or a request. |  |  |
| 4 | Try to sign in as "Ama Owusu" with any password. | Refused: "Invalid email or password.": a request is not an account. |  |  |

### C2. The administrator approves

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin in the normal window, open **Dashboard**. | A line reads "1 access request waiting". |  |  |
| 2 | Open **Access requests**, then click **Approve** on the row of "Ama Owusu". | Ama Owusu's request is listed under **Already decided** as "Approved, waiting for the password to be set". Ama Owusu is listed as Pending activation. The mailbox receives "Your CarbonOS access is approved", with a link to `/set-password?token=...` on this environment's address. |  |  |
| 3 | Open **Users**. | Ama Owusu is listed as Pending activation. |  |  |
| 4 | Look. | The mailbox receives "Your CarbonOS access is approved", with a link to `/set-password?token=...` on this environment's address: on this environment's address, never localhost or production. |  |  |

### C3. The link sets the password once

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Ama Owusu in the private window, open the link of the email "Your CarbonOS access is approved" in the mailbox, fill in **New password** with `Ama-pass`, fill in **Confirm password** with `Ama-pass`, then click **Set password and sign in**. | Refused inline: "At least 12 characters, with a letter and a digit.": too short. |  |  |
| 2 | Open the link of the email "Your CarbonOS access is approved" in the mailbox, fill in **New password** with `twelvelettersx`, fill in **Confirm password** with `twelvelettersx`, then click **Set password and sign in**. | Refused inline: "At least 12 characters, with a letter and a digit.": no digit. |  |  |
| 3 | Open the link of the email "Your CarbonOS access is approved" in the mailbox, fill in **New password** with `Ama-pass-2026`, fill in **Confirm password** with `Ama-pass-2026`, then click **Set password and sign in**. | Ama Owusu lands on **GHG accounting** with no organizations. **New organization** is offered and the empty state reads "No organizations yet" over "Create your first reporting organization to start the GHG Protocol workflow.". |  |  |
| 4 | Open the link of the email "Your CarbonOS access is approved" in the mailbox. | Refused: "This link is invalid or has expired.": with a way back to the landing page. |  |  |
| 5 | Open `/set-password?token=` followed by 64 zeros. | Refused: "This link is invalid or has expired.": a forged token is not told apart from a used one. |  |  |
| 6 | As Admin in the normal window, open **Users**. | Ama Owusu is listed as Active. **Users** reads five more than in case A1. |  |  |

## D. Platform settings

Settings are on the qa environment for every tester. Cases D2 and D3 put each value back.

### D1. A setting needs a value in range, a change and a reason

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Platform settings**. | **Support access lasts** reads 24 hours, **Who may create an organization** reads "Everyone signed in", **Editions inside a published period** reads "Blocked (default)". |  |  |
| 2 | Open **Platform settings**, fill in **Support access lasts** with `0`, fill in **Reason for this change** with `Governance pack: a window of zero`, then click **Save settings**. | Refused inline: "Support access lasts between 1 and 72 hours.". |  |  |
| 3 | Open **Platform settings**, fill in **Support access lasts** with `100`, fill in **Reason for this change** with `Governance pack: a window of a hundred`, then click **Save settings**. | Refused inline: "Support access lasts between 1 and 72 hours.". |  |  |
| 4 | Open **Platform settings**, fill in **Support access lasts** with `24`, fill in **Reason for this change** with `Governance pack: the same value again`, then click **Save settings**. | Refused inline: "Nothing changed, so there is nothing to record.". |  |  |
| 5 | Open **Platform settings**, fill in **Support access lasts** with `2`, fill in **Reason for this change** with `short`, then click **Save settings**. | Refused inline: "Give a reason of at least 10 characters.". |  |  |
| 6 | Open **Platform settings**, fill in **Support access lasts** with `2`, fill in **Reason for this change** with `Governance pack: a shorter support window`, then click **Save settings**. | Under **Every change** an entry reads "Support access window" from "24 hours" to "2 hours", with the reason "Governance pack: a shorter support window", the Admin alias and the moment. |  |  |
| 7 | Open **Dashboard**. | The dashboard's **Support access** section reads "Support access lasts 2 hours". |  |  |

### D2. Reserving organization creation takes effect at once

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open **Platform settings**, set **Who may create an organization** to **Administrators only**, fill in **Reason for this change** with `Governance pack: creation reserved`, then click **Save settings**. | Under **Every change** an entry reads "Who may create an organization" from "Everyone signed in" to "Administrators only", with the reason "Governance pack: creation reserved". |  |  |
| 2 | As Ama Owusu in the private window, open **GHG accounting**. | **New organization** is gone. The empty state reads "You are not a member of any organization yet. Ask an owner to add you, or a platform administrator.". |  |  |
| 3 | As Admin in the normal window, open **Platform settings**, set **Who may create an organization** to **Everyone signed in**, fill in **Reason for this change** with `Governance pack: creation opened again`, then click **Save settings**. | **Who may create an organization** reads "Everyone signed in". |  |  |
| 4 | Open **Platform settings**, fill in **Support access lasts** with `24`, fill in **Reason for this change** with `Governance pack: the window restored`, then click **Save settings**. | The log under **Every change** holds 4 entries, the newest first. |  |  |
| 5 | As Ama Owusu in the private window, open **GHG accounting**. | **New organization** is offered and the empty state reads "No organizations yet" over "Create your first reporting organization to start the GHG Protocol workflow.": leave it, procedure 2 creates the organization. |  |  |

### D3. The third setting is recorded like the others

What the setting does to an import is in the mining pack, procedure 10 case E5: every reported year of this pack has a frozen correction beside it, which blocks under either value.

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin in the normal window, open **Platform settings**. | **Editions inside a published period** reads "Blocked (default)": the hint says published runs keep the factors they reported with either way, and that frozen and final periods always block. |  |  |
| 2 | Open **Platform settings**, set **Editions inside a published period** to **Allowed: published runs keep their factors**, fill in **Reason for this change** with `Governance pack: reading the third setting`, then click **Save settings**. | Under **Every change** an entry reads "Editions inside a published period" from "Blocked (default)" to "Allowed: published runs keep their factors", with the reason "Governance pack: reading the third setting". |  |  |
| 3 | Open **Platform settings**, set **Editions inside a published period** to **Blocked (default)**, fill in **Reason for this change** with `Governance pack: the default again`, then click **Save settings**. | The log under **Every change** holds 6 entries, the newest first. |  |  |

## E. An administrator's own account

### E1. Self-demotion, self-disabling and self-deletion are refused

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin B in the private window, sign in as "Admin B". | Admin B is signed in. |  |  |
| 2 | Open **Users**, then click **Edit** on the row of "Admin B". Set **Role** to **Member**, then click **Save changes**. | Refused: "You cannot demote or disable your own account.". |  |  |
| 3 | Open **Users**, then click **Disable** on the row of "Admin B". | Refused: "You cannot demote or disable your own account.". |  |  |
| 4 | Open **Users**, then click **Delete** on the row of "Admin B". Confirm "Delete "Admin B"?" with **Delete user**. | Refused: "You cannot delete your own account.". |  |  |
| 5 | Sign out. | Admin B's session has ended: the sign-in page. |  |  |

### E2. A disabled account cannot sign in, and is re-enabled

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin in the normal window, open **Users**, then click **Disable** on the row of "Yaw Darko". | Yaw Darko is listed as Disabled. |  |  |
| 2 | As Yaw Darko in the private window, sign in as "Yaw Darko". | Refused: "Invalid email or password.". |  |  |
| 3 | As Admin in the normal window, open **Users**, then click **Enable** on the row of "Yaw Darko". | Yaw Darko is listed as Active. |  |  |
| 4 | As Yaw Darko in the private window, sign in as "Yaw Darko". | Yaw Darko lands on **GHG accounting** with no organizations. |  |  |
| 5 | Sign out. | Yaw Darko's session has ended: the sign-in page. |  |  |

## F. The account menu

### F1. The menu carries the profile, and the administrator's entry

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Ama Owusu in the private window, open **GHG accounting**. | The account menu lists **Edit profile**, **Help** and **Sign out**; there is no **Administration** entry. |  |  |
| 2 | Open the account menu and choose **Edit profile**, fill in **Display name** with `Ama Owusu (Owner)`, then click **Save changes**. | The name at the top right reads "Ama Owusu (Owner)". |  |  |
| 3 | Open the account menu and choose **Edit profile**, fill in **Display name** with `Ama Owusu`, then click **Save changes**. | The name at the top right reads "Ama Owusu". |  |  |
| 4 | As Admin in the normal window, open **GHG accounting**. | The account menu lists **Edit profile**, **Help**, **Administration** and **Sign out**: inside the administration area the entry is absent, the sidebar is the navigation there. |  |  |
| 5 | As Ama Owusu in the private window, open `/admin/users` in the address bar. | Refused: a member does not reach the platform area. |  |  |

## G. Passwords

### G1. A member changes their password on the profile

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Yaw Darko in the private window, sign in as "Yaw Darko". | Yaw Darko is signed in. |  |  |
| 2 | As Yaw Darko in the normal window, sign in as "Yaw Darko". | Yaw Darko is signed in. Two sessions of one account. |  |  |
| 3 | Open the account menu and choose **Edit profile**, fill in **Current password** with a wrong password, fill in **New password** with `Yaw-pass-2027`, fill in **Confirm new password** with `Yaw-pass-2027`, then click **Change password**. | Refused inline: "The current password is not correct.". |  |  |
| 4 | Open the account menu and choose **Edit profile**, fill in **Current password** with `Yaw-pass-2026`, fill in **New password** with `Yaw-pass-2026`, fill in **Confirm new password** with `Yaw-pass-2026`, then click **Change password**. | Refused inline: "Choose a password different from your current one.". |  |  |
| 5 | Open the account menu and choose **Edit profile**, fill in **Current password** with `Yaw-pass-2026`, fill in **New password** with `Yaw-pass-2027`, fill in **Confirm new password** with `Yaw-pass-2027`, then click **Change password**. | The toast reads "Password changed. Your other sessions are signed out.". This window stays signed in; every other session of the account is signed out. The mailbox receives "Your CarbonOS password was changed". |  |  |
| 6 | As Yaw Darko in the private window, look. | Yaw Darko's session has ended: the sign-in page: that session ended with the change. |  |  |

### G2. A forgotten password is reset by email

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Signed out, in the private window, open `/login` in the address bar, then click **Forgot your password?**. Fill in **Email** with `nobody@example.test`, then click **Send reset link**. | No email "Reset your CarbonOS password" reaches nobody@example.test. |  |  |
| 2 | Open `/login` in the address bar, then click **Forgot your password?**. Fill in **Email** with the Yaw alias, then click **Send reset link**. | The mailbox receives "Reset your CarbonOS password", saying "Somebody, probably you, asked to reset your password", with a link to `/reset-password?token=...` on this environment's address: both answers on the page read the same, and do not say which address holds an account. |  |  |
| 3 | Open the link of the email "Reset your CarbonOS password" in the mailbox, fill in **New password** with `Yaw-pass-2026`, fill in **Confirm password** with `Yaw-pass-2025`, then click **Set new password**. | Refused inline: "Passwords do not match.". |  |  |
| 4 | Open the link of the email "Reset your CarbonOS password" in the mailbox, fill in **New password** with `Yaw-pass-2026`, fill in **Confirm password** with `Yaw-pass-2026`, then click **Set new password**. | The sign-in page reads "Your password is reset. Sign in with your new password.". Every session of the account has ended. |  |  |
| 5 | Sign in as "Yaw Darko" with `Yaw-pass-2027`. | Refused: "Invalid email or password.". |  |  |
| 6 | Sign in as "Yaw Darko". | Yaw Darko is signed in. The pack's password for Yaw holds again. |  |  |
| 7 | Open the link of the email "Reset your CarbonOS password" in the mailbox. | Refused: "This reset link has already been used.". |  |  |
| 8 | Open `/reset-password?token=` followed by 64 zeros. | Refused: "This reset link is not valid.". |  |  |

### G3. An administrator sends a reset link

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As Admin in the normal window, open **Users**, then click **Reset password** on the row of "Esi Boateng". Confirm "Reset the password of "Esi Boateng"?" with **Send reset link**. | The mailbox receives "Reset your CarbonOS password", saying "A CarbonOS administrator sent you this link", with a link to `/reset-password?token=...` on this environment's address. |  |  |
| 2 | As Esi Boateng in the private window, sign in as "Esi Boateng". | Esi Boateng is signed in. |  |  |
| 3 | Sign out. | Esi Boateng's session has ended: the sign-in page. Leave the link unused, it expires in an hour and Esi's password stands. |  |  |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** the refusal "At least one active administrator must remain.", which the self-account rule reaches first for any administrator acting on their own row; a request approved and then rejected; the expiry of a set-password link by time; the expiry of a reset link and the limit on reset requests (the mining pack, procedure 1, cases A11 and A12); the limit on password changes.

## Change notes

- **Version 2, 2026-09-29.** Section D reads the third setting, **Editions inside a published period** (new case D3, PR #122), and **Every change** with the form's labels ("24 hours", "Everyone signed in"; PR #124). New section G: a password changed on the profile, reset by email, and reset by a link an administrator sends (spec 01.9, PR #123). Every account keeps the password the README lists.
- **Version 3, 2026-09-29.** F1 step 1 lists **Help** in the account menu (help centre, PR #117). Found by the governance walkthrough of 2026-09-29.
- **Version 4, 2026-10-02.** Transliterated to the QA scenario DSL (qa/packs/governance): the procedure is generated from domain steps and verified by the API and UI drivers. The sentences that described the screen (dialog titles, the options of a select, the hint under a field) moved into the drivers' UI projections or were dropped; one row per account where the prose grouped three; B2 counts accounts against the number noted in A1; C1 step 5 signs in with a wrong password by name.
