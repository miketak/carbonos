# Procedure 8: Publication and corrections

**Objective.** Confirm that a final run is designated and withdrawn by the
right role, that a published report never changes, that what came after is
shown apart, and that a correction inherits the view with a reason and
reports what it changed.

**Covers** [spec 05.1](../../specs/05.1-inventory-lifecycle-and-run-snapshots.md),
[spec 05.2](../../specs/05.2-run-numbering-and-voiding.md),
[spec 05.3](../../specs/05.3-inheritance-and-the-published-record.md) and
[spec 01.2](../../specs/01.2-organization-membership-and-roles.md) (roles).

**Estimated time:** 45 minutes.

**Run this procedure** before a release, and after any change to
publication, corrections, the report snapshot or the audit events.

## Prerequisites

- **2025 Operational** with runs as procedure 7 leaves it.
- The Analyst (REVIEWER) and Auditor (VERIFIER) accounts of procedure 1.

## A. Final designation

### A1. Designating and withdrawing

1. As the Analyst, mark run 005 as final.
2. Try to reopen the inventory; then withdraw the designation with the
   reason "Run 006 will carry the approver"; reopen; freeze; launch run
   006; mark it final.

**Expected result:** reopening is refused while a run is final. The
withdrawal needs a reason and appears in the history with the Analyst's
email. Run 006 is FINAL.

Verdict: ☐ pass ☐ fail. Notes:

### A2. Only an approver publishes

1. As the Auditor, try to publish. As the Analyst, publish.

**Expected result:** the Auditor is refused with the role named. The
inventory is PUBLISHED, with the time and the Analyst's email in the
history and in the report header.

Verdict: ☐ pass ☐ fail. Notes:

## B. The published record

### B1. Nothing on a published inventory changes

1. Try to reopen, to change the declaration, to void run 006, and to
   delete the inventory.

**Expected result:** each is refused: a published inventory is a record.

Verdict: ☐ pass ☐ fail. Notes:

### B2. The published report is frozen

1. Under **Activity data**, correct R2 (mill electricity) to 50,000 MWh
   with a reason.
2. Under **Base year**, designate 2025 Operational as the base year (if not
   already) and create **2026 Corporate** under Inventories.
3. Open run 006's report.

**Expected result:** the report reads exactly as published (48,500 MWh, no
2026 inventory in the profile). A **Since publication** block lists the
quantity change (48500 → 50000), the 2026 inventory, and the acts since.

Verdict: ☐ pass ☐ fail. Notes:

### B3. The published view marks what changed

1. Open the inventory's activity view.

**Expected result:** the page says the view shows records as published; R2
still shows 48,500 MWh with "Changed since publication: quantity".

Verdict: ☐ pass ☐ fail. Notes:

## C. Corrections

### C1. A correction needs a reason and inherits the view

1. As the Analyst, click **Create correction**; try with an empty reason;
   then enter "Mill electricity understated by 1,500 MWh" and create.

**Expected result:** the button stays disabled without a reason of at
least 10 characters. The correction opens as a draft: its boundary,
instruments, declaration and every classification and exclusion are
inherited (each marked "inherited"), and the page says how many decisions
it inherited and names the reason.

Verdict: ☐ pass ☐ fail. Notes:

### C2. The correction's report says what changed

1. In the correction, review activity data (R2 is already corrected),
   freeze, launch a run and open its report.

**Expected result:** a **Correction of 2025 Operational** block with the
reason, "0 lines added, 0 removed, 1 changed" and the change in t CO2e
(1,500,000 × 0.441 = 661,500 kg more).

Verdict: ☐ pass ☐ fail. Notes:

### C3. The chain is visible

1. Open the published inventory and the correction.

**Expected result:** the published one links to its correction and its
history says why it was created; the correction's header shows version 2
and what it supersedes. A second correction of the same published
inventory is refused.

Verdict: ☐ pass ☐ fail. Notes:

## Sign-off

| Field | Value |
| --- | --- |
| Procedure and version tested | |
| Tester and date | |
| Cases failed | |
| Issues filed | |

**Known non-goals:** re-syncing inherited decisions when the source changes
later; a diff of two PDFs.
