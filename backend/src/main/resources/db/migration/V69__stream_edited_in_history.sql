-- Edit an emission source (plan of 2026-10-07, specs 04.3 and 04.10 amended): editing a
-- source is an act in the organization's history, as editing a facility has been since
-- V60. The source is the unit the evidence pack keys on, so a renamed source or a changed
-- meter is a traceability break if the inventory report cites the old name; a changed kind
-- or operator is an operational-boundary decision (Corporate Standard chapter 4) that
-- chapter 9 wants documented. The action check is dropped and recreated with STREAM_EDITED
-- (the pattern of V60, V62 and V67).
ALTER TABLE ghg_audit_events DROP CONSTRAINT ghg_audit_events_action_check;
ALTER TABLE ghg_audit_events ADD CONSTRAINT ghg_audit_events_action_check
    CHECK (action IN ('RUN_VOIDED', 'FINAL_WITHDRAWN', 'CLASSIFIED', 'REVIEWED', 'FROZEN', 'REOPENED',
                      'RUN_LAUNCHED', 'FINAL_DESIGNATED', 'PUBLISHED', 'CORRECTION_CREATED', 'HEADER_SAVED',
                      'ADMIN_ACCESS_ASSUMED', 'ADMIN_ACCESS_ENDED', 'ADMIN_ACCESS_EXPIRED', 'ORGANIZATION_DELETED',
                      'FACTOR_PACK_ADOPTED', 'FACTOR_PACK_DECLINED', 'ORGANIZATION_CREATED',
                      'MEMBER_ADDED', 'MEMBER_ROLE_CHANGED', 'MEMBER_REMOVED', 'ORGANIZATION_RENAMED',
                      'ENTITY_ADDED', 'ENTITY_UPDATED', 'ENTITY_REMOVED',
                      'FACILITY_ADDED', 'FACILITY_UPDATED', 'FACILITY_REMOVED',
                      'STREAM_ADDED', 'STREAM_EDITED', 'STREAM_REMOVED',
                      'UPSTREAM_RULE_ADDED', 'UPSTREAM_RULE_REMOVED',
                      'IMPORT_SOURCE_MAPPED', 'RECORDS_BULK_CORRECTED',
                      'SUBMITTED_FOR_REVIEW', 'REVIEW_RETURNED', 'SUBMISSION_WITHDRAWN', 'SIGN_OFF_ASSIGNED'));
