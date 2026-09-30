-- Spec 04.7 (amended 2026-09-29): adding or removing an upstream rule is its own
-- act in an inventory's history. It was recorded as REVIEWED, so the history
-- labelled "upstream rule added: ..." as "Activity data reviewed". The action
-- check is dropped and recreated with the two kinds added (the pattern of V60),
-- and the rows already written are given the kind their reason names; the
-- reason itself is not touched.
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
                      'UPSTREAM_RULE_ADDED', 'UPSTREAM_RULE_REMOVED'));

UPDATE ghg_audit_events SET action = 'UPSTREAM_RULE_ADDED'
    WHERE action = 'REVIEWED' AND reason LIKE 'upstream rule added: %';
UPDATE ghg_audit_events SET action = 'UPSTREAM_RULE_REMOVED'
    WHERE action = 'REVIEWED' AND reason LIKE 'upstream rule removed: %';
