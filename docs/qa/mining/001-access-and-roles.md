# Procedure 1: Access and roles

**Objective.** Confirm that a newcomer can get an account through the
request flow, that an owner can add them to an organization with a role,
and that each role can do exactly what it allows and nothing more.

**Covers** [spec 01](../../../specs/01-identity-and-access.md),
[spec 01.1](../../../specs/01.1-access-requests.md),
[spec 01.2](../../../specs/01.2-organization-membership-and-roles.md),
[spec 01.3](../../../specs/01.3-organization-confidentiality-and-deletion-safeguards.md),
[spec 01.4](../../../specs/01.4-role-aware-ui-and-visible-refusals.md)
[spec 01.6](../../../specs/01.6-landing-the-account-menu-and-retiring-the-resume-upload.md)
and the member's side of [spec 01.9](../../../specs/01.9-password-change-and-reset.md)
(procedure 11 covers the administrator's side).

**Estimated time:** 95 minutes.

**Procedure version:** 2 (2026-09-29). The change notes are at the foot.

**Run this procedure** before a release, and after any change to the `user`
or `mail` module, the members card, or the role checks in `ghg`.

## Prerequisites

- The administrator account the engineering team created for you, and its
  password.
- Three fresh email aliases you can read: call them **Newcomer**,
  **Analyst** and **Auditor**.
- The normal window for the admin, the private window for the others,
  and a second browser for case A9 (any browser other than the one that
  holds your two windows).

Token expiry (the seven-day limit on set-password links) cannot be tested
on qa. The development team covers it. A password reset link lasts one
hour: for case A11 step 4, ask the development team to age the link, or
wait the hour.

## A. Request access

### A1. A visitor requests access

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the private window, open the app signed out and click **Request access**. | The request form opens. | | |
| 2 | Enter a name, the Newcomer alias and a company. Submit. | A confirmation state. | | |
| 3 | Submit the same request again. | Refused as a duplicate, with the same wording whether the address has a request or an account (no user enumeration). | | |

### A2. The admin approves and the account appears at once

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the normal window, sign in as the admin and open the access requests. | The Newcomer's request is listed. | | |
| 2 | Approve the Newcomer's request. | A toast confirms the approval and the setup email; the request leaves the queue (the card lists pending requests only, so it reads "No pending requests"). | | |
| 3 | Open the Users list. | The Newcomer is already listed with the state **Pending activation**. | | |

### A3. A pending account cannot sign in

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the private window, try to sign in with the Newcomer alias and any password. | Sign-in is refused. | | |

### A4. The password rule is shown and enforced

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open the link from the approval email in the private window. | The page states the rule before you type: at least 12 characters, with a letter and a digit. The link is `/set-password?token=…` on the qa address, never localhost or production. | | |
| 2 | Try `shortpass1`, then `twelveletterslong`, then `123456789012`. | Each attempt is refused with an inline message. | | |

### A5. Setting the password activates the account

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Enter `Newcomer-pass-2026` twice and submit. | The Newcomer lands on the **GHG accounting** page, signed in, with no organizations and no welcome card in between. The loader that plays after sign-in shows the wordmark, a progress bar and "Loading your workspace"; it makes no claim about verifying or calibrating anything, and a click skips it. | | |
| 2 | Read the empty state. | It does not tell them to create an organization while **New organization** is hidden. With creation open it invites them to create one; with creation reserved to administrators it says they are not a member of any organization yet and names who to ask. | | |
| 3 | In the normal window, refresh the Users list. | The account now shows **Active**. | | |

### A6. The link is single-use and a bad token looks the same

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open the emailed link again in a fresh tab. | The "This link is invalid or has expired." state, with a way back to the landing page. | | |
| 2 | Open `/set-password?token=` followed by 64 zeros. | The same state as step 1. | | |

### A7. Admin-created accounts follow the same rule

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the admin, create a user for the Analyst alias with the password `short1`. | Refused with the password rule under the field ("At least 12 characters, with a letter and a digit."). | | |
| 2 | Repeat with `Analyst-pass-2026`. | The account is created. | | |
| 3 | Repeat for the Auditor alias with `Auditor-pass-2026`. | The account is created. | | |

### A8. The account menu carries the profile

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the Newcomer, look at the top right of the page. | An avatar disc with their initial and their display name, not a bare **Sign out** button. | | |
| 2 | Open it. | A menu listing their email, **Edit profile** and **Sign out**. No **Administration** entry. | | |
| 3 | Press Escape. | The menu closes and the keyboard focus is back on the trigger, so Tab continues from there. | | |
| 4 | Open it again and choose **Edit profile**. | The profile page opens, with the same top bar and the same account menu. There is no Resume section anywhere on it. | | |
| 5 | Change the display name and save, then open the menu again. | The name in the top right is the new one. | | |
| 6 | Open the menu on an organization page and on the GHG accounting list. | It is in the same place on both. | | |
| 7 | As the admin, open the menu from any GHG page. | It also lists **Administration**, which opens the platform dashboard. Inside `/admin` that entry is absent, because the sidebar is the navigation there. | | |

### A9. You change your own password on the profile

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the Newcomer in the private window, open **Edit profile** and find **Change password**. | The section reads "You stay signed in here; every other session of your account is signed out." over **Current password**, **New password** and **Confirm new password**. | | |
| 2 | In the second browser, sign in as the Newcomer and open the GHG accounting page. Leave it open. | Signed in. | | |
| 3 | Back in the private window, type a wrong current password and `Newcomer-pass-2027` twice, then click **Change password**. | Refused: "The current password is not correct.". The page stays signed in. | | |
| 4 | Type the right current password, `Newcomer-pass-2026`, and the same `Newcomer-pass-2026` as the new password, twice. Submit. | Refused: "Choose a password different from your current one.". | | |
| 5 | Type `Newcomer-pass-2027` as the new password and `Newcomer-pass-2028` to confirm. Submit. | "Passwords do not match." under the confirmation. Nothing is sent. | | |
| 6 | Confirm with `Newcomer-pass-2027` and submit. | The toast reads "Password changed. Your other sessions are signed out.". The private window stays signed in. The mailbox receives "Your CarbonOS password was changed". | | |
| 7 | In the second browser, reload the page. | You are sent to the sign-in page: that session ended with the change. Sign in there with `Newcomer-pass-2026`: refused. Sign in with `Newcomer-pass-2027`: accepted. Close the second browser. | | |

### A10. A forgotten password is reset by email

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Sign out of the private window. On the sign-in page, click **Forgot your password?**. | A page headed "Reset your password" reads "Enter the email you sign in with. We will send a link to choose a new password.", with an **Email** field, **Send reset link** and "Back to sign in". | | |
| 2 | Click **Send reset link** with the field empty. | "Enter your email." under the field. | | |
| 3 | Type `nobody@example.test` and send. | "If nobody@example.test belongs to an active CarbonOS account, a reset link is on its way. The link is valid for 1 hour and works once." | | |
| 4 | Go back, type the Newcomer alias and send. | The same sentence with the Newcomer's address. An address that holds an account reads exactly like one that does not. | | |
| 5 | Read the mailbox. | An email with the subject "Reset your CarbonOS password" starts "Somebody, probably you, asked to reset your password" and holds a link to `/reset-password?token=…` on the qa address, never localhost or production. | | |
| 6 | Ask for a second link for the Newcomer alias the same way. Keep both emails. | A second email with a different link. | | |
| 7 | Open the second link. | A page headed "Choose a new password" reads "Choose a new password for <the Newcomer alias>. Every session of the account is signed out when you save it.", with **New password** (hint "At least 12 characters, with a letter and a digit."), **Confirm password** and **Set new password**. | | |
| 8 | Type `Newcomer-reset-2026` and confirm with `Newcomer-reset-2027`. Submit. | "Passwords do not match." Nothing is sent. | | |
| 9 | Type `Newcomer-reset-2026` in both fields and submit. | The sign-in page reads "Your password is reset. Sign in with your new password.", and the mailbox receives "Your CarbonOS password was changed". `Newcomer-pass-2027` is refused; `Newcomer-reset-2026` signs in. From here on the Newcomer signs in with `Newcomer-reset-2026`. | | |

### A11. A used, expired or forged link opens nothing

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Open the second link of case A10 again. | "This reset link has already been used." followed by "Ask for a new link and use the latest email." and the button **Ask for a new link**. | | |
| 2 | Open the first link of case A10. | The same "This reset link has already been used.": completing a reset spends every other open link of the account. | | |
| 3 | Open `/reset-password?token=` followed by 64 zeros. | "This reset link is not valid.", with the same sentence and button. | | |
| 4 | Click **Ask for a new link**, ask for a link for the Newcomer alias, and have the development team age it past its hour (or wait the hour). Then open it. | "This reset link has expired. Reset links are valid for 1 hour.", with the same sentence and button. `Newcomer-reset-2026` still signs in. | | |

### A12. Reset requests are limited

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | On **Forgot your password?**, send four requests in a row for `ratelimit@example.test`, an address with no account. | The first three read the confirmation sentence; the fourth reads "Too many password reset requests. Try again in 15 minutes.". The limit counts an address whether or not it holds an account, so it reveals nothing either. Ten requests from one network address within 15 minutes are the other limit: if testers share an address and the first request is already refused, wait 15 minutes and repeat. | | |

## B. Organizations and members

### B1. The creator is the owner and sees only their own organizations

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the private window, signed in as the Newcomer, create the organization **Sankofa Gold plc**. | The GHG home lists only this organization. | | |
| 2 | Open it, then open **Settings** from the sidebar. | **Settings** is the last entry in the sidebar, under a divider, with a gear. The page lists the Newcomer under **Members** with the role OWNER. | | |

### B2. An outsider gets nothing

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Copy the organization's URL from the private window. | | | |
| 2 | In a third context (or the normal window signed in as the Analyst), open that URL. | A not-found state. The Analyst's GHG home says there are no organizations yet. | | |

### B3. Adding members by email

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the Newcomer, on **Settings**, add the Analyst's email with the role **PREPARER** and the Auditor's email with the role **VERIFIER**. | The two members appear with their roles, and **History** at the foot of the page lists two "Member added" entries at once, without a reload. | | |
| 2 | Add `nobody@example.test`. | Refused under the field with "No account with that email. Ask a platform administrator to add the user first." The typed address stays in the field. | | |
| 3 | Add the Analyst a second time. | Refused as already a member. | | |

### B4. A preparer works but cannot publish

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | In the normal window, sign in as the Analyst. Open Sankofa Gold plc. | The organization opens. The foot of the sidebar reads "Your role: Preparer". | | |
| 2 | Add the facility **QA scratch site**, record one activity on it ("QA scratch diesel", 100 litre, any date in 2025), create the inventory **QA scratch** (2025, operational control) and freeze it. | Every write succeeds. | | |
| 3 | Launch a run (allowed for a preparer). | The run launches. | | |
| 4 | Look at **Mark as final** on the run. | The button is disabled with the tooltip "Needs the Reviewer or Owner role." (spec 05.5; a direct request is refused with "This action needs the REVIEWER or OWNER role in the organization."). **Publish** stays disabled ("Designate a final run first") until a run is final, so a preparer never reaches it. | | |
| 5 | Open **Settings** from the sidebar. | It opens on **Baseline and targets**, the only tab: there is no **Organization** tab, so no details, members, history or danger zone. A preparer does not administer the organization, but does keep the base year. | | |

Procedure 2 removes these three scratch objects before it builds the
scenario, so keep the names.

### B5. A verifier reads everything and changes nothing

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | Sign in as the Auditor in another context and open the organization. | The organization opens. The foot of the sidebar reads "Your role: Verifier". | | |
| 2 | Open the facility, the activity data and the inventory, including the run page of B4. | Every page opens, and each carries the banner "Your role in this organization is Verifier (read-only)." | | |
| 3 | Look at the activity register. | There is no **+ Add activity** and no **Import CSV**. Opening a record opens the drawer in read mode: facts, evidence and history, no fields and no **Save**. | | |
| 4 | Look at the legal entities, facilities, emission factors and units pages. | The add, edit and remove controls are either absent or disabled with the tooltip "Needs the Preparer, Reviewer or Owner role." | | |
| 5 | Look at the inventory page. | **Launch calculation run** is disabled with the tooltip "Needs the Preparer, Reviewer or Owner role."; **Mark as final** and **Publish** are disabled with "Needs the Reviewer or Owner role." | | |
| 6 | On the GHG home, look at the organization card. | It offers **Open** and nothing else: administering an organization is the **Organization** tab of its owner's **Settings** (spec 01.7), and a verifier has no link to it. In the sidebar, **Settings** opens on **Baseline and targets** only. **New organization** stays available, because anyone may create their own. | | |

Exports are checked in procedure 7.

### B6. Roles change, the last owner stays

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the Newcomer, change the Analyst's role to **REVIEWER**. | The role change applies at once and silently (no toast; the Analyst can now designate a final run). The Newcomer's sidebar reads "Your role: Owner"; the Analyst's reads "Your role: Reviewer" once their page reloads. | | |
| 2 | Try to remove yourself. | Refused with "'Sankofa Gold plc' needs at least one owner.". | | |
| 3 | Try to change your own role to PREPARER. | Refused with the same message. | | |

### B7. Every act is attributed

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the Newcomer, open the inventory the Analyst created and scroll to **History**. | The Analyst's email is on the freeze and on the run launch (the two inventory acts B4 performed); the Newcomer's email is on nothing they did not do. | | |

### B8. A platform administrator is an outsider until they assume support access

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the admin, open the GHG home. | Sankofa Gold plc is not listed: the admin is not one of its members. | | |
| 2 | Paste the organization's URL into the address bar. | A not-found state, the same one an outsider gets. | | |
| 3 | Open **Organizations** from the admin header (`/admin/organizations`). | Sankofa Gold plc is listed with the Newcomer's email under Owners and its member count. No facility count, no totals, no inventory names. | | |
| 4 | Click **Assume access** and submit with the reason `short`. | The button stays disabled until the reason is at least 10 characters. | | |
| 5 | Type `ticket 4512, preparer cannot open the run` and confirm. | A toast confirms the access. The row shows the expiry and an **End access** action. | | |
| 6 | Open the GHG home. | Sankofa Gold plc is now listed with a **Support access** badge and opens. | | |
| 7 | Open the activity register, then legal entities, then inventories. | Every page carries a banner naming Sankofa Gold plc, saying you are inside under support access, giving the moment it expires, and saying every act is recorded in the organization's history. It is not only on the overview. | | |
| 8 | On the organization, classify one record or change the header. | The act succeeds. | | |
| 8a | Open **Legal entities**, edit Sankofa Gold plc, type `GH` as its jurisdiction, and save. | Saved. The relationship column reads "Reporting company". | | |
| 9 | Open the organization overview and read the **Support access** card. | It names the admin's email, the time the access was taken, the reason, and the expiry. The history of grants is on the **Organization** tab of **Settings**, which support access does not open. | | |
| 10 | Look at the sidebar, and at the organization's card on the GHG home. | There is no **Settings** link on the card. The sidebar's **Settings** opens on **Baseline and targets** with no **Organization** tab, even when `/settings` is typed: support access never grants membership changes or deletion. The foot of the sidebar reads "Support access" where a member's reads their role. | | |
| 10a | If you can alter requests, send a new name for the organization (`PUT /api/ghg/organizations/{id}`). | Refused with 403: "This action needs the OWNER role in the organization.". The organization's details are Settings, which support access never carries. | | |
| 11 | Back on `/admin/organizations`, click **End access**. | The GHG home no longer lists Sankofa Gold plc. | | |
| 12 | Paste the organization's URL again. | Not found, and the page says support access ends on its own when its window expires and that an administrator holds no standing access without a grant. It does not say the organization may have been deleted. | | |
| 13 | As the Newcomer, open **Settings** and read **History**. | It lists "Support access assumed" and "Support access ended", each with the admin's email, the moment and the reason, and between them "Legal entity edited" with the admin's email and "Sankofa Gold plc: jurisdiction none → GH (under support access)". | | |

### B9. An organization is not deleted while it has a published record

| Step | Action | Expected result | Pass/Fail | Notes |
| --- | --- | --- | --- | --- |
| 1 | As the Newcomer, create the throwaway organization **QA tombstone**. | It is created and the Newcomer is its owner. | | |
| 2 | Open it, then **Settings**, and under **Danger zone** click **Delete organization**. | The dialog asks for the organization's name typed exactly and a reason, and **Delete** stays disabled until both are given. | | |
| 3 | Type `qa tombstone` (lower case) and a reason of 10 characters or more. | **Delete** stays disabled: the name must match exactly. | | |
| 4 | Correct the name to `QA tombstone` and confirm. | The organization disappears from the list, and its URL is not found. | | |
| 5 | Create **QA tombstone** again. | Accepted: a removed name is released for reuse. Delete it again the same way. | | |
| 6 | On **Settings** for Sankofa Gold plc, whose inventory procedures 7 and 8 publish, click **Delete organization**. | Once an inventory of it is published or final, the dialog lists it (for example "QA scratch: Published") and refuses with "Publish records are kept: withdraw the final designation or supersede the published inventory first." Skip this step on a first pass, before anything is published. | | |

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals** (do not report as bugs): single sign-on, email
invitations to people without an account, rate limiting on the
access-request form, restoring a deleted organization, an email to the
owners when support access is assumed, a support window other than 24
hours, an owner revoking an administrator's active grant, and the limit of
five password changes per 15 minutes (the development team covers it).

## Change notes

- **Version 2, 2026-09-29.** Password reset is no longer a non-goal:
  cases A9 to A12 change a password on the profile and reset a forgotten
  one (spec 01.9, PR #123), and the Newcomer signs in with
  `Newcomer-reset-2026` after A10. The sidebar's "Your role" line (B4 to
  B6, B8), the History card refreshing after **Add member** (B3), a
  structure change recorded under support access and the refused edit of
  the organization's details (B8, PRs #119 and #121).
