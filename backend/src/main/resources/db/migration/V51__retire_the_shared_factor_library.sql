-- Spec 02.10: the shared factor library is retired. An organization starts with
-- no factors at all and establishes its baseline by importing DESNZ 2026, the
-- Ghana pack, or both, so what a company accounts with is a decision it made
-- and can name, rather than a set of rounded rows that happened to be seeded
-- before the catalogue existed.
--
-- The fourteen rows that survived V50 were the last of them: twelve DESNZ 2025
-- rows rounded to six places, an Ecoriv secondary estimate for the Ghana grid,
-- and an R-410A blend. Every one is superseded by a pack row that carries the
-- published figure unrounded, with its own vintage and citation.
--
-- After this there is no tier: every factor belongs to an organization, and the
-- column says so.

-- 1. The rows leaving. A library factor is one no organization owns.
CREATE TEMPORARY TABLE retired_factors AS
SELECT id FROM ghg_emission_factors WHERE organization_id IS NULL;

-- 2. The guard, as V50 has it: a run line snapshots the factor's name, unit and
--    value and holds no foreign key, so nothing in the database would stop this
--    leaving a published report pointing at a factor that no longer exists.
--    Refuse instead. On a database built from the migrations alone no run cites
--    a library factor, because no organization has run anything yet.
DO $$
DECLARE
    stuck integer;
BEGIN
    SELECT count(*) INTO stuck
      FROM ghg_run_lines
     WHERE factor_id IN (SELECT id FROM retired_factors);
    IF stuck > 0 THEN
        RAISE EXCEPTION 'V51 would remove % shared library factor(s) a run line still cites. '
            'Wipe the environment (make db-wipe ENV=..) before deploying this.', stuck;
    END IF;
END $$;

-- 3. Dependants first, as V50 has them. A classification is working state: the
--    assignment releases its factor and reads as unclassified, which is what it
--    now is until the organization imports a pack and classifies again.
UPDATE ghg_assignments
   SET emission_factor_id = NULL
 WHERE emission_factor_id IN (SELECT id FROM retired_factors);

DELETE FROM ghg_upstream_rules
 WHERE primary_factor_id IN (SELECT id FROM retired_factors)
    OR upstream_factor_id IN (SELECT id FROM retired_factors);

DELETE FROM ghg_emission_factors WHERE id IN (SELECT id FROM retired_factors);

DROP TABLE retired_factors;

-- 4. The invariant, now that it holds: every factor belongs to an organization.
--    A tenant-visible row with no owner cannot be written again by accident.
ALTER TABLE ghg_emission_factors ALTER COLUMN organization_id SET NOT NULL;
