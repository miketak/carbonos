-- T-14, T-15, T-16, T-17 (audit findings F8, F12, F13, F14, F22; spec 04.4):
-- data quality tiers and uncertainty, evidence attachments, fact corrections
-- with a reason and a revision history, tombstones instead of hard deletes,
-- and record exclusions with a justification and an estimated magnitude.

-- 1. Data quality tier (1 best to 5 worst, Scope 3 Standard chapter 7) and
--    an optional uncertainty on each record; the tier defaults from the
--    method already recorded.
ALTER TABLE ghg_activities
    ADD COLUMN data_quality_tier   integer       NOT NULL DEFAULT 3
        CHECK (data_quality_tier BETWEEN 1 AND 5),
    ADD COLUMN uncertainty_percent numeric(6, 2) CHECK (uncertainty_percent >= 0);
UPDATE ghg_activities SET data_quality_tier = CASE data_quality
    WHEN 'MEASURED' THEN 1 WHEN 'CALCULATED' THEN 3 ELSE 4 END;

-- 2. Tombstones: a removed fact, facility or entity stays on the record with
--    who removed it, when and why.
ALTER TABLE ghg_activities
    ADD COLUMN deleted_at    timestamptz,
    ADD COLUMN deleted_by    varchar(320),
    ADD COLUMN delete_reason varchar(500);
ALTER TABLE ghg_facilities
    ADD COLUMN deleted_at    timestamptz,
    ADD COLUMN deleted_by    varchar(320),
    ADD COLUMN delete_reason varchar(500);
ALTER TABLE ghg_entities
    ADD COLUMN deleted_at    timestamptz,
    ADD COLUMN deleted_by    varchar(320),
    ADD COLUMN delete_reason varchar(500);
CREATE INDEX idx_ghg_activities_live ON ghg_activities (facility_id) WHERE deleted_at IS NULL;

-- 3. Every correction of a fact: who, when, why, and each field's old and new value.
CREATE TABLE ghg_activity_revisions (
    id                 uuid PRIMARY KEY,
    activity_id        uuid         NOT NULL REFERENCES ghg_activities (id) ON DELETE CASCADE,
    kind               varchar(12)  NOT NULL CHECK (kind IN ('CORRECTED', 'REMOVED')),
    reason             varchar(500) NOT NULL,
    changes            text         NOT NULL,
    changed_by_user_id uuid,
    changed_by         varchar(320) NOT NULL,
    changed_at         timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX idx_ghg_activity_revisions_activity ON ghg_activity_revisions (activity_id, changed_at);

-- 4. Evidence: a file in the object store, or a link, attached to a record or
--    to a contractual instrument.
CREATE TABLE ghg_evidence (
    id                 uuid PRIMARY KEY,
    activity_id        uuid REFERENCES ghg_activities (id) ON DELETE CASCADE,
    market_factor_id   uuid REFERENCES ghg_market_factors (id) ON DELETE CASCADE,
    kind               varchar(6)   NOT NULL CHECK (kind IN ('FILE', 'LINK')),
    name               varchar(255) NOT NULL,
    url                varchar(1000),
    content_type       varchar(120),
    size_bytes         bigint,
    storage_key        varchar(255),
    uploaded_by        varchar(320) NOT NULL,
    uploaded_at        timestamptz  NOT NULL DEFAULT now(),
    CHECK ((activity_id IS NULL) <> (market_factor_id IS NULL))
);
CREATE INDEX idx_ghg_evidence_activity ON ghg_evidence (activity_id);
CREATE INDEX idx_ghg_evidence_market_factor ON ghg_evidence (market_factor_id);

-- 5. A record exclusion carries a justification and an estimated magnitude;
--    the run's exclusion snapshot keeps both. A removed record is an
--    exclusion reason of its own.
ALTER TABLE ghg_assignments
    ADD COLUMN exclusion_justification varchar(500),
    ADD COLUMN estimated_kg_co2e       numeric(18, 3) CHECK (estimated_kg_co2e >= 0);
ALTER TABLE ghg_run_exclusions
    ADD COLUMN exclusion_justification varchar(500),
    ADD COLUMN estimated_kg_co2e       numeric(18, 3);
ALTER TABLE ghg_assignments DROP CONSTRAINT IF EXISTS ghg_assignments_exclusion_reason_check;
ALTER TABLE ghg_assignments ADD CONSTRAINT ghg_assignments_exclusion_reason_check
    CHECK (exclusion_reason IN ('OUTSIDE_PERIOD', 'OUTSIDE_BOUNDARY', 'NON_GHG', 'DUPLICATE', 'NOT_APPLICABLE',
                                'METHODOLOGY', 'OTHER', 'RECORD_REMOVED'));
ALTER TABLE ghg_run_exclusions DROP CONSTRAINT IF EXISTS ghg_run_exclusions_exclusion_reason_check;
ALTER TABLE ghg_run_exclusions ADD CONSTRAINT ghg_run_exclusions_exclusion_reason_check
    CHECK (exclusion_reason IN ('OUTSIDE_PERIOD', 'OUTSIDE_BOUNDARY', 'NON_GHG', 'DUPLICATE', 'NOT_APPLICABLE',
                                'METHODOLOGY', 'OTHER', 'RECORD_REMOVED'));

-- 6. Lines snapshot the record's quality and its evidence, so the report's
--    data-quality table and the calculation file read from the run alone.
ALTER TABLE ghg_run_lines
    ADD COLUMN data_quality        varchar(20),
    ADD COLUMN data_quality_tier   integer,
    ADD COLUMN uncertainty_percent numeric(6, 2),
    ADD COLUMN evidence_files      varchar(1000);
UPDATE ghg_run_lines l SET data_quality = a.data_quality, data_quality_tier = a.data_quality_tier
    FROM ghg_activities a WHERE a.id = l.activity_id;

-- 7. The accountant's qualitative uncertainty statement, printed with the data-quality table.
ALTER TABLE ghg_inventories ADD COLUMN uncertainty_statement varchar(1000);
