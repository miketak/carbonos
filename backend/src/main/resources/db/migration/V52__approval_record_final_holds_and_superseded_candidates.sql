-- Spec 02.11: approval is a control. A factor records who entered it and who
-- approved it, and when; approving what one entered oneself is refused while
-- another member could check it, and recorded as a self-approval otherwise,
-- so the report can say so (Corporate Standard chapter 7, ISO 14064-1 8.1).
ALTER TABLE ghg_emission_factors
    ADD COLUMN created_by    varchar(320),
    ADD COLUMN approved_by   varchar(320),
    ADD COLUMN approved_at   timestamptz,
    ADD COLUMN self_approved boolean NOT NULL DEFAULT false;

-- The run's snapshot of a factor carries the same, so a report printed years
-- later still names who approved what it calculated with.
ALTER TABLE ghg_run_factors
    ADD COLUMN approved_by   varchar(320),
    ADD COLUMN self_approved boolean NOT NULL DEFAULT false;

-- Spec 06: a facility removed and then put back as it stood in the base year
-- is no structural change; the undecided removal candidate is superseded
-- rather than a second "added" candidate raised against it.
ALTER TABLE ghg_base_year_recalculations
    DROP CONSTRAINT ghg_base_year_recalculations_status_check;
ALTER TABLE ghg_base_year_recalculations
    ADD CONSTRAINT ghg_base_year_recalculations_status_check
        CHECK (status IN ('FLAGGED', 'RECALCULATED', 'DECLINED', 'SUPERSEDED'));
