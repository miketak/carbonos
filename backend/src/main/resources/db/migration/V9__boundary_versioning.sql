-- Spec 007: the organizational boundary gains a DRAFT/FROZEN lifecycle, and
-- every freeze cuts an immutable, numbered version. A run cites the version it
-- computed from, so a verifier can see the complete boundary behind a number,
-- not only the facilities that happened to emit.

-- 1. Versions: one row per deliberate freeze.
CREATE TABLE ghg_boundary_versions (
    id                     uuid PRIMARY KEY,
    inventory_id           uuid         NOT NULL REFERENCES ghg_inventories (id) ON DELETE CASCADE,
    version_no             integer      NOT NULL,
    consolidation_approach varchar(30)  NOT NULL
        CHECK (consolidation_approach IN ('EQUITY_SHARE', 'FINANCIAL_CONTROL', 'OPERATIONAL_CONTROL')),
    facility_count         integer      NOT NULL,
    frozen_by_user_id      uuid,
    frozen_by              varchar(320),
    frozen_at              timestamptz  NOT NULL DEFAULT now(),
    UNIQUE (inventory_id, version_no)
);

CREATE INDEX idx_ghg_boundary_versions_inventory ON ghg_boundary_versions (inventory_id);

-- 2. Entries: the boundary exactly as it stood. Facility name and location are
--    copied, as run lines copy them, so a version stays readable after a
--    facility is renamed or deleted. facility_id is a loose reference.
CREATE TABLE ghg_boundary_version_entries (
    id                  uuid PRIMARY KEY,
    boundary_version_id uuid          NOT NULL REFERENCES ghg_boundary_versions (id) ON DELETE CASCADE,
    facility_id         uuid          NOT NULL,
    facility_name       varchar(120)  NOT NULL,
    location            varchar(120)  NOT NULL,
    ownership_percent   numeric(5, 2) NOT NULL,
    financial_control   boolean       NOT NULL,
    operational_control boolean       NOT NULL,
    accounting_share    numeric(7, 4) NOT NULL
);

CREATE INDEX idx_ghg_boundary_version_entries_version
    ON ghg_boundary_version_entries (boundary_version_id);

-- 3. The inventory carries the state and a pointer to its latest version. The
--    version number is copied alongside the id, as final_run_id is a plain
--    column, so responses never need a second lookup.
ALTER TABLE ghg_inventories
    ADD COLUMN boundary_status varchar(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (boundary_status IN ('DRAFT', 'FROZEN')),
    ADD COLUMN current_boundary_version_id uuid
        REFERENCES ghg_boundary_versions (id) ON DELETE SET NULL,
    ADD COLUMN current_boundary_version_no integer;

-- 4. A run cites the version it computed its accounting shares from.
ALTER TABLE ghg_runs
    ADD COLUMN boundary_version_id uuid REFERENCES ghg_boundary_versions (id),
    ADD COLUMN boundary_version_no integer;

-- 5. Backfill. Inventories that already produced a run are frozen at a v1
--    reconstructed from their current treatments, with no freezer recorded.
--    Their existing runs keep a NULL version on purpose: the boundary may have
--    moved since they were calculated, so citing v1 would assert something we
--    cannot know to be true. Inventories with no run stay DRAFT.
INSERT INTO ghg_boundary_versions (id, inventory_id, version_no, consolidation_approach, facility_count)
SELECT gen_random_uuid(),
       i.id,
       1,
       i.consolidation_approach,
       (SELECT count(*) FROM ghg_boundary_treatments t WHERE t.inventory_id = i.id)
FROM ghg_inventories i
WHERE EXISTS (SELECT 1 FROM ghg_runs r WHERE r.inventory_id = i.id);

INSERT INTO ghg_boundary_version_entries (id, boundary_version_id, facility_id, facility_name, location,
                                          ownership_percent, financial_control, operational_control,
                                          accounting_share)
SELECT gen_random_uuid(),
       v.id,
       f.id,
       f.name,
       f.location,
       t.ownership_percent,
       t.financial_control,
       t.operational_control,
       CASE v.consolidation_approach
           WHEN 'EQUITY_SHARE'        THEN t.ownership_percent / 100
           WHEN 'FINANCIAL_CONTROL'   THEN CASE WHEN t.financial_control   THEN 1 ELSE 0 END
           WHEN 'OPERATIONAL_CONTROL' THEN CASE WHEN t.operational_control THEN 1 ELSE 0 END
       END
FROM ghg_boundary_versions v
JOIN ghg_boundary_treatments t ON t.inventory_id = v.inventory_id
JOIN ghg_facilities f ON f.id = t.facility_id
WHERE v.version_no = 1;

UPDATE ghg_inventories i
SET boundary_status             = 'FROZEN',
    current_boundary_version_id = v.id,
    current_boundary_version_no = v.version_no
FROM ghg_boundary_versions v
WHERE v.inventory_id = i.id
  AND v.version_no = 1;
