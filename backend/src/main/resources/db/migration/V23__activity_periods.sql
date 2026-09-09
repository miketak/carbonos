-- T-07 (audit findings F9, F24; spec 04.2): an activity record covers a
-- period, not a date. A record straddling the reporting period or a
-- membership window is pro-rated by days or blocked, per the inventory.

ALTER TABLE ghg_activities RENAME COLUMN activity_date TO period_end;
ALTER TABLE ghg_activities ADD COLUMN period_start date;
UPDATE ghg_activities SET period_start = period_end;
ALTER TABLE ghg_activities
    ALTER COLUMN period_start SET NOT NULL,
    ADD CONSTRAINT chk_ghg_activities_period CHECK (period_start <= period_end);

ALTER TABLE ghg_run_exclusions RENAME COLUMN activity_date TO period_end;
ALTER TABLE ghg_run_exclusions ADD COLUMN period_start date;
UPDATE ghg_run_exclusions SET period_start = period_end;
ALTER TABLE ghg_run_exclusions ALTER COLUMN period_start SET NOT NULL;

-- lines calculated before this change counted their record in full on one day
ALTER TABLE ghg_run_lines
    ADD COLUMN period_start date,
    ADD COLUMN period_end   date,
    ADD COLUMN period_days  bigint        NOT NULL DEFAULT 1,
    ADD COLUMN covered_days bigint        NOT NULL DEFAULT 1,
    ADD COLUMN period_share numeric(9, 6) NOT NULL DEFAULT 1,
    ADD COLUMN period_note  varchar(255);
UPDATE ghg_run_lines l SET period_start = a.period_start, period_end = a.period_end
    FROM ghg_activities a WHERE a.id = l.activity_id;
UPDATE ghg_run_lines l SET period_start = r.period_end, period_end = r.period_end
    FROM ghg_runs r WHERE r.id = l.run_id AND l.period_start IS NULL;
ALTER TABLE ghg_run_lines
    ALTER COLUMN period_start SET NOT NULL,
    ALTER COLUMN period_end SET NOT NULL;

ALTER TABLE ghg_inventories
    ADD COLUMN straddle_treatment varchar(10) NOT NULL DEFAULT 'PRO_RATE'
        CHECK (straddle_treatment IN ('PRO_RATE', 'BLOCK'));
