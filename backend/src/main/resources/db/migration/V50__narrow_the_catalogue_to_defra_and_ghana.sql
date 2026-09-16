-- Spec 02.9: the catalogue narrows to the two publications CarbonOS stands
-- behind, the UK DESNZ conversion factors and the Ghana pack. The eight other
-- families V43 seeded go, and the three sector packs go with them: they were
-- selections re-citing EPA Hub, IPCC 2006 and NGA rows, so they cannot survive
-- without the packs they selected from.
--
-- V43 is applied and Flyway checksums it, so this is a forward migration that
-- deletes rather than an edit of the seed. It inserts nothing.
--
-- It rewrites data rather than schema, so it is replayed with psql on a copy of
-- a seeded database before it deploys, as docs/how-to/add-a-migration.md
-- requires. The temporary tables are dropped explicitly at the end rather than
-- declared ON COMMIT DROP: Flyway wraps the file in one transaction but psql
-- commits between statements, and a table that vanishes halfway through the
-- replay is not the migration that ships.

-- 1. The editions leaving the catalogue. Everything outside the two families.
CREATE TEMPORARY TABLE doomed_editions AS
SELECT edition_id
  FROM ghg_factor_pack_editions
 WHERE pack_key NOT IN ('defra', 'ghana');

-- 2. The factors leaving ghg_emission_factors. Two groups.
--
--    First, the organization factors only a removed pack ever delivered. A row
--    a surviving pack also delivered stays: spec 02.3 makes one publication row
--    one factor carrying every pack's tag, so a diesel row that arrived by both
--    sector-mining and defra-2026 is the same factor and keeps the DEFRA tag.
CREATE TEMPORARY TABLE doomed_factors AS
SELECT f.id
  FROM ghg_emission_factors f
 WHERE f.organization_id IS NOT NULL
   AND f.pack_code IS NOT NULL
   AND NOT EXISTS (SELECT 1
                     FROM ghg_emission_factor_packs p
                    WHERE p.factor_id = f.id
                      AND p.pack IN ('defra-2026', 'ghana'));

--    Second, the nine shared library rows whose publisher is neither DESNZ nor
--    the Ghana pack: explosives from the Australian NGA, quicklime from IPCC
--    2006, district cooling, which was always an assumption rather than a
--    published factor, and the six gas rows that existed for the sector packs'
--    venting and fugitive path. The other fourteen library rows are DESNZ 2025,
--    the Ghana grid and the R-410A blend, and they stay.
INSERT INTO doomed_factors (id) VALUES
    ('c4a1f001-0000-4000-8000-000000000014'::uuid),  -- Explosives detonation (ANFO, emulsion)
    ('c4a1f001-0000-4000-8000-000000000015'::uuid),  -- Quicklime (CaO) calcination
    ('c4a1f001-0000-4000-8000-000000000017'::uuid),  -- District cooling
    ('c4a1f001-0000-4000-8000-000000000018'::uuid),  -- Methane (CH4) emitted as gas, fossil origin
    ('c4a1f001-0000-4000-8000-000000000019'::uuid),  -- Methane (CH4) emitted as gas, biogenic origin
    ('c4a1f001-0000-4000-8000-000000000020'::uuid),  -- Nitrous oxide (N2O) emitted as gas
    ('c4a1f001-0000-4000-8000-000000000021'::uuid),  -- Carbon dioxide (CO2) emitted as gas
    ('c4a1f001-0000-4000-8000-000000000022'::uuid),  -- Sulfur hexafluoride (SF6) emitted as gas
    ('c4a1f001-0000-4000-8000-000000000023'::uuid);  -- Nitrogen trifluoride (NF3) emitted as gas

-- 3. The guard. A run line is the frozen record behind a published report. Its
--    factor_id carries no foreign key into this table (the line snapshots the
--    factor's name, unit and value at the moment of the run), so nothing in the
--    database would stop this migration leaving a published report pointing at
--    a factor that no longer exists. Refuse instead. On a database built from
--    the migrations alone nothing cites a doomed factor and this never fires;
--    where it does fire, the environment is wiped (make db-wipe ENV=..) rather
--    than quietly rewritten.
DO $$
DECLARE
    stuck integer;
BEGIN
    SELECT count(*) INTO stuck
      FROM ghg_run_lines
     WHERE factor_id IN (SELECT id FROM doomed_factors);
    IF stuck > 0 THEN
        RAISE EXCEPTION 'V50 would remove % emission factor(s) a run line still cites. '
            'Wipe the environment (make db-wipe ENV=..) before deploying this.', stuck;
    END IF;
END $$;

-- 4. The catalogue. Notices first: they key on an edition and do not cascade.
--    Rows, changes and events do cascade, so the editions take them along.
DELETE FROM ghg_factor_pack_notices
 WHERE edition_id IN (SELECT edition_id FROM doomed_editions)
    OR predecessor_edition_id IN (SELECT edition_id FROM doomed_editions);

DELETE FROM ghg_factor_pack_editions WHERE pack_key NOT IN ('defra', 'ghana');

DELETE FROM ghg_factor_packs WHERE pack_key NOT IN ('defra', 'ghana');

-- 5. The tags a surviving factor carries for a pack that no longer exists.
--    ghg_emission_factor_packs.pack is a plain column with no key into the
--    catalogue, so nothing swept these up on the delete above.
DELETE FROM ghg_emission_factor_packs WHERE pack NOT IN ('defra-2026', 'ghana');

-- 6. A surviving factor whose "first pack that delivered it" was a removed one
--    now names a pack nobody can read. Point it at a tag it still carries. The
--    sweep above has already run, so the minimum is a surviving edition.
UPDATE ghg_emission_factors f
   SET pack = (SELECT min(p.pack) FROM ghg_emission_factor_packs p WHERE p.factor_id = f.id)
 WHERE f.pack IS NOT NULL
   AND f.pack NOT IN ('defra-2026', 'ghana')
   AND EXISTS (SELECT 1 FROM ghg_emission_factor_packs p WHERE p.factor_id = f.id);

UPDATE ghg_emission_factors
   SET source_edition = pack
 WHERE source_edition IS NOT NULL
   AND source_edition NOT IN ('defra-2026', 'ghana')
   AND id NOT IN (SELECT id FROM doomed_factors);

-- 7. The factors themselves, dependants first. A classification is working
--    state rather than a record of what happened, so an assignment releases its
--    factor and the activity reads as unclassified again, which is what it now
--    is. A derived-line rule goes whole, because both of its factors are
--    required and one of them is leaving.
--    ghg_emission_factors.superseded_by_id clears itself: it is ON DELETE SET
--    NULL, so a lineage that pointed at a removed version simply ends.
UPDATE ghg_assignments
   SET emission_factor_id = NULL
 WHERE emission_factor_id IN (SELECT id FROM doomed_factors);

DELETE FROM ghg_upstream_rules
 WHERE primary_factor_id IN (SELECT id FROM doomed_factors)
    OR upstream_factor_id IN (SELECT id FROM doomed_factors);

DELETE FROM ghg_emission_factors WHERE id IN (SELECT id FROM doomed_factors);

DROP TABLE doomed_factors;
DROP TABLE doomed_editions;
