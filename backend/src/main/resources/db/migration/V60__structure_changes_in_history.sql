-- Specs 01.7 and 03.1 (amended 2026-09-29): the organization's history records
-- its structure. A legal entity or a facility added, edited or removed, and a
-- source stream added or removed, is an act an owner reads for themselves:
-- who changed a subsidiary's ownership share, and when. The action check is
-- dropped and recreated with the eight kinds added, the pattern V37, V45, V48,
-- V53 and V56 use.
ALTER TABLE ghg_audit_events DROP CONSTRAINT ghg_audit_events_action_check;
ALTER TABLE ghg_audit_events ADD CONSTRAINT ghg_audit_events_action_check
    CHECK (action IN ('RUN_VOIDED', 'FINAL_WITHDRAWN', 'CLASSIFIED', 'REVIEWED', 'FROZEN', 'REOPENED',
                      'RUN_LAUNCHED', 'FINAL_DESIGNATED', 'PUBLISHED', 'CORRECTION_CREATED', 'HEADER_SAVED',
                      'ADMIN_ACCESS_ASSUMED', 'ADMIN_ACCESS_ENDED', 'ADMIN_ACCESS_EXPIRED', 'ORGANIZATION_DELETED',
                      'FACTOR_PACK_ADOPTED', 'FACTOR_PACK_DECLINED', 'ORGANIZATION_CREATED',
                      'MEMBER_ADDED', 'MEMBER_ROLE_CHANGED', 'MEMBER_REMOVED', 'ORGANIZATION_RENAMED',
                      'ENTITY_ADDED', 'ENTITY_UPDATED', 'ENTITY_REMOVED',
                      'FACILITY_ADDED', 'FACILITY_UPDATED', 'FACILITY_REMOVED',
                      'STREAM_ADDED', 'STREAM_REMOVED'));
