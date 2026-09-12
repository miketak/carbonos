-- Spec 02.3 (audit 2026-09-11, findings F22 and F23): a factor cites the
-- publication it comes from, not the pack that delivered it, and the
-- publication row is the factor's identity within an organization. Packs
-- become tags; the copies five imports left behind are merged.
--
-- This migration rewrites data. It re-points ghg_assignments at the surviving
-- factor before deleting the copies, so it is replayed with psql on a copy of
-- a seeded database before it is deployed, as docs/how-to/add-a-migration.md
-- requires.

-- 1. The pack or packs that delivered a factor, apart from its provenance.
CREATE TABLE ghg_emission_factor_packs (
    factor_id uuid        NOT NULL REFERENCES ghg_emission_factors (id) ON DELETE CASCADE,
    pack      varchar(60) NOT NULL,
    PRIMARY KEY (factor_id, pack)
);

INSERT INTO ghg_emission_factor_packs (factor_id, pack)
SELECT id, pack FROM ghg_emission_factors WHERE pack IS NOT NULL;

-- 2. The merge. Within an organization, factors that share a publication row
--    (pack_code) are one factor: the oldest approved copy survives, or the
--    oldest copy when none is approved.
CREATE TEMPORARY TABLE ghg_factor_merge AS
WITH ranked AS (SELECT id,
                       first_value(id) OVER (PARTITION BY organization_id, pack_code
                           ORDER BY approved DESC, created_at ASC, id ASC) AS survivor_id
                FROM ghg_emission_factors
                WHERE organization_id IS NOT NULL
                  AND pack_code IS NOT NULL)
SELECT id AS duplicate_id, survivor_id
FROM ranked
WHERE id <> survivor_id;

-- Every assignment that pointed at a merged copy points at the survivor.
UPDATE ghg_assignments a
SET emission_factor_id = m.survivor_id
FROM ghg_factor_merge m
WHERE a.emission_factor_id = m.duplicate_id;

-- The survivor's tags are the union of the copies' packs.
INSERT INTO ghg_emission_factor_packs (factor_id, pack)
SELECT DISTINCT m.survivor_id, p.pack
FROM ghg_factor_merge m
         JOIN ghg_emission_factor_packs p ON p.factor_id = m.duplicate_id
ON CONFLICT DO NOTHING;

-- Runs are unaffected: ghg_run_lines.factor_id and ghg_run_factors.factor_id
-- are plain identifiers with no foreign key, so a past report still names the
-- copy it applied.
DELETE FROM ghg_emission_factors WHERE id IN (SELECT duplicate_id FROM ghg_factor_merge);
DROP TABLE ghg_factor_merge;

-- 3. One factor per publication row from here on, whatever pack delivers it.
DROP INDEX idx_ghg_emission_factors_pack_code;
CREATE UNIQUE INDEX idx_ghg_emission_factors_pack_code
    ON ghg_emission_factors (organization_id, pack_code) WHERE pack_code IS NOT NULL;

-- 4. The run's frozen factor set snapshots the publication and the tags, so
--    the report's factor table reads the same after the library changes.
ALTER TABLE ghg_run_factors
    ADD COLUMN publication_year integer,
    ADD COLUMN data_year        integer,
    ADD COLUMN packs            varchar(200);
