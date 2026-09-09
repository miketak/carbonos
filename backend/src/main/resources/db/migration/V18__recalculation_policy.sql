-- Spec 06.1: the recalculation policy as Chapter 5 states it. The base year
-- records why it was chosen and how mid-year structural changes are
-- accounted; the three triggers are always honored, so their switches go; a
-- candidate records its cumulative weight with the outstanding earlier ones,
-- and who raised it when the accountant did.

ALTER TABLE ghg_base_years
    ADD COLUMN reason varchar(500) NOT NULL DEFAULT 'not recorded',
    ADD COLUMN structural_change_convention varchar(20) NOT NULL DEFAULT 'TRANSACTION_DATE'
        CHECK (structural_change_convention IN ('TRANSACTION_DATE', 'WHOLE_YEAR')),
    DROP COLUMN trigger_structural,
    DROP COLUMN trigger_methodology,
    DROP COLUMN trigger_errors;

ALTER TABLE ghg_base_year_recalculations
    ADD COLUMN cumulative_percent numeric(7, 2),
    ADD COLUMN raised_by varchar(320);

-- the running sum in creation order: each candidate together with every
-- earlier one that was not a recalculation
UPDATE ghg_base_year_recalculations r
SET cumulative_percent = (
    SELECT COALESCE(SUM(e.affected_percent), 0)
    FROM ghg_base_year_recalculations e
    WHERE e.base_year_id = r.base_year_id
      AND (e.id = r.id OR (e.created_at < r.created_at AND e.status <> 'RECALCULATED')))
WHERE r.affected_percent IS NOT NULL;
