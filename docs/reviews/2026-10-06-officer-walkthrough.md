---
owner: miketak
last_reviewed: 2026-10-06
---

# CarbonOS: GHG officer review (third engagement walkthrough)

Reviewers: six certified GHG inventory practitioners (Corporate Standard, Scope 2 Guidance, Scope 3 Standard, ISO 14064-1), each walking one slice of the product at the same time, as a prospective customer, through the UI only. I led the walk and consolidated the six sets of notes; I wrote the two earlier reports, and "I" below is the engagement's voice.

Date: 6 October 2026, from about 07:05 to 11:30 local time. App: a local production build of main at 9813af8 (release v0.9.0 plus the import page, the activity register round two, the factor caveat and check note, and the sign-off workflow) at http://localhost:5173, on a clean database holding only the factor catalogue and one platform administrator, with the QA hooks switched off, driven with Playwright and headless Chromium; every email went to a local Mailpit. ECO-44 named the qa environment, but qa still ran v0.9.0, which lacks half the scope, and the console tests publish and withdraw factor pack editions that would reach every tester's organization there, so the walk ran locally.

Method: each task started from the help centre, as a customer would use it, and followed the article literally; the engineering specs were a last resort and every use of them counts as a help gap (there was one in the whole walk); no code was read and no state was changed except through the screens. Screenshot names in the Evidence lines refer to the capture folders of the walkthrough session; they are not stored in the repository. Each Evidence line ends with the ids of the reviewer notes it draws on, so every finding traces to its notes.

The factor catalogue ships DESNZ 2025, DESNZ 2026 and the Ghana pack by decision (spec 02.9, 15 September 2026). The brief named the publications of the 11 September catalogue in error, so the absence of the other packs is not a finding; its consequence for the stated markets is (F92).

Scenarios and organizations:

- A1, data in: "Asante Gold Resources (A1)" (ORG-0001), the Ghanaian gold miner of the earlier engagements, FY2025, operational control, AR5; seven legal entities, six facilities, 27 emission sources; the DESNZ 2025, DESNZ 2026 and Ghana packs; 67 records (41 from a workbook that matches a CSV, zero-rule files, monthly template files and hand entries); FY2025 frozen and run twice.
- A2, results out: "Asante Gold Resources (A2)" (ORG-0002), the same miner with a sole owner; 48 imported records; FY2024 (published, base year) and FY2025 (published) under operational control, with a PPA, I-RECs, a failing guarantee of origin and a well-to-tank rule; an equity-share AR6 copy; corrections of both years; a scratch organization deleted.
- B, sector fit and scale: "Akwaaba Energy (B)" (ORG-0003), a Ghanaian oil marketer (a fuel depot, a lubricants plant on purchased steam and hot water, a head office on district cooling, 85 retail stations of which 60 are franchised, a 20% LPG terminal stake, sold fuels and the downstream categories), FY2025, operational control, AR5; a 2,575-row monthly file for the volume test.
- C, the platform: two factor maintainers and the owner of "Kumasi Cement Works (C)" (ORG-0006), a cement grinding plant, FY2025 and FY2026, operational control, AR5; a factor family of C's own in three editions (one on AR6, one erratum later withdrawn), support access, platform settings and two scratch organizations.
- D, people and sign-off: "Gye Nyame Gold (D)" (ORG-0004), the help's worked example built by following Get started literally, with an owner, a preparer, a reviewer and a verifier in separate browsers; "Solo Assay Services (D)" (ORG-0007), a sole member.
- E, the help centre: the whole help read as a signed-out newcomer and as a practitioner, 25 bank questions and ten of E's own by hub and by search, and 25 task articles followed in "Help Check (E)" (ORG-0005), from an empty account to a published Run 001, a base year and a correction.

## 1. Verdict

I would put a client on CarbonOS today for an operational-control Scope 1 and Scope 2 inventory, with Scope 3 categories 1, 3, 5, 6 and 7, with a practitioner beside them and on three conditions: every emission source the import creates is checked and given its kind before anything is classified; no inventory is deleted, and the Reviewer role is given knowingly, until deleting an inventory with runs is refused; and no restatement of a published base year is promised. The two changes a verifier would have tested first on 11 September are done: the emissions-by-gas table foots to the total with a row for CO2e-only factors and pro-rated gas masses, and the equity-share copy rebuilds its boundary from Table 1 and applies Appendix F again. The PDF is a reader's document; a platform administrator reaches a client only through a logged, time-boxed grant the owner sees; an organization with a published inventory cannot be deleted; and the sign-off separates the preparer from the approver, records every withdrawal and prints a self-approval in the report header and the PDF. The import page, the documented zero, the bulk acts and the console's publication rules are sound, and every line the six reviewers recomputed reproduces from the factors the product displays.

What stands in the way is three Blockers and a set of controls behind them. A source created in the import preview defaults to "Stationary combustion", so grid electricity classified with the Ghana grid factor landed in Scope 1 and both Scope 2 totals printed zero, with no gate (F17). One click on "Delete" in the inventories list, by a Reviewer, hard-deleted an inventory with its runs and a run in review, and no history records it (F84). A published base year cannot be recalculated: the correction's run is refused, "RECALCULATED" records the original figure, and an acquisition never raises a structural change (F81, F80). Behind them, the by-gas table foots but misattributes, because the derived Ghana loss factor prints as CO2 and five DESNZ "Kyoto protocol products" rows print as HFCs; a steam contract is applied to electricity in the market-based total; a run on superseded facts or an older boundary version can be signed off; a disabled account keeps its open sessions; base-year acts under support access leave no trace; a franchise network and an investment cannot reach categories 14 and 15; the factor console lets the approver edit what they publish and loses an adoption's record once it is decided; and at 2,575 monthly rows the import's 211 source decisions froze the tab and outlasted the session, with no bulk classification after it. The help is accurate at the task level but does not make a customer self-sufficient: it does not cover planning, Scope 3 screening, uncertainty, verification, franchises or the downstream categories, and it teaches the contractor default as a rule of the Standard. Fix the three Blockers and the Top 10, and the tool is ready for a limited-assurance engagement for a miner or a manufacturer; an oil marketer with franchised stations needs the Scope 3 work of item 8 as well.

## 2. Findings

### Stage A: accounts, roles, sign-off and support access

**F1. A temporary password set by the platform team never has to be changed, and only one of four reviewers saw a confirmation after changing a password.**

- Severity: Minor. Area: Sign in; Administration > Users > Add user; Edit profile > Change password.
- What I did: Signed in with the temporary passwords the platform team set with "Add user" (A1, A2, B, D's reviewer, E's officer) and changed each on Edit profile with "Current password", "New password" and "Confirm new password".
- What happened: Sign-in went straight to "No organizations yet"; nothing asked for a new password, and the help says only "sign in with it, then change it on your profile". On the change, D saw "Password changed. Your other sessions are signed out." and the email "Your CarbonOS password was changed"; A1, A2 and B saw the three fields clear and nothing else, and proved the change only by signing in again. I cannot resolve the conflict from the notes: A2's harness also missed other toasts in its session ("Name added.", "Base year 2024 designated."), so the toast may show too briefly to catch. Forced rotation is a stated non-goal of the identity spec.
- Why it matters: The platform team knows a password it shared out of band, so the acts recorded before the change are not reliably attributable to one person (ISO 14064-1:2018 clause 8.2; a verifier's IT-controls enquiry under ISO 14064-3).
- What to do: Require a change at the first sign-in with an administrator-set password, or expire it after first use; keep the confirmation on the form until the user leaves it.
- Evidence: shots/001-officer-a1-01-change-password.png (A1-01, A1-02, A2-30, D-10; B's Help log).

**F2. An owner cannot bring a colleague in alone: an email with no account is now refused on screen, but the message sends the owner to a page owners do not have, and only the platform team can create accounts.**

- Severity: Minor. Area: Settings > Members; Request access; Administration > Users.
- What I did: As the owner of Gye Nyame Gold (D), added preparer@d.gng.test, who had no account yet, as "Preparer (records, classifies, runs)", then followed "Add members and assign roles" for a preparer, a reviewer and a verifier with no accounts (D).
- What happened: An alert under the form: "No account with that email. Add the user under Manage users first. Ask a platform administrator to add them." (rule "ghg.account.not-found"); the silent failure of 11 September is gone. The console page is called "Users" and an owner cannot open it, and the help quotes the message without its last sentence. The preparer had to request access and wait for the platform team ("We usually reply in 48 hours."); the reviewer and the verifier had to be created by the platform team with a temporary password shared out of band. Members has no invitation by email.
- Why it matters: Usability rather than a standards point: an organization cannot staff its own segregation of duties (Corporate Standard ch. 7) in the reporting crunch without a support ticket.
- What to do: Reword to "No CarbonOS account uses that email yet. Ask your colleague to request access from the sign-in page, or ask ECORIV to add them; then add them here." and update the help's quote; consider an owner's invitation by email that creates a pending account bound to the organization and the role.
- Evidence: 009-owner-D-11-add-member-no-account.png (D-08, D-09).

**F3. The post-sign-in splash reads "MEASURE. CERTIFY. SUSTAIN."**

- Severity: Minor (regression). Area: Post-sign-in splash.
- What happened: Captured during sign-in: "CarbonOS / MEASURE. CERTIFY. SUSTAIN." On 11 September it was the neutral "Loading your workspace. Click or press any key to skip."
- Why it matters: The product certifies nothing; verification is by an accredited third party (ISO 14064-3, ISO 14065). A client may read "certify" as an assurance claim, which is what the first engagement's F3 removed.
- What to do: Return to the neutral loader, or drop "certify".
- Evidence: splash text captured in session A1/splash (A1-43).

**F4. Roles hold and the sign-off separates preparation from approval: the submitter cannot sign, a named preparer and approver are enforced, a return needs a reason, every withdrawal leaves a history line, and a sole member's self-approval is disclosed everywhere it should be.**

- Severity: none (positive). Area: Inventory title row and Runs tab; Sign-off card; report header; PDF.
- What I did: With an owner, a preparer, a reviewer and a verifier in four browsers, submitted, returned, resubmitted, named a preparer and an approver, tried each act from the wrong seat, ran the three withdrawal routes and signed Run 003 off (D); signed off alone in two sole-member organizations (A2, D).
- What happened: The verifier gets "Your role in this organization is Verifier (read-only)." and every write control disabled; "Mark as final" and "Publish" are closed to the preparer. "Return the inventory to the preparer?" needs a reason ("Inventory returned to the preparer."). The submitter's "Mark as final" reads "You submitted this run; another reviewer or owner signs it off." The Approver list offers only owners and reviewers; once named, other members are refused with "Yaw Boateng (D reviewer) is this inventory's approver; only they return it or sign it off." (rule "ghg.inventory.not-the-approver") and "Ama Mensah (D preparer) is this inventory's preparer; only they submit it for review." (rule "ghg.inventory.not-the-preparer"). The history reads "submission of run 1 withdrawn: the inventory was reopened as a draft", "submission of run 1 withdrawn: run 2 launched after it", "submission of run 2 withdrawn: run 2 was voided" and "run 3 signed off and designated final: ...". The PDF prints "Prepared by Ama Mensah (D preparer) (preparer@d.gng.test), run 3, 6 October 2026, 16:42 UTC: ...". "Mark as final" opens a dialog with "Review note (optional)". A sole member reads "Nobody else in the organization may approve, so your sign-off of the run you submitted is recorded as a self-approval, and the report says so." in the dialog, "(self-approved: nobody else in the organization could check it)" in the lifecycle panel, and "Approved by Kwame Ofori (D solo) (solo@d.gng.test), run 1, 6 October 2026; self-approved: nobody else in the organization could check it" in the header and the PDF; D's solo total, 34.6 t, is 13,000 litre x 2.66155 kg/litre.
- Why it matters: Corporate Standard ch. 7 (review and approval) and ISO 14064-1:2018 clause 8 (traceable records); this is the separation an ISO 14064-3 verifier tests first, and where no independent review was possible the report says so. It closes old F1, F2 and F43.
- Evidence: 004-preparer-D-15-preparer-reopen-dialog-in-review.png, 012-owner-D-25-owner-not-named-mark-final.png, 004-reviewer-D-26-reviewer-submitter-mark-final-disabled.png, 007-reviewer-D-29-final-run003.png, 002-solo-D-31-solo-mark-final-dialog.png, 004-solo-D-33-solo-report-header.png, a2-011-fy2025-mark-final-dialog.png, a2-012-fy2025-final-lifecycle.png (D-16, D-21, A2-19; D's retest of old F2).

**F5. A control disabled by role or by the selection never shows its reason to a sighted user, "Publish" names the state rather than the role, and a member who is not the named approver still sees enabled controls.**

- Severity: Minor. Area: Inventory title row and Runs tab; Activity data selection footer.
- What I did: Hovered the disabled controls as the preparer and as the verifier; after naming a preparer and an approver, used the owner's controls (D). Ticked four records, one of which already had a source, and looked at "Assign emission source" (A1).
- What happened:
    - Every role-gated control carries a title such as "Needs the Reviewer or Owner role." on a button styled `disabled:pointer-events-none`, so the pointer lands on the parent span and no tooltip appears; the same text exists only as screen-reader text, and a disabled button takes no keyboard focus. The help promises "A button that needs a higher role is disabled with a tooltip". The Sign-off "Preparer" and "Approver" selects and the "Run label" field stay editable for the preparer and the verifier while their buttons are disabled.
    - "Publish" gives the preparer and the verifier "Submit a run for review and have it marked final first" and "Mark the submitted run as final first", which is the state, while the help's matrix says their role may never publish.
    - After the naming, the owner's "Return to preparer", "Mark as final" and "Submit for review" stayed enabled; each dialog accepted a note and then showed the server's refusal.
    - "Assign emission source" was disabled with its reason only in a title ("Select records at one facility with no emission source."), so nothing named ACT-0032 as the record that blocked it, while the help describes a refusal that "lists the records that refuse it by number".
- Why it matters: The controls hold (F4); the explanation does not, although the landing page promises "When the product refuses an action, the screen says why and names the role that can do it."
- What to do: Show the reason visibly (a focusable wrapper with a tooltip, or a line of text under the row), check the role before the state, disable controls for everyone but the named person, and disable the fields whose save the role cannot use; for the bulk act, refuse in the dialog and name the record.
- Evidence: 003-preparer-D-14-preparer-mark-final-hover.png, 003-verifier-D-18-crop.png, 004-verifier-D-19-verifier-runs-tab.png, 012-owner-D-25-owner-not-named-mark-final.png, shots/012-officer-a1-12-bulk-assign-disabled.png (D-12, D-13, D-20, A1-23).

**F6. A run computed on a superseded boundary version can be submitted and signed off as final while a newer run on the current version exists, and its chip then reads "FINAL · BOUNDARY v2".**

- Severity: Major. Area: Runs tab ("Submit for review" and "Mark as final" on an older run).
- What I did: After the owner reopened FY2025, refroze it as boundary version 2 and launched Run 003, the preparer submitted Run 001, computed on version 1, and the reviewer marked it final (D).
- What happened: "Run 001 submitted for review." with the chip "IN REVIEW · BOUNDARY v2"; the sign-off dialog showed only "Run #001 (86,428.43 t CO₂e) becomes this inventory's final run ..."; then "Run 001 designated final." and "FINAL · BOUNDARY v2". Only section 01 gives it away: "Boundary version 1 of 2 ... reopened 06/10/2026, 16:36:50 by owner@d.gng.test". On the first FY2025, Run 001 (without the late record ACT-0008) still offered "Submit for review" after Run 002 (with it) existed. D withdrew the designation afterwards.
- Why it matters: The final run is the inventory's result, and the report and the base year attach to it. A run that predates a reopen can omit records added since, so signing it off understates the inventory against its own boundary (Corporate Standard ch. 1 completeness, ch. 7 review), and the chip misleads the approver. The landing page promises "A final run refuses known defects instead of warning about them."
- What to do: Offer "Submit for review" and "Mark as final" only on the latest non-voided run of the current boundary version, or refuse with a rule that names both versions; show the run's own boundary version in both dialogs and on the chip.
- Evidence: 005-reviewer-D-27-reviewer-mark-final-stale-run.png, 006-reviewer-D-28-run001-final-on-boundary-v1.png (D-17).

**F7. The sign-off dialogs leave out what the person acting needs to know: a reopen, a new run or a void withdraws someone else's submission without a word, a sole member is promised a second signer, and the approval prints a date with no time.**

- Severity: Minor. Area: "Reopen as a draft?", "Launch calculation run", "Void Run 002?" and "Submit Run 001 for review?"; the In review panel; report section 00; PDF.
- What happened:
    - With Run 001 in review, submitted by the owner, the preparer's "Reopen as a draft?" read only "The boundary and the activity view become editable again. Boundary version 1 stays on the record with your reason, and the next freeze cuts a new boundary version."; the history then gained "submission of run 1 withdrawn: the inventory was reopened as a draft". "Launch calculation run" started a run with no dialog while the preparer's Run 001 was in review, and "Void Run 002?" did not mention that Run 002 was in review. The help's reopen section does not say it either (D).
    - A sole member's submit dialog reads "A reviewer or owner other than you marks it final, or returns it with a reason." and the In review panel "A reviewer or owner other than the preparer marks it final, or returns it with a reason."; the self-approval appears only at "Mark as final" (A2, D).
    - "Approved by Yaw Boateng (D reviewer) (reviewer@d.gng.test), run 3, 6 October 2026" and "Final designated by reviewer@d.gng.test on 6 October 2026" carry no time in the PDF while "Prepared by" carries "16:42 UTC"; the history has the moment ("06/10/2026, 16:43:30: run 3 signed off") (D).
- Why it matters: The withdrawals are right and recorded (ISO 14064-1 clause 8 traceability), but the person causing one should know it; and the order of approval, publication and correction on one day is part of the trail a verifier reads from the issued report.
- What to do: When a run is in review, add "Run 001, submitted for review by Kofi Owusu on 6 Oct, will be withdrawn." to the reopen, launch and void dialogs; when nobody else may approve, say at submission that the sign-off will be a self-approval; print the approval time with its zone in the header and the PDF.
- Evidence: 004-preparer-D-15-preparer-reopen-dialog-in-review.png, 001-solo-D-30-solo-in-review-lifecycle.png, a2-006-fy2024-mark-final-dialog.png, downloads/1791305080817-gye-nyame-gold-d-org-0004-2025-run-3.pdf (D-14, D-18, D-22, A2-20).

**F8. Nobody is told when the work moves: a submission, a return, a withdrawal and a support-access grant send no email and show nothing on the other person's overview.**

- Severity: Minor. Area: Organization overview; inventory page; email.
- What I did: After each submission, return and withdrawal, read the other people's overviews and every Mailpit inbox (D); after an administrator took support access, checked the owner's mail and screens (C).
- What happened: Mailpit held only access, approval and password emails. The reviewer's overview read "Needs attention 0" and the FY2025 card "Run 002 · 2025-01-01 → 2025-12-31" with no state; only the Inventories list showed "IN REVIEW · BOUNDARY v2". After the return the preparer's inventory read "FROZEN · BOUNDARY v1", and the reviewer's reason appeared only as a History line at the foot of the Runs tab. For support access the owner's only mail was "Your CarbonOS password was changed"; the grant shows on the overview while it is live and as two history lines afterwards. The sign-off spec lists notifying the approver as open work (ECO-15).
- Why it matters: The four-eyes review stalls unless people tell each other outside the product, and an owner who does not open the overview during a short grant never learns that a vendor administrator held owner rights (F11, F12).
- What to do: Email the approver, or every reviewer and owner, on submission and the submitter on a return or a withdrawal; show "Waiting for your sign-off" on the overview; keep the return reason in the lifecycle panel until the next submission; email the owners when a support grant starts and ends, with its reason.
- Evidence: 002-reviewer-D-21-reviewer-inventories-list.png, 005-preparer-D-24-preparer-after-return.png; Mailpit listings (D-19, C-28).

**F9. A verifier cannot read the organization's history, so who changed an ownership share is invisible to the role the help says reads "everything ... and history".**

- Severity: Major. Area: Settings, as a Verifier; help "Add members and assign roles", "Check what your role may do", "Edit the organization's details and read its history".
- What I did: As the owner, changed a joint venture's share from 60% to 70%; added verifier@e.help.test as "Verifier (read-only)"; signed in as the verifier and looked for the change (E).
- What happened: Settings opened on "Baseline and targets" only, with no Organization tab and no History card, so "Help JV (E) Ltd: economic interest 60% → 70%, legal ownership 60% → 70%" and who made it are invisible; only the current 70% shows on Legal entities and in the boundary version. "Add members and assign roles" says a Verifier may "Read everything: records, evidence, inventories, runs, reports, exports and history."; the matrix in "Check what your role may do" answers "Edit the organization's details; read its history on Settings, Organization tab" with Owner "Yes" and the other three roles "No". The owner-only tab is a decision (spec 01.7), whose own example is the question it now hides from the verifier: "Someone changed a subsidiary's ownership share: who, and when?"
- Why it matters: A verifier must be able to trace the structural changes behind a boundary (ISO 14064-3, evidence of changes to the organizational boundary; Corporate Standard ch. 5). The help answers bank question q20 for a persona who cannot follow the answer.
- What to do: Let reviewers and verifiers read the History card, keeping details, members and deletion for owners; then make the role table, the matrix and "Read the history" say the same thing.
- Evidence: 001-verifier-verifier-settings-no-history.png (E-11).

**F10. A platform administrator who is not a member cannot open an organization; support access is a logged, time-boxed grant with a reason the owner sees, and platform settings keep every change with its reason.**

- Severity: none (positive). Area: GHG accounting; Administration > Organizations and Platform settings; organization overview and history.
- What I did: As an administrator with no membership, opened the GHG home and the organization's address, took support access with a reason, worked under the grant, ended it and tried the address again; set the support window from 24 to 23 hours and back with reasons, and probed the limits (C).
- What happened: Without a grant: "No organizations yet" and, at the address, "Organization not found ... a platform administrator holds no standing access without a grant." The grant needs a reason ("At least 10 characters; the owners read it."). Under it every page carries "You are in Kumasi Cement Works (C) (ORG-0006) under support access until 2026-10-07 16:58. Every act is recorded in this organization’s history."; Settings holds back the Organization tab; the owner's overview showed "Support access: approver@c.platform.test since 2026-10-06 16:58: Walkthrough ticket C-34 ... Until 2026-10-07 16:58."; the history recorded "Support access assumed" and "Support access ended"; an inventory act was marked "(under support access)". After "End access" the address answered "Organization not found" again. Platform settings refused 73 hours ("Support access lasts between 1 and 72 hours.") and a short reason ("Give a reason of at least 10 characters."), and "Every change" lists from, to, reason, author and time.
- Why it matters: ISO 14064-1:2018 clause 8.2 and a verifier's IT-controls enquiry: access to a client's inventory is by membership or by a logged, visible grant. It closes old F3; what a grant may do is F11 and F12.
- Evidence: shots/005-approver-36-approver-org-not-found.png, shots/006-approver-37-support-access-granted.png, shots/015-owner-38-owner-overview-support-card.png, shots/018-curator-42-platform-settings-history.png (C-26, C-33).

**F11. Base-year acts leave no trace in the organization's history: an administrator under support access changed the significance threshold and declined a recalculation candidate, and neither act, nor the owner's own threshold change, appears there.**

- Severity: Major. Area: Settings > Baseline and targets; Settings > History.
- What I did: Under a support grant, clicked "Edit policy", changed "Significance threshold (%)" from 1 to 5 and saved, then clicked "Decline" with a note on the candidate the owner's adoption had raised; as the owner, read the History and set the threshold back to 1 (C).
- What happened: Both acts went through. The policy form asked for no reason, and the page then read "5% of base-year emissions" with no name or date. The candidate turned "DECLINED ... Decided by approver@c.platform.test, 06/10/2026, 17:04:44 · Walkthrough test ..." without "(under support access)". The owner's History lists "Support access assumed" and "Support access ended" and nothing between them; the owner's own policy edit also asked no reason and left no line. The decline lifted the hold on "Submit for review".
- Why it matters: The recalculation policy and each recalculation decision are the company's chapter 5 decisions (Corporate Standard ch. 5; ISO 14064-1:2018 clause 6.4). The banner's promise that every act is recorded is not kept, and a verifier testing the policy cannot see that the threshold moved.
- What to do: Record every base-year act (policy edit, designation, withdrawal, candidate raised, recalculated, declined) in the History, with a required reason and the "(under support access)" mark.
- Evidence: shots/007-approver-39-support-edited-threshold.png, shots/008-approver-40-support-declined-recalc.png (C-27).

**F12. Support access can take the client's accounting decisions (mark a run final, publish, change the base-year threshold, decline a recalculation), and a preparer can take the base-year decisions alone.**

- Severity: Major. Area: Support access; Settings > Baseline and targets; help "What is support access?" and "Check what your role may do".
- What I did: Took the base-year acts under a grant (C); read the support-access concept and the role matrix (D, E); read the platform and sign-off specs to see whether this is deliberate.
- What happened: Under the grant the threshold change and the decline went through (F11). The help says "The grant gives an owner's rights, so support can record, classify, run, mark a run as final and publish for a client.", and the matrix gives support access "Yes" for "Publish; create a correction" and "Yes, but not final on a run support submitted" for "Mark a submitted run as final". C could not test a sign-off under the grant, because support had submitted the run and "Mark as final" was disabled. It is deliberate: the platform spec keeps marking final and publishing available under support access "so an administrator can still finish a run for a client who cannot", and the sign-off spec keeps it "until a client objects", while accepting a factor edition is already held back because it would put both sides of a decision "in one pair of hands". Separately, the matrix gives Owner, Reviewer and Preparer "Yes" for "Designate the base year, withdraw it, decide a recalculation candidate", while runs and hand-entered factors need a second person.
- Why it matters: The final designation and the publication are the responsible party's approval of its GHG statement (ISO 14064-1 clause 9; ISO 14064-3 relies on the responsible party's assertion; Corporate Standard ch. 7). A sign-off by the vendor's staff, recorded or not, is not management approval, and the reasoning that holds back an edition adoption applies to the base year too. A recalculation decision restates every later comparison (Corporate Standard ch. 5); leaving it to a preparer alone stops the product's maker-checker logic one step short of its most consequential decision (professional judgement: the standards do not say who approves). I treat this walk as the client objection the spec waits for. D rated the preparer point Minor; I judge it with the support point because the remedy is one.
- What to do: Under a grant, hold back "Mark as final", "Publish", "Create correction", "Edit policy", "Clear base year", "Record recalculated base" and "Decline", as adoption already is, and say so in the help; move base-year designation, withdrawal and candidate decisions to Reviewer and Owner, or apply the submit-and-sign pattern with a disclosed self-approval when nobody else can decide.
- Evidence: shots/007-approver-39-support-edited-threshold.png, shots/008-approver-40-support-declined-recalc.png; /help/access/what-is-support-access, /help/access/check-what-your-role-may-do (C-27, E-27, D-11).

### Stage B: organization set-up

**F13. Legal entities still reproduce Table 1 for all seven AGR entities, a dated acquisition feeds every inventory's membership window, and an edit to an entity is recorded in the history.**

- Severity: none (positive). Area: Legal entities; inventory boundary; Settings > History.
- What I did: Entered the seven AGR entities (A1, A2); recorded a joint venture acquired on 1 July 2025 and later changed its share (E); recorded franchisees at 0% and not operated (B).
- What happened: Equity, financial and operational shares: Nkawkaw 100/100/100; Obuom "50% through the chain" 50/50/100; Wassa 30/0/0; Tarkwa "(GH) · from 2025-07-01" 100/100/100; Kumasi 60/100/100; Ahafo 40/40/0; Bonsu 0/0/0 (A1). Tarkwa's "Acquired on" prefilled "Member from 2025-07-01" and seven pre-acquisition records were excluded as "Tarkwa Logistics Ltd: member from 2025-07-01" (A1); E's pre-acquisition record read "Excluded · Outside boundary". A franchisee at 0% and not operated reads "Franchise (GH) 0% 0% No not controlled 0% 0% 0%" (B). The history row for E's edit reads "Help JV (E) Ltd: economic interest 60% → 70%, legal ownership 60% → 70%". The IFRS 10 override was not re-probed.
- Why it matters: Corporate Standard ch. 3, Table 1, and ch. 5 (a structural change dated once and applied consistently).
- Evidence: shots/002-officer-a1-02-entities.png (A1-03, E-11, B-02; A1 retest of old F9).

**F14. Choosing the "Franchise" relationship keeps the form's defaults of 100% economic interest and "Operated by the company", which would consolidate a typical franchisee in full.**

- Severity: Minor. Area: Legal entities > Add legal entity.
- What I did: Added "Kumasi Road Dealers Ltd (franchisee)" and chose "Franchise (consolidated only with equity rights or control)" (B).
- What happened: "Economic interest (%)" stayed at "100" and "Operated by the company" stayed ticked; a new box "Financially controlled by the company" appeared unticked. Saved as it stood, the entity would read 100% under equity share and operational control; with 0% and the box unticked it reads right (F13).
- Why it matters: Corporate Standard ch. 3, Table 1: in most cases a franchisor has neither equity rights nor control over a franchise, so it is not consolidated and its emissions are the franchisor's Scope 3 category 14 (Scope 3 Standard ch. 5). The relationship's own label says "consolidated only with equity rights or control"; the defaults say the opposite.
- What to do: When "Franchise", "Associate" or "Fixed-asset investment" is chosen, reset the defaults to 0% and not operated, or clear them and require an answer.
- Evidence: shots/002-officer-entity-franchise-defaults.png (B-02).

**F15. An emission source cannot be edited: its kind, fuel, meter and contractor flag can only be removed and re-added, which is refused once records name it.**

- Severity: Minor. Area: Facilities > Emission sources.
- What I did: Registered 23 sources across six facilities and looked for a way to correct one (A1); found 19 sources the import had created with the wrong kind (A2, F17).
- What happened: Each source line offers only "Remove", which "is refused while records name it". The help ("Record facilities and emission sources", "What is an emission source?") describes adding and removing, never editing, yet "Edit the organization's details and read its history" says "editing a source is not recorded". A2 had to create correctly kinded sources and move 27 records to them one by one.
- Why it matters: The kind fixes the categories a record can take and the contractor flag its default scope (Corporate Standard ch. 4); a wrong flag found after the import cannot be corrected at the source, so every inventory has to override it record by record with a justification.
- What to do: Allow editing a source, with the change written to the organization history and a note that classified records keep their decisions until the next review refreshes them (F70).
- Evidence: facility source pages (A1-05, A1-47, A2-01).

### Stage C: activity data: the import page and the register

**F16. The import page reads a workbook exactly as its CSV, its control totals and the retained file's digest check out, a re-import is refused as duplicates, the decision cards map or create sources with the reason in the history, and the zero rules refuse an unexplained zero.**

- Severity: none (positive). Area: Activity data > Import; Source documents; Settings > History.
- What I did: Built agr-fy2025.csv and agr-fy2025.xlsx (real date and number cells) from the same 41 rows with a script that also summed them; previewed both, compared the previews, imported the workbook, downloaded the retained file and previewed the CSV again; decided three unknown sources; previewed zero-rule probe files (A1). Followed the import articles with nine rows, a rejected row and an unknown source (E).
- What happened: The two previews are identical line for line (25 control-total lines, 3 decision cards, 58 warnings, "41 records to add"), and every total equals the script's, for example "Nkawkaw Open Pit · Grid supply (ECG bulk) · 12 · 18,400,000 kWh". "41 records imported. 1 emission source added during import." Source documents shows "agr-fy2025.xlsx 41 rows (ACT-0001 to ACT-0041) · 9 KB · officer@a1.agr.test, 2026-10-06 15:12 · sha256 fb55b4462101…", and the downloaded file hashes to the same value. A second preview read "Nothing will import: 41 rows rejected." with "duplicate: the same facility, activity, quantity, unit and period already exist on file or earlier in this file". The cards offered "Use Standby gensets" on a near name ("A similar name, so no reason is needed."), refused an 8-character "Why this source?" ("At least 10 characters.") and wrote "'Refrigerant top-ups' in row 30 of agr-fy2025.xlsx mapped to 'Air conditioning units': CoolTech logs ..." and "Hired cars added at Accra Head Office: business travel, during import of agr-fy2025.xlsx (sha256 fb55b446); row 32" to the history. The zero rules refused "Row 2: quantity is 0: say in the note what showed that nothing was consumed", "Row 5: quantity must be 0 or more" and "Row 10: quantity has more than 3 decimals or more than 11 integer digits", and warned "quantity is 0 but 'Camp air conditioning' recorded 6 kg the month before" and "the same note appears on 2 zero rows: say per source what showed nothing was consumed". E's file drew the rejection "Row 11: no facility named 'Plant 2'" as the help says.
- Why it matters: ISO 14064-1:2018 clause 8.2 (traceability from record to source file); Corporate Standard ch. 1 (completeness: a zero is a claim) and ch. 7 (no double counting on re-import). It closes the request of old F18 that the preview create or map sources.
- Evidence: files/preview-csv-full.txt, files/preview-xlsx-full.txt, files/dl/1791299712417-agr-fy2025.xlsx, shots/006-officer-a1-06-import-preview-csv.png, shots/007-officer-a1-07-decision-cards.png, files/preview-zero-rejects.txt (A1-10, A1-11, A1-17, E-31).

**F17. A source created in the import preview defaults to "Stationary combustion", so grid electricity, landfill waste and a refrigerant top-up were classified into Scope 1 without a prompt or a gate, and the run reported Scope 2 as zero.**

- Severity: Blocker. Area: Import preview (decision cards, "Create"); Review and classify records; pre-flight; run report.
- What I did: Imported 48 rows with the product's CSV template and answered 19 unknown-source cards with "Create 'Plant grid supply'" and the like; in FY2024 chose the Ember grid factor, the DESNZ landfill factor and the DESNZ R410A factor, as "Review and classify records" says, then froze and ran (A2). On another card ticked "Create 'Hired cars'" and looked at "Add records" before choosing a kind (A1). Imported 2,575 rows that raised 211 cards (B).
- What happened: A1 and B saw a "Kind" field preselected to "Stationary combustion", with "Add records" already enabled, and B noted that the default holds whatever the source's name says; A2's notes say its 19 cards offered "Create 'Plant grid supply'" ("Added to Nkawkaw Open Pit when the records are added, marked as added during import.") with no kind and no contractor flag. Two reviewers against one: the field exists, starts on "Stationary combustion" and nothing requires a change, which is how all of A2's sources were created: "Stationary combustion · owned or controlled · defaults to Scope 1, Stationary combustion · added during import" (grid supplies, landfill, chillers, flights, quicklime, a contractor's drilling fleet). Classification took the source's default: the detail reads "SCOPE 1 / STATIONARY COMBUSTION" for "Grid electricity" with "Grid electricity, Ghana (2024)…", the history "'Grid electricity' classified as scope 1, Stationary combustion", and no justification was asked because the scope matched the source. The pre-flight passed Classification, and Run 001 printed "Scope 1 52,172.325 t CO₂e", "Scope 2, location-based 0.000 t CO₂e" and "Scope 2, market-based 0.000 t CO₂e": 62.8 GWh of grid electricity (29,441.2 t) sat in Scope 1 and the R-410A top-up under "Stationary combustion". A1's "Use another source" list for a refrigerant row also offered "Business flights", "Employee commuting", "Office grid supply" and "Office waste". A2 voided the run and moved 27 records to correctly kinded sources; only then did the gate object ("'Grid electricity' is classified in scope 1; its emission source 'Plant grid supply (electricity)' defaults to scope 2."), which shows the check exists but compares with the source, not with the factor.
- Why it matters: Corporate Standard ch. 4 (Scope 2 is purchased electricity, and the scopes must not be mixed) and Scope 2 Guidance ch. 7 and 8 (dual reporting). A report with Scope 2 at zero and grid electricity in Scope 1 is materially misstated, the path is the one the help describes, and nothing stops it. A1 rated its half Minor; A2's consequence makes it the Blocker.
- What to do: Start "Kind" at "Choose a kind" and require it, or suggest it from the activity type and unit (kWh to purchased electricity, litre to combustion, kg of a refrigerant to fugitive); list same-kind sources first under "Use another source" and confirm a different kind; let an owner edit a source (F15); and add a classification gate when a factor's own scope or category differs from the source's default ("Grid electricity, Ghana (2024) is a scope 2 factor; this record is filed in Scope 1 Stationary combustion"), at least as a warning that needs a justification.
- Evidence: a2-003-grid-filed-scope1.png, a2-004-fy2024-run001-scope2-zero.png, files/fy2024-run001.txt, shots/007-officer-a1-07-decision-cards.png (A2-01, A1-14, B-19, A2-31).

**F18. A record whose period overlaps another record of the same source imports without a word: 7,000 litre of March genset diesel went in beside the January to June record of 42,000 litre.**

- Severity: Major. Area: Activity data > Import preview; register; record form; pre-flight.
- What I did: Imported "Kumasi Exploration Camp, Camp genset, Diesel - camp genset, 7000 litre, 2025-03-01 to 2025-03-31" while ACT-0037 (42,000 litre, 1 January to 30 June 2025, same source) was on file; put a March LPG zero inside the annual 8,000 litre record ACT-0039 in a probe file (A1).
- What happened: The only refusal is the exact duplicate (same facility, activity, quantity, unit and period). The overlapping row became ACT-0047, "Ready", with no warning, and the pre-flight has no overlap check either, so A1 excluded it by hand as a duplicate (F52). For the LPG probe the warning read "quantity is 0 but 'Camp kitchen LPG' recorded 8000 litre the month before", although the 8,000 litre record covers March itself.
- Why it matters: Double counting is the commonest error in fuel data that arrives both as period totals and as monthly reads; Corporate Standard ch. 7 (QA: check for double counting) and ISO 14064-1 clause 9.3 expect it to be caught before calculation.
- What to do: Warn on any record whose period overlaps a non-draft record of the same facility and source ("overlaps ACT-0037, 2025-01-01 to 2025-06-30"), in the import, on the record form and at pre-flight; word the zero check as "a zero inside a period that ACT-0039 reports as 8,000 litre".
- Evidence: files/zero-warnings.csv, files/preview-zero-rejects.txt (A1-18).

**F19. The import preview shows 20 rows of 41, buries its two real warnings among 58, and its zero check skips earlier rows of the same file and sources not yet decided.**

- Severity: Minor. Area: Activity data > Import preview; "Download a monthly template"; Settings > History.
- What happened:
    - The records table lists rows 2 to 21 and then a plain "and 21 more", not expandable; the rows behind the decisions (30, 32), the unknown unit (24) and "1 row: needs evidence" (33, unnamed) cannot be checked before adding, although the page says "Check the preview before adding them" (A1).
    - Following the help's advice to put a meter in "Meter or supplier" ("For a grid supply the meter or account number is the source's handle") drew 31 warnings of the form "Row 2: 'Grid supply (ECG bulk)' is recorded with the supplier 'ECG account 4410-2211'; this row names 'Electricity Company of Ghana'", beside 25 long-period warnings; the two real points ("'Quicklime purchases' mixes units in this file: bags-25kg, tonne" and "'Office grid supply' mixes units in this file: gwh, kwh") are lost, and the unit codes print lowercased (A1).
    - The zero-after-a-non-zero-month warning compares only with records on file: a monthly file with an August zero after July's 18,000 kWh drew no warning (A1), and B's 2,575-row file drew no "Worth a look before adding" block although 52 zero rows follow a month with a top-up on the same, still undecided, source (B).
    - The monthly template is one facility and one month with the unit blank, as spec 04.12 designs it, so a year for one source means twelve downloads or retyping eleven periods (A1).
    - The two import mappings print in the organization history with an empty "Action" cell, beside rows that read "Emission source added" (A1).
- Why it matters: A warning that fires on most rows teaches preparers to skip the block (Corporate Standard ch. 7, QA), and a preview that shows half the file cannot be checked.
- What to do: Show every row (paginated) and name the rows behind each count; split the meter from the supplier and compare the supplier column with the supplier only, one grouped warning per source; compare a zero with the previous month whether it is on file, earlier in the file or on a source still to be decided; offer a month range for one source and prefill the unit last used; label the mapping act ("Emission source mapped during import").
- Evidence: files/preview-csv-full.txt, shots/006-officer-a1-06-import-preview-csv.png, files/tarkwa-depot-grid-2025-monthly.csv, `shots/010-officer-a1-10-monthly-template-preview.png`, files/1791300118441-activity-tarkwa-logistics-depot-2025-01.csv, shots/008-officer-a1-08-org-history-blank-action.png (A1-12, A1-13, A1-15, A1-19, A1-20, B-19).

**F20. A record in an unregistered unit imports as "Ready", and its factor picker says only "No factor matches this search."**

- Severity: Minor. Area: Import preview; register; Inventory > factor picker.
- What I did: Imported 400 "bags-25kg" of quicklime (ACT-0023), opened "Choose factor…" with an empty search, then defined "bags-25kg" under Units as 25 kg and opened the picker again (A1).
- What happened: The preview gave no unit warning, only the mixed-units line; the register showed "Ready"; the picker read "No factor matches this search." with nothing about the unit. After "1 bags-25kg = 25 kg defined." the picker offered the mass factors. The drawer warning of 11 September ("An unregistered unit only matches a factor in the identical unit...") is not shown for an imported record.
- Why it matters: The preparer is told the record is ready, then meets an unexplained dead end at classification (Corporate Standard ch. 7, data management).
- What to do: Warn in the preview and on the record ("unit 'bags-25kg' is not defined: define it under Units"), keep the record out of "Ready", and say in the picker why nothing matches.
- Evidence: shots/019-officer-a1-19-unknown-unit-picker.png (A1-35).

**F21. Nothing on an imported record names its file or row, although the help says "Each record's history names the imported file".**

- Severity: Minor. Area: Record detail > History; Source documents; help "Import records from a spreadsheet".
- What I did: Opened ACT-0029 (row 30, mapped to "Air conditioning units") and its History, and searched the record view for the file name, "row" and "imported" (A1).
- What happened: History reads "Never corrected: the record reads as first entered."; nothing names agr-fy2025.xlsx, row 30 or the mapping reason. The link runs only the other way (Source documents: "41 rows (ACT-0001 to ACT-0041)") and through the organization history. Source documents also says "Each CSV import is kept as uploaded" of an XLSX, and does not show "the table as it was read" that the help promises for a workbook.
- Why it matters: A verifier samples from the record to the source (ISO 14064-3 vouching), so the trail should read from the record.
- What to do: Print "Imported from agr-fy2025.xlsx, row 30 (sha256 ...)" and any mapping on the record; correct the help, or ship the parsed table it describes.
- Evidence: record ACT-0029 History dialog (A1-16).

**F22. On the register, a documented zero needs a note and is labelled, bulk acts are one request with a reason written to each record and once to the organization history, and a source described on the record form is checked against similar names.**

- Severity: none (positive). Area: Activity data > "+ Add activity"; selection footer; record form > "New emission source…".
- What I did: Entered a December zero for "Air conditioning units" with a data source and a reference, first without a note; assigned a source, set a tier and added an evidence link on several records; created "Light vehicles" from the record form at Obuom, then typed "Light vehicle" on another record (A1).
- What happened: "A zero needs a note of at least 10 characters: what showed that nothing was consumed." and then "Activity recorded."; ACT-0060 lists as "0 kg · documented zero" and December shows "⊘" in the coverage matrix (small and pale beside the dots). The footer offers "Assign emission source", "Set data quality tier", "Add evidence link" and "Remove N selected"; each dialog reads "Applies to N records." and needs "At least 5 characters"; the results read "Data quality tier set on 4 records." and "Evidence link added to 4 records."; ACT-0061's history shows "Emission source: empty → Dewatering pumps" and "Quality tier: 1 → 2" with the reasons, and the organization history "Emission source 'Dewatering pumps' assigned to 3 records (ACT-0061, ACT-0062, ACT-0063): ...". The new source reads "Light vehicles ... defaults to Scope 1, Mobile combustion · added during data entry"; the second save stopped on "'Obuom Processing Plant' has an emission source with a similar name: 'Light vehicles'. Use it, or give a reason to create 'Light vehicle' as a separate source.", and "Use Light vehicles" attached the record without creating anything. This similar-name notice is the "reconcile prompt" of ECO-5; the help never uses that word.
- Why it matters: Corporate Standard ch. 1 (completeness: a zero is a claim) and ch. 7 (one source, one stream of records; changes with reasons). It closes old F18.
- Evidence: shots/011-officer-a1-11-documented-zero-record.png, shots/012-officer-a1-12-bulk-assign-disabled.png, shots/014-officer-a1-14-inline-source-saved.png, shots/015-officer-a1-15-similar-name-notice.png (A1-21, A1-22, A1-26).

**F23. Evidence links can be attached twice and removed with one click, and neither the additions nor the removal reach the record's History; the removal is recorded nowhere.**

- Severity: Major. Area: Record detail > Evidence; Source documents; record History.
- What I did: Added the link "PUMP-NKW-Q4-2025" to four records, then again to ACT-0061 and ACT-0064; opened ACT-0061 > Evidence and clicked "remove" on one copy; read the record History, Source documents and the organization history (A1).
- What happened: The second act succeeded ("Evidence link added to 2 records.") and ACT-0061 listed the identical link twice. "remove" deleted one copy at once, with no confirmation and no reason. ACT-0061's History lists the source and tier changes but neither link addition (although the dialog said "Each record's history carries" the reason) nor the removal. Source documents then listed 5 links with no trace of the removed one, and the organization history has the two bulk additions and no removal. Only links were tested; no uploaded file was removed.
- Why it matters: Evidence is what a verifier vouches to (ISO 14064-3), and ISO 14064-1:2018 clause 8.2 requires the records that support the inventory to be retained; here evidence can leave a record without a trace.
- What to do: Refuse a duplicate link and name it; ask for a reason to remove evidence and keep the removed item as a tombstone, as "Record removed" does for documents; write additions and removals to the record's History.
- Evidence: shots/013-officer-a1-13-duplicate-link.png (A1-25).

**F24. The register's dialogs and drawer stop short: "Assign emission source" offers no new source, the drawer opened from its address says a facility with five sources has none, and a source created on the form does not offer to collect the facility's other records of that activity.**

- Severity: Minor. Area: Activity data > Assign an emission source; "+ Add activity" drawer.
- What happened:
    - "Assign emission source" listed only existing sources ("Blasting explosives", "Contract haulage (Rocksure)", "Grid supply (ECG bulk)", "Haul fleet", "Pit workshop gensets"); unlike the import cards and the record form it has no "New emission source…", so a missing source means leaving the register, adding it under Facilities and selecting the records again (A1).
    - Opened from /activity?record=new, or after a reload, the drawer offered only "No emission source" and "New emission source…" with "This facility has no emission sources yet. Choose New emission source... above, or register them under Facilities › Emission sources." for a facility with five; choosing the already selected facility again loaded them, and the reload cleared what had been typed (C).
    - Creating "Light vehicles" at Obuom did not offer to attach ACT-0064, a sourceless record of the same activity at the same facility (A1).
- Why it matters: A record saved without its source loses the source's default scope (Corporate Standard ch. 4), and the false hint sends the preparer to register sources that exist.
- What to do: Offer "New emission source…" in the bulk dialog; load the preselected facility's sources when the drawer opens; after creating a source, offer the facility's sourceless records of the same activity.
- Evidence: shots/002-owner-17-record-drawer.png, shots/003-owner-18-drawer-no-sources-after-reload.png (A1-24, C-13, A1-26).

**F25. A removed record still cannot be found: the register has no removed view and searching its number returns "No records match"; only its documents surface, marked "(record removed)".**

- Severity: Minor. Area: Activity data register; Source documents.
- What I did: Removed ACT-0065 (a draft) and ACT-0047 (the duplicate that Run 001 lists under "Duplicate (1 record)") with one reason; searched the register for "ACT-0047"; filtered Source documents by "Record removed" (A1).
- What happened: "No records match", and the filters have no "Removed" option. Source documents lists "PUMP-NKW-Q4-2025 link ACT-0065 · Diesel - January camp genset invoice (awaiting figures) (record removed)". Who removed the records, when and why shows only in the organization history; the register numbers ACT-0001 to ACT-0067 with two gaps.
- Why it matters: Transparency principle and ISO 14064-1:2018 clause 8.2: a verifier sampling Run 001's exclusions will ask for ACT-0047.
- What to do: Add a "Removed" filter that shows each tombstone with who, when and why, and link it from any run that cites the record.
- Evidence: register search and Source documents text (A1-48).

### Stage D: the factor catalogue, organization factors and the pack console

**F26. Factors behave as vintages: the picker offers only the edition valid in the period, with a full citation; a new edition cuts versions rather than overwriting them; a GWP basis change cannot pass as a vintage progression; superseded and withdrawn editions stay readable but leave the import list; and a recalculation candidate holds the sign-off but not the run.**

- Severity: none (positive). Area: Inventory > factor picker; Updates; Emission factors; Factor packs console; Runs.
- What I did: Classified FY2025 with DESNZ 2025 and 2026 both held (A1); published a second edition on AR6 and an erratum, accepted the second as the owner, read the factor list, froze and ran FY2026, tried "Submit for review", then withdrew the erratum (C).
- What happened: The FY2025 picker shows one "Liquid fuels: Diesel (100% mineral diesel) (/litre)", citing "UK Government (DESNZ) GHG Conversion Factors for Company Reporting, flat file: Fuels / Liquid fuels / Diesel (100% mineral diesel) (published 2025, data year 2025) · defra-2025"; the organization's list shows the 2025 version "valid 2025-01-01 to 2025-12-31" and the 2026 version "valid 2026-01-01 to …" (A1). "Vintage progression" was refused: "The edition changes the Global Warming Potential basis from AR5 to AR6, so it cannot be a vintage progression: chapter 1 requires one basis across the inventory and across years. Answer it as a retrospective adoption or an erratum." After acceptance each changed factor shows "2 versions of this factor" with the 2025 version closed on 31 December 2025; caveated versions arrived "Not approved"; the dropped petrol row stayed valid ("Accepting does not retire them"). A candidate was raised, FY2026 still froze and ran, and "Submit for review" was refused with "An inventory that reports against the base year cannot be submitted for review until the recalculation is completed or declined. Calculation runs stay available, because quantifying the movement is how a recalculation is assessed." The superseded and the withdrawn editions stayed readable in the console and left the owner's import list, and FY2025's published report still reads 97,687.21 t (C).
- Why it matters: Corporate Standard ch. 1 (consistency), ch. 5 (recalculation policy) and ch. 9 (factor sources); ISO 14064-1:2018 clause 8.2. It closes old F22 and F23 for the packs now offered.
- Evidence: files/picker-genset-diesel.txt, shots/006-owner-23-notice-drawer.png, shots/007-owner-24-notice-vintage-refused.png, shots/009-owner-26-recalc-candidate.png, shots/012-owner-29-submit-refused-base-year.png (A1-29, C-19, C-25).

**F27. Five DESNZ "Kyoto protocol products" rows in both editions carry their gas in the HFC column, so 565 kg of vented and fugitive methane printed as "HFCs 565 kg 15.820 t CO₂e" while the total ties.**

- Severity: Major. Area: DESNZ 2025 and 2026 editions ("Kyoto protocol products" rows); run report section 05; Lines (CSV).
- What I did: Recorded methane from the depot's tank breathing and working losses (420 kg), the vapor recovery unit vent (60 kg) and the leased-out tanks (85 kg), and classified them with "Kyoto protocol products: Methane, Emissions including only Kyoto products" (28 kg CO2e/kg) (B).
- What happened: The factor row reads "28 kg CO₂e/kg HFCs 1"; Run 001 section 05 reads "HFCs 565 kg 15.820 t CO₂e", and the lines CSV has `ch4_kg` 0 and `hfcs_kg` 420 for ACT-0002; the same pack's carbon dioxide row reads "1 kg CO₂e/kg HFCs 1" (B). The lead checked the seeded catalogue: in both DESNZ editions the "Kyoto protocol products" rows for "Carbon dioxide", "Methane", "Nitrous oxide", "Sulphur hexafluoride (SF6)" and "Nitrogen trifluoride" carry their mass in the HFC column (5 of the 33 "Kyoto protocol products" rows in each edition), while the PFC rows map correctly. Any CO2, CH4, N2O, SF6 or NF3 release recorded with those rows therefore prints under HFCs, and the CO2e total stays right, which hides it. The publication rule on gas splits exempts an HFC mass without a composition (spec 02.5 rule 4), which would let such a row pass. Separately, the seeded diesel and LPG rows show "HFCs (kg per unit)" 0 and "Biogenic CO2 (kg per unit)" 0 where the publication states nothing, against the row form's own rule "Leave a gas empty where the publication states nothing about it: that is not the same as a stated zero." (C).
- Why it matters: Corporate Standard ch. 9 requires emissions data for each of the seven gases separately, and methane mass is the figure oil and gas lenders and OGMP 2.0 ask for. These rows are the catalogue's only route for a vented or fugitive gas recorded as itself (the gap old F56 named), and they misstate two rows of the by-gas table every time they are used. C rated its seed point Minor; it joins this Major because the fix is one audit of the seed's gas columns.
- What to do: Correct the gas mapping of those five rows in both editions and clear the unstated zeros; add a publication rule that a row's single gas column matches the gas its name states; add a regression test on the by-gas table. Issued as errata, the corrections meet F42 in every organization with a published 2025.
- Evidence: run001 page text, section 05; run001 lines CSV, row ACT-0002; factor row text (B); row dialogs on defra-2025 (C) (B-09, C-39; lead's check of the seeded catalogue).

**F28. The derived Ghana transmission-loss factor books a CO2e figure as CO2 mass, so the by-gas table moves 8,204 t from the "without a gas split" row into CO2, and its description gives an arithmetic that does not reproduce it.**

- Severity: Major. Area: Ghana edition, row "Grid electricity T&D losses, Ghana (derived)"; report sections 05 and 08; Get started steps 3 and 7.
- What I did: Followed Get started to Run 001 and reconciled section 05 against the lines and the factors (D); re-performed the factor from its description (A1, E).
- What happened: The row reads "Gases (kg per unit): CO₂ 0.117202" with the source "the 2024 Ember intensity of 0.468809 kg CO2e/kWh times the share lost in transmission and distribution (20% of generation ...), per kWh consumed". The lead checked the seeded "ghana" edition: the six grid rows "GHANA:grid:GHA:2019" to "2024" are CO2e-only, with no gas masses, while "GHANA:td-losses" (0.117202 kg CO2e/kWh) is not marked CO2e-only and carries its whole value in the CO2 column. Run 001 therefore prints "CO2 45,124.224 t" and only the grid and diesel well-to-tank lines under "CO₂e from factors without a gas split" (40,819.716 t): the CO2 row carries the two loss lines (4,219.27 t and 3,984.87 t, 8,204.140 t), and combustion CO2 is 36,920.084 t. In E's organization the same lines put 108.998 t into CO2. The help's step 7 prints the misbooked figures as the expected result. On the arithmetic, 0.468809 x 0.20 = 0.093762, while the value is 0.468809 x 0.20 / 0.80 = 0.117202 (losses per kWh consumed), which is right; the source text and Get started step 3 ("times the share of generation lost ... 20%") are not. A1 and E rated this Minor; I keep D's Major because it is a wrong figure in a required disclosure that enters every Ghana inventory with a loss rule, and the tie of the total hides it.
- Why it matters: Corporate Standard ch. 9 requires emissions by gas in tonnes; a CO2e figure printed as CO2 overstates the CO2 row by 22% here and cannot be reproduced from a source that publishes no gas split, and a verifier re-performing the factor from its stated method gets a figure 20% lower (Scope 2 Guidance ch. 6 on T&D losses, reported in Scope 3 category 3).
- What to do: Make the derived row CO2e-only like its parents and state the formula ("intensity x loss / (1 - loss), 0.20 / 0.80 = 0.25") in a corrected Ghana edition; correct Get started steps 3 and 7 (CO2 36,920.084 t; the no-split row 49,023.856 t).
- Evidence: files/run001.txt, sections 05, 08 and 10 (D); Emission factors search "losses" (A1); report sections 04, 05 and 08 of Help Check (E) Run 001 (D-07, A1-09, E-21; lead's check of the seeded catalogue).

**F29. A prior-year inventory finds no factor at all: every pack row, including Ember's 2024 Ghana grid row, is valid only from 1 January 2025, and the picker blames the unit.**

- Severity: Major. Area: Emission factors (packs); Review and classify records (FY2024); help "Import a factor pack", "Fix a factor or update problem".
- What I did: Imported DESNZ 2025 and Ghana ("ghana, applying from 2025-01-01: 7 added, 0 versioned, 0 tagged, 0 unchanged."), created "FY2024 Operational control (AR5)" and opened "Choose factor…" on a 4,000,000 litre diesel record, with and without "Show unapproved" and with the search "diesel" (A2).
- What happened: "No factor matches this search." and "No factor matches litre (volume): add a matching factor or record it in a compatible unit." with 1,935 factors held, many per litre. Every Ghana row reads "valid 2025-01-01 to …", including "Grid electricity, Ghana (2024) … data year 2024". The help says only "a period is offered only the versions valid inside it", and "Fix a factor or update problem" has nothing for a year before the packs. A2 finished by entering four factors by hand ("Valid from 2024-01-01", "Valid to 2024-12-31") from the DESNZ 2025 and Ember 2024 figures, approved as the sole member.
- Why it matters: Corporate Standard ch. 5: the base year is normally earlier than the first report, so a prior-year inventory is among the first things a new client builds. A data-year 2024 grid factor that cannot price 2024 consumption contradicts Scope 2 Guidance ch. 6, and the message sends the user after the unit, which is not the cause.
- What to do: Let an import choose its applies-from date, or offer an edition for earlier periods with a vintage warning; tie the Ember rows' validity to their data year; when a period has no valid version, say so ("No factor in this organization is valid in 2024; import an edition for 2024 or add one"); add a help section on a base year that predates the packs.
- Evidence: a2-002-fy2024-no-factor-matches.png (A2-02).

**F30. An organization approves a published zero-value supplier template with one click, so a run prices 9,000 t of purchased gypsum at 0 kg CO2e.**

- Severity: Major. Area: Emission factors > Approve; run report.
- What I did: Published "kcw-c:material:gypsum:supplier-template" (0 kg CO2e per tonne, unapproved, note "Template: obtain the supplier's environmental product declaration for the gypsum and record its factor."), the only zero the console allows; as the owner, imported the edition, ticked "Show unapproved", searched "gypsum" and clicked "Approve"; classified the gypsum record with it and ran (C).
- What happened: No dialog and no refusal: "Approved by owner@c.kcw.test on 2026-10-06 15:31" at 0 kg CO2e/tonne. A caveated row, by contrast, opened a dialog that refused an empty note with "Say what you checked before approving this factor." The pre-flight said only "'Purchased gypsum, supplier-specific (template)' publishes CO2e only."; Run 001 printed "ACT-0005 Purchased gypsum ... 9,000 tonne ... 0 kg/tonne ... 0 kg CO₂e" among the "2 lines" of category 1 in the published report.
- Why it matters: The template exists so the organization records the supplier's figure; approving the zero prices a category 1 purchase at nothing, with no exclusion and no justification (Scope 3 Standard ch. 6 and ch. 11; Corporate Standard ch. 1, completeness). It is immaterial here (the later edition's 7.80307 kg/t gives 70 t) and material for any template a client relies on.
- What to do: Refuse approval of a zero-value template ("Record the supplier's factor as your own factor, or exclude the records with a reason"); at least require the check note and flag a zero factor at pre-flight.
- Evidence: shots/001-owner-16-gypsum-zero-template-approved.png, shots/004-owner-19-run001-v1-report.png (C-11).

**F31. A caveated factor can be approved with the check note "ok", and an unapproval and re-approval leave no trace: approvals, unapprovals and pack imports appear in no history.**

- Severity: Minor. Area: Emission factors > Approve (caveated factor) and Unapprove; Settings > History.
- What I did: Approved "Grid electricity T&D losses, Ghana (derived)" with "ok" in "Check note", clicked "Unapprove", approved again with a full note and read Settings > History (A1).
- What happened: The dialog reads "The publisher attached a caveat to this value. Say what you checked before approving it; the note prints beside the caveat in the report's factor table."; "ok" was accepted, and the row read "Approved by officer@a1.agr.test on 2026-10-06 14:55 / Checked: ok". "Unapprove" acted at once with no dialog and no reason, and the row then showed only the second approval. The History lists sources, facilities and entities but no pack import, approval or unapproval; the help's list of recorded acts confirms only "Factor pack adopted, Factor pack declined". Clearing the note on unapproval is the design (spec 02.11); the missing trail is the gap. Elsewhere the product asks for at least 10 characters (scope departures, documented zeros).
- Why it matters: The check note is the only evidence that the caveat was addressed (Corporate Standard ch. 7; ISO 14064-1:2018 clause 8.2), and who approved a factor, on what check and whether the approval was withdrawn is evidence of a control operating over the period.
- What to do: Require a note of at least 10 characters; ask a reason on "Unapprove"; record pack imports (with their four counts), approvals (with the note) and unapprovals in the organization history.
- Evidence: shots/004-officer-a1-04-approve-caveat.png, shots/005-officer-a1-05-caveat-approved-ok.png (A1-07, A1-08).

**F32. Factor pack publication is a two-person act with hard rules: every failing row is named with what to fix, the curator cannot publish their own draft, and the published edition names its curator, its approver and the checksum of its source document.**

- Severity: none (positive). Area: Administration > Factor packs (Validation tab, Publish dialog, Metadata).
- What I did: Added probe rows to a draft of a family of my own ("kcw-c") and read Validation after each; opened Publish as the curator; as the approver, uploaded the source PDF, read the blast radius and published; ran sha256sum on the file (C).
- What happened: Each rule is a heading with its count and the row codes, for example "The provenance is complete" ("kcw-c:probe:no-source The row is missing the source publication, an absolute source URL, the publication year, the data year."), "No value without a source", "The unit is one the registry knows" ("'bag (50 kg)' is not a registered unit; ..."), "The gas split reconciles to the stated CO2e" ("The gases come to 2.03337003 kg CO2e under AR5, which is 23.60% from the stated 2.66155. They must agree within one percent."; C re-performed 2.0 + 0.00001036 x 28 + 0.00012483 x 265 = 2.03337), "A caveated row publishes unapproved", "The code names the publication and the row" and "Biogenic CO2 is excluded from the stated CO2e" ("state 0.01 and keep 2.49 as the biogenic CO2."). The Publish dialog calls a rule failure "a hard failure, never a warning, because a published edition is a citation." The curator saw "Not met: The approver must not be the curator. ..." with Publish disabled; the approver saw "SHA-256 2194d87daa55558c7ffe740fe1ddb867656557a730802c429334c1f5df758473, computed over the bytes stored.", which matched sha256sum (three times over the walk). The published edition reads "CURATOR Efua Curator", "APPROVER Yaw Approver" and "EVIDENCE CHECKSUM 2194d87d...758473", with "Frozen at publication against no predecessor: 5 added, 0 changed, 0 discontinued, 0 unchanged."
- Why it matters: Corporate Standard ch. 9 (factor sources), ch. 4 and 9 (biogenic CO2 outside the scopes) and ISO 14064-1:2018 clause 8.2 (retained records); the one-percent reconciliation and the checksum are what a verifier re-performs.
- Evidence: shots/006-curator-06-validation-no-source.png, shots/009-curator-09-validation-nine-breaches.png, shots/011-curator-11-publish-dialog-curator.png, shots/002-approver-14-publish-dialog-sha256.png, shots/003-approver-15-published-metadata.png (C-03, C-09).

**F33. Codes and edition identifiers are not tied to their family: a row in another publisher's namespace is accepted without a finding, the blast radius counts it as the DEFRA lineage two client organizations hold, and "defra-2027" could be created as a draft of another family.**

- Severity: Major. Area: Factor packs > draft edition (Add row, Validation, Blast radius); New edition.
- What I did: In my family "kcw-c", draft "kcw-c-2025", added a row with the code `DEFRA:Fuels:Liquid_fuels_Diesel_100_mineral_diesel_:litres`, the exact code of the DESNZ diesel row; read Validation and the blast radius and deleted the row; then created an edition "defra-2027" in the same family and tried "defra-2026" (C).
- What happened: The row saved and Validation listed no rule against it (the count stayed at "4 rows break a publication rule", all for other probes). The blast radius read "2 organizations hold one of these lineages", naming two other reviewers' organizations with "Holds 1 lineage of this pack; 1 would move, 0 by more than 5 percent." and "Not approved: DEFRA:Fuels:...", while the same panel says "This is the first edition of the family, so every row is an addition". "defra-2027" was created as a "DRAFT" under "Kumasi cement test factors (C)" (deleted afterwards, and the identifier was free again); "defra-2026" was refused ("An edition named 'defra-2026' already exists. An edition identifier is the citation a report prints, so it is never reused."). The code rule checks only that two or more segments are filled, and the editions spec lists a family with editions from different publishers as something "nothing enforces".
- Why it matters: Lineage identity is the code alone, across families, so one draft can publish a new "version" of another publisher's factor, and a report could cite "defra-2027" for a figure from another publication. Corporate Standard ch. 9 requires each factor's source, and the vintage logic (ch. 1 and ch. 5) depends on a lineage belonging to one publication; the only safeguard left is an approver noticing an unexplained holder. C rated the identifier point Minor; it joins this Major because the remedy is one namespace rule.
- What to do: Add a rule "The code is in this family's namespace" (first segment equal to the family key, or a declared prefix such as "DEFRA" for "defra") and list it in Validation; key lineages on family and code; require an edition identifier to start with its family key; say in the blast radius why an organization counts as a holder of a first edition.
- Evidence: shots/007-curator-07-blast-radius-defra-code-lineage-collision.png, shots/003-curator-03-defra-2027-accepted-in-kcw-family.png, shots/004-curator-04-edition-id-reused-refusal.png (C-01, C-02).

**F34. A row whose blend is "HCFC-22:1" publishes counted in the scopes, and the gas split has no field for it, so its mass sits under "HFCs".**

- Severity: Major. Area: Factor packs > Add row and Edit row; Validation.
- What I did: Added "kcw-c:probe:hcfc22" ("Probe: HCFC-22 counted in the scopes"), Fugitive emissions, kg, 1760 kg CO2e, "HFCs (kg per unit)" 1 and reporting basis "SCOPES: counted in the scopes", then set "Blend composition" to "HCFC-22:1" with "Blend GWP source" "AR5" (C).
- What happened: The row saved and its gas split reconciled, so the product knows HCFC-22's potential (1,760), but no rule fired; the only field for the mass is "HFCs (kg per unit)". The console's own rule for non-Kyoto gases ("A Montreal Protocol row marked SCOPES is refused", spec 02.5 rule 6) did not catch a Montreal Protocol gas named in the composition.
- Why it matters: Corporate Standard ch. 4 and ch. 9 keep non-Kyoto gases out of the scopes (optional separate disclosure); such a row would overstate Scope 1 and misstate the by-gas table, and R-22 equipment is common in Ghana. C rated it Minor; I raise it because the approver relies on a rule the spec says exists, as for F33.
- What to do: Apply the Montreal Protocol rule to blend compositions and refuse "SCOPES" for them; add an "Other (non-Kyoto)" gas field, or name the gas in the split.
- Evidence: shots/009-curator-09-validation-nine-breaches.png (C-06).

**F35. Validation and the row form have gaps and raw messages: breaches are counted as rows, an unapproved row needs no caveat, and two refusals are framework text.**

- Severity: Minor. Area: Factor packs > Validation tab, Publish dialog, Add row.
- What happened:
    - With 7 failing rows, two of them breaking two rules, the tab read "9 rows break a publication rule. Publication is refused while any of them stands." and the dialog "Not met: 9 rows break a rule."
    - A row with the caveat "Proxy" and no note, and rows left unapproved with no caveat, raised nothing; "Approved for use in a calculation" starts unticked, so every hand-authored row publishes unapproved unless ticked, while the help says "untick Approved for use in a calculation".
    - "Blend GWP source" refused "IPCC AR5 WG1 Table 8.A.1" with "size must be between 0 and 20" and no hint ("AR5" passes), and a negative value drew "must be greater than or equal to 0".
- Why it matters: The caveat is what the organization reads as the reason a factor is unapproved and what its check note answers (ISO 14064-1 clause 6.2 on factor selection), and the blend GWP source is the citation of the potentials applied (old F27 was a wrong GWP citation).
- What to do: Count distinct rows ("7 rows break 9 rules"); add the rules "An unapproved row states its caveat" and "A caveat names the condition to check"; decide the Approved default and make the help match it; offer "AR5" or "AR6" as a select for the blend GWP source and reword both messages.
- Evidence: shots/009-curator-09-validation-nine-breaches.png, shots/011-curator-11-publish-dialog-curator.png, shots/008-curator-08-blend-gwp-source-size.png (C-04, C-05, C-07).

**F36. The approver can change a row's value in the draft and then publish it: separation of duties checks only who created the draft, and no row history shows who changed what.**

- Severity: Major. Area: Factor packs > draft edition (Edit row, Publish dialog), signed in as the approver.
- What I did: As approver@c.platform.test, opened the curator's draft, changed "kcw-c:fuel:petrol-mineral:litre" from 2.33984 to 2.34 kg CO2e per litre and saved, opened Publish; then, as the curator, opened the same row (C).
- What happened: "kcw-c:fuel:petrol-mineral:litre was saved." The dialog read "Met: The approver must not be the curator. Efua Curator built this draft, so somebody else publishes it." and "Met: Every publication rule passes." (2.34 is within one percent of the gases), so the approver could have published a value nobody else had seen. The curator's form showed 2.34 with no sign of the change; Metadata names only "CURATOR Efua Curator"; "Recent platform activity" lists attachments and publications, not row edits. The curator restored 2.33984 before publishing.
- Why it matters: Organizations receive pack rows as "checked by the platform's two-administrator publication" (help, "What is a factor pack edition?"). ISO 14064-1 clause 6.2 and Corporate Standard ch. 7 rely on an independent check of factor values; here the checker can be the last author.
- What to do: Record every row edit with its author; disable Publish for anyone who edited or uploaded a row of the draft, or require a third administrator; show "last changed by" on each row.
- Evidence: shots/001-approver-13-approver-edited-row-publish-condition-met.png (C-08).

**F37. A published or withdrawn edition does not show the evidence and the reason it rests on, its page invites edits it then refuses, and an edition reaches every organization at once.**

- Severity: Minor. Area: Factor packs > edition page (Metadata, row actions, Publish dialog); Platform overview; organizations' factor pack lists.
- What happened:
    - A published edition shows "EVIDENCE CHECKSUM" but no file name, no download link, no "Source document as cited" and no publication date (the date appears only in the dashboard's activity list); a draft nobody had reviewed read "PROVENANCE REVIEW REVIEWED" and "APPROVER Not recorded"; the seeded edition shows the raw value "SEED_UNCHECKED" (C).
    - A withdrawn edition shows "WITHDRAWN" under the banner "This edition is published, so its rows, metadata and values never change again ..."; the reason (refused at 5 characters with "... It is the record a verifier reads beside the figures that rest on it.") appears nowhere, and the dashboard reads "curator@c.platform.test withdrew kcw-c-2025.r1" without it. The withdrawal impact said "1 organization holds one of these lineages" of an organization that had declined the edition (C).
    - "Read the blast radius" in the Publish dialog closes the dialog, and the "Source document as cited" already typed reverts to its default (C).
    - Rows of a published edition offer "Edit" with 25 enabled inputs and "Save row"; saving is refused ("'kcw-c-2026' is published. A published edition's rows, metadata and values never change, because reports already rest on them. Clone it into a new draft instead.", rule "ghg.pack.edition-immutable"), so immutability holds where it counts (C).
    - Once published, C's test edition "Kumasi cement test factors (C) 2026" appeared in every organization's factor pack list (B saw it at 11:07). Publication is platform-wide by design, so a maintainer cannot trial an edition with one organization before it reaches all of them; the blast radius is the only rehearsal.
- Why it matters: A checksum is useful only if the verifier can retrieve the file it was computed over, and the withdrawal reason is promised as "the record a verifier reads" (ISO 14064-3 evidence; ISO 14064-1:2018 clause 8.2).
- What to do: Show the source document with a download link, the citation as entered, the publication date and the approver; print the withdrawal date, author and reason on the edition, on the dashboard line and on the organization's notice; show "Not yet reviewed" on a draft; open the blast radius over the Publish dialog, or keep the typed values; offer "View" with "Clone to correct" on a published row; consider publishing to named organizations first.
- Evidence: shots/010-curator-10-metadata-tab.png, shots/003-approver-15-published-metadata.png, shots/012-curator-12-defra-2025-metadata.png, shots/017-curator-35-withdrawn-edition-page.png, shots/016-curator-34-edit-published-row-refused.png (C-10, C-20, C-23, C-24; B-01).

**F38. After an organization accepts a new edition, its open FY2026 inventory keeps the clinker classification on the closed 2025 version, and the run prices 2026 clinker at 510 instead of 520 kg/t with only a warning.**

- Severity: Major. Area: FY2026 inventory; pre-flight; Run 001 of FY2026.
- What I did: With FY2026 (a draft) classified on kcw-c-2025, accepted the kcw-c-2026 notice, approved the new clinker version (it arrived "Not approved" because of its caveat) with a check note, opened the pre-flight, froze and ran (C).
- What happened: The library showed "2 versions of this factor" (510 "valid 2025-01-01 to 2025-12-31"; 520 "valid 2026-01-01 to …"), but FY2026 still pointed at 510. The pre-flight warned, without holding: "'Purchased clinker, calcination CO2 proxy (IPCC Tier 1 default)' is valid from 2025-01-01 until 2025-12-31, which does not cover the reporting period." and "'kcw-c' is applied in two editions: ...". The run read "ACT-0008 Purchased clinker ... 130,000 tonne 2026-01-01 → 2026-09-30 510 kg/tonne ... 66,300 t CO₂e"; at 520 the line is 67,600 t, so the run is 1,300 t (1.9% of the line) low, the movement the notice had estimated. The diesel line did move ("1 classification moved to 'kcw-c-2026' from 2026-01-01" at acceptance); the clinker, whose new version arrived unapproved, was left behind and not moved when it was approved. The adoption spec says the import moves the classifications of every open draft onto the versions it cut.
- Why it matters: Corporate Standard ch. 1 (consistency) and ch. 5 (one vintage per year): a reviewer who reads the totals, not the warning, signs off a wrong number.
- What to do: When a version is cut, move every open classification on the lineage to the version live in its period, approved or not, or hold the freeze until a person does; make a factor whose validity does not cover the period a hold, not a warning.
- Evidence: shots/010-owner-27-fy2026-preflight-after-accept.png, shots/011-owner-28-fy2026-run-clinker-510.png (C-14).

**F39. An adoption's significance is measured on the current year's part-year activity, not on the base year: 1.33% where the base year gives 1.84%, and early in a year it would read close to zero.**

- Severity: Major. Area: Updates > notice drawer; Settings > Baseline and targets (Recalculation history).
- What I did: With FY2025 (97,687.21 t) as base year and a 1% threshold, opened the kcw-c-2026 notice (clinker 510 to 520) and accepted it (C).
- What happened: "The movement is an estimate over FY2026, using the activity data already recorded. ... It is 1.33% of base-year emissions, measured against your 1% significance threshold." The candidate reads "1.33% of base-year emissions, above the 1% threshold, recalculation required". 1,300.06 t is the January to September 2026 movement (130,000 t x 10 kg); on the base year's 180,000 t it is 1,800 t, 1.84%. This is the adoption spec's design (the estimate over the latest open period, divided by the base year's total), so the defect is in the design, not the build.
- Why it matters: Corporate Standard ch. 5 sets the threshold on the change to base-year emissions, that is the base year recalculated with the new method. With only January entered, the same adoption would read about 0.15% and raise no hold, so the test depends on how many months are on file.
- What to do: Measure a methodology or factor change against the base-year run's activity (its lines re-priced with the new versions), show both figures, and amend the adoption spec.
- Evidence: shots/006-owner-23-notice-drawer.png, shots/009-owner-26-recalc-candidate.png (C-15).

**F40. Once accepted, a notice recomputes its diff against today's factors, so the decided record reads "520 520 0%" and "Estimated movement 0 kg CO₂e".**

- Severity: Major. Area: Updates > "View" on an accepted notice.
- What I did: Accepted the kcw-c-2026 notice and clicked "View" on the accepted row (C).
- What happened: Every row of "What moves" reads Now equal to New with "0%" and "0 kg CO₂e" (for example "Purchased clinker ... 520 520 0 0%"); the header reads "Rows moving 3", "Estimated movement 0 kg CO₂e" and "It is 0% of base-year emissions". Only the answer line keeps the figure ("Answered as: Retrospective adoption (1.33% of base-year emissions against a 1% threshold)"); the inbox row still shows "+1,800.09 t CO₂e" (the maintainer's estimate) and a "Diff hash c792c7e0637a4b5a…" is printed.
- Why it matters: The accepted notice is the record of a chapter 5 decision (Corporate Standard ch. 5); a verifier (ISO 14064-3) who opens it sees a diff that contradicts its own answer line and cannot see what moved when the reviewer decided.
- What to do: Freeze the diff, the estimate and the percentage at decision time and show them on a decided notice, labelled with the date of the decision.
- Evidence: shots/008-owner-25-accepted-notice-recomputed.png, shots/005-owner-22-updates-inbox.png (C-16).

**F41. The blast radius and the change log leave out a row that moves from zero, list a locked period that does not apply, and say nothing of a GWP basis change.**

- Severity: Major. Area: Factor packs > kcw-c-2026 (Blast radius, Changes).
- What I did: In the second edition changed the gypsum row from 0 to 7.80307 kg CO2e per tonne (Run 001 of FY2025 had 9,000 t on it) and moved the GWP basis from AR5 to AR6; read the blast radius as curator and as approver, and the published change log (C).
- What happened: "0 rows move by more than 5 percent, measured against kcw-c-2025." and "Estimated movement: 1,800,089.259 kg CO2e, from the last completed run (Run 001).", which is clinker 1,800,000 + diesel 86.7 + LPG 2.56 kg; the gypsum line (70,227.63 kg) is missing, and the change log prints "kcw-c:material:gypsum:supplier-template CHANGED 0 7.80307 -". The edition applies from 1 January 2026, yet the blast radius listed four rows "INSIDE A LOCKED PERIOD: ... (FY2025, PUBLISHED)"; the notice then showed no blocked rows and acceptance went through. Neither view mentions the basis change, which the notice opens with ("This edition moves the Global Warming Potential basis from AR5 to AR6 ..."); the estimate prices 86.7 kg on diesel from the AR6 restatement, which an AR5 inventory does not use; and the log's "Fields" for the gypsum row omit the caveat the edition added.
- Why it matters: The blast radius is the approver's check before publishing. A change from zero is the largest relative change there is, and a lock that does not apply and a missing basis change both misinform the decision (Corporate Standard ch. 1, one GWP basis). C rated the locked-period and basis points Minor; they join this Major because they are the same screen and the same fix.
- What to do: Count a change from zero as moving more than 5 percent ("from zero") and price it; list a locked period only when the applies-from date falls inside it; add "GWP basis changes from AR5 to AR6" to both views; price rows with a gas split under each holder's GWP set; list every changed field.
- Evidence: shots/013-curator-20-v2-blast-radius-curator.png, shots/004-approver-21-v2-change-log.png, shots/006-owner-23-notice-drawer.png (C-17, C-18).

**F42. Under the platform default, a publisher's erratum to a reported year can never be adopted, not even into an open correction of that year, so a base year cannot be restated with the corrected factor; the setting that decides it is missing from the dashboard and the help.**

- Severity: Major. Area: Updates (notice for kcw-c-2025.r1); Emission factors > Import pack; FY2025 (correction); Platform settings.
- What I did: Published "kcw-c-2025.r1" as an erratum ("What was wrong": the clinker row omitted the cement kiln dust correction, 510 should read 520), applying from 1 January 2025; as the owner, tried "Accept" answered "Erratum", created "FY2025 (correction)" with that reason and tried again, then tried "Import pack" (C).
- What happened: Every route was refused with rule "ghg.pack.applies-inside-locked-period": "'kcw-c-2025.r1' applies from 2025-01-01, which falls inside 'FY2025' (2025-01-01 to 2025-12-31), which is PUBLISHED. A reported period keeps the factors it reported with. The edition cannot be imported while that period is on record and the platform setting Editions inside a published period is Blocked; choose an edition that applies from a later date, or ask a platform administrator about the setting." The open correction made no difference, and the help says "under 'Blocked (default)' such an edition is refused for that organization for good." The dashboard reads "Support access lasts 24 hours, and everyone signed in may create an organization." and the help describes Platform settings as "How long support access lasts and who may create an organization.", both leaving out the third setting, the one that refused the erratum. The default, and the deployment-wide "Allowed: published runs keep their factors", are an owner decision of 29 September 2026 (spec 02.6), so a client's only routes are a vendor setting that changes the rule for every client, or a hand-typed factor.
- Why it matters: Corporate Standard ch. 5 requires the base year to be recalculated for a significant error, and this one is 1.84% of the organization's base year against a 1% threshold. A published report keeps its snapshot either way ("Published runs keep the factors they reported with either way"), so for a correction the block protects nothing. C rated the missing setting on the dashboard and in the help Minor; it joins this Major because it hides the cause.
- What to do: Let an edition be adopted into an open correction of a published year while the published report keeps its snapshot; at least make the setting per organization, decided by its owner with a reason; name all three settings on the dashboard and in the help.
- Evidence: shots/014-owner-32-erratum-accept-refused.png, shots/001-curator-01-curator-platform-overview.png (C-21, C-34).

**F43. The notice for an erratum to an earlier year diffs against the organization's 2026 versions, so the corrected row reads "520 520 0%" while unrelated rows appear to move, and the publisher's "What was wrong" is shown nowhere.**

- Severity: Major. Area: Updates > notice drawer for kcw-c-2025.r1; Factor packs > kcw-c-2025.r1 (Blast radius, Metadata) and kcw-c-2025 (superseded).
- What I did: After adopting kcw-c-2026, published the erratum (one row changed against kcw-c-2025: clinker 510 to 520) and opened its blast radius and the owner's notice (C).
- What happened: The drawer reads "Purchased clinker ... 520 520 0 0%", while "Purchased gypsum ... 7.80307 0 -7.80307 -100%", diesel "2.66257 2.66155" and "This edition moves the Global Warming Potential basis from AR6 to AR5" are the differences between the 2026 and 2025 vintages, not the erratum. The estimate is "over FY2026" ("-61.2 kg CO₂e" in the drawer, "+1,299.94 t CO₂e" in the inbox). The console's blast radius said "Changed 1 ... Unchanged 4" at the top but "Holds 5 lineages of this pack; 4 would move, 1 by more than 5 percent" and priced the FY2026 run. "What was wrong" appears neither on the notice, nor on the erratum's Metadata, nor on kcw-c-2025, which reads only "SUPERSEDED" although the dialog said publishing "marks the predecessor as holding an error".
- Why it matters: A reviewer deciding an erratum must see the value that was wrong and the corrected one for the year it applies to (Corporate Standard ch. 5, significant errors); the screen shows the opposite and hides the reason.
- What to do: Diff an edition against the versions live in its own applies-from window and price it on the inventories of that window; print the erratum's "What was wrong" on the notice, the edition and the predecessor.
- Evidence: shots/013-owner-31-erratum-notice.png, shots/014-curator-30-erratum-blast-radius.png, shots/015-curator-33-superseded-no-erratum-mark.png (C-22).

### Stage E: boundary, classification and the pre-flight

**F44. "Copy the view from" into equity share now rebuilds the boundary from Table 1, moves the leased-in head office to Scope 3 category 8 and copies every instrument verbatim, and the AR6 run reproduces.**

- Severity: none (positive). Area: New inventory (Copy the view from); equity-share Boundary, Method and run.
- What I did: Created "FY2025 Equity share (AR6)" copying "FY2025 Operational control (AR5)", reviewed the activity data, classified the six Wassa and Ahafo records, froze, ran and recomputed (A2).
- What happened: "View copied from FY2025 Operational control (AR5): 48 decisions inherited. Boundary rebuilt from Table 1 under equity share; 7 leased assignments moved scope under Appendix F." and "Wassa Gold Associates: Other documented reason dropped, 30% equity share under this approach" (Ahafo likewise at 40%). The instruments copied as "All eight met" (the PPA and the I-RECs) and "Not applied: 1 not met … 5 not met" with the guarantee of origin's certificate range, registry, vintage and "retired 2026-03-01". The pre-flight caught the new category ("Records are classified into scope 3 '8. Upstream leased assets' but the declaration does not list it"), the R410A blend that "cannot be re-derived under AR6 (no composition recorded)", the instrument that now "covers nothing" and the AR5 base year. Recomputed: location-based 46,680,000 kWh x 0.468809 = 21,884.004 t; market-based 14,851.869 t; AR6 diesel 2.62818 + 0.00001036 x 29.8 + 0.00012483 x 273 = 2.662567 kg/litre; category 8 = 267.914 t; section 05 foots to 65,659.826 t. The boundary is still pre-populated from Table 1 with reasons for exclusions, and a 36-month period draws "This period is 36 months. Chapter 9 expects an annual inventory; keep it only if the period is deliberate."
- Why it matters: Corporate Standard ch. 3 (Table 1) and Appendix F; Scope 2 Guidance ch. 7. It closes old F30, F37 and F39.
- Evidence: files/fy2025-eq-run001.txt, fy2025-eq-run1/pdf.txt (A2-15; A2 retests of old F29 and 8 September F24).

**F45. Scope is an accounting decision for every factor: a Scope 2 factor's scope can now be overridden with a justification, the contractor flag drives the default, and the lease type is inherited from the facility.**

- Severity: none (positive). Area: Inventory > classify detail.
- What happened: On a Ghana grid record the scope select was enabled; choosing Scope 3 showed "The emission source suggests Scope 2.", all 15 categories and "Why the scope departs from the default (at least 10 characters)", and A1 reverted. The contractor source reads "defaults to Scope 3, 1. Purchased goods and services" and classified straight into category 1 (for what the help teaches about it, see F97); proxy justifications print; head-office rows read "operating lease (leased in) inherited"; a source change after a run is picked up by the frozen inventory's pre-flight (A1).
- Why it matters: Ownership fixes the scope, not the factor (Corporate Standard ch. 4, Appendix F). It closes old F34 (8 September F27) and keeps old F12 and F33.
- Evidence: classify detail text (A1-30; A1 retests of old F12, F33 and F34).

**F46. Under equity share, business flights booked at the leased head office move from category 6 to category 8, because Appendix F is applied to every record at a leased facility.**

- Severity: Major. Area: equity-share Records (classification); report section 04.
- What I did: Read the head-office rows of the copied view with the category filter "8. Upstream leased assets" and opened ACT-0025 (A2).
- What happened: ACT-0025 and ACT-0026 ("Flights long-haul economy", source "Business air travel", Business travel kind) read "SCOPE 3 / 8. UPSTREAM LEASED ASSETS" with "Leased facility: operating lease (leased in) inherited.", and the category select is disabled. Only "Lease treatment: Not a leased asset" put them back ("SCOPE 3 / 6. BUSINESS TRAVEL … (set aside for this record)"). Nothing warned. Left as copied, category 8 would have carried 404.4 t instead of 267.9 t, and category 6 nothing. The help's "Copy a view" article does not mention it.
- Why it matters: Appendix F concerns the leased asset's own emissions (its fuel, refrigerant and energy); air travel by staff is category 6 wherever they sit (Scope 3 Standard, minimum boundaries of categories 6 and 8), and the category table is a required disclosure (Scope 3 Standard ch. 11).
- What to do: Apply the Appendix F re-derivation only to kinds that are the asset's own operation (stationary, mobile, fugitive, process, purchased energy), never to travel, commuting, goods or waste.
- Evidence: a2-010-equity-flights-cat8.png (A2-16).

**F47. An entity outside the boundary with no facilities is still told to "Record why it is left out" but given no field, and the report's exclusions omit it.**

- Severity: Minor. Area: Inventory > Boundary; report section 09; PDF section 9.
- What happened: Bonsu Royalty Holdings (A1, A2) and Wassa Gold Associates (A1, which gave it no facility) read "Outside the boundary under operational control: 0% share from its Table 1 row. Record why it is left out so the report says so." followed by "No facilities under this entity." and no picker. Section 09 lists only the entities with facilities ("Operations excluded from the boundary (1 operation)" for A1, "(2 operations)" for A2), and the PDF's "Operations left out of the boundary" is the same.
- Why it matters: Corporate Standard ch. 9 asks for every excluded operation; a 30% associate and a royalty interest are what a reader of a gold miner's report asks about (Scope 3 category 15), and the screen asks for a reason it gives no way to record.
- What to do: Offer the reason and the detail for every entity outside the boundary, and print them.
- Evidence: files/run001-report.txt (A1); files/fy2025-oc-run001.txt and the FY2025 PDF, page 5 (A2) (A1-42, A2-05).

**F48. The base-year report lists Tarkwa Logistics, acquired on 1 July 2025, at "100%" in its 2024 boundary, the pre-flight calls it "a partial-period membership" in a year it was not a member, and the reporting company is labelled "Subsidiary".**

- Severity: Minor. Area: FY2024 report section 01; pre-flight (Reporting boundary); PDF.
- What happened: FY2024 section 01 prints "Tarkwa Logistics Ltd, Subsidiary · member from 2025-07-01 … 100% Yes 100%", and the freeze cut "5 facilities ... in the boundary"; the pre-flight says "Tarkwa Logistics Ltd is a member from 2025-07-01: a partial-period membership, accounted from that date." The reporting company itself is labelled "Subsidiary" in the same table (A2).
- Why it matters: Corporate Standard ch. 3 and ch. 9: the boundary table must show what the period contained, and an operation acquired after the period is not in that year's boundary.
- What to do: Show an entity whose window misses the period as outside it ("not a member in 2024"), and label the reporting company as such.
- Evidence: files/fy2024-run002.txt (A2-12).

**F49. The factor picker is narrowed by neither the source's kind nor its fuel: a litre of genset diesel is offered 565 factors including refrigerant blends, mineral diesel is thirteenth after typing "diesel", and a kilogram of LPG meets the per-litre factor first.**

- Severity: Minor. Area: Inventory > classify detail > factor picker; help "What is an emission source?".
- What I did: Opened "Choose factor…" on ACT-0037 (Kumasi "Camp genset", Stationary combustion, fuel "Diesel", 42,000 litre); searched "LPG" on a 12,000 kg record and tried the per-litre and the per-tonne factors (A1).
- What happened: The list opened on "Biofuel: Avtur (renewable) (/kg)" and ended "515 more match. Narrow the search to see them."; refrigerant blends such as "Blends: R407A ... (/kg)" are offered. Typing "diesel" gave 32 rows: 12 biofuel rows, then "Liquid fuels: Diesel (100% mineral diesel) (/litre) 2.662 kg CO₂e / litre". For LPG, "(/litre)" came before "(/tonne)" although Units says "LPG is invoiced by mass in Ghana; prefer a factor per tonne where the pack carries one."; with the per-litre factor the record stayed "Unclassified" with the visible hint "kg meets a factor per litre: choose the density that converts between them to finish classifying.", and "Density" started at "Choose the density that converts…" rather than LPG. The History logs both choices as "classified as scope 1, Stationary combustion, with 'Gaseous fuels: LPG'", so the switch from litre-with-density to tonne is invisible. The help says the source's fuel "narrows the factors offered", and the source spec says the picker offers the factors whose category matches the source's kind; neither holds.
- Why it matters: Corporate Standard ch. 6: a preparer under time pressure picks the first plausible row, and a biodiesel factor understates mineral diesel, the fuel of Ghanaian mines, by two orders of magnitude; the density assumption moves the LPG figure by about 2% here.
- What to do: Filter by the source's kind and rank by its fuel and by the record's own dimension; hide refrigerants and process factors for combustion sources unless "Show all" is ticked; preselect the density of the factor's fuel; print the factor's unit in the History line.
- Evidence: files/picker-genset.txt, files/picker-genset-diesel.txt, shots/018-officer-a1-18-lpg-density.png (A1-28, A1-34, A1-47).

**F50. The inventory has no bulk classification: at 598 monthly records a preparer needs about 54 minutes at machine speed and two to three hours by hand, and with "Unclassified" filtered each save drops the panel to "Not in this view".**

- Severity: Major. Area: Inventory > Records (classification).
- What I did: Classified FY2025's 50 included records one by one (A1); after "Review activity data" on 2,575 imported rows, timed six classifications among the 598 company-station records awaiting one (B).
- What happened: Ticking rows offers only "Exclude N selected" and "Clear"; there is no "classify N selected", no rule by source and no way to accept "Suggested: Grid electricity, Ghana (2024)" on many rows at once, so A1's 21 suggested rows each took their own click. At volume one record took 0.6 to 1.5 s to open and 3.7 to 5.0 s from the factor click to the saved state (33,071 ms for six), although every one of the 598 is one of 25 decisions (the suggested Ghana grid factor for each grid supply, DESNZ diesel for each genset). With the status filter on "Unclassified", the saved record leaves the list and the panel reads "Not in this view: This record is not on the page in front of you. Clear the search or the filters to bring it back.", so the help's "use ‹ and › to reach the next record" fails in the filter a preparer uses for a backlog. B bulk-excluded 591 of the 598 with the reason "Volume test" to reach a run (F93). A1 rated its half Minor; B's timings make it Major.
- Why it matters: Corporate Standard ch. 7 asks for consistent methods across records, and a decision repeated 598 times is where inconsistency and fatigue errors enter; a retailer with monthly data cannot finish a year without outside help or hours of clicking.
- What to do: Add "Classify N selected" with one factor, scope and category (refusing records whose source kind does not fit) and "Accept the suggestion on N rows"; offer a rule per source ("apply this classification to every record of this emission source in the view"); move to the next unclassified record after a save.
- Evidence: footer text (A1); B/officer timings (A1-31, A1-27, B-20).

**F51. Exclusions are not recorded in the inventory History: eight manual exclusions with justifications left no entry, no excluded record shows who excluded it or when, and classification entries name the activity, not the record.**

- Severity: Major. Area: Inventory > Runs > History; classify detail (Exclude).
- What I did: Excluded ANFO and emulsion, quicklime, the lime bags and cyanide ("Methodology exclusion", "Not estimated"), two R-22 records ("Outside the scopes: Montreal Protocol gas") and one duplicate, then read the History at the foot of the Runs tab (A1).
- What happened: The History holds "Record classified" (55 entries, including a temporary switch of ACT-0001 to Scope 3), "Activity data reviewed" and "Inventory frozen", and no exclusion. The excluded record's detail shows the reason and justification but no author or date. Classification entries read "'Grid electricity' classified as scope 2 ..." twelve times, so a reader cannot tell which record changed.
- Why it matters: An exclusion is the most judgement-laden decision in an inventory (Corporate Standard ch. 9 requires exclusions to be disclosed and justified), and ISO 14064-1:2018 clause 8.2 and ISO 14064-3 expect it to be traceable to a person and a date. The run snapshots the justification, not the decision trail.
- What to do: Write "Record excluded" entries (record number, reason, justification, magnitude, who, when) and show the author on the excluded record; put the record number in every History line.
- Evidence: Runs tab History (entry types counted: "Inventory frozen" 1, "Record classified" 55, "Activity data reviewed" 2) (A1-36).

**F52. Excluding a duplicate refuses a typed 0 and demands "This record emits nothing", and a refused exclusion discards the justification already typed.**

- Severity: Minor. Area: classify detail > Exclude > Duplicate; report section 09.
- What I did: Excluded ACT-0047 (7,000 litre of March genset diesel inside ACT-0037, F18) as "Duplicate", with 0 in "Estimated emissions left out (kg CO₂e)" (A1).
- What happened: "Type the emissions left out, tick 'This record emits nothing', or choose 'Not estimated'." (422); the form closed back to the reason buttons and the justification was lost. The only accepted state, "This record emits nothing", is false for a duplicate, which emits and is counted in ACT-0037, and the report prints "1 emits nothing". "Not estimated" for the methodology exclusions works (old F35 resolved).
- Why it matters: Corporate Standard ch. 9 and Scope 3 Standard ch. 11: an exclusion is justified and sized, and for a duplicate the honest statement is where it is counted.
- What to do: For "Duplicate", ask "Counted in which record?" and print "counted in ACT-0037"; keep the typed fields after a refusal.
- Evidence: live message and report section 09 (A1-37).

**F53. An inventory with no activity records freezes ("Activity data completeness passes"), runs with "0 lines" and publishes without a warning.**

- Severity: Minor. Area: Freeze dialog; run; Publish (Scratch (C)).
- What happened: The freeze dialog listed "Activity data completeness passes"; the run read "Scratch (C) (ORG-0009) · 2025-01-01 → 2025-12-31 · 0 lines"; submission, final designation and publication went through (C).
- Why it matters: Completeness (Corporate Standard ch. 1): a facility in the boundary with no record at all should at least warn before an empty report is issued.
- What to do: Warn, or hold the final designation, when a facility in the boundary has no included record for the period.
- Evidence: Scratch (C) snapshots (C-32).

**F54. Customer screens cite engineering specs a customer cannot read: "(spec 04.2)" and "(spec 07.1)" on New inventory, "(spec 07.4)" and "(spec 01.3)" on Settings, "(spec 05.2)" and "(spec 04.8)" in two dialogs.**

- Severity: Minor. Area: New inventory; Settings (Details, Danger zone); "Withdraw the final designation?"; "Exclude 50 records?".
- What happened: "An annual total for a site acquired mid-year is either counted for the days inside, with the split on the line, or blocked until split (spec 04.2)."; "The IPCC 100-year global warming potentials the report converts each gas with (spec 07.1)."; "the address and contact print on the report header (spec 07.4)"; "... and the deletion is kept (spec 01.3)."; "... recorded in the inventory's history (spec 05.2)."; and the bulk exclusion dialog's "each is recorded as not estimated (spec 04.8)". Five of the six reviewers met at least one (A1, A2, B, D, E; C on Settings).
- Why it matters: The neighbouring hints cite the Corporate Standard by chapter, which a customer and a verifier can use; the first engagement removed spec references from the report (8 September F43).
- What to do: Replace each with a plain sentence, a help link or the Standard's chapter, and add a UI-copy lint that fails on "(spec ".
- Evidence: a2-001-new-inventory-form.png; New inventory, Settings and dialog texts (A1-32, A2-03, B-17, C-30, D-05, E-22).

**F55. Opening or typing on the New inventory form fires two failed requests for an inventory with no identifier.**

- Severity: Minor. Area: New inventory.
- What happened: The harness logged "api-error [404] GET /api/ghg/inventories/ ... No static resource api/ghg/inventories." twice for every reviewer who opened the form (A1, A2, B, and C on four occasions); nothing showed on screen and the inventory was created.
- What to do: Do not fetch an inventory before one is chosen; the "Copy the view from" list is the likely caller.
- Evidence: harness output (A1-33, A2-04, B-17, C-40).

### Stage F: Scope 2, including steam, heat and cooling

**F56. Scope 2 is dual-reported and both totals reproduce: contractual instruments apply to the megawatt-hours they cover, each Quality Criterion is answered on its own, a failing instrument is not applied, a frozen view lists its instruments, and purchased steam and hot water are priced location-based.**

- Severity: none (positive). Area: Method tab (Market-based scope 2 instruments); report section 04.
- What I did: Recorded a 20,000 MWh PPA at Obuom, 5,000 MWh of I-RECs at Nkawkaw and a guarantee of origin at Accra failing criterion 5, ran both views and recomputed (A2); recorded a test I-REC with every criterion met (E); priced 2,450,000 kWh of steam and 310,000 kWh of hot water (B).
- What happened: Location-based 65,790,000 kWh x 0.468809 = 30,842.944 t and market-based (65,790,000 - 25,000,000) kWh x 0.468809 = 19,122.719 t, both as printed; the guarantee of origin was not applied and copied with its failing criteria (F44). After freezing, the instruments show read-only with their criteria; adding one still needs a reopen (old F40 partly resolved). B's steam and hot water ran at DESNZ 2025 "District heat and steam" (0.175289 kg CO2e/kWh, AR5), correct location-based, and every run printed Scope 2 location-based and market-based side by side with the residual-mix statement.
- Why it matters: Scope 2 Guidance §6.2, ch. 7 (Quality Criteria) and ch. 8 (dual reporting).
- Evidence: a2-008-instruments-listed.png, files/fy2025-oc-run001.txt (A2-06, B-13; A2 retests of old F38 and F40; E-20).

**F57. A steam supplier's rate recorded as the blending plant's instrument is applied to the plant's grid electricity while the steam keeps its location-based figure, so market-based Scope 2 is understated by 368.808 t; an instrument has no energy carrier, and a facility holds only one.**

- Severity: Major. Area: Method tab > Market-based scope 2 instruments; run report section 04; Lines (CSV).
- What I did: The Tema lubricants plant buys 2,450,000 kWh of process steam and 310,000 kWh of hot water from the industrial park and 980,000 kWh of grid electricity. Recorded for that facility a "Supplier-specific factor" of 0.2305 kg CO2e/kWh covering 2,450 MWh, sourced to the steam supplier (natural gas at 0.18442 kg CO2e/kWh gross calorific value over an 80% boiler efficiency), all eight criteria "Met", and launched Run 001 (B). With the Obuom PPA recorded, chose Obuom again in the instrument form (A2).
- What happened: The pre-flight warned "The instrument for Tema Lubricants Blending Plant covers 2,450,000 kWh but the facility's scope 2 electricity in its period is 980,000 kWh: the excess covers nothing." In the run the grid electricity line reads "market-based ... 980,000 kWh at 0.2305 kg/kWh (supplier specific)" (225.890 t instead of 459.433 t at the grid average), while the steam line reads "no contractual instrument applies to 'Purchased heat and steam'; the location-based figure stands" (429.459 t instead of 564.725 t at the supplier's rate). The plant's market-based figure is 709.689 t; applied to the energy it describes it would be 1,078.498 t, and the total is 1,814.130 t against 2,182.938 t (B). The Method card speaks only of electricity ("megawatt-hours"; criterion 6 "delivered electricity net of certificates sold"), and "A facility has one instrument per inventory": for A2 the form loaded the PPA and turned to "Save instrument", so a site with a PPA and unbundled certificates cannot record both. Both limits are stated non-goals of the instrument spec (one instrument per facility; instruments for purchased heat, steam and cooling), yet nothing stops a steam contract from being applied to electricity.
- Why it matters: Scope 2 Guidance ch. 6: the market-based method uses the factor the contract conveys, for steam, heat and cooling as for electricity, and a supplier-specific rate applies only to the energy it was issued for; ch. 6 and 7 apply the hierarchy and the Quality Criteria instrument by instrument. Here a steam contract lowers the reported emissions of electricity it never covered, a wrong number in a required disclosure; a Ghanaian mine buying a solar PPA and topping up with I-RECs cannot record each instrument. A2 rated the one-instrument limit Minor; it joins B's Major because the instrument model is one fix.
- What to do: Give each instrument an energy carrier (electricity, steam, heat, cooling) and apply it only to that category's lines; allow several instruments per facility, each with its covered MWh and criteria, applied in the §6.2 hierarchy; refuse, not warn, an instrument whose carrier the facility does not consume; word the criteria for heat and cooling contracts.
- Evidence: `run001/1791303830811-run-1-lines.csv` (ACT-0013 and ACT-0001 market columns), run001 PDF page 2 (B); a2-008-instruments-listed.png (A2) (B-07, A2-10).

**F58. District cooling is classified and reported as "Purchased heat and steam", at a leased-in site the selects that would correct it are disabled, and the report has no Scope 2 breakdown by energy type.**

- Severity: Minor. Area: Facilities > Emission sources (kind); Inventory > classify detail; report lines.
- What I did: Registered "District cooling (chilled water)" at the leased-in Accra head office (kind "Purchased heat, steam or cooling"), added a hand factor in the category "Purchased cooling" and classified the 1,150,000 kWh record with it (B).
- What happened: The source line reads "defaults to Scope 2, Purchased heat and steam". The record took "Scope 2, Purchased heat and steam" whatever the factor's category; the detail reads "Leased facility: operating lease (leased in) inherited." and both selects are disabled ("District cooling delivered category [disabled]"), although "Purchased cooling" exists in the view's category filter and on the factor form. The run line prints "Purchased heat and steam ... market-based: 134.78 t CO₂e (no contractual instrument applies to 'Purchased heat and steam'...)", and the CSV category is "PURCHASED_HEAT_STEAM". The report shows no Scope 2 by energy type and no energy consumed in MWh by type.
- Why it matters: Corporate Standard ch. 4 and the Scope 2 Guidance treat electricity, steam, heat and cooling as distinct purchased energy, and ISO 14064-1 Annex B separates imported electricity from other imported energy. The totals are right; the energy type is wrong and the user cannot correct it.
- What to do: Derive the category from the factor (or from the source's fuel) when one kind covers three carriers, or split the kind; let Appendix F lock the scope but not the Scope 2 sub-category; print Scope 2 by energy type with the MWh.
- Evidence: shots/006-officer-cooling-category-locked.png; run001 lines CSV, row ACT-0016 (B-08).

**F59. The grid region is still free text: the Ghana factor is suggested as a one-click shortcut but not pre-selected, and a facility on an unknown region gets no suggestion and no warning.**

- Severity: Minor. Area: Add facility; Inventory > Records and classify detail.
- What I did: Added six facilities with country "GH", leaving the region blank on four, "GHA" on Obuom and "XX-NOWHERE" on Kumasi Exploration Camp; reviewed the electricity records in FY2025 (A1).
- What happened: "Grid region (optional)" is a text box ("GHA or US-CAMX"; "The grid the site draws from; its location-based factor is suggested. Blank follows the country."). A blank region now follows the country ("Mine · grid GHA"); "XX-NOWHERE" saved without a word ("Camp · grid XX-NOWHERE"). Rows at the four Ghana sites read "Suggested: Grid electricity, Ghana (2024)" with status "Unclassified", and the detail offers "Suggested for this facility's grid: Grid electricity, Ghana (2024)", which classified the row as "Scope 2 / Purchased electricity" in one click; nothing is applied until clicked. ACT-0067 at Kumasi reads "No factor chosen", with no suggestion and no hint that its region is unknown. The suggestion is the 2024 data year for a 2025 period (the latest Ember year in the pack), and nothing says why.
- Why it matters: Scope 2 Guidance ch. 6: the location-based factor follows the grid of consumption; the mapping is the first thing a verifier tests, and an unknown region fails silently.
- What to do: Offer a picker of the regions the imported packs carry and warn on, or refuse, a region no pack knows; pre-select the suggested factor or offer it in bulk (F50); say "latest available data year" beside the vintage.
- Evidence: shots/003-officer-a1-03-facilities.png, shots/017-officer-a1-17-grid-suggestion.png (A1-04, A1-27).

**F60. The report says both that "no residual mix is available" and that the inventory "does not state whether an adjusted residual mix is available".**

- Severity: Minor. Area: Run report sections 04 and 08.
- What happened: Section 04 reads "Market-based basis: no instrument applied and no residual mix available; the grid average (location-based) stands in." and then "The inventory does not state whether an adjusted residual mix is available for its markets"; section 08 reads "No contractual instrument was applied and no residual mix is available". A1 never answered the residual-mix question, and the pre-flight had warned that it was unanswered (A1).
- Why it matters: Scope 2 Guidance ch. 7 and 8 require the residual-mix disclosure; the report asserts a fact the preparer did not state.
- What to do: Until the question is answered, print only "not stated".
- Evidence: files/run001-report.txt (A1-41).

**F61. The eight criteria on the instrument form are not Table 7.1's eight, while the help calls them "the Scope 2 Guidance's eight Quality Criteria", and a long Source fails silently.**

- Severity: Minor. Area: Method tab (instrument form and criteria); report section 04; help "What is dual reporting?"; glossary "Scope 2 instrument".
- What happened:
    - The form lists criteria 1 to 6 as the Guidance does, then "7 Untracked electricity in the market takes a residual mix where one is published" (the Guidance's criterion 8) and "8 Contract or certificate references, quantity, vintage and retirement are held as evidence" (not a Quality Criterion). The Guidance's criterion 7, that for direct purchases and on-site generation every instrument conveying the claim is transferred to the reporting company only, is absent. The help says "It counts only if it meets the Scope 2 Guidance's eight Quality Criteria". The criteria spec chose this list on purpose ("7 and 8 restate its residual-mix and documentation requirements") (E).
    - "Add instrument" with a 147-character Source returned 422 (`"source":"size must be between 0 and 120"`) and the screen showed nothing: no message, no field error, no length limit on the field, and the card still read "No instruments recorded" (B).
- Why it matters: In Ghana the common instrument is a PPA with an on-site or captive solar developer, and whether the developer kept or sold the certificates is what criterion 7 tests (Scope 2 Guidance ch. 7); a verifier comparing the report with Table 7.1 will note the substitution. A preparer who reads the form as accepted may freeze without the instrument.
- What to do: Align the eight criteria with Table 7.1 and keep the evidence check as a separate requirement, then let the help name them; set the field's limit and show the field error.
- Evidence: Method tab and report section 04 text (E); shots/007-officer-instrument-422.png (B) (E-20, B-10).

### Stage G: Scope 3, franchises and the downstream categories

**F62. The Scope 3 arithmetic and controls hold: sold fuels in category 11 at combustion factors, customer-paid haulage in category 9, leased-out tanks in category 13 under Appendix F, category 3 derived by upstream rules that touch only Scope 1 litres and Scope 2 kilowatt-hours, and a warning for a category declared but empty.**

- Severity: none (positive). Area: Inventory > Records and Method; Run 001.
- What happened: Category 11 lines reproduce exactly: 210,000,000 litre x 2.66155 = 558,925.51 t; 160,000,000 litre x 2.339841 = 374,374.48 t; 18,500 t of LPG x 2,939.360949 = 54,378.18 t (DESNZ 2025, AR5). Category 9: 17,100,000 tonne-km x 0.077999 = 1,333.79 t. The leased-out tanks' records went to "13. Downstream leased assets" with "The emission source suggests Scope 1 (leased asset, Appendix F)". The well-to-tank rule matched 3 records and the T&D rule 4, none of them sold, contractor, franchisee or investee lines. The gate warned "Scope 3 '14. Franchises' is declared as covered but no included record is classified into it: a reader takes 'covered' to mean quantified." (B). A2's well-to-tank rule produced 10 lines ("well-to-tank of ACT-0001"), 9,692,000 litre x 0.62409 = 6,048.680 t as printed, and the lines CSV carries `derived_from_line_id` and `derived_kind` (A2). D's two Get started rules, the Ghana grid to the derived loss factor and diesel to its well-to-tank row, each covered their records, and section 08 says "Activities of the category no rule covers, such as upstream emissions of purchased electricity where no factor exists, are not quantified." (D).
- Why it matters: Scope 3 Standard categories 3, 9, 11 and 13; Corporate Standard Appendix F. It closes old F41.
- Evidence: run001 PDF and lines CSV (B); files/fy2025-oc-run001.txt (A2) (B-13, A2-06; A2 retest of old F41; D's Get started steps 6 and 7).

**F63. A franchisee's and an associate's records are excluded on review as "Outside boundary", and the boundary offers only exclusion reasons: nothing routes them to Scope 3 category 14 or 15.**

- Severity: Major. Area: Inventory > Boundary; Records (Review activity data); run hold.
- What I did: Under operational control, recorded six franchisee entities ("Franchise", 0%, not operated) holding 60 stations and "Tema LPG Import Terminal Ltd" as a 20% associate; imported January 2025 grid electricity and genset diesel for franchised station S026 and the terminal's FY2025 diesel and electricity; clicked "Review activity data" (B).
- What happened: Each franchisee and the associate reads "Outside the boundary under operational control: 0% share from its Table 1 row. Record why it is left out so the report says so.", with "Why is it left out?" offering "Non-GHG activity", "Duplicate", "Not applicable", "Methodology exclusion" and "Other documented reason". Their four records read "Excluded · Outside boundary (facility not in the boundary)". No reason, control or message mentions category 14 or 15, and the 20% equity share is not offered for the investment. A run with the records re-included is held ("is outside the boundary (facility not in the boundary): exclude it or change the boundary"). The help says only "Records outside the period, the boundary or a membership window are excluded on review", and searches for "franchise", "category 14", "investments" and "downstream" find nothing on how to report them. At volume the same rule excluded 1,977 franchised-station records and filled the report (F73).
- Why it matters: Scope 3 Standard ch. 5 (Table 5.4): a franchisor reports in category 14 the Scope 1 and 2 emissions of franchises outside its own Scope 1 and 2, and category 15 takes an investee's Scope 1 and 2 in proportion to the equity share (20% here). Corporate Standard ch. 3 puts them outside the organizational boundary, not outside the inventory; the product calls the franchise network "left out" when it should be quantified, and a verifier would qualify a category 14 or 15 claim. B judged it a borderline Blocker; I keep it Major, as the 11 September report did for category 3 (old F41), because Scope 3 reporting stays optional under the Corporate Standard, but for an oil marketer claiming conformance with the Scope 3 Standard it blocks two categories.
- What to do: When an entity is a franchise, an associate or a fixed-asset investment outside the control boundary, offer "Reported in Scope 3 category 14" (or 15, at the entity's equity share) instead of an exclusion, and bring its facilities' records in with that default; add a help article on franchises and investments.
- Evidence: shots/004-officer-excluded-franchise-record.png; Boundary tab text (B-04).

**F64. The category select offers all fifteen Scope 3 categories, but the server refuses most of them by source kind: a franchisee's grid electricity and genset diesel cannot go to category 14, an investee's fuel cannot go to category 15, and a capital project's contractor fuel cannot go to category 2.**

- Severity: Major. Area: Inventory > Records > classify detail (scope and category selects).
- What I did: Re-included a franchised station's records, chose a factor, set the scope to "Scope 3" and tried each category in turn; classified the 2025 depot expansion (8,640 t of ready-mix concrete, 410 t of rebar and 186,000 litres of the EPC contractor's plant diesel) (B).
- What happened: For the "Purchased electricity" source "Station grid supply", categories 1, 3, 8 and 13 saved, and 9, 11, 14 and 15 were refused, for example "'14. Franchises' is not a category a purchased electricity emission source ('Station grid supply') can be classified into." (409). For the "Stationary combustion" source "Station standby genset", 13 saved and 2, 4, 9, 11, 14 and 15 were refused with the same sentence; only a source of kind "Other" accepted every category. After a refusal the select falls back to "1. Purchased goods and services". The concrete took "Construction: Concrete, Primary material production" (118.79306 kg CO2e/tonne, DESNZ material use) into "2. Capital goods", but the contractor's diesel (Mobile combustion, contractor-operated) was refused category 2 ("'2. Capital goods' is not a category a mobile combustion emission source ('Contractor plant diesel') can be classified into.") and stayed in category 1.
- Why it matters: Category 14 is by definition the franchisees' own combustion and purchased electricity, and category 15 the investee's (Scope 3 Standard, categories 14 and 15); the correctly described sources are the ones refused, and a customer has to guess that "Other" is the way in, which loses the source type. Category 2 takes the cradle-to-gate emissions of a capital asset, including the construction work bought to produce it, in the year of acquisition (Scope 3 Standard, category 2), and the company should be able to choose it. B rated the category 2 point Minor; it joins this Major because it is the same refusal by source kind.
- What to do: Allow categories 13, 14 and 15, and 2 for the construction of capital assets, for every combustion, fugitive and purchased-energy kind; offer in the select only the categories the server accepts, with the reason beside the others.
- Evidence: shots/005-officer-franchise-cat14-refused.png; refusal texts (B-05, B-11).

**F65. A source of kind "Other" defaults to "Scope 1, Stationary combustion", so 160 million litres of petrol sold to customers lands in Scope 1 unless the preparer overrides it, and no source kind exists for sold products, leased-out assets, franchises or investments.**

- Severity: Major. Area: Facilities > Emission sources; Inventory > classify detail.
- What I did: Registered "Sold petrol (combustion by customers)", "Sold diesel ...", "Sold LPG ...", "Base oil sold to third-party blender" and "Terminal scope 1 and 2 (investee-reported)" as kind "Other", the only fit in a list of "Stationary combustion", "Mobile combustion", "Process", "Fugitive", "Purchased electricity", "Purchased heat, steam or cooling", "Waste", "Transport", "Business travel", "Employee commuting", "Purchased goods and services" and "Other"; chose the DESNZ 2025 petrol factor on the sold-petrol record (B).
- What happened: The source line reads "Other · Petrol · Sales ledger, product PMS · owned or controlled · defaults to Scope 1, Stationary combustion", and after the factor was chosen the record read "Included, Scope 1, Stationary combustion" with no justification asked. Moving it to Scope 3 category 11 needed "Why the scope departs from the default". Likewise "Transport" (contractor-operated) defaults to "4. Upstream transportation and distribution" and "Waste" to "5. Waste generated in operations", so categories 9 and 12 are always departures (B).
- Why it matters: Corporate Standard ch. 4: Scope 1 is the company's own combustion. For an oil marketer category 11 is typically 80 to 90% of the total; a default that puts it in Scope 1 inflates Scope 1 by two orders of magnitude (about 374,000 t CO2e from this one record) if a preparer accepts it, no gate flags it because it is the default, and the justification rule asks for a reason on the correct treatment instead of the wrong one. It is the same failure as F17: a scope nobody chose.
- What to do: Add the kinds "Sold product (use phase)", "Sold product (processing)", "Sold product (end of life)", "Downstream transport", "Leased-out asset", "Franchise" and "Investment" with downstream defaults; give "Other" no default scope, so that classification is required.
- Evidence: Emission sources page for Tema Fuel Depot; record ACT-0007 detail (B-06).

**F66. The by-category table prints "0 lines 0.000 t CO₂e" for a declared category that is not quantified, and no screen or help article states the Scope 3 minimum boundaries.**

- Severity: Minor. Area: Run report section 04 ("Scope 3 by category"); Boundary > Operational boundary declaration; help.
- What happened: B declared categories 1, 2, 3 and 9 to 15 and gave "Not quantified this year because…" for 10, 14 and 15. Section 02 prints "10. Processing of sold products yes 0 declared, not quantified: ..." correctly, but section 04 prints "10. Processing of sold products 0 lines 0.000 t CO₂e" (and the same for 14 and 15), which reads as a quantified zero. The undeclared categories 4 to 8 appear only in the free text "Why other categories are excluded". The category names match the Scope 3 Standard, but nothing in the declaration, the classify panel or the help states a category's minimum boundary, for example the direct use-phase emissions of sold fuels for category 11 or the franchisees' Scope 1 and 2 for category 14 (B).
- Why it matters: Scope 3 Standard ch. 11 asks for emissions per category and for the excluded categories with their justification, and a zero must not stand in for "not quantified", the principle the product applies to exclusions; without Table 5.4's minimum boundaries a customer cannot check coverage.
- What to do: Print "not quantified" in section 04 for a declared category with no lines and list each undeclared category as a row with its reason; add each category's minimum boundary as help text in the declaration and in a help article.
- Evidence: run001 page text, sections 02 and 04; PDF page 2 (B-12).

**F67. Which parts of category 3 are covered is misstated: the report says T&D losses are computed when no T&D rule exists, and the worked example declares the category covered while the upstream of LPG and of purchased electricity is left out.**

- Severity: Minor. Area: Report section 08; PDF section 8; Method tab text; Get started steps 5 and 6.
- What happened:
    - With one upstream rule (well-to-tank diesel), section 08 reads "Transmission and distribution losses are computed on every kilowatt-hour consumed, at the location-based factor, not on the market-based balance."; no T&D line exists, and A2's declaration says T&D losses are not quantified (A2).
    - Get started declares category 3 covered and the "well-to-tank and grid-loss emissions of the fuel and electricity we buy (category 3) are quantified", but its rules derive only diesel well-to-tank and grid T&D losses: the two LPG records (41,600 litres) and the generation-fuel upstream of 70 GWh get no line, and the Classification gate reads "Pass". The Method tab defines category 3 as "the well-to-tank emissions of every litre in scope 1 and the transmission and distribution losses of every kilowatt-hour in scope 2" (D).
- Why it matters: Category 3 has three parts for a company that buys fuel and electricity: the upstream of fuels, the upstream of electricity and T&D losses (Scope 3 Standard ch. 5, Table 5.4); the report must say which activities of a category are covered (ch. 11). The LPG part is immaterial here; the teaching is the issue.
- What to do: Print the T&D sentence only when a T&D rule applied; add an LPG well-to-tank rule to Get started step 6 and have the declaration say which part is not quantified and why; widen the Method tab's definition to the three parts.
- Evidence: files/fy2025-oc-run001.txt (A2); Method tab rules card and gate text (D) (A2-08, D-06).

### Stage H: runs, the report and its PDF

**F68. The run's arithmetic reproduces, the emissions-by-gas table foots to the total with a row for CO2e-only factors and pro-rated gas masses, and the report states documented zeros and data-quality tiers.**

- Severity: none (positive). Area: Run report sections 04, 05, 6A, 08, 09 and 10; lines CSV.
- What I did: Recomputed ten lines and section 05 of A2's FY2025 Run 001 from the factors the run displays and footed the CSV (A2); recomputed A1's Run 001 (A1). The factors compared are DESNZ 2025 diesel (100% mineral) at 2.66155 kg CO2e/litre with its gas split, Ember Ghana 2024 at 0.468809 kg CO2e/kWh (CO2e only), R-410A at 1,924 kg CO2e/kg (DESNZ, AR5), DESNZ 2025 landfill at 520.5327 kg CO2e/t and well-to-tank diesel at 0.62409 kg CO2e/litre, all under AR5.

| Item | Recomputed | Product |
| --- | --- | --- |
| A2 haul diesel, 2,100,000 litre x 2.66155 (t) | 5,589.255 | 5,589.26 |
| A2 straddling record, 62,000 x 17/31 = 34,000 litre x 2.66155 (t) | 90.493 | 90.49 ("pro-rated: 17 of 31 days … (54.84%)") |
| A2 R-410A, 85 kg x 1,924 (t) | 163.540 | 163.54 |
| A2 Scope 1, 9,692,000 litre x 2.66155 + 97 kg x 1,924 (t) | 25,982.371 | 25,982.371 |
| A2 Scope 2 location-based, 65,790,000 kWh x 0.468809 (t) | 30,842.944 | 30,842.944 |
| A2 Scope 2 market-based, 40,790,000 kWh x 0.468809 (t) | 19,122.719 | 19,122.719 |
| A2 category 1 contractor diesel, 3,100,000 litre x 2.66155 (t) | 8,250.805 | 8,250.805 |
| A2 category 3 well-to-tank, 9,692,000 litre x 0.62409 (t) | 6,048.680 | 6,048.680 |
| A2 category 5 landfill, 310 t x 520.5327 (t) | 161.365 | 161.365 |
| A2 section 05, 33,755.291 + 3.723 + 423.997 + 186.628 + 37,052.990 (t) | 71,422.629 | "Total (scope 2 location-based), ties to section 04 71,422.629" |
| A1 Scope 2 location-based, 65,482,600 kWh x 0.468809 (t) | 30,698.83 | 30,698.83 |
| A1 Nkawkaw Scope 1, 8,694,300 litre x 2.66155 (t) | 23,140.314 | 23,140.314 |

- What happened: Section 05 has the row "CO₂e from factors without a gas split … 37,052.990" naming the grid, well-to-tank and landfill factors; the straddling record's gas masses are pro-rated (CSV ACT-0015 `co2_kg` 89,358.104 = 34,000 x 2.62818); the CSV's `kg_co2e` sums to 71,422,628.653 kg; diesel runs at the published 2.66155 with unrounded gas masses (A2). A1's run adds "6 records state a documented zero: ..." at pre-flight, "6 source-months report a documented zero." and a tier-by-scope table (85.1% tier 1) in section 08, "HCFC-22 6 kg Recorded mass of an excluded record not quantified ACT-0040, ACT-0042" in section 6A and "Evidence: PUMP-NKW-Q4-2025" on the lines (A1). Two seed defects still misattribute gases within a table that foots (F27, F28).
- Why it matters: Corporate Standard ch. 9 (emissions per gas in tonnes and in CO2e) and ISO 14064-3 re-performance. It closes the Blocker of 11 September (old F45) and old F44.
- Evidence: files/fy2025-oc-run001.txt, `fy2025-oc-run1/*-run-1-lines.csv` (A2); files/run001-report.txt, shots/020-officer-a1-20-preflight-draft.png, files/preflight-frozen.txt (A1) (A2-06, A1-39).

**F69. The PDF is now a reader's document: no internal identifiers, dates as "6 October 2026, 16:16 UTC", the header first, and a split table repeats its heading.**

- Severity: none (positive). Area: PDF report.
- What I did: Extracted the 7-page PDF of FY2025 Run 001 and looked at pages 1 to 3 as images (A2); read the sign-off lines of D's PDFs (D).
- What happened: "operational control approach (Corporate Standard, chapter 3)", "Assurance Not verified", "Outside reporting period", "Methodology exclusion"; the header table sits under the title; the gas table continues on page 3 under a repeated "5. Emissions by gas". The small defects that remain are in F76.
- Why it matters: The PDF is what goes to a board, a lender or the Ghana EPA (Corporate Standard ch. 9). It closes old F48.
- Evidence: fy2025-oc-run1/page1.png, page2.png, page3.png, pdf.txt (A2-13).

**F70. After a run, a corrected record is flagged nowhere: "Review activity data" refreshes nothing, the pre-flight's "Resolve 1 record →" opens an empty list, and the run can be submitted on the superseded figures.**

- Severity: Major. Area: Inventory (frozen, with Run 001) > pre-flight; Records > Review activity data; Activity data > "Resolve n items".
- What I did: After Run 001, corrected ACT-0038 (39,500 → 39,850 litre, with a reason) and moved ACT-0015 from "Contract haulage (Rocksure)" to "Haul fleet"; used "Resolve 1 item →" on Activity data and the pre-flight's "Resolve 1 record →"; reopened, reviewed, fixed ACT-0015 and launched Run 002 (A1). Moved five FY2024 records to correctly kinded sources and ran "Review activity data" (A2).
- What happened: Activity data's "Resolve 1 item →" listed only ACT-0032 ("Needs evidence"), which is right for data readiness. The frozen inventory turned to "Classification is blocking": "'Diesel - contractor haulage' is classified in scope 3; its emission source 'Haul fleet' defaults to scope 1. ..."; its "Resolve 1 record →" opened the view filtered to "Unclassified" with "No records match". The ACT-0038 correction produced no message at all: Run 001 still offered "Submit for review" with 39,500 litre on its line, the frozen view silently showed 39,850, and after the reopen the review logged "0 records reviewed, 0 refreshed". Changing the scope select to Scope 1 was refused ("'Stationary combustion' is not a category a mobile combustion emission source ('Haul fleet') can be classified into."); choosing the factor again gave "Scope 1 / Mobile combustion". Run 002 reproduced both corrections to the kilogram (Scope 1 +8,250.805 t and +0.932 t; Scope 3 -8,250.805 t) (A1). In A2's FY2024, "Review activity data" answered "All activity records are already reviewed." and the rows kept "Scope 1" until each factor was chosen again, although the help says "a record changed after review is refreshed by the next Review activity data" (A2).
- Why it matters: Corporate Standard ch. 7 (QA) and the sign-off workflow rely on the reviewer knowing that the facts behind a run have changed; here a run can be submitted on superseded data with nothing on screen saying so (F6 is the boundary-version case). A2 rated its source-change point Minor; it joins A1's Major because the review that should refresh both is one.
- What to do: Mark a run "facts changed since this run" with the records and the changes ("ACT-0038 quantity 39,500 → 39,850; ACT-0015 source ...") and hold "Submit for review" until acknowledged; make the pre-flight's link filter to the records its findings name; treat a corrected quantity or a source change as a change the review refreshes; let the scope select take the source's category.
- Evidence: shots/022-officer-a1-22-resolve-items.png, shots/023-officer-a1-23-preflight-after-corrections.png, shots/024-officer-a1-24-preflight-resolve-link.png, files/preflight-after-corrections.txt, files/preflight-reopened.txt (A1); files/fy2024-run002.txt (A2) (A1-38, A2-31).

**F71. The PDF of a correction run omits the correction block: neither the reason nor the comparison with the published run appears on any of its pages.**

- Severity: Major. Area: PDF report of a correction.
- What I did: Downloaded the PDF of Run 001 of "FY2025 Operational control (AR5) (correction)" and searched its text (A2).
- What happened: The HTML prints "Correction of FY2025 Operational control (AR5)", the reason, and "Against the published run: 0 lines added, 0 removed, 1 changed; +197.14 t CO₂e in total." The PDF has only "Report version 2, supersedes FY2025 Operational control (AR5)"; neither the reason nor the comparison appears on any of its 7 pages.
- Why it matters: Corporate Standard ch. 5 and ch. 9 require the context of a restatement, and the help says "the correction's report prints it with what changed"; the PDF is what is issued.
- What to do: Print the correction block in the PDF under the header.
- Evidence: fy2025-corr-run1/pdf.txt, files/fy2025-corr-run001.txt (A2-21).

**F72. Some factors are re-derived from rounded gas masses, so the line prints a figure that is neither the one the picker showed nor the one the publication states.**

- Severity: Minor. Area: Factor picker; report section 08; run lines.
- What happened: The picker shows "Bus: Average local bus ... 0.10385 kg CO₂e / passenger-km"; the report prints "0.103849 / passenger-km" (0.10311 + 3.6e-7 x 28 + 0.00000275 x 265), and the commuting line is 238.852 t, not 238.855 t (A1). Flights show "0.10916" in the picker and run at "0.109171 kg/passenger-km" with "CO₂ 0.10849 · CH₄ 3.6e-7 (fossil) · N₂O 0.00000253", so category 6 is 136.463 t against 136.450 t (A2); cars likewise (0.16272 against 0.162721) (A1); LPG runs at "2939.360949 / tonne" against the published 2939.36095 (B, C). Diesel, by contrast, now runs at its published 2.66155.
- Why it matters: Immaterial here (a few kilograms to tens of kilograms a line), but a verifier re-performing a line against the DESNZ table will not find the printed figure in it (Corporate Standard ch. 9).
- What to do: Use the published CO2e whenever the source publishes one, as for diesel, and treat the gas split as a disclosure.
- Evidence: files/run001-report.txt, files/picker-genset-diesel.txt (A1); files/fy2025-oc-run001.txt (A2) (A1-40, A2-07, B-13; C retest of old F25).

**F73. Section 09 lists every excluded record inline, other years' records included, so the exclusions of a retail network fill 71 of the PDF's 116 pages.**

- Severity: Minor. Area: Report section 09; Exclusions (CSV); PDF section 9; run report page.
- What happened: FY2024 Run 001 printed "Outside reporting period (37 records)", all of them FY2025 records, and FY2025 Run 001 "Outside reporting period (11 records)", row by row in the HTML, the PDF and the CSV, beside the two real exclusions (A2). At volume, 71 of the 116 PDF pages list the 1,981 franchised-station records as "Outside boundary ... not estimated" (section 9 reads "Outside boundary 1981 1981 not estimated"), and the report page renders 2,707 table rows with every exclusion inline (B).
- Why it matters: Corporate Standard ch. 9 asks for the exclusions of sources, facilities or operations within the inventory; records of another year are not exclusions, and the list grows every year. A verifier wants exclusions summarized by reason with the detail in an annex, and a franchisor's report should carry its network in category 14 (F63), not as pages of exclusions.
- What to do: Keep period mismatches out of section 09, or as a collapsed count; summarize exclusions by reason and facility in the report and move the record list to the CSV annex; paginate the exclusion list on the report page.
- Evidence: files/fy2024-run001.txt, files/fy2025-oc-run001.txt (A2); files/run002/ (B) (A2-09, B-23).

**F74. Two disclosures do not say what they rest on: the intensity does not name the scopes it divides, and in an AR6 view the CO2e-only factors keep their AR5 basis without a word.**

- Severity: Minor. Area: Report sections 04, 05 and 08; PDF.
- What happened: "0.336899 t CO₂e per oz of gold produced (212,000 oz)" is 71,422.629 / 212,000, that is Scope 1, Scope 2 location-based and Scope 3, and says none of it. The equity-share AR6 report says "More than one assessment report was used: a blend whose composition is not recorded keeps the CO₂e its source stated under IPCC AR5" and lists the DESNZ landfill and well-to-tank rows as "IPCC AR6", although DESNZ computed them under AR5 and the run cannot re-derive them (A2).
- Why it matters: Corporate Standard ch. 9 and ch. 11: a ratio indicator states its basis, and mining intensity is normally on Scope 1 and 2; the GWP basis is reported, and the pre-flight itself says "a final run needs one GWP set across the inventory".
- What to do: Label the intensity's basis and offer Scope 1 and 2 (both methods) as the default; label every CO2e-only factor published under another set as such in the factor register, name it in the methodology sentence and warn at pre-flight.
- Evidence: files/fy2025-oc-run001.txt, files/fy2025-eq-run001.txt (A2-14, A2-17).

**F75. Section 08's data-quality and uncertainty statements describe the activity data only: "100% of the total rests on tier 1 data" where 94% of the total uses a caveated proxy factor, and "±2.9%" is a weighted average, not the uncertainty of the total.**

- Severity: Minor. Area: Run report section 08; help "Fill the report header and read the report", "Enter a record".
- What happened: Kumasi Cement Works' report prints the clinker row's caveat and check note and "1 line uses a proxy factor", and also "100% of the total rests on tier 1 data (metered or invoiced primary data, 5 lines)"; the clinker line is 91,800 of 97,687.21 t (C). Gye Nyame Gold's reads the same although 16,207 t of category 3 rests on a UK factor used by analogy and on a derived factor (D). E's reads "15 of 17 lines record a quantitative uncertainty; weighted by emissions it is ±2.9% for those lines.", and the help says only "Add Uncertainty, ± % where the source states it" (E).
- Why it matters: Scope 3 Standard ch. 7 assesses activity data and emission factors together; a weighted average is not the uncertainty of a total (for independent streams the relative uncertainty of the total is smaller) and it leaves out the factors' uncertainty (IPCC 2006 vol. 1 ch. 3). ISO 14064-1 clause 8 asks for an uncertainty assessment, and a reader may quote ±2.9% as the inventory's.
- What to do: Add the factor's quality (proxy, caveat, secondary source) to the data-quality table or as its own line; label the figure "activity data, emissions-weighted average"; add a help section on assessing and stating uncertainty (F101).
- Evidence: shots/004-owner-19-run001-v1-report.png (C); D's Help log, Get started step 7; report section 08 of Help Check (E) Run 001 (C-36, E-26; D's Help log).

**F76. Export files of different views share one name, the PDF title does not name the view, the "Frozen inputs" file can re-derive neither the upstream lines nor the run's records, and three small PDF defects remain.**

- Severity: Minor. Area: Run page downloads; PDF; Frozen inputs (JSON); help "Export the report".
- What happened:
    - Run 1 of "FY2025 Operational control (AR5)", of "FY2025 Equity share (AR6)" and of the correction all download as "asante-gold-resources-a2-org-0002-2025-run-1.pdf" (and "run-1-lines.csv", "run-1-inputs.json"), and each PDF opens "GHG inventory report: Asante Gold Resources (A2) (ORG-0002), 2025 / Run 1 (Run 001)" (A2).
    - run-1-inputs.json holds the run settings, the boundary version, the factors, the instruments and the residual-mix fields, but nothing names the rule "Liquid fuels: Diesel (100% mineral diesel) → Well-to-tank" that produced 10 lines (the lines CSV does carry `derived_from_line_id` and `derived_kind`) (A2). At volume the file is 19,187 bytes, the same size as for B's run before the volume import, because it carries no records or classifications (B).
    - The upstream-rule arrow is lost in the PDF ("Liquid fuels: Diesel (100% mineral diesel)  Well-to-tank: …"), and the declared categories print in tick order ("1, 5, 6, 15, 3") (A2).
    - The help's export article says the files "never change after the run" and that "Downloading a file again later returns the same content", and also that the PDF carries the header and final designation "as they stand when you download it" (A2, E).
- Why it matters: A verifier's evidence folder overwrites one view with another, and the approach is the first thing a reader must know (Corporate Standard ch. 9); a file called "Frozen inputs" that cannot reproduce the run without the CSVs will be misread (ISO 14064-3 re-performance).
- What to do: Put the inventory name, or the approach and GWP set, in the file names and the PDF title; add the upstream rules to the frozen inputs, and either add the records and classifications or rename the file ("Run settings and factors"); keep the arrow and sort the categories; say in the help that the CSV and JSON never change and the PDF reprints the header as it stands.
- Evidence: `fy2025-oc-run1/`, `fy2025-eq-run1/`, `fy2025-corr-run1/` (A2); files/run002/ (B) (A2-18, A2-11, A2-13, B-23, E-18).

### Stage I: lifecycle: final, publication, correction, base year

**F77. The lifecycle acts ask for their reasons and hold: a reopen asks why, a freeze holds while a scope departure is unjustified, a void keeps the run, publication fixes the report, a correction needs a reason and prints a line diff, and the base year is designated and a candidate declined with a note.**

- Severity: none (positive). Area: Inventory lifecycle; Create correction; Base year.
- What happened: "Reopen as a draft?" requires a reason and the history prints it; "The report version in the header counts corrections, not freezes."; unjustified scope departures hold the freeze; voided runs keep their numbers (A2). E's correction run reads "Against the published run: 0 lines added, 0 removed, 1 changed; +5.86 t CO₂e in total." (E). A2 designated FY2024 (Run 002, 52,172.32 t, threshold 5%, "From the transaction date (membership windows)"), raised a candidate and declined one with a note (A2).
- Why it matters: Corporate Standard ch. 5 and ch. 7; ISO 14064-1:2018 clause 8.2. It closes old F31 and F54 and keeps old F42 and F53.
- Evidence: a2-007-base-year-designated.png (A2 retests of old F31, F42, F53 and F54; E's correction run; A2-24).

**F78. A correction loses the per-category "not quantified" reasons of the Scope 3 declaration, so the restated report prints "no reason recorded".**

- Severity: Major. Area: Create correction; report section 02; PDF section 2.
- What happened: The published report read "15. Investments yes 0 declared, not quantified: The investees (Wassa 30%, Ahafo 40%, Bonsu 5%) report no data to AGR …". The correction ("48 decisions inherited") reads "15. Investments yes 0 declared, not quantified: no reason recorded", and its PDF drops the sentence. The "Why other categories are excluded" text, the instruments, the uncertainty statement and the intensity denominator did come across (A2).
- Why it matters: Scope 3 Standard ch. 11 requires the justification, and the correction dialog promises that it "inherits this inventory's … declaration"; the restated report a reader relies on loses a disclosure the published one had.
- What to do: Copy the per-category reasons with the declaration, also for "Copy the view from".
- Evidence: files/fy2025-oc-run001.txt, files/fy2025-corr-run001.txt, fy2025-corr-run1/pdf.txt (A2-22).

**F79. A correction's comparison counts one changed line where two changed, and neither it nor "Since publication" says which record changed, who changed it, when or why.**

- Severity: Minor. Area: Correction run (section 00); published run ("Since publication").
- What happened: Correcting ACT-0004 (2,120,000 → 2,180,000 litre) changed the diesel line (+159.693 t) and its derived well-to-tank line (+37.445 t); the correction says "0 lines added, 0 removed, 1 changed; +197.14 t CO₂e in total". The published run's block reads only "Diesel consumption: quantity 2120000 → 2180000", with no record number, facility, date, author or reason (A2).
- Why it matters: Corporate Standard ch. 5 (explain the change) and ISO 14064-1 clause 8 (traceability): a verifier ties a restatement line by line.
- What to do: List the changed lines with the record, the old and new quantity and the tCO2e, count derived lines, and print the record's reason, author and date in "Since publication".
- Evidence: files/fy2025-corr-run001.txt (A2-23).

**F80. The acquisition of Tarkwa Logistics never becomes a recalculation candidate, and a structural change cannot be raised by hand.**

- Severity: Major. Area: Base year (Recalculation history); freeze.
- What I did: Designated FY2024 as base year; froze FY2025 (Tarkwa "member from 2025-07-01", with its 2024 data on file: 1,400,000 litre and 600 MWh); created a correction of FY2024, cleared Tarkwa's window so that its 2024 records came in ("2 stale decisions refreshed."), and froze it; opened "Raise a candidate" (A2).
- What happened: After both freezes: "No recalculation candidates yet. Freezing an inventory whose boundary differs from the base year records one here". The acquisition date sits on the entity, so the base year's boundary carried the same window and nothing "differs"; a facility that emitted nothing in the base run never flags. The manual dialog offers only "Methodology change" and "Significant error corrected" (the base-year spec refuses a manual structural change because freezes raise it). The acquisition is 4,007.5 t, 7.68% of the base year, and A2 had to file it as a methodology change.
- Why it matters: Corporate Standard ch. 5: acquiring an operation that existed in the base year is a structural change that triggers recalculation above the threshold, and "What is the base year?" promises it ("Structural change: A site sold or acquired, a membership window changed. … A freeze whose boundary differs from the base year's").
- What to do: Detect a structural change from membership windows that begin or end after the base year, weighed with the acquired operation's base-year records; add "Structural change" to the manual triggers.
- Evidence: a2-007-base-year-designated.png, a2-009-raise-candidate-dialog.png, files/fy2024-corr-run001.txt (A2-24).

**F81. A published base year cannot be recalculated: the correction's run is refused as the comparison run and is not offered as the recalculated base, so "RECALCULATED" records the original figure in every later report.**

- Severity: Blocker. Area: Base year (Raise a candidate, Record recalculated base); report section 07; help "Decide a recalculation candidate".
- What I did: Followed "Decide a recalculation candidate" ("Launch a run of the base-year inventory that reflects the change, for example from a correction"): the FY2024 correction's Run 001 came to 56,179.829 t ("Against the published run: 2 lines added, 0 removed, 0 changed; +4,007.5 t CO₂e"); pasted its id into "Comparison run id (optional)", then typed 7.68 instead, raised the candidate and opened "Record recalculated base" (A2).
- What happened: Inline: "The comparison run must be a run of the base-year inventory 'FY2024 Operational control (AR5)'." The id is still typed by hand (old F52). "Recalculated base run" offered only "Run 002 · 52,172.32 t CO₂e", since a published inventory takes no new runs. Recorded with a note, the history reads "RECALCULATED … 7.68% … recalculation required … recalculated base: Run 002", and section 07 of later runs prints "Recalculated base (Run 002): 52,172.32 t CO₂e", the unchanged figure. A base year is normally published, so this is the common case.
- Why it matters: Corporate Standard ch. 5 requires the base year to be restated when the threshold is crossed. The product records a recalculation that changed nothing and prints it as one, so the trend a verifier tests rests on a base year 7.68% low, and the help describes a route the product refuses. A2 rated it Major; I raise it because a required control cannot operate and the product prints a materially wrong comparative.
- What to do: Accept the runs of the base-year inventory's corrections as comparison and recalculated-base runs, offer them in a picker and derive the share from them; refuse "Record recalculated base" when the chosen run is the original base run.
- Evidence: a2-013-comparison-run-refused.png, `a2-014-record-recalc-only-run002.png`, a2-015-base-year-after-decisions.png (A2-25).

**F82. The emissions profile lists each correction as a separate row of the same year instead of one restated series.**

- Severity: Minor. Area: Report section 07 (Emissions profile over time).
- What happened: Section 07 of the FY2025 correction run lists "2024 FY2024 Operational control (AR5) 52,172.32 t CO₂e 52,172.32 t CO₂e", "2024 FY2024 Operational control (AR5) (correction) not yet final", "2025 FY2025 Operational control (AR5) 71,422.63 t CO₂e" and "2025 FY2025 Operational control (AR5) (correction) not yet final" (A2).
- Why it matters: Corporate Standard ch. 9 asks for a profile over time consistent with the recalculation policy: one figure per year, the latest restated one, with the superseded figure marked.
- What to do: Show one row per year (the latest final or published version), with superseded versions folded under it.
- Evidence: files/fy2025-corr-run001.txt (A2-26).

### Stage J: deletion, concurrency and sessions

**F83. Deleting an organization or a facility now protects the record: a facility with records and a record a run used are refused with the rule named, an organization with a published inventory cannot be deleted even after a correction supersedes it, a platform administrator has no delete path, and a draft-only organization needs its typed name and a reason.**

- Severity: none (positive). Area: Facilities (Remove); record drawer (Remove); Settings > Danger zone; Administration > Organizations.
- What happened: "'Kumasi Core Store' has recorded activity data. Facts are the audit trail: remove or reassign its activity records before deleting the facility." (rule "ghg.facility.has-records"); "ACT-0036 is used in run 1 and cannot be removed. Reported results must stay traceable to their source: correct the record instead." (rule "ghg.activity.used-in-run"); "Asante Gold Resources (A2) has records the company has issued: FY2025 Operational control (AR5): Published; FY2024 Operational control (AR5): Published" with Delete disabled (A2); "Scratch (C) has records the company has issued: Scratch FY2025: Published", before and after a correction (C). The console's Organizations rows offer only "Assume access", and a grant "never carries deleting the organization" (C). "Scratch (A2)" and "Scratch draft (C)" needed "Type ... to confirm" and a reason of at least 10 characters, and their addresses then read "Organization not found" (A2, C). The lead confirmed in the database that deleting an organization is a soft delete: the row stays with its deletion time, the deleting account and the reason.
- Why it matters: ISO 14064-1:2018 clause 8.2 (retention of the records behind an issued report). It closes old F6.
- Evidence: a2-016-remove-facility-refused.png, a2-017-delete-org-dialog.png, shots/016-owner-41-delete-org-refused-published.png (A2-27, C-29; lead's note 2).

**F84. One click on "Delete" in the inventories list destroyed an inventory with its two runs, its two boundary versions and a run in review: no confirmation, no reason, done by a Reviewer, and no line in any history.**

- Severity: Blocker. Area: Inventories list ("Delete" in the Actions column).
- What I did: Signed in as the reviewer (role Reviewer), opened Inventories to find the inventory "IN REVIEW · BOUNDARY v2", and clicked "Delete" on its row to see what it offered (D).
- What happened: No dialog. The list changed at once to "No inventories yet"; after a reload the inventory's address reads "Inventory not found. It may have been deleted." and Run 002's report "Report not found. This run may have been deleted." The organization's History (Settings, as the owner) has no line for it. FY2025 held Run 001 (86,412 t CO2e, submitted and withdrawn), Run 002 (86,428.43 t, "IN REVIEW", submitted by the preparer with a note), boundary versions 1 and 2, the report header, the Scope 3 declaration, eight classifications and two upstream rules. The help documents no inventory deletion and the role matrix has no row for it. The lead confirmed in the database that this is a hard delete: the inventory and its runs are gone, unlike an organization's soft delete (F83). D rebuilt FY2025 to finish the slice.
- Why it matters: The product's own rule is "A run is never deleted: it can be voided with a reason, and its number is never reused." Deleting the inventory deletes the runs, the sign-off trail and the boundary versions without trace, which defeats the retention and audit-trail requirements a verifier tests (Corporate Standard ch. 7; ISO 14064-1:2018 clauses 8.2 and 9; ISO 14064-3). A reviewer, who should be the control, can erase the preparer's submission, and so can a slip of the mouse.
- What to do: Refuse to delete any inventory that has a run (offer void and supersession instead); for a run-less draft, require the typed name and a reason, restrict it to owners, keep a tombstone and write "Inventory deleted" with the reason to the organization history; document it in the help and the role matrix.
- Evidence: 002-reviewer-D-21-reviewer-inventories-list.png, 011-owner-D-22-run002-after-inventory-delete.png (D-15; lead's note 2).

**F85. The deletion texts disagree, one suggests that superseding a published inventory unblocks deletion, and the record kept of a deleted organization is shown nowhere.**

- Severity: Minor. Area: Settings > Danger zone and the Delete organization dialog; Administration > Organizations and Platform overview; help "Edit the organization's details and read its history".
- What happened:
    - The Danger zone reads "Everything under it goes: facilities, activity data, inventories and runs. ... the deletion is kept (spec 01.3)."; the dialog says the facilities, activity data and runs "stay in the database". The refusal reads "Publish records are kept: withdraw the final designation or supersede the published inventory first." (sic "Publish"), yet superseding with a correction did not unblock it, and should not. The help repeats the card and the refusal (A2, C).
    - After "Scratch draft (C)" was deleted, ORG-0010 is gone from Organizations and "Recent platform activity" lists factor pack events only, with no creation or deletion; the dialog had promised "The record of who removed it, when and why is kept", but nobody can read it without the database. An owner named by an administrator at creation received no email (C).
- Why it matters: The owner cannot tell what a deletion destroys, and a verifier or a client who asks who removed an organization and why cannot be answered from the product (ISO 14064-1:2018 clause 8.2).
- What to do: One accurate statement (removed from view, kept on file); "Published records are kept, so an organization with a published inventory cannot be deleted."; list removed organizations (name, account number, who, when, reason) under Organizations, and creation and deletion in Recent platform activity; email an owner named by an administrator.
- Evidence: a2-017-delete-org-dialog.png, shots/016-owner-41-delete-org-refused-published.png (A2-29, C-30, C-31).

**F86. A closed site can never be retired: the refusal advises removing or reassigning its records, but run records cannot be removed and reassigning them would misstate where the fuel or power was used.**

- Severity: Minor. Area: Facilities (Remove).
- What happened: Removing Kumasi Core Store is refused (F83), and its records cannot be removed ("ACT-0036 is used in run 1 and cannot be removed"); the only other route the message names is moving the records to another facility. A facility has no closing date (entities have "Disposed of on"), and "used in run 1" does not name the inventory although four inventories had a Run 1 (A2).
- What to do: Offer "Closed on" for a facility, after which it leaves later boundaries and the coverage matrix; drop "reassign" from the advice; name the inventory in "used in run 1".
- Evidence: a2-016-remove-facility-refused.png (A2-28).

**F87. When two people classify the same record at once, the second choice silently replaces the first, and the first person's screen keeps showing the factor they chose.**

- Severity: Major. Area: Inventory > Records > classify panel ("FY2025 concurrency").
- What I did: The owner and the preparer opened "Kitchen LPG" (ACT-0006) in the same draft in two browsers; the owner chose "Gaseous fuels: Propane (/litre)" and, 26 seconds later, the preparer, whose panel still read "Gaseous fuels: LPG (/litre)", chose "Gaseous fuels: Butane (/litre)" (D).
- What happened: Both saves succeeded with no conflict message. The record holds butane; the owner's panel still read "Gaseous fuels: Propane (/litre) · Gaseous fuels / Propane defra-2025" until a reload. The History keeps both lines (propane at 17:01:03 by owner@d.gng.test, butane at 17:01:29 by preparer@d.gng.test). The help says nothing about concurrent work.
- Why it matters: A classification decision is lost without its author knowing, and the person who believes the record carries their factor may freeze or sign off on that belief. The trail is intact; the control fails at the moment of the decision (Corporate Standard ch. 7: the review relies on what the reviewer sees).
- What to do: Send the version the panel was loaded from with each classification and refuse a stale write ("Ama Mensah changed this record's factor to Butane at 17:01; reload to see it"), or push changes to open panels.
- Evidence: 013-owner-D-34-conc-A-stale-propane.png (D-23).

**F88. A page that sent a refused act keeps showing the old state, and an open panel keeps a quantity that has since been corrected.**

- Severity: Minor. Area: Inventory page in two browsers.
- What happened: The preparer reclassified after the owner had frozen the inventory: refused with "The inventory is frozen. Reopen it as a draft to change it." (409), while the preparer's header still read "DRAFT". The owner launched a run after the preparer had reopened: refused with "The inventory is a draft. Freeze it to enable a run." (409), while the owner's header still read "FROZEN · BOUNDARY v1" with "Launch calculation run" enabled. After the owner corrected "Genset diesel" from 900,000 to 950,000 litres, the preparer's open panel kept "ACT-0005 · Obuasi Camp · 900,000 litre" with no notice until a reload. Neither 409 carries a "rule" id, unlike the sign-off refusals (D).
- Why it matters: Nothing is corrupted: the server holds the line and the messages are clear. But the screen contradicts the message, and a reviewer classifying from the panel sees a quantity that is no longer the record's.
- What to do: Refetch the inventory after any 409 and on window focus; mark an open panel stale when its record changes; give these two refusals rule ids.
- Evidence: 006-preparer-D-35-conc-B-classify-after-freeze.png, 014-owner-D-36-conc-A-launch-after-reopen.png, 007-preparer-D-37-conc-B-after-correction.png (D-24).

**F89. A session ends without warning and the screen does not recover: after about 30 minutes of deciding import cards, "Add records" failed with only "Authentication is required.", and a browser signed out by a password reset says the organization "may have been deleted".**

- Severity: Major. Area: Activity data > Import; session handling on every page.
- What I did: Decided 211 import cards, which make no server call, and clicked "Add records" (B); reset the preparer's password from a second browser, then clicked "Open inventory" in the first (D).
- What happened: The add request returned 401 and the page showed "Authentication is required." (also in the live region) with the 211 decisions still on screen, no sign-in link and no warning beforehand; signing in again in a new tab of the same browser and clicking "Add records" in the original tab then worked ("2575 records imported. 211 emission sources added during import." in 42,807 ms). A customer who reloads, or follows the sign-in redirect, loses the hour of decisions (B). The reset matched the help word for word and ended every session ("Choose a new password for preparer@d.gng.test. Every session of the account is signed out when you save it."); the first browser then read "Organization not found. It may have been deleted. Head back to the list to pick another." and "Inventory not found. It may have been deleted. Back to inventories" while every call returned 401 "Authentication is required.", and only a full reload went to Sign in (D). Sessions end after about 25 to 30 minutes idle, which is the product's idle timeout (B, C, D; lead's note 5). D rated its half Minor; B's consequence makes it Major.
- Why it matters: The longest task in the product outlasts the session, and a user told their organization may have been deleted will assume data loss, which after F84 is not a far-fetched reading.
- What to do: Keep the session alive while an import preview is open, or extend it on local activity, and warn before expiry; on any 401, open a sign-in dialog that returns to the page with its state ("You were signed out. Sign in again to continue."); say in the import help that signing in again keeps the preview.
- Evidence: 008-preparer-D-38-old-session-after-reset.png (D); page text and timings in B/officer (B) (B-22, D-25; lead's note 5).

**F90. Disabling an account does not end its open sessions: the disabled preparer saved a new draft record two minutes after "Ama Mensah (D preparer) disabled." and could still read the inventory five minutes later.**

- Severity: Major. Area: Administration > Users > "Disable"; every organization page.
- What I did: With the preparer signed in, the platform team clicked "Disable" on her row (help: "the account can no longer sign in, and its history stays"); in her open browser, opened Activity data, clicked "+ Add activity", typed "Disabled-user test draft", chose "Obuasi Camp" and clicked "Save draft"; five minutes later, loaded the inventory page in full (D).
- What happened: "Ama Mensah (D preparer) disabled." at 17:18:37; at 17:20:24 the disabled user got "Draft saved." and the record exists in Gye Nyame Gold (D); at 17:23:41 a full page load still returned data. A new sign-in in another browser was refused. A password reset, by contrast, ends every session at once (F89).
- Why it matters: Disabling is how a client removes a departing preparer or a compromised account; a disabled person who can still write activity data, classify or submit can alter the inventory under their own name after losing access. An ISO 14064-3 verifier testing access controls would record a deficiency.
- What to do: Revoke every session of the account when it is disabled, as the reset does, and refuse any request from a disabled account; add a regression test.
- Evidence: 009-preparer-D-39-disabled-preparer-draft-saved.png (D-26).

**F91. A disabled member looks active inside the organization, and the disabled person is told "Invalid email or password." with a help answer that loops.**

- Severity: Minor. Area: Settings > Members; Sign-off card; run row; Sign in; help "Fix a sign-in or access problem".
- What happened:
    - Members lists "Ama Mensah (D preparer) preparer@d.gng.test" with the Preparer role and no mark; FY2025's Sign-off card still names her as the only person who may submit; her pending run reads "IN REVIEW · Submitted for review by Ama Mensah (D preparer) on 06/10/2026" with no flag, and the reviewer may return it to someone who cannot sign in. The disable took one click, with no confirmation and no reason, and nobody in the organization was told. What should stay did: the History lines, the run row and "Prepared by Ama Mensah (D preparer) (preparer@d.gng.test), run 3, ..." on screen and in a PDF exported after the disable (D).
    - Signing in with her current password gave "Invalid email or password." (401, rule "user.credentials.invalid"); the help's row for that message says "Check both. If you forgot the password, click Forgot your password? ...", and "Reset a forgotten password" says "Only an active account gets the email". The single message for a disabled account is deliberate (it stops accounts being enumerated, spec 01), so the fix belongs in the help (D).
- Why it matters: The approver should know before signing that the preparer is gone (Corporate Standard ch. 7), and a person disabled by mistake loops between two pages. Keeping the name on past acts is right (ISO 14064-1:2018 clause 8).
- What to do: Show "Disabled" on the member row and in the Sign-off lists; warn on a run submitted by a disabled account; ask the platform team for a reason when disabling, record it and notify the owners; add the disabled case to the help's row ("If your account was disabled, ask your organization's owner or ECORIV").
- Evidence: downloads/1791307350064-gye-nyame-gold-d-org-0004-2025-run-3.pdf, 001-preparer2-D-40-disabled-sign-in.png (D-27, D-28).

### Stage K: sector fit and volume

**F92. With the catalogue narrowed to DESNZ and Ghana by decision, the signature sources of the stated markets have no catalogue factor (explosives, purchased quicklime, cyanide, clinker, rebar and structural steel, flaring, venting and tank losses); the organization-factor route works, also for a sole member, but nothing in the product or the help points a customer to it.**

- Severity: Major. Area: Emission factors > Factor packs; Add factor; overview checklist; help "Import a factor pack", "Add and approve a factor".
- What I did: Imported the packs the overview proposes ("One import of each gives the DESNZ and Ghana rows"), searched DESNZ for explosives, lime and cyanide, and searched the help for "mining sector pack" (A1). Looked for a clinker, lime or cement factor for a cement grinder (C). Looked for flaring, venting and tank-loss factors and for construction steel; recorded tank and vent methane as the gas itself; added a hand factor for district cooling; searched the help for "construction", "flaring", "oil and gas" and "sector pack" (B). Entered and approved factors by hand as a sole member (A2 for 2024, E for purchased steam).
- What happened: The Factor packs table lists three editions: "UK Government (DESNZ) GHG conversion factors 2025" (1,928), "... 2026" (1,868) and "Ghana: grid electricity and transmission losses" (7). Nothing usable was found for an ANFO or emulsion detonation factor, for purchased quicklime (category 1) or for cyanide, so A1 excluded them as "Methodology exclusion", "Not estimated" (A1). C authored a clinker proxy in the console as the platform team, which a client cannot do (C). There is no flaring, venting or tank-loss factor or method; methane as itself exists only through the DESNZ "Kyoto protocol products" row, which prints as HFCs (F27); DESNZ has no reinforcing-steel row (only "Metal: steel cans" and "scrap metal"), so the rebar was excluded "not estimated" while the concrete was priced from DESNZ material use; district cooling needed a hand factor (B). The help has no page on any of this: "mining sector pack" returns 20 results, none relevant, and "construction" and "flaring" return "Nothing matched" (A1, B). The route itself works: E's hand-entered "Purchased steam and heat (EPA Hub 2025)" was approved at one click as "Approved by officer@e.help.test on 2026-10-06 15:14 (self-approved: nobody else could check it)", A2's four 2024 factors ran, and B's cooling factor printed "self-approved: nobody else could check it" in the report. A1 believed that a one-person team cannot finish without adding a member; the product records a self-approval where nobody else can check (spec 02.11), so it can. HCFC-22 is reported outside the scopes from the DESNZ Montreal Protocol rows (A1's section 6A: "HCFC-22 6 kg"). The narrowing is a decision (spec 02.9, 15 September 2026): Corporate Standard ch. 6 asks for a factor appropriate to the source, every extra pack is another edition to keep current and another citation to defend, a preparer is expected to "enter the supplier or study factor by hand and approve it", and a curated Ghana or West Africa selection was declined on 5 October 2026 (ECO-23). B and C reported the absent packs as a finding because the brief listed them; I do not carry that, and the consequences stand.
- Why it matters: Explosives detonation is a Scope 1 process source at every open-pit mine; purchased quicklime, cyanide and clinker are the category 1 hotspots of a gold plant and a cement grinder; flaring, venting and tank losses are an oil and gas company's Scope 1 methane; steel and rebar are a contractor's category 1 and 2 (Corporate Standard ch. 4; Scope 3 Standard minimum boundaries of categories 1 and 2). A customer who is not told that these need an organization factor or an outside method, and where an official one comes from, excludes them as "Not estimated" or stops, and a verifier raises the completeness gap (Corporate Standard ch. 1 and ch. 9).
- What to do: Keep the decision and close the gap around it: list on the overview's checklist and in the help the common sources of the stated markets that the catalogue does not carry, with the route for each (an organization factor with its source, URL, years and evidence, self-approved and disclosed when nobody else can check; or a mass computed outside the product with a published method and recorded as the gas itself once F27 is fixed) and where an official or supplier factor comes from; say the same on "Import a factor pack".
- Evidence: Emission factors page, packs table (A1); shots/002-curator-02-factor-packs-catalogue.png (C); shots/009-officer-factor-packs-three-only.png (B); factor rows in E/officer (A1-06, C-35, B-01, B-11, B-08, E-17, A2-02; lead's note 1).

**F93. A 2,575-row monthly file for 85 stations did not import without help: its 211 unknown-source cards are decided one by one, the first pass left the tab unresponsive for about 50 minutes, and the session expired under it; the ECO-31 baseline below records each step's time and what was worked around.**

- Severity: Major. Area: Activity data > Import (preview, "Decide N unknown emission sources"); the volume flow end to end.
- What I did: Generated the product's template for 85 stations over 12 months (grid electricity and genset diesel at every station, R-410A top-ups at 45 franchised stations with 465 documented zeros, each with its own note): 2,575 rows, 478 KB. Uploaded it, decided the cards, added, reviewed, classified a sample, froze, ran and exported, timing each step with performance.now() (B).
- What happened: The preview read "2575 records to add", "2575 rows: reference only, nothing attached", "465 rows: documented zero" and "Decide 211 unknown emission sources". Each card needs "Create 'name'" and a kind that starts on "Stationary combustion" (F17); there is no "create all" and no single decision for one name across facilities, and each decision re-renders the whole preview. On the first pass the tab stopped answering for about 50 minutes (the harness reported that session unreachable); on the retry one card took 1,471 ms (the radio) plus 1,284 ms (the kind), and a scripted chunk of 20 cards took 120,015 ms. The session expired under the decisions (F89). After the import, 1,977 franchised-station records were excluded on review as outside the boundary (F63), and the 598 company-station records needed one-by-one classification (F50): B classified six to time them and bulk-excluded the other 591 with the reason "Volume test" to reach a run, so Run 002 is a performance baseline only, not an inventory.

| Step (B, 6 October 2026) | Time | Finished? |
| --- | --- | --- |
| 85 facilities and 6 franchisee entities through the forms, scripted | 6.5 minutes (3.3 to 8.2 s a form) | Yes; about an hour by hand, by B's estimate |
| Facilities list, 91 rows | 4,476 ms | Yes; no search, filter or pagination |
| Import preview, 2,575 rows | 13,047 ms (15,475 ms on the retry) | Yes |
| 211 unknown-source cards | First pass: tab unresponsive for about 50 minutes. Retry: 6,001 ms a card, about 21 minutes for 211, scripted | Only on the retry; well over an hour by hand |
| "Add records" | 401 "Authentication is required."; after a sign-in in another tab, 42,807 ms | Worked around |
| "Review activity data" | 32,735 ms ("2575 new records under review.") | Yes |
| Register, 2,603 records | 2,533 ms; search 1,782 ms; facility filter 786 ms | Yes |
| Inventory page; Records tab; search of the view | 2,229 ms; 6,745 ms; 3,589 ms | Yes |
| Classification, one record | 0.6 to 1.5 s to open, 3.7 to 5.0 s to save (33,071 ms for six) | No: six timed, 591 of 598 bulk-excluded ("Volume test") |
| Freeze | 1,333 ms (dialog), 7,452 ms (freeze) | Yes |
| Run 002, 43 lines | 42,051 ms | Yes |
| Report page | 9,149 ms on a clean reload (2,707 table rows); about 8 minutes on the first attempt, partly the harness's own wait | Yes |
| PDF | 11.4 s (312 KB, 116 pages) | Yes |
| Lines CSV; Exclusions CSV; Frozen inputs JSON | 6.0 s; 5.4 s (502 KB); 5.3 s (19,187 bytes) | Yes |

- Why it matters: The monthly granularity the product asks for ("monthly rows make the coverage matrix and cut-off checks precise") is exactly what produces hundreds of station and source pairs; a retailer cannot finish an import of this size without outside help, or without registering 211 sources by hand first (Corporate Standard ch. 7, data management).
- What to do: Group the cards by source name with one decision ("Create 'Station grid supply' at the 83 facilities that lack it, kind Purchased electricity"); suggest the kind from the name and unit; virtualize the preview's rows so a decision does not re-render 2,575 of them; keep the session alive while a preview is open (F89); rerun this baseline after each fix.
- Evidence: files/akwaaba-stations-2025.csv; B/officer and B/officer2 timings; files/run002/ (B-19, B-22, B-20, B-23, B-21).

**F94. At 2,603 records the register and the inventory's Records tab paginate at 50 and stay usable: the register loads in 2.5 s, the Records tab in 6.7 s, a search answers in under 4 s, and no row carries its own factor select.**

- Severity: none (positive). Area: Activity data register; Inventory > Records.
- What happened: "50 of 2,603 records, page 1 of 53" with "Previous" and "Next"; the facility filter answers in 786 ms; "Search the view" reaches "36 of 36 records" in 3,589 ms; the Records tab has 7 selects on a page (the 107-option select per row of 11 September is gone) and its accessibility snapshot completes in 2,845 ms (83,674 characters). Neither list sorts by column, and the coverage matrix still lists every facility and source (267 lines) below the list (B).
- Why it matters: A preparer can work a backlog of thousands of rows; this resolves the scale half of old F36 (classification itself does not scale, F50).
- Evidence: B/officer timings (B-21; A1 retest of old F36).

**F95. Setting up an 85-station retailer is form by form: there is no facility or entity import, the Facilities list shows all 91 rows unpaginated, and the facility types have no station, depot or terminal.**

- Severity: Minor. Area: Facilities > Add facility; Legal entities > Add legal entity; Facilities list.
- What happened:
    - 85 facilities and 6 franchisee entities took a scripted 6.5 minutes through the forms (3.3 to 8.2 s a round trip), which B estimates at 30 to 45 s a site and about an hour by hand; there is no import for facilities or entities, and the activity import refuses an unknown facility ("no facility named 'name'"). The Facilities page took 4,476 ms to show all 91 rows, with no search, filter or pagination, and every facility select (activity form, register filter, import, Method tab) is a plain list of all 91 sites.
    - "Facility type (optional)" offers "Office", "Mine", "Processing plant", "Warehouse", "Port or loadout", "Camp", "Fleet depot", "Construction site", "Well site" and "Other", so the depot and every station read "Other · grid GHA".
- Why it matters: Usability at the scale of a retail network, where intensity per station is a common metric; no standard requires it.
- What to do: Add a facility and entity import with the same template contract as activity data, search and pagination on Facilities and a searchable facility picker; add "Retail station", "Fuel depot or terminal" and "Pipeline" types, or let an organization add its own.
- Evidence: B/officer timings; facilities table text (B-18, B-03).

### Stage L: the help centre

**F96. The help is navigable and accurate at the task level: every bank question is reachable from the hub in one or two clicks, 19 of the 25 task articles E followed matched the screen to the string, and Get started's figures matched Run 001 to the last decimal.**

- Severity: none (positive). Area: Help hub; task articles; Get started; feedback.
- What happened: 22 of the 25 bank questions resolve in one click from the hub's titles and three after "Show more (5)"; step pages show "STEP n", "ROLE", "About n minutes", "Before you start", "What you have" and PREVIOUS / NEXT (E). Every label, button and message E checked in 19 articles matched, including the import rejection "Row 11: no facility named 'Plant 2'", the decision cards and the control totals; the export column and key lists match the files exactly (63 line columns); typos are tolerated ("emision factor", "inventroy", "scop 2"), "source stream" finds the renamed concept, and "No" on "Was this helpful?" asks "What was wrong?" (E). D followed Get started literally: the labels, counts and figures of steps 1 to 7 matched, sections 04, 05 and 10 to the last decimal (86,411.999 t; 45,124.224 t CO2; 40,819.716 t without a split), and D's recomputation agrees; two small step texts drift (F107). Of the 21 articles A2 could check, 16 were accurate.
- Why it matters: This is what makes the help usable for the work itself; the gaps are around it (F101, F103), not in it. Keep the rule of driving the product before writing and of quoting its strings.
- Evidence: 001-reader-hub-desktop.png; downloads 1791301833202-run-1-lines.csv, 1791301841493-run-1-inputs.json, 1791301837039-run-1-exclusions.csv, 1791301828521-help-check-e-org-0005-2025-run-1.pdf, 1791302673842-evidence-index.csv (E-07, E-31; D's and A2's Help logs).

**F97. The help and the Emission sources page teach the contractor default as "the Corporate Standard's rule (chapter 4)", in a worked example whose contractor runs on the mine's own diesel, and file purchased haulage under category 1.**

- Severity: Major. Area: Help "What is scope classification?", Get started steps 2 and 6, "Meet Gye Nyame Gold", "What is an emission source?", "Record facilities and emission sources"; Emission sources page.
- What I did: Read the classification articles and the series as practitioners (D, E); registered "Contract ore haulage" with "Operated by a contractor (its emissions default to scope 3)" (D) and a "Contract haulage diesel" issued from E's own fuel farm (E).
- What happened: "What is scope classification?" prints "Contractor-operated source | Scope 3, category 1: chapter 4 of the Corporate Standard puts a contractor's combustion in the customer's scope 3." Step 2 says "The contractor's default is the Corporate Standard's rule (chapter 4) that a contractor's combustion belongs in the customer's scope 3; CarbonOS applies it without asking for a justification", and step 6 repeats it. The worked example reads "Contract ore haulage | Contractor-operated, on diesel from the mine's own fuel farm | Scope 3, category 1, by default", and its CSV note "Issued from the mine's fuel farm to the haulage contractor". The Emission sources page says "a contractor-operated source defaults to scope 3 (Corporate Standard chapter 4)", and E's haulage diesel landed in "Scope 3 / 1. Purchased goods and services" with no justification asked. The source spec itself states the rule correctly ("contractor equipment is scope 3 unless the company directs its operation").
- Why it matters: Corporate Standard ch. 4 puts outsourced activities in Scope 3 only "if the selected consolidation approach (equity or control) does not apply to them"; under operational control (ch. 3, "full authority to introduce and implement its operating policies") a contractor fleet working the mine's pit under the mine's procedures on the mine's diesel is often Scope 1, and many miners report it so. Where it is Scope 3, purchased haulage between a company's own facilities is category 4 (Scope 3 Standard Table 5.4), not category 1. Contractor fleets are often the largest diesel stream at a Ghanaian mine, so teaching the default as the rule moves Scope 1 into Scope 3 with no justification on file. D rated it Minor, as wording; I take E's Major because the first worked example teaches it on the largest diesel stream and the product asks for no justification.
- What to do: Rewrite the rule as a default the officer confirms against the contract (who sets the operating policies, who supplies the fuel), citing ch. 3 and ch. 4 correctly, and explain category 1 against category 4; change the worked example's facts (the contractor buys its own fuel) or its scope, and reword the Emission sources page; consider asking for a short justification on contractor sources.
- Evidence: /help/inventories/what-is-scope-classification; the step 2 and step 6 articles; files/gye-nyame-2025.csv, row 2 (D-03, E-12).

**F98. The worked example's file link in Get started step 4 opens the app's "Page not found" instead of downloading "gye-nyame-2025.csv".**

- Severity: Major. Area: Help /help/get-started/import-the-records-and-correct-one.
- What I did: Clicked "gye-nyame-2025.csv" in "Before you start", as the step says ("Download the year's records") (D).
- What happened: The browser stayed in the app at /help-assets/gye-nyame-2025.csv and showed "Page not found. No page lives at this address. The link may be out of date, or the address mistyped." with "Back to home". The file exists (a full page load returns it as text/csv, and a reload downloads it behind the not-found page); the link has no download attribute, so the app's router takes the click.
- Why it matters: Step 4 cannot be done without the file, so a customer following the series stops here or rebuilds seven rows by hand from "Meet Gye Nyame Gold", and the page tells them the link is out of date.
- What to do: Give help asset links a download attribute (or open them outside the router), exclude /help-assets/ from the client router, and add a help-check rule that every /help-assets/ link resolves to a file on click.
- Evidence: 006-owner-D-08-help-csv-link-not-found.png, files/gye-nyame-2025.csv (D-04).

**F99. The help search does not index tables or the later part of a section, so the Fix articles' message tables and the reference tables cannot be found by pasting a message.**

- Severity: Major. Area: Help search.
- What I did: Searched words that occur only in a table or deep in a section, and pasted product messages that the Fix articles quote (E).
- What happened: "tile counts up" and "Non-GHG activity", both in the table of "Fix an inventory or run problem", never return that article; "Launch on hold" returns six task and concept sections but not the Fix article whose first row quotes "Launch on hold · 1 blocking". The four Fix articles are reached only by the word "fix". "Uncertainty" returns "1 result" although step 9 of "Enter a record" names the field "Uncertainty, ± %"; "Context for the reviewer" (step 7 of a section) is not found while "eyebrow" (step 1) is; "biogenic" misses the report's "06 Biogenic CO₂ and 6A Gases outside the scopes" row.
- Why it matters: A stuck user's first move is to paste the message into search; the Fix pages exist for exactly that, and the product links an article from few screens (F103). The reference tables (statuses, findings, rules and limits, export columns) are invisible to search as well.
- What to do: Index every block of an article (table cells, list items, notes) under its section; add a test that each product string quoted in a Fix table returns its Fix article in the top three.
- Evidence: search queries in E's Help log, E/reader session (E-04).

**F100. Search ranks word fragments above real matches, has no synonyms and does not search the glossary, and its "no result" metric hides it.**

- Severity: Minor. Area: Help search; glossary; Administration > Platform overview.
- What happened:
    - "permission" returns three emission-source sections (the fragment "mission"); "edit a record" returns "Accept or decline an edition notice › Accept the edition" first; "REC" returns recalculation sections; "who can sign off" returns "Set your password and sign in › Sign in" first; "DEFRA version" returns "Boundary version"; "category 14" returns 20 hits on "category" and "14"; nearly every query reports "20 results for ..." (B, E).
    - "acquisition" returns "Nothing matched “acquisition”." although the glossary's "Membership window" row uses the word, and no glossary term ever appears in results; "audit trail" and "change log" miss "Read the history"; "DEFRA" misses "What is a factor pack edition?" (E); "bulk" returns "Nothing matched “bulk”.", and the bulk acts are found only by "select several records" (A1).
    - The console reads "Searches with no result, 30 days 4 (3% of 118 searches; target under 5%)", while the first natural query found an accepted article for 13 of the 25 bank questions (E).
- Why it matters: A newcomer searches in their own words, and the team will read 3% as "search is fine".
- What to do: Match whole words, with stemming, before fragments; weight titles and headings; require all terms before any; show "No good match" rather than 20 weak results; index the glossary; add synonyms (acquisition and acquired, audit trail and history, DEFRA and DESNZ, REC, I-REC, certificate and instrument, sign off and mark as final, greyed out and disabled, baseline and base year, bulk and several records); log which result a reader opens and report searches with no click.
- Evidence: E's Help log, rows q01 to q25 and O1 to O10; A1's and B's Help logs (E-05, E-06, E-28, A1-46, B-14).

**F101. The help does not cover the jobs of an inventory year that sit outside the screens, nor the parts of the product an oil marketer needs: planning and scoping, the data request, Scope 3 screening, fugitive and process sources, uncertainty, the review before sign-off, verification, franchises and investments, the downstream categories, and steam and cooling contracts.**

- Severity: Major. Area: Help coverage.
- What I did: Answered E's ten first-month questions from the help (O1 to O10) and searched and browsed for the planning and review jobs of a practitioner's eight-step workflow (E); searched for every task of the oil-marketer slice (B); every reviewer recorded where the help ran out (section 4).
- What happened: No article says what to decide before starting (purpose, period, consolidation approach and why, GWP set, base year) or what data to request from whom. "Declare scope 3" says only "Know which categories the records and the upstream rules will quantify this year", and its one worked exclusion ("DESNZ publishes no explosives factor; it is not quantified this year") justifies an exclusion by a missing factor; "scope 3 screening" returns the declaration steps. "refrigerant" returns one result, a field of the factor form, and nothing explains mass-balance or screening methods or Montreal gases beyond an exclusion reason; "biogenic" finds one form field and "uncertainty" one header field (F75). "compare with last year" and "year on year change" return base-year pages, and nothing explains reviewing movements before sign-off or prepares a team for verification (what a verifier asks for, the evidence index, limited against reasonable assurance) beyond the export columns (E). Nothing covers franchises or category 14, investments or category 15, the downstream categories, instruments for steam, heat or cooling (the instruments article speaks only of electricity), vented or fugitive methane, or oil and gas and construction sources: "franchise" returns only the Table 1 relationship list, and "downstream", "construction" and "flaring" return "Nothing matched"; "Review and classify records" does not say that franchise and investee data then has no route into Scope 3 (B). The other reviewers hit the same edge: a document that arrives after a run (A1, E), a base year before the packs (F29), an erratum into a reported year (F42), a new factor family (F111), concurrent editing and deleting an inventory (D), and a session that ends during a long import (B).
- Why it matters: The owner's goal is a client officer who runs a year with the product and the help only, and these are the steps where first inventories fail verification: an undocumented boundary and screening (Corporate Standard ch. 3 and 4; Scope 3 Standard ch. 6, "disclose and justify any exclusions"), missing refrigerants, no uncertainty or QA/QC (Corporate Standard ch. 7; ISO 14064-1 clause 8), no variance explanation, and for an oil marketer the categories that carry most of its total (Scope 3 Standard ch. 5 and 11). B rated its half Major as well; the two are one gap.
- What to do: Add a short "Plan and close your inventory year" group, or extend Get started: decide the scope of the year; request the data (a downloadable request list by source type); screen Scope 3 (a matrix and acceptable justifications); record refrigerants and process sources; review before sign-off (variance, completeness, the pre-flight as a checklist); prepare for the verifier (evidence index, exports, what each file proves). Add "Report franchises (category 14) and investments (category 15)", "Classify the downstream categories 9 to 13", "Steam, heat and cooling under both Scope 2 methods" and a sector page for oil and gas and construction. Each can link the existing task articles.
- Evidence: E's Help log, rows O1 to O10; B's Help log and search texts (E-24, B-14; every reviewer's Help log).

**F102. The help renders some of its own markup as text and three of its five diagrams as broken images.**

- Severity: Minor. Area: Help rendering.
- What happened:
    - Seven articles print the callout syntax as a paragraph that starts `!!! note` and the quoted title, among them "You are the only active administrator" (Approve access requests), "Adding a reviewer ends self-approval" (Add members), "What holds the designation" (Designate a final run), "Which convention to choose" (Designate the base year), "Copying into next year" (Copy a view), "The recalculation question" (Accept or decline an edition notice) and the curator note of "Author and publish a factor pack edition"; search snippets show it too (B, C, D, E).
    - "Enter a record" prints required-field labels with their raw markup, for example `**Activity type ***`, `**Facility ***` and `**Period start ***` (D).
    - The diagrams of "Meet Gye Nyame Gold", "What is the inventory lifecycle?" and "What is the base year?" show a broken-image icon and their alt text: the SVGs are served but are not well-formed XML, because a Mermaid label carries an unclosed `<br>`, which the lead confirmed in help/docs/assets/diagrams. The lifecycle diagram on "How an inventory becomes a report" is scaled into the 664-pixel column, so labels such as "Return to preparer" are about 6 pixels high (E).
- Why it matters: These notes carry governance points (the last active administrator, self-approval, what holds a sign-off), and as raw text they read as a formatting accident; the first page of Get started opens on a broken picture. "help:check" counts diagrams but did not catch one that cannot render.
- What to do: Render the callouts in the help compiler, or convert them to the house callout, and fix the bold labels; regenerate the three SVGs; lay the long lifecycle out in two rows or vertically, or open it full size; make help:check fail on a literal `!!!`, on raw bold markers and on an SVG that is not well-formed XML.
- Evidence: shots/009-approver-43-help-raw-admonition.png, 003-platform-D-02-help-raw-admonition-b.png, 001-preparer-D-12-help-raw-bold.png, 001-platform-admonition-raw.png, shots/008-officer-help-raw-admonition.png, 005-reader-meet-diagram.png, 006-reader-lifecycle-whatis.png, 003-reader-how-inventory-becomes-report.png, 004-reader-lifecycle-diagram.png (C-37, D-02, E-19, B-16, E-01, E-02; lead's note 3).

**F103. The product sends a stuck user to the help from very few places: there is no help link before sign-in, 3 of 17 organization screens link an article, and no refusal or empty state points to a Fix article.**

- Severity: Minor. Area: Landing page; Sign in; organization screens; refusals and toasts.
- What happened: The landing page offers "Product", "Pricing", "FAQ", "Sign in", "Request access", "Ask about the pilot", "Request a licence", "Talk to ECORIV" and the ECORIV links, and Sign in offers "Sign in" and "Forgot your password?"; the only way into the help before sign-in is "How access works" in the "Request access" dialog, so "Fix a sign-in or access problem" is out of reach for someone who cannot sign in (D, E). Signed in, the import page links "What each column must contain", the inventory workbench links "Help" twice and Settings once; Overview, Legal entities, Facilities, Activity data, Source documents, Emission factors, Updates, Units, Inventories, New inventory, the run report and Baseline and targets link none; a new account lands on "No organizations yet" with no pointer to Get started; refusal tooltips and toasts carry no link (E).
- Why it matters: The help is good at the task level (F96); it is not where the user is when they are stuck.
- What to do: Add "Help" to the landing page's top bar and footer and "Trouble signing in?" on Sign in; add a "Learn more" link on each page header to its group or task article and "New to CarbonOS? Start with Get started" on the empty organizations list; link an article from each refusal with a rule id (ADR 0008 already gives the id to map).
- Evidence: link inventory of the landing and sign-in pages (D); link scan in E/officer, 001-officer-first-landing.png (D-01, E-25).

**F104. Help navigation slips: the hub hides the five concept articles of the inventory group, a link label names a page that no longer exists, and wide tables lose their headers on a phone.**

- Severity: Minor. Area: Help hub; "How an inventory becomes a report"; "Fix an inventory or run problem"; the help on a phone.
- What happened:
    - The "Build, check and run an inventory" card lists eight titles and "Show more (5)", hiding "What is the inventory lifecycle?", "What is scope classification?", "What is a pre-flight gate?", "What is dual reporting?" and "What is a calculation run?", the answers to bank questions q06, q16 and q23 (B, E).
    - "Pre-flight gates and findings", at the foot of "How an inventory becomes a report" and in the Fix table's row "Launch on hold · 1 blocking", opens "Freeze the inventory and launch a run"; no article has that title, and the findings table is in "Clear the pre-flight findings" (E).
    - At 390 by 844 pixels the pages fit, but tables scroll inside their box with no sticky header, so scrolling down the role matrix leaves cells reading "Yes" without a column name (E).
- What to do: Show this group's concepts, or give them their own card; link "Clear the pre-flight findings" by its current title in both places; use sticky headers and first columns, or stacked cards below 600 pixels, for tables over four columns.
- Evidence: hub text; 008-reader-phone-hub.png, 009-reader-phone-role-matrix.png, 010-reader-phone-browse.png (E-08, E-03, E-30; B's Help log).

**F105. Four concept articles stop short of the GHG Protocol position a reader needs: which Scope 2 figure to quote, what the unsplit gas row means for the per-gas disclosure, how to choose a base year and when a new vintage is not a recalculation trigger, and a stake bought during the year.**

- Severity: Minor. Area: Help "What is dual reporting?", "Fill the report header and read the report" (emissions by gas), "What is a pre-flight gate?", "What is the base year?", "Designate the base year", "What is a consolidation approach?".
- What happened:
    - "What is dual reporting?" says location-based is "Used for: The inventory total, the by-gas table and the category 3 losses" and market-based "Disclosure beside the location-based figure", and never says which figure to quote when asked for one number (bank question q06).
    - The gas section says the "CO₂e from factors without a gas split" row "ties to section 04", and "Why is a warning a disclosure?" calls a CO2e-only factor "a fact about the source"; neither says that the per-gas disclosure is then incomplete (47% of the worked example's total) or how to treat it.
    - "What is the base year?" lists "A new factor vintage or calculation method." as a methodology change and says nothing on which year to choose; the task article only quotes the field's hint.
    - "What is a consolidation approach?" answers a 60% stake but not one bought in March (q08) or a subsidiary acquired in July (O1); the membership window is in two other articles that search does not surface, and nothing says that the approach must stay the same across years.
- Why it matters: Scope 2 Guidance ch. 8 gives both totals equal standing and asks companies to say which method drives their targets; Corporate Standard ch. 9 requires each gas separately; ch. 5 asks for "a base year for which verifiable emissions data are available" with the reasons, and a factor that reflects a real change in the grid is not a methodology change; ch. 3 and ch. 5 date an acquisition and require the approach to be applied consistently.
- What to do: Add "Which figure do I quote?" (both where possible; one only with its method named; the method of the company's target); a caveat on the gas row with the two acceptable treatments (disclose the limitation, or estimate the split from the generation mix or the supplier); "Which year should I choose?" and a sentence separating a method or accuracy change from a real change in intensity; "What if we bought or sold part of the group during the year?", linking the boundary task and the base-year trigger.
- Evidence: article sources; E's Help log, rows q05, q06, q08, q21 and O1 (E-13, E-14, E-15, E-16).

**F106. The glossary maps only product words, oversimplifies four terms, and can be neither linked to nor searched.**

- Severity: Minor. Area: Help /help/glossary.
- What happened:
    - "Emission factor: A published rate of kilograms of CO₂e per unit of activity" (factors are often per gas, their CO2e depends on the GWP set, and supplier and derived factors are not published); "Legal entity: A company the organization consolidates: ... investment or franchise" (investments and most franchises are not consolidated); "Exclusion: A record left out of an inventory" (facilities and entities are excluded too); "Correction | Recalculation of a reported year" (it reads as the base-year recalculation; the act is a restatement).
    - Missing: GWP and CO2e, location-based, market-based and dual reporting, biogenic CO2, Scope 3 category, operational control, financial control and equity share, significance threshold, structural change, materiality, uncertainty, data quality tier, intensity, assurance and verification, well-to-tank, transmission and distribution losses, and "gas split", which the help IA review of 28 September promised for q21.
    - The table has no links, no anchor per term and no A to Z jump links, although tree.yaml describes "A to Z jump links" and the page promises each term "with the page that explains it"; "Documented zero" sits between "Emission factor" and "Emission source"; the glossary is not searchable (F100).
- Why it matters: The glossary is where a sustainability officer maps their vocabulary onto the product (Corporate Standard ch. 3, 5 and 9; Scope 3 categories 14 and 15).
- What to do: Correct the four rows; add the practitioner terms with one-line definitions and a link to the explaining article; add term anchors and A to Z links; sort the rows.
- Evidence: glossary source and page (E-23, E-29, E-06).

**F107. Get started never says that Gye Nyame Gold is practice, ends without a bridge to the reader's own year, and leaves a published practice organization that cannot be deleted; two step texts drift from the screen.**

- Severity: Minor. Area: Help, the Get started series.
- What happened:
    - Step 1 has the reader create "Gye Nyame Gold Ltd" ("Nothing else. Creating an organization makes you its owner") and step 8 publishes it; no page says it is practice or how to remove it, and an organization with a published inventory cannot be deleted (F83). The last step's "Where next" offers "Correct a published inventory", "Designate the base year" and "Understand the export files", and nothing on starting one's own organization; the topic page states no total time (about 75 minutes to Run 001 and 85 to a published report, while the hub says "eight short steps") (E).
    - Step 1 tells the reader to leave "Owner's email (optional)" empty, a field a customer's dialog does not have, and quotes "Gye Nyame Gold Ltd (ORG-0001) created.", which is true only for the platform's first organization (D's was ORG-0004); step 3 quotes "1928 factors" and "7 factors" where the pack table prints "1,928" and "7" (D, E).
    - Step 8 is written for a one-person organization ("As the organization's only member, you do both") and points teams to "Designate a final run and publish" (D).
- Why it matters: The customer's real account keeps a published report for an invented mine, visible to every future member and verifier, and the last page leaves the reader without a next step.
- What to do: Say in step 1 that this is a practice organization, or let the reader stop before publishing; add "Start your own inventory year" with the decisions and data to prepare (F101); state the total time; correct the two step texts.
- Evidence: /help/get-started/create-the-organization-and-its-legal-entity, /help/get-started/fill-the-header-publish-and-export (E-09, E-18; D's Help log).

**F108. The account and organization articles drift from the screens: the Overview has five steps, a source's fuel does not narrow the factors, a source cannot be edited at all, and the support-access and role articles contradict each other.**

- Severity: Minor. Area: Help groups "Get access and manage your account" and "Set up your organization".
- What happened:
    - "Create an organization": "Open leads to the organization's Overview, whose four numbered steps are the order the rest of the setup goes in."; the Overview lists five (A1, E).
    - "What is an emission source?": "The source does carry a fuel or material, which narrows the factors offered." (it does not, F49); "Edit the organization's details and read its history": "editing a source is not recorded" (there is no edit, F15) (A1).
    - "What is support access?" says "The sidebar has no Settings entry"; "Assume support access" and the screen say "Settings opens on Baseline and targets only" (C).
    - "What is a role?" quotes "'organization' needs at least one owner." while "Add members" quotes "'Organization' needs ..."; "Add members" quotes the no-account message without its last sentence (F2); the request dialog's "we set up your organization" is not what happens next, since the owner creates it (D).
- What to do: Correct each sentence against the screen.
- Evidence: 002-officer-overview-empty.png; article texts (A1-45, A1-47, E-18; C's and D's Help logs).

**F109. The factor articles leave out the approval paths a customer meets and describe a conflict that the screen cannot produce.**

- Severity: Minor. Area: Help group "Manage emission factors and updates".
- What happened:
    - "Add and approve a factor" says of a derived pack row "Check the loss rate, then click Approve" and that the row then reads approved; the product opens "Approve Grid electricity T&D losses, Ghana (derived)" with a "Check note" ("the note prints beside the caveat in the report's factor table"), and the row then shows "Checked: ...". For one's own factor the article says "Approving a factor you entered is refused", while for a sole member the product approves at one click as "(self-approved: nobody else could check it)". Get started step 6 does describe the check note (A1, B, C, E).
    - "Accept or decline an edition notice" and "Import a factor pack" tell the reviewer to "Read Conflicts (rows you edited locally)" and say that the import names the "rows you edited locally" it "left untouched"; pack rows offer only "Approve", "Unapprove" and "Retire…", so no local edit exists. C needed the specs to learn what the state means (spec 02.6 rule 4), the only spec reading of the walk, and the conflict path of ECO-44 item T4 could not be produced (C).
    - "Accept or decline an edition notice" presents the published-period block as normal and is silent on how an erratum is diffed (F42, F43); "Fix a factor or update problem" has no row for "No factor matches litre (volume)" or for a period before the packs (F29) (A2, C).
- What to do: Describe the check-note dialog and the self-approval, and suggest adding a reviewer first; remove the conflict wording or say how a row becomes edited locally; add the missing Fix rows.
- Evidence: article texts; factor rows in E/officer (A1-44, E-17, B-15, C-12; A2's and C's Help logs).

**F110. The inventory and reporting articles skip a step or promise behavior the product does not have.**

- Severity: Minor. Area: Help groups "Build, check and run an inventory" and "Publish the report and track it over time".
- What happened:
    - "Correct a published inventory" says "Freeze the correction, launch a run, mark it final and publish it", skipping "Submit for review" ("Publish" stays disabled with "Submit a run for review and have it marked final first"); its step 1 promises "1 new record under review." where the product says "All activity records are already reviewed."; and its "Before you start" links a page title retired on 28 September (A2, E).
    - "Freeze the inventory and launch a run" names three files where the run page offers four, with "Frozen inputs (JSON)"; "Enter a record" says "keep Method as Measured" under a collapsed "DATA QUALITY" it does not say to open (E).
    - The reopen section does not say that a reopen withdraws a run in review (F7); "Copy a view" does not warn that travel at a leased site moves to category 8 (F46); "Decide a recalculation candidate" describes a route the product refuses (F81); "Review and classify records" does not say that the category list offers categories the server refuses (F64) (A2, B, D).
    - Example timestamps print in US format ("10/6/2026, 5:56:18 AM", "Published 10/6/2026, 5:56:18 AM") where the product shows "06/10/2026, 16:44:41" (A2, D).
- What to do: Correct each step against the screen; use the product's date format in examples.
- Evidence: Runs tab and toast text in E/officer; article texts (E-10, E-18; A2's, B's and D's Help logs).

**F111. The platform articles never say how to create a factor family, describe the Approved default the wrong way round, and name two of the three platform settings.**

- Severity: Minor. Area: Help group "Administer the platform".
- What happened: "Author and publish a factor pack edition" starts at "Click New edition on the family, or Clone on a published edition"; the console's "Add family" dialog (Key, Name, Kind "SOURCE" or "SECTOR", Summary) is described nowhere, and a search for "Add family" finds 20 results, none about families. The same article says "untick Approved for use in a calculation", which starts unticked (F35), and is silent on an approver editing rows (F36). "What is the administration console?" describes Platform settings as two settings; there are three (F42) (C).
- What to do: Add "Create a family" with the key rule ("Lowercase letters, digits, hyphens and dots, as 'defra' does") and what the kind changes; correct the Approved sentence; name all three settings.
- Evidence: shots/002-curator-02-factor-packs-catalogue.png (C-38, C-05, C-34).

## 3. The ECO-44 items

| Item | In a few words | Verdict | Findings | Note |
| --- | --- | --- | --- | --- |
| T1 | Console: a draft edition and the publication rules | Works with findings | F32, F33, F34, F35 | Every refusal names its row with the computed figures; not refused: a code in DEFRA's namespace, an edition identifier of another family, an unapproved row with no caveat, HCFC-22 in the scopes. |
| T2 | Console: publication by two people, checksum, change log | Works with findings | F32, F36, F37 | The curator cannot publish and the SHA-256 matched sha256sum three times; the approver can edit a row and still publish; the source document cannot be opened from the edition. |
| T3 | Console: blast radius before publishing and withdrawing | Works with findings | F33, F37, F41, F43 | Read before each publication and the withdrawal; it misses a change from zero, lists a lock that does not apply, ignores a GWP basis change and misprices an erratum. |
| T4 | Versioned import: a new version, a local edit as a conflict, a locked period | Works with findings | F26, F38, F42, F109 | Versions are cut, not overwritten; no local edit can be made from the screen, so the conflict path was not reached; a locked period refuses, an erratum into an open correction included. |
| T5 | Adoption inbox: diff, estimate, recalculation question, hold | Works with findings | F26, F38, F39, F40, F43 | Diff, estimate and question work, and the hold falls on submission, not on runs; an open inventory keeps a closed version, significance is measured on part-year activity, and a decided notice loses its diff. |
| T6 | A published edition immutable; superseded or withdrawn readable, not importable | Works with findings | F26, F37 | The server refuses edits to a published edition and the old editions leave the import list; the page still offers "Edit" and hides the withdrawal reason. |
| T7 | Preparer and Reviewer end to end; final and publish refused to a Preparer | Works with findings | F4, F5, F7 | Both acts are refused to a preparer; the reasons are invisible to a sighted user. |
| T8 | Concurrency: two members on one inventory | Works with findings | F87, F88 | The last classification wins silently (Major); the server refuses writes against a changed state, but screens stay stale. |
| T9 | "Record recalculated base" and "Decline" | Fails | F80, F81, F82 | "Decline" works; an acquisition is never detected, and a published base year can only be "recalculated" to its original run (Blocker). |
| T10 | Deleting an organization and a facility | Works with findings | F83, F85, F86 | The refusals and the typed-name deletion work, and an organization's deletion is soft; deleting an inventory, found beside this item, is a Blocker (F84). |
| T11 | Steam, heat and cooling lines | Works with findings | F56, F57, F58, F61 | Location-based steam and hot water are right; a steam contract is applied to electricity in the market-based total (Major); cooling is filed as heat and steam and locked; no Scope 2 by energy type. |
| T12 | The franchise relationship | Fails | F14, F63, F64, F101 | Table 1 shares are right at 0%, but franchisee records are excluded on review, the energy kinds refuse category 14, and the help is silent. |
| T13 | Downstream categories 9 to 14 | Works with findings | F62, F63, F64, F65, F66 | Categories 9, 11, 12 and 13 are quantified and reproduce; 10 is declared, not quantified (no factor); 14 and 15 cannot be quantified; "Other" defaults to Scope 1. |
| T14 | Volume (ECO-31) | Works with findings | F50, F73, F89, F93, F94, F95 | Baseline in F93; the import finished only after a sign-in in another tab, and classification did not finish (591 records bulk-excluded to reach a run); the lists scale. |
| T15 | Grid-region pre-selection (ECO-21) | Works with findings | F50, F59 | A one-click suggestion, not a pre-selection; "XX-NOWHERE" gets no suggestion and no warning. |
| T16 | The PDF of an equity-share run and of a correction run | Works with findings | F71, F76 | The equity-share PDF reads well but shares its file name and title with the operational-control PDF; the correction PDF omits the reason and the comparison (Major). |
| T17 | Password reset | Works with findings | F89 | The reset matches the help word for word and ends every other session; the signed-out browser then says data "may have been deleted". |
| T18 | Disabling a user and the attributed history | Fails | F90, F91 | New sign-ins are refused, but the open session kept writing (Major); the history and the PDF keep her name. |
| T19 | Verify 11 September F32 and F39 | Works with findings | F44, F47 | Old F39 resolved (criteria and certificate details copied verbatim); old F32 open (no reason field for an entity without facilities). |
| T20 | ECO-5: inline source creation and the reconcile prompt | Works with findings | F17, F22, F24 | The reconcile prompt is the similar-name notice, and it works; a new source's kind starts on "Stationary combustion". |
| T21 | ECO-24: the import page, a workbook, the decision cards | Works with findings | F16, F17, F19, F21 | Workbook and CSV previews are identical and the digest matches; a source created in the preview keeps the default kind, which put grid electricity in Scope 1 (Blocker). |
| T22 | ECO-24: bulk acts, each refused as a whole by name | Works with findings | F5, F22, F23, F24, F25 | Each act is one request with a reason and removal names the refusing record ("ACT-0061 is used in run 1 and cannot be removed."); "Assign emission source" is greyed with no visible reason; a duplicate link is accepted. |
| T23 | ECO-27: the documented zero end to end | Works | F22, F68 | "0 kg · documented zero", the crossed circle in the matrix, the pre-flight line and the report's sentence are all there. |
| T24 | ECO-27: the import's zero rules, the supplier, the monthly template | Works with findings | F16, F18, F19 | The zero rules refuse and warn as designed; an overlapping period imports silently (Major); supplier warnings swamp the list. |
| T25 | ECO-27: "Resolve n items" after a correction | Fails | F70 | The pre-flight's "Resolve 1 record →" lists no record, and a corrected quantity is flagged nowhere. |
| T26 | ECO-13: submit, return, resubmit; final disabled for the submitter | Works with findings | F4, F6, F7, F8 | Submit with a note, return with a reason and the submitter rule work; a run on an older boundary version can be signed off (Major). |
| T27 | ECO-13: a named preparer and approver; the Approver list | Works with findings | F4, F5 | Naming narrows who acts, with rule ids, and the Approver list offers only reviewers and owners; other members still see enabled controls. |
| T28 | ECO-13: a sole owner's self-approval disclosed | Works with findings | F4, F7 | Disclosed in the dialog, the lifecycle panel, the header and the PDF; the submit dialog still promises a second signer. |
| T29 | ECO-13: Prepared by and Approved by in the PDF | Works with findings | F4, F7 | Names, emails and the run are printed; the approval has a date and no time. |
| T30 | ECO-13: a new run, a void and a reopen withdraw a submission | Works with findings | F4, F7 | Each route leaves its history line; no dialog warns the person withdrawing. |
| T31 | The by-gas table footing (11 September F44, F45) | Works with findings | F27, F28, F68 | Section 05 foots and pro-rates gas masses; the derived T&D row prints as CO2 and five DESNZ rows print as HFCs. |
| T32 | The equity-share copy rebuilding its boundary (11 September F30, F37) | Works with findings | F44, F46, F74 | The boundary is rebuilt and the head office moves to category 8; business flights at the leased office move too. |
| T33 | The PDF (11 September F48) | Works with findings | F69, F71, F76 | No identifiers, UTC dates, headings kept with their tables; the correction block is missing and file names collide. |
| T34 | Support access (11 September F3) | Works with findings | F8, F10, F11, F12 | Grant, banner, owner card and history work; base-year acts under a grant are not recorded, and support may sign off and publish by design. |
| H1 | First visit: the hub, the groups, Get started | Works with findings | F96, F98, F102, F103, F104, F107 | Order and prerequisites are clear; the first page opens on a broken diagram, the file link fails, and nothing says the example is practice. |
| H2 | Findability | Works with findings | F9, F96, F99, F100, F104, F105 | Hub 25 of 25; search 13 of 25 at the first query and 20 of 25 within three phrasings (section 4). |
| H3 | Accuracy | Works with findings | F96, F107, F108, F109, F110, F111 | 19 of 25 task articles accurate to the string (E), 16 of 21 (A2); the mismatches are listed in section 4. |
| H4 | GHG correctness | Works with findings | F12, F28, F61, F67, F75, F97, F105, F106 | Right on Table 1, leases, pro-rating, the residual mix and documented zeros; the contractor rule is taught wrong (Major). |
| H5 | Self-sufficiency | Fails | F9, F92, F101, F103 | The screens can be run from the help; the work around them, and an oil marketer's categories, cannot (section 4). |
| H6 | The help's own interface | Works with findings | F99, F100, F102, F104, F106 | Hub, Browse on a phone, PREVIOUS / NEXT and the feedback vote work; search, callouts, diagrams, the glossary and wide tables on a phone need work. |
| H7 | Scorecard per group | Works | Section 4 | E's scores and reasons are in section 4. |

## 4. Can a customer do it alone? The help centre

Not yet. A client officer can operate every screen from the help, and the task articles are accurate to the string; but the help does not carry an officer through the work around the screens, it has nothing for franchises, the downstream categories or steam and cooling contracts, and in two places it teaches the wrong rule (F97, F28). A client without outside help would reach a published report that a verifier would question on screening, uncertainty and variance, and an oil marketer could not report its franchise network at all.

Scorecard (E's, H7). Scores run from 1 (poor) to 5 (excellent): coverage of the jobs a client officer has in the group, accuracy against the screen, clarity for a newcomer, and correctness under the GHG Protocol and ISO 14064-1.

| Group | Coverage | Accuracy | Clarity | GHG correctness | Reasons |
| --- | --- | --- | --- | --- | --- |
| Get started | 4 | 4 | 4 | 3 | A complete path from an empty account to the exports, with role and time per step; no bridge to the reader's own year, a broken and a tiny diagram; the contractor rule and an exclusion justified by a missing factor teach weak practice (F107, F102, F97, F101). |
| Get access and manage your account | 4 | 4 | 4 | 3 | Request, password, reset, roles and profile matched the screens; the role table contradicts the matrix on the history (F9); a vendor sign-off under support access is presented as normal (F12). |
| Set up your organization | 4 | 4 | 4 | 3 | Entities, facilities, sources, units and history matched; "four numbered steps" (F108); Table 1 shares and leases right, the contractor rule misstated (F97), a mid-year acquisition split across pages (F105). |
| Record activity data | 4 | 5 | 4 | 4 | Entry, the documented zero, the import with decisions, correction and evidence were exact; nothing on planning the data request or on what the uncertainty field feeds (F101, F75). |
| Manage emission factors and updates | 3 | 3 | 4 | 3 | Import and editions clear; the approval paths incomplete (F109); no guidance on a representative factor or on AR5 against AR6; the derived loss factor's arithmetic misdescribed (F28). |
| Build, check and run an inventory | 4 | 4 | 4 | 3 | Boundary, declaration, classification, instruments, freeze and run matched; the concepts hidden behind "Show more" (F104); dual reporting, the Quality Criteria and the gas row need caveats (F105, F61). |
| Publish the report and track it over time | 3 | 3 | 4 | 3 | Sign-off, publication, export and base year matched; the correction steps wrong and the export sentence contradictory (F110, F76); nothing on year-on-year review or verification (F101); the base-year choice and the vintage caveat missing (F105). |
| Administer the platform | 4 | 4 | 4 | 4 | "Add user" matched exactly; the callouts render raw (F102); one task followed. |
| Fix a problem | 3 | 4 | 4 | 4 | Clear "You see / It means / Do this" tables quoting real messages; unreachable by search and from the screens (F99, F103); one stale link (F104). |
| Glossary | 2 | 4 | 3 | 3 | Product words only, with no practitioner terms, anchors or links; four rows oversimplify (F106). |

E scored the groups before the other slices finished. D's walk of Get started found the file link broken (F98), C's walk of the platform articles found three more gaps (F111), and B found no coverage at all for franchises, the downstream categories, steam and cooling contracts or oil and gas sources (F101); each would lower its group's coverage or accuracy by a point.

Findability (E's bank of 25 questions and ten of E's own, by the hub and by the search box):

- By the hub: 25 of 25 bank questions in one or two clicks, 22 of them in one; q06, q16 and q23 need "Show more (5)".
- By search: the first natural query found an accepted article for 13 of 25, and three phrasings for 20 of 25. None of three phrasings put an accepted article in the top three for q02 (a greyed-out launch button), q07 (can the vendor's staff read our numbers), q16 (can the figures change after sign-off), q20 (who changed an ownership share) or q24 (a final number that turned out wrong).
- E's own ten first-month questions: 3 answered (O2 market-based Scope 2 without certificates, O9 correcting a published report, O10 who may sign off), 4 in part (O1 a subsidiary acquired in July, O3 an invoice after the run, O4 the evidence behind a line, O7 an activity with no factor) and 3 not at all (O5 Scope 3 screening, O6 stating uncertainty, O8 explaining the change from last year).
- B's slice: "franchise" finds only the Table 1 relationship list, "category 14" returns 20 unrelated hits, and "downstream", "construction" and "flaring" find nothing.

How often the help alone was not enough. Across the six Help logs (157 rows: A1 18, A2 22, B 16, C 21, D 25 and E 55, of which 35 are findability tests), the reviewer could not finish from the help and the screen 29 times (A1 3, A2 5, B 7, C 5, D 3, E 6) and could only in part a further 21 times. The specs were needed once in the whole walk: C read spec 02.6 to learn what a factor "edited locally" is, a state the screen cannot reach (F109). Examples:

- A2: why grid electricity sat in Scope 1 (F17); "No factor matches litre (volume)" in a 2024 inventory (F29); recalculating the base year for an acquisition (F81).
- B: where a franchisee's and an investee's emissions go (F63); a supplier rate for purchased steam (F57); classifying 600 monthly records at once (F50); a session that ends during a long import (F89).
- A1: the mining pack and where its factors come from (F92); editing a source (F15); how a correction after a run reaches the inventory (F70).
- C: creating a factor family and adopting an erratum into a reported year (F111, F42).
- D: the worked example's file (F98); two people editing one inventory (F87); deleting an inventory (F84).
- E: the one Scope 2 figure to quote (F105); a verifier asking who changed a share (F9); Scope 3 screening, uncertainty and year-on-year review (F101).

The gaps an officer meets in a year, all outside what the help covers today:

- Deciding the year before starting: purpose, period, consolidation approach and why, GWP set, base year and the reasons for it (F101, F105).
- The data request: what to ask of whom, by source type (F101).
- Scope 3 screening, justified exclusions and each category's minimum boundary (F101, F66).
- Refrigerants and process sources, Montreal Protocol gases, vented and fugitive methane, and the sources the catalogue does not carry (F101, F92).
- Franchises (category 14), investments (category 15) and the downstream categories 9 to 13 (F101).
- Steam, heat and cooling under both Scope 2 methods (F101, F57).
- A base year that predates the packs, and restating a published base year (F29, F81).
- A document that arrives after a run, before and after publication (F101).
- Uncertainty: what the report's figure is and how to assess the inventory's (F75).
- The review before sign-off: variance against last year, completeness, the pre-flight as a checklist (F101).
- Preparing for verification: what a verifier asks for, the evidence index, what each export proves, limited against reasonable assurance (F101).
- Working together: two people on one inventory, deleting an inventory, what a signed-out screen means (F87, F84, F89).

The help's accuracy problems:

- The contractor default taught as a rule of the Standard, with category 1 for haulage (F97).
- The derived T&D factor's stated arithmetic, and Get started's by-gas figures (F28).
- "Correct a published inventory" skips "Submit for review" and promises "1 new record under review." (F110).
- "Add and approve a factor" omits the check note and the self-approval (F109).
- "Each record's history names the imported file" (F21).
- A source's fuel "narrows the factors offered", and "editing a source is not recorded" (F108).
- "Conflicts (rows you edited locally)", which cannot occur (F109).
- The export files "never change", beside a PDF that reprints its header (F76).
- A verifier reads "history" (F9); support may sign off and publish, presented as normal (F12).
- "The Scope 2 Guidance's eight Quality Criteria" (F61).
- "Decide a recalculation candidate" describes a route the product refuses (F81).
- "Four numbered steps", "untick Approved", two platform settings out of three, the support-access sidebar, US-format dates and "Manage users" (F108, F111, F110, F2).
- A link label for a page that no longer exists (F104).

## 5. What works well

- The two fixes a verifier would test first since 11 September hold (the by-gas Blocker and the Appendix F regression): the emissions-by-gas table foots to the total with a row for CO2e-only factors and pro-rated gas masses, and the equity-share copy rebuilds its boundary from Table 1 and applies Appendix F again; the PDF is a reader's document.
- The sign-off workflow separates preparation from approval: the submitter cannot sign, a named preparer and approver are enforced with rule ids, every withdrawal leaves its own history line, and a self-approval is disclosed in the dialog, the lifecycle panel, the report header and the PDF.
- Access is by membership or by a logged, time-boxed support grant that the owner sees; the verifier role is read-only with a banner; platform settings keep every change with its reason.
- The record is protected where it was weakest on 11 September: an organization with a published inventory, a facility with records and a record a run used all refuse deletion, and an organization's deletion is a soft delete with its typed name and reason.
- The import page reads a workbook exactly as its CSV, its control totals and SHA-256 check out, a re-import is refused, decision cards map or create sources with the reason in the history, and the zero rules refuse an unexplained zero; on the register a documented zero needs its note, and bulk acts carry a reason to each record.
- Factor provenance and vintages: every row cites its publication, table, years and pack; the picker offers one version per period; a new edition cuts versions and cannot pass a GWP basis change off as a vintage; the console publishes only with two people, a checksum and rules that name each failing row; a hand-entered factor's self-approval is disclosed.
- Scope is an accounting decision for every factor, with a justification on departure; Appendix F applies to leased-in assets under equity share and to leased-out tanks under operational control.
- Every line the reviewers recomputed reproduces from the displayed factors: Scope 1, both Scope 2 totals, categories 1, 3, 5, 6, 7, 8, 9 and 11, the AR6 diesel factor and the pro-rating; Scope 2 is always printed location-based and market-based, side by side, with the residual-mix statement.
- The register and the Records tab paginate and stay usable at 2,603 records.
- The help's hub reaches every bank question in one or two clicks, most task articles are accurate to the string, and Get started's figures match Run 001 to the last decimal.

## 6. Not exercised

- Approval of a hand-entered factor by a second member, and the refusal to its author while another writer exists.
- Workbooks with several sheets or formula cells; the IFRS 10 control override; removing a legal entity.
- Changing a member's role, removing a member and the last-owner refusal; "Enable" on a disabled account; how long a disabled account's open session survives beyond five minutes.
- An AR6 inventory with a refrigerant blend that carries a composition, and the non-fossil methane potential (11 September F27).
- Biogenic fuels and the biogenic CO2 line of section 06.
- Publishing an equity-share view or a correction (corrections were frozen and run, not published); the "For the whole year" structural-change convention; non-calendar fiscal years.
- Equity-share and financial-control views of the franchisor (category 15 at 20%); the workaround for categories 14 and 15 (recording franchisee data at an in-boundary facility under an "Other" source), not performed because it misstates where the activity happened.
- Category 3 for purchased steam and heat; market-based instruments for heat and cooling beyond the one steam supplier rate.
- Classifying hundreds of records (six were timed and 591 bulk-excluded to reach a run); the coverage matrix with 465 documented zeros.
- An open notice closing as "Withdrawn by the publisher"; the expiry of a support grant; marking final and publishing under support access on a run the client submitted (F12 rests on the help and the specs for that act).
- The platform settings "Administrators only" and "Allowed", which would have changed the rules for the other reviewers; the console's Help metrics page.
- A server refusal of a verifier's write, since no write control stays enabled for the verifier.
- The Fix tables' messages one by one; the help in the dark theme, by keyboard only and with a screen reader; the landing page's phone menu.

## 7. Top 10 priorities

1. F17, F15 and F65: no emission source gets a scope the preparer did not choose. Require the kind when the import creates a source, let an owner edit a source, give "Other" no default scope and add the downstream kinds, and gate a factor whose own scope differs from its source's default.
2. F84: refuse to delete an inventory that has a run; a run-less draft needs its typed name, a reason, an owner and a history line.
3. F81, F80, F29 and F39: make a published base year restatable (accept the correction's run as comparison and recalculated base, from a picker), detect an acquisition from the membership windows, let a prior-year inventory find its factors, and measure a factor change against the base year's activity.
4. F28, F27, F57 and F18: correct the figures a verifier re-performs first: a CO2e-only derived T&D row, the right gas for the DESNZ "Kyoto protocol products" rows, an energy carrier on every instrument, and a warning on overlapping periods.
5. F6, F70 and F87: the run that is signed is the current one. Refuse the sign-off of a run on an older boundary version or with facts changed since, make the pre-flight's link list the records it names, and refuse a stale classification write.
6. F51, F23, F11, F78 and F71: keep the trail and the restatement whole. Record exclusions, evidence removals and base-year acts in the history, inherit the declaration's category reasons in a correction, and print the correction block in its PDF.
7. F90, F12 and F9: access and decision rights. End a disabled account's sessions, keep the client's accounting decisions from support access and from a preparer alone, and let a verifier read the organization's history.
8. F63, F64, F46 and F66: Scope 3 categories. Route franchises and investments to categories 14 and 15, accept every category a source kind can carry, apply Appendix F only to the leased asset's own sources, and print "not quantified" rather than a zero.
9. F36, F33, F34, F30, F38, F41, F40, F42 and F43: the factor console and adoption. No edits by the approver, namespaces per family, the Montreal Protocol rule for blends, no approval of a zero template, open inventories moved to the adopted versions, a blast radius that counts a change from zero, decided notices frozen, and errata that reach a correction with their reason.
10. F93, F50, F89, F101, F97, F98, F99 and F92: volume and self-sufficiency. One decision per source name in a large import, bulk classification, a session that survives a long task, the help's missing jobs, the contractor rule, the Get started file link, search over tables, and signposts for the sources the catalogue does not carry.

## 8. Status of the 11 September findings

| Old | Title (short) | Status | Note | New finding |
| --- | --- | --- | --- | --- |
| F1 | Members with four roles; acts attributed (positive) | Resolved | Holds; every history line names the actor, and the header names the preparer and the approver | F4 |
| F2 | Verifier sees write controls; saves fail silently | Resolved | Read-only banner and every write control disabled; the reasons exist only as hidden text | F5 |
| F3 | Platform administrator sees every organization | Resolved | Membership or a logged, time-boxed grant the owner sees; what a grant may do is open | F8, F10, F11, F12 |
| F4 | Adding a member with no account fails silently | Resolved | The refusal is on screen; its wording points owners at a page they lack | F2 |
| F5 | Request access, approval email, password policy (positive) | Resolved | Request, approval, set-password email and policy text as the help says (D); temporary passwords never forced to change | F1 |
| F6 | Organization deletion destroys published inventories | Resolved | A published inventory blocks deletion, even after a correction; typed name, reason and a soft delete; deleting an inventory is a hard delete | F83, F84 |
| F7 | Neutral post-login splash (positive) | Regressed | Now "MEASURE. CERTIFY. SUSTAIN." | F3 |
| F8 | Table 1 logic and the IFRS 10 override (positive) | Resolved | Seven entities right; IFRS 10 not re-probed; the franchise defaults are wrong | F13, F14 |
| F9 | Entity dates feed the membership windows (positive) | Resolved | "Member from" prefilled and pre-acquisition records excluded; the base-year table shows the acquired entity at 100% | F13, F48 |
| F10 | Grid region free text, no pre-selection | Partly resolved | A blank region follows the country and a one-click suggestion exists; still free text, "XX-NOWHERE" silent | F59 |
| F11 | Removed items kept but invisible | Partly resolved | Documents of removed records show "(record removed)"; the records cannot be found | F25 |
| F12 | Source register drives the default scope (positive) | Resolved | The contractor default works; import-created sources default to "Stationary combustion" and "Other" to Scope 1 | F17, F45, F65 |
| F13 | Periods, pro-rating, coverage matrix (positive) | Resolved | "17 of 31 days ... 54.84%"; the matrix shows "⊘" for documented zeros | F68 |
| F14 | Import with template, totals, preview, retained file (positive) | Resolved | Workbooks too; the digest matches | F16, F19 |
| F15 | Evidence on lines and the evidence index (positive) | Resolved | Lines print their evidence and E downloaded the index; evidence removal leaves no trace | F23 |
| F16 | Corrections need a reason; calculated records stay (positive) | Resolved | Holds; a correction after a run is flagged nowhere | F70 |
| F17 | Data quality tiers in the report (positive) | Resolved | Holds; the tier ignores the factor's quality | F75 |
| F18 | Bulk actions limited to removal | Resolved | Assign source, tier, link, remove, and decision cards at import; no bulk classification | F22, F50 |
| F19 | An unregistered unit dead-ends | Open | Imports as "Ready"; the picker says nothing about the unit | F20 |
| F20 | Density discoverability | Partly resolved | Inline hint and the conversion printed; density not preselected, per-litre listed first | F49 |
| F21 | Extensible factor library (positive) | Resolved | A two-person console with rules and editions; the catalogue narrowed by decision | F26, F32, F92 |
| F22 | Pack factors cite the pack, not the publication | Resolved | Every row cites its publication, table path, years and pack | F26 |
| F23 | The same factor two or three times in the picker | Resolved | One version per period | F26 |
| F24 | Unsourced grid and cooling factors approved; mixed vintages | Resolved | No shared library; a warning when two editions of a family meet in one inventory | F38 |
| F25 | Gas splits rebuilt from rounded values | Partly resolved | Diesel runs at the published figure; bus, flights, cars and LPG are re-derived | F72 |
| F26 | No HCFC-22 route, no cyanide, no purchased goods in the mining pack | Partly resolved | HCFC-22 is reported outside the scopes from DESNZ; explosives, lime and cyanide have no catalogue factor (catalogue narrowed by decision, spec 02.9) | F92 |
| F27 | AR6 R-410A citation and the non-fossil methane potential | Not retested | No pack blend carries a composition since spec 02.9, so A2's AR6 view kept R-410A at its AR5 CO2e and said so; a blend with a composition and the methane potential were not exercised | F74 |
| F28 | Picker filtered by unit family, not by kind | Open | 565 factors for a genset's diesel, refrigerant blends included | F49 |
| F29 | Boundary pre-populated, reasons, declaration checked (positive) | Resolved | Holds; a 36-month period draws its warning | F44 |
| F30 | Copied view keeps operational-control exclusions | Resolved | "Boundary rebuilt from Table 1 under equity share" | F44 |
| F31 | Freeze on hold, reopen without reason, two versions | Resolved | Unjustified departures hold the freeze; reopen asks a reason; the versions are explained | F77 |
| F32 | Entity without facilities: no reason, not in the exclusions | Open | Unchanged for Bonsu (A1, A2) and Wassa (A1) | F47 |
| F33 | Scope departure justification, proxy flag, lease inherited (positive) | Resolved | Holds | F45 |
| F34 | Scope locked for Scope 2 and 3 factors | Resolved | The select is enabled with a justification | F45 |
| F35 | Exclusion forces a numeric estimate | Resolved | "Not estimated" works; a duplicate is forced into "This record emits nothing" | F52 |
| F36 | Review renders a 107-option select per record | Resolved | Pages of 50; 6.7 s at 2,603 records (B), and A1 agrees; classification itself does not scale | F50, F94 |
| F37 | Appendix F lost under equity share | Resolved | The head office moves to category 8; staff flights move too | F44, F46 |
| F38 | Instruments by MWh, criteria, failing not applied (positive) | Resolved | Holds and recomputes in both views; a steam contract is applied to electricity | F56, F57 |
| F39 | Copied instruments lose their criteria | Resolved | The guarantee of origin copied with its failing criteria and certificate details | F44 |
| F40 | Instruments vanish when frozen | Partly resolved | Listed read-only with their criteria; adding one still needs a reopen | F56 |
| F41 | No category 3 from fuel and power | Resolved | Upstream rules derive well-to-tank and T&D lines | F62, F67 |
| F42 | Void with reason (positive) | Resolved | Holds | F77 |
| F43 | "Mark as final" acts at once, with no note | Resolved | A dialog with a review note, closed to preparers, refused to the submitter | F4 |
| F44 | Pro-rated lines carry full gas masses | Resolved | `co2_kg` 89,358.104 = 34,000 litre x 2.62818 | F68 |
| F45 | By-gas table does not foot (Blocker) | Resolved | A row for CO2e-only factors; foots in the HTML and the PDF; two seed rows misbook gases | F27, F28, F68 |
| F46 | Arithmetic reproduces (positive) | Resolved | Holds; diesel at the published 2.66155 | F68 |
| F47 | Four exports (positive) | Resolved | Holds, 63 line columns; file names collide and the JSON omits the rules | F76 |
| F48 | PDF identifiers, timestamps, drifting tables | Resolved | Reader labels, UTC dates, headings kept with their tables | F69, F71 |
| F49 | Chapter 9 content (positive) | Resolved | Holds; exclusions list and intensity basis need work | F73, F74 |
| F50 | Tiles, versions, dates | Partly resolved | Versions explained and PDF dates in UTC; HTML times have no zone and the Scope 2 tile no method | none |
| F51 | Base-year policy and candidates (positive) | Partly resolved | Designation, raise and decline work; an acquisition is not detected and a restated run cannot be recorded | F80, F81 |
| F52 | Affected share typed, run id pasted | Open | Still a typed id; a correction's run is refused | F81 |
| F53 | Publication and correction (positive) | Resolved | Holds in the HTML; the correction's PDF and its category reasons do not, and its line count is short | F71, F78, F79 |
| F54 | Reopen without a reason | Resolved | "Reopen as a draft?" requires a reason and the history prints it | F77 |
| F55 | Sector packs exist (positive) | Superseded | Catalogue narrowed by decision, spec 02.9 (B saw them gone and called it a regression) | F92 |
| F56 | Gaps for the stated markets | Partly resolved | HCFC-22 outside the scopes, and methane as a gas through a DESNZ row that prints as HFCs; no flaring, venting, cyanide, purchased lime or steel; the route is an organization factor (A1, B agree) | F27, F92 |

## 9. Status of the 8 September findings still open on 11 September

| Old | Title (short) | Status | Note | New finding |
| --- | --- | --- | --- | --- |
| F8 | No confirmation or soft delete | Partly resolved | Removal dialogs with reasons and tombstones; removed records cannot be found; an evidence link goes in one click; an inventory is hard-deleted in one click | F23, F25, F84 |
| F19 | Weak factor provenance | Resolved | Every row cites its publication, table and years, and the console refuses rows without them; the derived T&D row's stated arithmetic is off | F26, F28, F32 |
| F20 | Grid factor CO2 only; by-gas omits it | Resolved | The by-gas row for CO2e-only factors ties to the total; the derived T&D row is booked as CO2 | F28, F68 |
| F24 | No warning for non-annual periods | Partly resolved | "This period is 36 months. ..." on the form; fiscal years not exercised | F44 |
| F27 | Scope locked for Scope 2 and 3 factors | Resolved | The select is enabled with a justification | F45 |
| F28 | Appendix F lease treatment (positive) | Resolved | Restored under equity share; staff flights move with it | F44, F46 |
| F47 | Affected share typed by hand | Open | As 11 September F52 | F81 |
| F51 | Sector coverage thin for the stated market | Partly resolved | By decision the catalogue is DESNZ and Ghana (spec 02.9): HCFC-22 outside the scopes, fuel oil and the Ghana T&D factor are there, and methane as a gas exists but prints as HFCs; explosives, purchased lime, cyanide, clinker, steel and rebar, flaring, venting and tank losses need an organization factor (A1, B; B called it a regression against 11 September) | F27, F92 |
