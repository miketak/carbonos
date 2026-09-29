---
owner: miketak
last_reviewed: 2026-09-28
description: Ask for a CarbonOS account from the landing page, read what the confirmation promises, and learn who approves the request and what arrives when they do.
role: Anyone
minutes: 3
---

# Request access

An access request is how an account starts: you leave your name and work email on the landing page, and a platform administrator at ECORIV approves or denies it. Approval brings an email with a link to set your password.

<!-- sources: tasks/account/request-access-and-set-your-password.md (verified 2026-09-27); specs 01.1, 01.2; LandingNav.tsx and ClosingSection.tsx (the buttons); intent.ts (form titles, notes and confirmations); RequestAccessModal.tsx (labels, "How access works"); DuplicateAccessRequestException.java; AccessRequestService.java (the 7-day token, the account created on approval); AccessRequestEmails.java (the approval and denial emails); AccessRequestsSection.tsx (what the administrator reads); AdminLayout.tsx (Access requests, Users) -->

## Before you start

- You have no CarbonOS account and no request waiting. One email address holds one or the other, never both.
- You know which organization you will work in. An owner adds you to it once your account exists.

## Send the request

1. Open CarbonOS. The landing page carries **Sign in** and **Request access** in the top bar; on a phone, the menu holds them. Click **Request access**.
2. Read the note: "Leave your details and we set up your organization. We usually reply in 48 hours." Its link **How access works** opens this page.
3. Fill **Full name** and **Work email**. The email becomes your sign-in name and receives the link.
4. Fill **Company (optional)** and, when the reviewer should know something, **Anything we should know? (optional)**, up to 1,000 characters.
5. Click **Request access**.

What you see: the dialog **Request received** reads "Thanks, *name*. Your request is with our team. Once it is approved you will get an email with a link to set your password at *email*." Click **Done**.

When an account or a waiting request already carries the email, the form refuses with "An account or pending request already exists for '*email*'." Sign in instead, or wait for the earlier decision.

## The landing page's other buttons

**Ask about the pilot**, **Request a licence** and **Talk to ECORIV** open the same form under their own title, with the button **Send** or **Request a licence**. They send the same request, marked with what you asked for, and ECORIV usually replies in 48 hours by email. The administrator reads the mark next to your name: "Asked about the pilot", "Asked for a licence" or "Wants to talk to ECORIV".

## What happens next

A platform administrator reads the request under **Access requests** in the administration console. Approval creates your account at once, pending its password, and sends the email "Your CarbonOS access is approved": "Set your password to activate your account (the link is valid for 7 days)". Open the link within 7 days and follow [Set your password and sign in](set-your-password-and-sign-in.md). A denial sends the email "Your CarbonOS access request", which says that you are welcome to request access again.

An administrator can also create your account directly under **Users**, with a temporary password handed to you out of band; sign in with it.
