-- Spec 03.2 (effective-dated membership) and spec 05.1 (inventory lifecycle
-- and complete run snapshots).

-- 1. A treatment may be bounded in time: a facility acquired on 1 July is a
--    member from 1 July. Versions record the window alongside the share, and
--    record zero-share entities as excluded under the approach rather than as
--    members contributing nothing.
ALTER TABLE ghg_boundary_treatments
    ADD COLUMN effective_from date,
    ADD COLUMN effective_to   date,
    ADD CONSTRAINT chk_ghg_boundary_treatments_window
        CHECK (effective_from IS NULL OR effective_to IS NULL OR effective_from <= effective_to);

ALTER TABLE ghg_boundary_version_entries
    ADD COLUMN effective_from   date,
    ADD COLUMN effective_to     date,
    ADD COLUMN excluded         boolean NOT NULL DEFAULT false,
    ADD COLUMN exclusion_reason varchar(255);

-- 2. The inventory has one lifecycle covering both the boundary and the
--    activity view. The boundary status folds into it.
ALTER TABLE ghg_inventories
    ADD COLUMN status varchar(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'FROZEN', 'FINAL', 'PUBLISHED')),
    ADD COLUMN superseded_by_id uuid REFERENCES ghg_inventories (id) ON DELETE SET NULL,
    ADD COLUMN published_at timestamptz;

UPDATE ghg_inventories
SET status = CASE
                 WHEN boundary_status = 'FROZEN' AND final_run_id IS NOT NULL THEN 'FINAL'
                 WHEN boundary_status = 'FROZEN' THEN 'FROZEN'
                 ELSE 'DRAFT'
             END;

ALTER TABLE ghg_inventories DROP COLUMN boundary_status;

-- 3. An automatic exclusion says why in words a verifier can read, e.g. the
--    membership window the record fell outside.
ALTER TABLE ghg_assignments ADD COLUMN exclusion_detail varchar(255);

-- 4. A run snapshots every assignment it did not calculate, with the
--    activity's facts and the documented reason (Chapter 9: exclusions are
--    reported with justification).
CREATE TABLE ghg_run_exclusions (
    id               uuid PRIMARY KEY,
    run_id           uuid           NOT NULL REFERENCES ghg_runs (id) ON DELETE CASCADE,
    activity_id      uuid           NOT NULL,
    facility_name    varchar(120)   NOT NULL,
    activity_type    varchar(120)   NOT NULL,
    quantity         numeric(14, 3) NOT NULL,
    unit             varchar(30)    NOT NULL,
    activity_date    date           NOT NULL,
    exclusion_reason varchar(40)    NOT NULL,
    exclusion_detail varchar(255)
);

CREATE INDEX idx_ghg_run_exclusions_run ON ghg_run_exclusions (run_id);

-- 5. A line remembers which facility it came from (a loose reference, like
--    activity_id), so a later boundary change can be measured against a
--    base-year run per facility (spec 06).
ALTER TABLE ghg_run_lines ADD COLUMN facility_id uuid;

UPDATE ghg_run_lines l
SET facility_id = a.facility_id
FROM ghg_activities a
WHERE a.id = l.activity_id;
