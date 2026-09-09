-- T-06 (audit finding F38; spec 07.5): the calculation file names the record,
-- its evidence reference and the factor id on every line, so a verifier can
-- trace a line to the primary document without the live tables.
ALTER TABLE ghg_run_lines
    ADD COLUMN activity_type varchar(120),
    ADD COLUMN evidence_ref  varchar(150),
    ADD COLUMN factor_id     uuid;
UPDATE ghg_run_lines l SET activity_type = a.activity_type, evidence_ref = a.evidence_ref
    FROM ghg_activities a WHERE a.id = l.activity_id;
UPDATE ghg_run_lines l SET factor_id = f.id
    FROM ghg_emission_factors f WHERE f.name = l.factor_name;
