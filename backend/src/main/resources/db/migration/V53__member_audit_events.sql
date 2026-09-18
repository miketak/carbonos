-- Spec 01.7: History lists the organization's own events, and membership
-- changes are among them. Who was added, promoted, demoted or removed, by
-- whom and when, is a fact an owner reads for themselves. The action check is
-- dropped and recreated with the three kinds added, the pattern V37, V45 and
-- V48 use.
ALTER TABLE ghg_audit_events DROP CONSTRAINT ghg_audit_events_action_check;
ALTER TABLE ghg_audit_events ADD CONSTRAINT ghg_audit_events_action_check
    CHECK (action IN ('RUN_VOIDED', 'FINAL_WITHDRAWN', 'CLASSIFIED', 'REVIEWED', 'FROZEN', 'REOPENED',
                      'RUN_LAUNCHED', 'FINAL_DESIGNATED', 'PUBLISHED', 'CORRECTION_CREATED', 'HEADER_SAVED',
                      'ADMIN_ACCESS_ASSUMED', 'ADMIN_ACCESS_ENDED', 'ADMIN_ACCESS_EXPIRED', 'ORGANIZATION_DELETED',
                      'FACTOR_PACK_ADOPTED', 'FACTOR_PACK_DECLINED', 'ORGANIZATION_CREATED',
                      'MEMBER_ADDED', 'MEMBER_ROLE_CHANGED', 'MEMBER_REMOVED'));
