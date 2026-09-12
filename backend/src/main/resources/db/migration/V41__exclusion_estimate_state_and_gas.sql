-- Spec 04.8 (audit 2026-09-11, findings F35 and F26): a manual exclusion is
-- sized, stated to emit nothing, or not estimated, and a Montreal Protocol gas
-- a record holds is reported outside the scopes rather than as a false zero.
--
-- This migration rewrites data: a manual exclusion holding 0 kg CO2e was
-- entered before the three states existed, so it becomes a null that reads as
-- "not estimated", and the review asks the preparer to confirm or size it. It
-- is replayed with psql on a copy of a seeded database before it is deployed,
-- as docs/how-to/add-a-migration.md requires.

-- 1. The gas a record holds when it is excluded as a Montreal Protocol gas.
--    The assignment carries the preparer's answer; the run exclusion snapshots
--    it beside the quantity and unit it already holds.
ALTER TABLE ghg_assignments
    ADD COLUMN gas varchar(60);
ALTER TABLE ghg_run_exclusions
    ADD COLUMN gas varchar(60);

-- 2. The new reason. Chapter 4 counts the seven Kyoto gas groups; a Montreal
--    Protocol gas is disclosed separately, as optional information.
ALTER TABLE ghg_assignments DROP CONSTRAINT IF EXISTS ghg_assignments_exclusion_reason_check;
ALTER TABLE ghg_assignments ADD CONSTRAINT ghg_assignments_exclusion_reason_check
    CHECK (exclusion_reason IN ('OUTSIDE_PERIOD', 'OUTSIDE_BOUNDARY', 'NON_GHG', 'DUPLICATE', 'NOT_APPLICABLE',
                                'METHODOLOGY', 'OTHER', 'RECORD_REMOVED', 'OUTSIDE_SCOPES_NON_KYOTO'));
ALTER TABLE ghg_run_exclusions DROP CONSTRAINT IF EXISTS ghg_run_exclusions_exclusion_reason_check;
ALTER TABLE ghg_run_exclusions ADD CONSTRAINT ghg_run_exclusions_exclusion_reason_check
    CHECK (exclusion_reason IN ('OUTSIDE_PERIOD', 'OUTSIDE_BOUNDARY', 'NON_GHG', 'DUPLICATE', 'NOT_APPLICABLE',
                                'METHODOLOGY', 'OTHER', 'RECORD_REMOVED', 'OUTSIDE_SCOPES_NON_KYOTO'));

-- 3. The zeros the audit found were placeholders, not statements that the
--    record emits nothing: the dialog demanded a number and 0 was the only
--    answer a preparer without a factor could give. They become "not
--    estimated", and the detail says so once, so the review can ask for a
--    deliberate answer. Only live decisions are touched: ghg_run_exclusions is
--    a snapshot of a launched run, so no run figure moves.
UPDATE ghg_assignments
SET estimated_kg_co2e = NULL,
    exclusion_detail  = 'magnitude entered before the three states existed; confirm or size it'
WHERE included = false
  AND estimated_kg_co2e = 0
  AND exclusion_reason IN ('NON_GHG', 'DUPLICATE', 'NOT_APPLICABLE', 'METHODOLOGY', 'OTHER');
