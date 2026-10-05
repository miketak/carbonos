-- ECO-24 (spec 04.11): the import decides an unknown emission source in the
-- preview, accepts a workbook, and the register acts on several records at once.

-- 1. A source born during an import is told apart from one described on the activity form.
ALTER TABLE ghg_source_streams DROP CONSTRAINT ghg_source_streams_origin_check;
ALTER TABLE ghg_source_streams ADD CONSTRAINT ghg_source_streams_origin_check
    CHECK (origin IN ('REGISTER', 'INLINE', 'IMPORT'));

-- 2. The batch records which reader parsed the file, where the rendered table of a
--    workbook is kept beside it, and how many sources the import created.
ALTER TABLE ghg_import_batches
    ADD COLUMN parser               varchar(60)  NOT NULL DEFAULT 'csv',
    ADD COLUMN rendered_storage_key varchar(255),
    ADD COLUMN sources_created      integer      NOT NULL DEFAULT 0;

-- 3. Each decision on an unknown source name: what was typed, what it resolved to,
--    the rows it covered, the reason and who decided.
CREATE TABLE ghg_import_decisions (
    id                  uuid PRIMARY KEY,
    batch_id            uuid         NOT NULL REFERENCES ghg_import_batches (id) ON DELETE CASCADE,
    facility_id         uuid         NOT NULL REFERENCES ghg_facilities (id) ON DELETE CASCADE,
    typed_name          varchar(120) NOT NULL,
    kind                varchar(8)   NOT NULL CHECK (kind IN ('MAPPED', 'CREATED')),
    stream_id           uuid         REFERENCES ghg_source_streams (id) ON DELETE SET NULL,
    rows                text         NOT NULL,
    reason              varchar(500),
    decided_by_user_id  uuid,
    decided_by          varchar(320) NOT NULL,
    decided_at          timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_ghg_import_decisions_batch ON ghg_import_decisions (batch_id);

-- 4. The revisions and tombstones of one bulk act share an id, so twelve corrections read as one act.
ALTER TABLE ghg_activity_revisions ADD COLUMN bulk_id uuid;
CREATE INDEX idx_ghg_activity_revisions_bulk ON ghg_activity_revisions (bulk_id) WHERE bulk_id IS NOT NULL;
ALTER TABLE ghg_activities ADD COLUMN delete_bulk_id uuid;

-- 5. Two new acts in the organization's history.
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
                      'IMPORT_SOURCE_MAPPED', 'RECORDS_BULK_CORRECTED'));
