-- ECO-13 (spec 05.8): a review state between frozen and final, who prepares and who signs.

-- 1. In review: a run was submitted for review and waits for someone other than its submitter to
--    sign it off (Corporate Standard chapter 7, ISO 14064-1 8.1). V12 named the check inline.
ALTER TABLE ghg_inventories DROP CONSTRAINT ghg_inventories_status_check;
ALTER TABLE ghg_inventories ADD CONSTRAINT ghg_inventories_status_check
    CHECK (status IN ('DRAFT', 'FROZEN', 'IN_REVIEW', 'FINAL', 'PUBLISHED'));

-- 2. The assignment: an optional named preparer and approver who narrow who may act, within the
--    organization roles. Plain identifiers with snapshots of the email and name, no foreign key
--    across modules, as the boundary version's reopen and the audit actor already do.
ALTER TABLE ghg_inventories
    ADD COLUMN preparer_user_id uuid,
    ADD COLUMN preparer_email   varchar(320),
    ADD COLUMN preparer_name    varchar(160),
    ADD COLUMN approver_user_id uuid,
    ADD COLUMN approver_email   varchar(320),
    ADD COLUMN approver_name    varchar(160);

-- 3. The submission: the run put forward, by whom, when, and the note for the approver. A plain id,
--    like final_run_id, so a response never loads the run.
ALTER TABLE ghg_inventories
    ADD COLUMN submitted_run_id     uuid,
    ADD COLUMN submitted_by_user_id uuid,
    ADD COLUMN submitted_by         varchar(320),
    ADD COLUMN submitted_by_name    varchar(160),
    ADD COLUMN submitted_at         timestamptz,
    ADD COLUMN submit_note          varchar(500);

-- 4. The sign-off as an account: final_designated_by (V36) holds the email; the id and the name join
--    it, and whether nobody else could check, which the report discloses.
ALTER TABLE ghg_inventories
    ADD COLUMN final_designated_by_user_id uuid,
    ADD COLUMN final_designated_by_name    varchar(160),
    ADD COLUMN final_self_approved         boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN ghg_inventories.approved_by IS
    'The approver typed before spec 05.8, kept for inventories published with it; nothing writes it any more.';
COMMENT ON COLUMN ghg_inventories.submitted_run_id IS
    'The run submitted for review while the inventory is IN_REVIEW, and the run that was signed off once FINAL.';
COMMENT ON COLUMN ghg_inventories.final_self_approved IS
    'The sign-off was by the submitter because nobody else in the organization could approve (spec 05.8).';

-- 5. Four new acts in the inventory's history.
ALTER TABLE ghg_audit_events DROP CONSTRAINT ghg_audit_events_action_check;
ALTER TABLE ghg_audit_events ADD CONSTRAINT ghg_audit_events_action_check
    CHECK (action IN ('RUN_VOIDED', 'FINAL_WITHDRAWN', 'CLASSIFIED', 'REVIEWED', 'FROZEN', 'REOPENED',
                      'RUN_LAUNCHED', 'FINAL_DESIGNATED', 'PUBLISHED', 'CORRECTION_CREATED', 'HEADER_SAVED',
                      'ADMIN_ACCESS_ASSUMED', 'ADMIN_ACCESS_ENDED', 'ADMIN_ACCESS_EXPIRED', 'ORGANIZATION_DELETED',
                      'FACTOR_PACK_ADOPTED', 'FACTOR_PACK_DECLINED', 'ORGANIZATION_CREATED',
                      'MEMBER_ADDED', 'MEMBER_ROLE_CHANGED', 'MEMBER_REMOVED', 'ORGANIZATION_RENAMED',
                      'ENTITY_ADDED', 'ENTITY_UPDATED', 'ENTITY_REMOVED',
                      'FACILITY_ADDED', 'FACILITY_UPDATED', 'FACILITY_REMOVED',
                      'STREAM_ADDED', 'STREAM_REMOVED',
                      'UPSTREAM_RULE_ADDED', 'UPSTREAM_RULE_REMOVED',
                      'IMPORT_SOURCE_MAPPED', 'RECORDS_BULK_CORRECTED',
                      'SUBMITTED_FOR_REVIEW', 'REVIEW_RETURNED', 'SUBMISSION_WITHDRAWN', 'SIGN_OFF_ASSIGNED'));
