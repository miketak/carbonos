# Procedure 1: Access and roles

**Objective.** Confirm that a newcomer can get an account through the
request flow, that an owner can add them to an organization with a role,
and that each role can do exactly what it allows and nothing more.

**Covers** [spec 01](../../specs/01-identity-and-access.md),
[spec 01.1](../../specs/01.1-access-requests.md) and
[spec 01.2](../../specs/01.2-organization-membership-and-roles.md).

**Estimated time:** 60 minutes.

**Run this procedure** before a release, and after any change to the `user`
or `mail` module, the members card, or the role checks in `ghg`.

## Prerequisites

- The ADMIN account and its password.
- Three fresh email aliases you can read: call them **Newcomer**,
  **Analyst** and **Auditor**.
- The normal window for the admin, the private window for the others.

Token expiry (the seven-day limit on set-password links) cannot be tested
on staging. The development team covers it.

## A. Request access

### A1. A visitor requests access

1. In the private window, open the app signed out and click **Request access**.
2. Enter a name, the Newcomer alias and a company. Submit.

**Expected result:** a confirmation state. Submitting the same form again
is refused as a duplicate, with the same wording whether the address has a
request or an account (no user enumeration).

Verdict: ☐ pass ☐ fail. Notes:

### A2. The admin approves and the account appears at once

1. In the normal window, sign in as the admin and open the access requests.
2. Approve the Newcomer's request.
3. Open the Users list.

**Expected result:** a toast confirms the approval and the setup email;
the request leaves the queue (the card lists pending requests only, so it
reads "No pending requests"). The Users list already lists the Newcomer
with the state **Pending activation**.

Verdict: ☐ pass ☐ fail. Notes:

### A3. A pending account cannot sign in

1. In the private window, try to sign in with the Newcomer alias and any
   password.

**Expected result:** sign-in is refused.

Verdict: ☐ pass ☐ fail. Notes:

### A4. The password rule is shown and enforced

1. Open the link from the approval email in the private window.
2. Try `shortpass1`, then `twelveletterslong`, then `123456789012`.

**Expected result:** the page states the rule before you type: at least 12
characters, with a letter and a digit. Each attempt is refused with an
inline message. The link is `https://frontend-staging-2e61.up.railway.app/set-password?token=…`,
never localhost or production.

Verdict: ☐ pass ☐ fail. Notes:

### A5. Setting the password activates the account

1. Enter `Newcomer-pass-2026` twice and submit.
2. In the normal window, refresh the Users list.

**Expected result:** the Newcomer lands in the app signed in. The loader
that plays after sign-in shows the wordmark, a progress bar and "Loading
your workspace"; it makes no claim about verifying or calibrating
anything, and a click skips it. The Users list now shows the account
**Active**.

Verdict: ☐ pass ☐ fail. Notes:

### A6. The link is single-use and a bad token looks the same

1. Open the emailed link again in a fresh tab.
2. Open `/set-password?token=` followed by 64 zeros.

**Expected result:** both show the same "This link is invalid or has
expired." state with a way back to the landing page.

Verdict: ☐ pass ☐ fail. Notes:

### A7. Admin-created accounts follow the same rule

1. As the admin, create a user for the Analyst alias with the password
   `short1`.
2. Repeat with `Analyst-pass-2026`.

**Expected result:** the first is refused with the password rule under
the field ("At least 12 characters, with a letter and a digit."); the
second creates the account. Repeat for the Auditor alias with
`Auditor-pass-2026`.

Verdict: ☐ pass ☐ fail. Notes:

## B. Organizations and members

### B1. The creator is the owner and sees only their own organizations

1. In the private window, signed in as the Newcomer, create the
   organization **Sankofa Gold plc**.
2. Open its overview.

**Expected result:** the overview lists the Newcomer under **Members** with
the role OWNER. The GHG home lists only this organization.

Verdict: ☐ pass ☐ fail. Notes:

### B2. An outsider gets nothing

1. Copy the organization's URL from the private window.
2. In a third context (or the normal window signed in as the Analyst), open
   that URL.

**Expected result:** a not-found state. The Analyst's GHG home says there
are no organizations yet.

Verdict: ☐ pass ☐ fail. Notes:

### B3. Adding members by email

1. As the Newcomer, on the members card, add the Analyst's email with the
   role **PREPARER** and the Auditor's email with the role **VERIFIER**.
2. Add `nobody@example.test`.

**Expected result:** the two members appear with their roles. The unknown
address is refused with "Account nobody@example.test was not found." Adding
the Analyst a second time is refused as already a member.

Verdict: ☐ pass ☐ fail. Notes:

### B4. A preparer works but cannot publish

1. In the normal window, sign in as the Analyst. Open Sankofa Gold plc.
2. Add the facility **QA scratch site**, record one activity on it
   ("QA scratch diesel", 100 litre, any date in 2025), create the inventory
   **QA scratch** (2025, operational control) and freeze it.
3. Launch a run (allowed for a preparer), then click **Mark as final**
   on it. Note that **Publish** stays disabled ("Designate a final run
   first") until a run is final, so a preparer never reaches it.

Procedure 2 removes these three scratch objects before it builds the
scenario, so keep the names.

**Expected result:** every write in step 2 succeeds and the run launches.
Step 3 is refused with "This action needs the REVIEWER or OWNER role in
the organization.".

Verdict: ☐ pass ☐ fail. Notes:

### B5. A verifier reads everything and changes nothing

1. Sign in as the Auditor in another context and open the organization.
2. Open the facility, the activity data and the inventory; try to record
   an activity and to change the inventory.

**Expected result:** every page opens, including the run page of B4. The
buttons are still shown; each write is refused on submit with "This
action needs the PREPARER, REVIEWER or OWNER role in the organization."
(Exports are checked in procedure 7.)

Verdict: ☐ pass ☐ fail. Notes:

### B6. Roles change, the last owner stays

1. As the Newcomer, change the Analyst's role to **REVIEWER**.
2. Try to remove yourself, then try to change your own role to PREPARER.

**Expected result:** the role change applies at once and silently (no
toast; the Analyst can now designate a final run). Both attempts on the
last owner are refused with "'Sankofa Gold plc' needs at least one
owner.".

Verdict: ☐ pass ☐ fail. Notes:

### B7. Every act is attributed

1. As the Newcomer, open the inventory the Analyst created and scroll to
   **History**.

**Expected result:** the Analyst's email is on the freeze and on the run
launch (the two inventory acts B4 performed); the Newcomer's email is on
nothing they did not do.

Verdict: ☐ pass ☐ fail. Notes:

### B8. Platform administrators keep oversight

1. As the admin, open the GHG home.

**Expected result:** the admin sees every organization and can open
Sankofa Gold plc; its overview's **Members** card reads "Your role:
ADMIN" although the admin is not listed as a member.

Verdict: ☐ pass ☐ fail. Notes:

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals** (do not report as bugs): single sign-on, password reset
for existing users, email invitations to people without an account, rate
limiting on the public form.
