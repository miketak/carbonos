-- Spec 04.6: the activity register as a data-collection workspace: drafts,
-- per-organization record numbers, import provenance, and the promotion of a
-- draft as a revision of its own kind.

-- 1. The organization on the record, denormalized from the facility (a
--    correction never moves a record across organizations), so the record
--    number can be unique per organization.
ALTER TABLE ghg_activities
    ADD COLUMN organization_id uuid REFERENCES ghg_organizations (id) ON DELETE CASCADE;
UPDATE ghg_activities a SET organization_id = f.organization_id
  FROM ghg_facilities f WHERE f.id = a.facility_id;
ALTER TABLE ghg_activities ALTER COLUMN organization_id SET NOT NULL;

-- 2. The record number (ACT-0001 in the UI and the exports), backfilled once
--    in (period_start, created_at) order; from here on numbers follow
--    allocation order and are never reused, tombstones included.
ALTER TABLE ghg_activities ADD COLUMN record_no integer;
UPDATE ghg_activities a SET record_no = n.rn
  FROM (SELECT id,
               row_number() OVER (PARTITION BY organization_id ORDER BY period_start, created_at, id) AS rn
          FROM ghg_activities) n
 WHERE n.id = a.id;
ALTER TABLE ghg_activities ALTER COLUMN record_no SET NOT NULL;
ALTER TABLE ghg_activities
    ADD CONSTRAINT uq_ghg_activities_record_no UNIQUE (organization_id, record_no);

-- 3. The allocator: the next free number per organization, row-locked while
--    numbers are taken.
ALTER TABLE ghg_organizations ADD COLUMN next_record_no integer NOT NULL DEFAULT 1;
UPDATE ghg_organizations o SET next_record_no =
    COALESCE((SELECT max(record_no) FROM ghg_activities a WHERE a.organization_id = o.id), 0) + 1;

-- 4. Drafts: a draft may lack quantity, unit or period; a fact must have all
--    three. The V4 quantity check and the V23 period check tolerate NULL.
ALTER TABLE ghg_activities ADD COLUMN draft boolean NOT NULL DEFAULT false;
ALTER TABLE ghg_activities
    ALTER COLUMN quantity     DROP NOT NULL,
    ALTER COLUMN unit         DROP NOT NULL,
    ALTER COLUMN period_start DROP NOT NULL,
    ALTER COLUMN period_end   DROP NOT NULL;
ALTER TABLE ghg_activities ADD CONSTRAINT chk_ghg_activities_fact_complete
    CHECK (draft OR (quantity IS NOT NULL AND unit IS NOT NULL
                     AND period_start IS NOT NULL AND period_end IS NOT NULL));
CREATE INDEX idx_ghg_activities_org_live ON ghg_activities (organization_id, draft)
    WHERE deleted_at IS NULL;

-- 5. Lines and exclusions snapshot the record number, so the calculation file
--    reads from the run alone.
ALTER TABLE ghg_run_lines ADD COLUMN record_no integer;
ALTER TABLE ghg_run_exclusions ADD COLUMN record_no integer;
UPDATE ghg_run_lines l SET record_no = a.record_no FROM ghg_activities a WHERE a.id = l.activity_id;
UPDATE ghg_run_exclusions x SET record_no = a.record_no FROM ghg_activities a WHERE a.id = x.activity_id;

-- 6. Import provenance (ISO 14064-1 section 8.3): the file each imported
--    record came from, kept in the object store, with its digest and row.
CREATE TABLE ghg_import_batches (
    id              uuid PRIMARY KEY,
    organization_id uuid         NOT NULL REFERENCES ghg_organizations (id) ON DELETE CASCADE,
    file_name       varchar(255) NOT NULL,
    sha256          varchar(64)  NOT NULL,
    row_count       integer      NOT NULL,
    size_bytes      bigint       NOT NULL,
    storage_key     varchar(255) NOT NULL,
    imported_by     varchar(320) NOT NULL,
    imported_at     timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_ghg_import_batches_org ON ghg_import_batches (organization_id, imported_at);
ALTER TABLE ghg_activities
    ADD COLUMN import_batch_id uuid REFERENCES ghg_import_batches (id),
    ADD COLUMN import_row      integer;

-- 7. The promotion of a draft to a fact is a revision of its own kind.
ALTER TABLE ghg_activity_revisions DROP CONSTRAINT ghg_activity_revisions_kind_check;
ALTER TABLE ghg_activity_revisions ADD CONSTRAINT ghg_activity_revisions_kind_check
    CHECK (kind IN ('CORRECTED', 'REMOVED', 'ENTERED'));
