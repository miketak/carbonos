---
owner: miketak
last_reviewed: 2026-09-29
description: Ask for a reset link from the sign-in page, choose a new password within the hour, and read what a used, expired or refused link means.
role: Anyone
minutes: 3
---

# Reset a forgotten password

A reset link replaces a password you no longer know. Ask for one from the sign-in page; a platform administrator can also send you one from **Users**. Either way the email is "Reset your CarbonOS password".

<!-- sources: spec 01.9; LoginPage.tsx ("Forgot your password?", the notice after a reset); ForgotPasswordPage.tsx and ResetPasswordPage.tsx (labels, confirmation, refusals); passwordApi.ts (the rule); PasswordService.java (1 hour, single use, only an active account gets a link, other links voided, every session ended); InvalidResetLinkException.java and PasswordRateLimiter.java (the refusals and limits); PasswordEmails.java (the two emails); PasswordApiIntegrationTests.java -->

## Before you start

- Your account is active: you have signed in before. An account still waiting for its first password uses the link in its approval email instead; see [Set your password and sign in](set-your-password-and-sign-in.md).
- You can read the mailbox of the email you sign in with.

## Ask for a reset link

1. On the sign-in page, click **Forgot your password?**
2. On **Reset your password**, fill **Email** with the address you sign in with.
3. Click **Send reset link**.

What you see: "If *email* belongs to an active CarbonOS account, a reset link is on its way. The link is valid for 1 hour and works once." The page reads the same whether or not the address has an account, so it tells nobody who uses CarbonOS. Only an active account gets the email. More than three requests for one address, or ten from one network address, within 15 minutes are refused with "Too many password reset requests. Try again in 15 minutes."

## Choose the new password

1. Open the link in the email within the hour. The page **Choose a new password** reads "Choose a new password for *email*."
2. Fill **New password**: "At least 12 characters, with a letter and a digit."
3. Fill **Confirm password** with the same value. A difference is refused with "Passwords do not match."
4. Click **Set new password**.

What you see: the sign-in page with "Your password is reset. Sign in with your new password." Sign in with it. Every session of your account, on any device, is signed out, and every other reset link you asked for stops working. CarbonOS emails you "Your CarbonOS password was changed".

## When the link is refused

The page shows the reason, then "Ask for a new link and use the latest email." and the button **Ask for a new link**.

| You see | It means |
| --- | --- |
| "This reset link has already been used." | The link, or another link of your account, has set a password. |
| "This reset link has expired. Reset links are valid for 1 hour." | The hour is over. |
| "This reset link is not valid." | The link is incomplete or was never issued. Copy the whole link from the email. |

## If you did not ask

An email you did not expect changes nothing: your password stays until somebody uses the link. If "Your CarbonOS password was changed" arrives and it was not you, reset your password at once and tell a platform administrator.
