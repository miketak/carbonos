-- T-11 (audit findings F10, F26, F27, F30; spec 04.3): a register of source
-- streams per facility drives the default classification; scope is an
-- explicit choice with a justification when it departs from the default; a
-- proxy factor is flagged; lines carry the record's own description.

CREATE TABLE ghg_source_streams (
    id                  uuid PRIMARY KEY,
    facility_id         uuid         NOT NULL REFERENCES ghg_facilities (id) ON DELETE CASCADE,
    name                varchar(120) NOT NULL,
    kind                varchar(40)  NOT NULL CHECK (kind IN (
        'STATIONARY_COMBUSTION', 'MOBILE_COMBUSTION', 'PROCESS', 'FUGITIVE', 'PURCHASED_ELECTRICITY',
        'PURCHASED_HEAT_STEAM_COOLING', 'WASTE', 'TRANSPORT', 'TRAVEL', 'COMMUTING', 'PURCHASED_GOODS', 'OTHER')),
    fuel                varchar(80),
    meter_or_supplier   varchar(120),
    contractor_operated boolean      NOT NULL DEFAULT false,
    note                varchar(255),
    created_at          timestamptz  NOT NULL DEFAULT now(),
    updated_at          timestamptz  NOT NULL DEFAULT now(),
    UNIQUE (facility_id, name)
);
CREATE INDEX idx_ghg_source_streams_facility ON ghg_source_streams (facility_id);

ALTER TABLE ghg_activities ADD COLUMN stream_id uuid REFERENCES ghg_source_streams (id) ON DELETE SET NULL;
CREATE INDEX idx_ghg_activities_stream ON ghg_activities (stream_id);

ALTER TABLE ghg_assignments
    ADD COLUMN scope_justification varchar(500),
    ADD COLUMN proxy               boolean NOT NULL DEFAULT false,
    ADD COLUMN proxy_justification varchar(500);

ALTER TABLE ghg_run_lines
    ADD COLUMN stream_name         varchar(120),
    ADD COLUMN scope_justification varchar(500),
    ADD COLUMN proxy               boolean NOT NULL DEFAULT false,
    ADD COLUMN proxy_justification varchar(500);
