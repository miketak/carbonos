-- ECO-23 (spec 02.5 rule 10, spec 02.11): a publisher's caveat on a pack row, and the check that lifts it.

-- 1. A caveat is a condition the publisher attaches to a value ("approve it after checking the year's
--    loss rate"), distinct from the notes that say where the value comes from. A row with a caveat
--    publishes unapproved; the organization sees the caveat as the reason, and approving the factor
--    needs a note recording the check that was done.
ALTER TABLE ghg_factor_pack_rows ADD COLUMN caveat varchar(500);
COMMENT ON COLUMN ghg_factor_pack_rows.caveat IS
    'The publisher''s condition on using the value; a row carrying one must publish unapproved (spec 02.5 rule 10).';

ALTER TABLE ghg_emission_factors
    ADD COLUMN caveat        varchar(500),
    ADD COLUMN approval_note varchar(500);
COMMENT ON COLUMN ghg_emission_factors.caveat IS
    'The publisher''s caveat the import copied from the edition row; null for a row without one or a hand-entered factor.';
COMMENT ON COLUMN ghg_emission_factors.approval_note IS
    'What the approver checked before approving a caveated factor; required when the factor carries a caveat.';

-- 2. The run's factor snapshot keeps both, so the report prints the condition and how it was met.
--    Nullable and left null for runs made before this migration, as V46 did for the edition.
ALTER TABLE ghg_run_factors
    ADD COLUMN caveat        varchar(500),
    ADD COLUMN approval_note varchar(500);

-- 3. The one seeded row that is a caveat rather than a note: the derived Ghana T&D losses row, which
--    already ships unapproved. The Ember grid rows stay as they are: published, licensed values whose
--    "prefer a national factor" sentence is a hierarchy note, not a condition (officer review, 2026-10-05).
UPDATE ghg_factor_pack_rows
   SET caveat = notes
 WHERE code = 'GHANA:td-losses' AND NOT approved;

UPDATE ghg_emission_factors
   SET caveat = note
 WHERE pack_code = 'GHANA:td-losses' AND NOT approved AND caveat IS NULL;
