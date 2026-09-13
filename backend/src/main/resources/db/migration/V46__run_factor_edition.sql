-- Spec 02.6: a run names the edition and the vintage behind every figure.
--
-- ghg_run_factors already freezes the values a run applied. It did not record
-- which edition those values came from, nor the day the version it applied
-- begins, so a report could name a pack family but never a vintage. That was
-- the first finding of the officer's review: a tag names a family, not a
-- vintage, and ISO 14064-1:2018 clause 9.3.1 asks for the factor actually used.
--
-- Both columns are nullable and both are left null for runs made before
-- versioning. A past run reads as unknown rather than being credited to an
-- edition it never saw: the pack tags it already carries stay the only claim it
-- makes. Nothing on this table is ever rewritten, so there is no backfill.
ALTER TABLE ghg_run_factors
    ADD COLUMN source_edition varchar(60),
    ADD COLUMN valid_from     date;

COMMENT ON COLUMN ghg_run_factors.source_edition IS
    'The factor pack edition whose values the run applied; null for a hand-entered factor or a run made before spec 02.6.';
COMMENT ON COLUMN ghg_run_factors.valid_from IS
    'The first day the version the run applied covers; null when the version has always applied.';
