-- Spec 02.5: a factor pack stops being a JSON file compiled into the server and
-- becomes a catalogue. A family is the lineage of one publication; an edition is
-- one dated release of it, and the edition is the unit of vintage, so a citation
-- names one thing forever. Rows, the change log frozen at publication, and the
-- publication trail hang off the edition.
--
-- This migration rewrites data on ghg_emission_factors: it backfills
-- source_edition from the pack tag a factor already carries and swaps the unique
-- index of V38 for the one versioning needs. It is replayed with psql on a copy
-- of a seeded database before it is deployed, as docs/how-to/add-a-migration.md
-- requires. V43 seeds the ten shipped editions and backfills the taxonomy
-- columns, which it can only do once its rows exist.

-- 1. The families. A pack key is the lineage: 'defra' holds defra-2026 and
--    every edition after it. SOURCE is a published table, SECTOR a selection
--    from others (spec 02.4).
CREATE TABLE ghg_factor_packs (
    pack_key   varchar(60) PRIMARY KEY,
    name       varchar(200) NOT NULL,
    kind       varchar(10)  NOT NULL,
    summary    varchar(2000),
    created_at timestamptz  NOT NULL DEFAULT now(),
    updated_at timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT chk_ghg_factor_packs_kind CHECK (kind IN ('SOURCE', 'SECTOR'))
);

-- 2. The editions. The identifier is the citation key an organization imports
--    and a report prints, so it is the primary key: 'defra-2026', 'defra-2026.r2'.
--    A draft is mutable and invisible; a published edition's rows, metadata and
--    values never change again.
CREATE TABLE ghg_factor_pack_editions (
    edition_id        varchar(60) PRIMARY KEY,
    pack_key          varchar(60)  NOT NULL REFERENCES ghg_factor_packs (pack_key),
    name              varchar(200) NOT NULL,
    status            varchar(12)  NOT NULL,
    -- the publication this edition represents (spec 02.3: a row may still cite its own)
    source            varchar(500) NOT NULL,
    source_url        varchar(500),
    publication_year  integer,
    gwp_basis         varchar(20),
    license           varchar(200),
    retrieved         varchar(20),
    notes             varchar(4000),
    applies_from      date,
    -- publication: the moment, the source document checked against, and the evidence file
    published_at      timestamptz,
    source_document   varchar(500),
    evidence_key      varchar(200),
    evidence_name     varchar(255),
    evidence_size     bigint,
    evidence_checksum varchar(64),
    -- separation of duties: the curator builds the draft, the approver checks and publishes it
    curator_user_id   uuid,
    curator_email     varchar(320),
    curator_name      varchar(200),
    approver_user_id  uuid,
    approver_email    varchar(320),
    approver_name     varchar(200),
    -- whether the provenance was checked against the publication, or only seeded
    provenance_review varchar(20)  NOT NULL DEFAULT 'REVIEWED',
    provenance_note   varchar(1000),
    supersedes_id     varchar(60) REFERENCES ghg_factor_pack_editions (edition_id),
    erratum           boolean      NOT NULL DEFAULT false,
    erratum_note      varchar(1000),
    -- recorded on the predecessor when an erratum supersedes it; its values are never edited
    error_note        varchar(1000),
    withdrawn_at      timestamptz,
    withdrawn_by      varchar(320),
    withdrawal_reason varchar(500),
    created_at        timestamptz  NOT NULL DEFAULT now(),
    updated_at        timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT chk_ghg_factor_pack_editions_status
        CHECK (status IN ('DRAFT', 'PUBLISHED', 'SUPERSEDED', 'WITHDRAWN')),
    CONSTRAINT chk_ghg_factor_pack_editions_provenance_review
        CHECK (provenance_review IN ('REVIEWED', 'SEED_UNCHECKED')),
    -- a published edition has a moment, an evidence checksum, an applies-from date, a source
    -- document, and an approver unless it is one of the ten V43 seeded, whose values were in
    -- production before the catalogue existed. An edition authored in the console never carries
    -- SEED_UNCHECKED, so it can never be published without an approver.
    CONSTRAINT chk_ghg_factor_pack_editions_published
        CHECK (status = 'DRAFT' OR (published_at IS NOT NULL AND evidence_checksum IS NOT NULL
            AND applies_from IS NOT NULL AND source_document IS NOT NULL
            AND (approver_user_id IS NOT NULL OR provenance_review = 'SEED_UNCHECKED'))),
    CONSTRAINT chk_ghg_factor_pack_editions_separation
        CHECK (curator_user_id IS NULL OR approver_user_id IS NULL OR curator_user_id <> approver_user_id),
    CONSTRAINT chk_ghg_factor_pack_editions_withdrawal
        CHECK (status <> 'WITHDRAWN' OR (withdrawn_at IS NOT NULL AND withdrawal_reason IS NOT NULL))
);
CREATE INDEX idx_ghg_factor_pack_editions_pack ON ghg_factor_pack_editions (pack_key, status);

-- 3. The rows: what EmissionFactor carries, plus the publisher's taxonomy in
--    three columns rather than one concatenation (1,157 of the 1,868 DESNZ rows
--    share a display name, so the parts are what tell two rows apart), and
--    whether the row publishes CO2e only. The values are unconstrained numeric:
--    a row states the publisher's figure at the scale the publication used, and
--    the rounding to numeric(12,6) happens where it happens today, on import.
CREATE TABLE ghg_factor_pack_rows (
    id                       uuid PRIMARY KEY,
    edition_id               varchar(60)  NOT NULL REFERENCES ghg_factor_pack_editions (edition_id) ON DELETE CASCADE,
    ordinal                  integer      NOT NULL DEFAULT 0,
    code                     varchar(200) NOT NULL,
    name                     varchar(120) NOT NULL,
    default_scope            varchar(10)  NOT NULL,
    default_category         varchar(40)  NOT NULL,
    scope_agnostic           boolean      NOT NULL DEFAULT false,
    unit                     varchar(30)  NOT NULL,
    kg_co2e_per_unit         numeric      NOT NULL,
    -- a null gas is one the publication does not state, which is not the same as a stated zero
    co2_kg_per_unit          numeric,
    ch4_kg_per_unit          numeric,
    ch4_fossil               boolean      NOT NULL DEFAULT false,
    n2o_kg_per_unit          numeric,
    hfcs_kg_per_unit         numeric,
    pfcs_kg_per_unit         numeric,
    sf6_kg_per_unit          numeric,
    nf3_kg_per_unit          numeric,
    biogenic_co2_kg_per_unit numeric,
    blend_composition        varchar(255),
    blend_gwp_source         varchar(20),
    data_year                integer,
    source_publication       varchar(500),
    source_url               varchar(500),
    publication_year         integer,
    source_category          varchar(120),
    source_activity          varchar(200),
    source_detail            varchar(500),
    co2e_only                boolean      NOT NULL DEFAULT false,
    approved                 boolean      NOT NULL DEFAULT false,
    notes                    varchar(500),
    reporting_basis          varchar(30)  NOT NULL DEFAULT 'SCOPES',
    created_at               timestamptz  NOT NULL DEFAULT now(),
    updated_at               timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uq_ghg_factor_pack_rows_code UNIQUE (edition_id, code)
);
CREATE INDEX idx_ghg_factor_pack_rows_edition ON ghg_factor_pack_rows (edition_id, ordinal);
-- the blast radius keys on the code, never on a pack tag: 150 codes appear in more than one pack
CREATE INDEX idx_ghg_factor_pack_rows_code ON ghg_factor_pack_rows (code);

-- 4. The change log, frozen at publication against the predecessor: one entry
--    per code, so a reader can see the one row that moved.
CREATE TABLE ghg_factor_pack_changes (
    id             uuid PRIMARY KEY,
    edition_id     varchar(60)  NOT NULL REFERENCES ghg_factor_pack_editions (edition_id) ON DELETE CASCADE,
    code           varchar(200) NOT NULL,
    kind           varchar(14)  NOT NULL,
    old_kg_co2e    numeric,
    new_kg_co2e    numeric,
    percent_change numeric(12, 4),
    fields         varchar(500),
    created_at     timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT chk_ghg_factor_pack_changes_kind
        CHECK (kind IN ('ADDED', 'CHANGED', 'DISCONTINUED', 'UNCHANGED')),
    CONSTRAINT uq_ghg_factor_pack_changes_code UNIQUE (edition_id, code)
);

-- 5. The publication trail. It is not ghg_audit_events: chk_ghg_audit_events_subject
--    requires an organization or an inventory on every audit event, and an edition
--    belongs to neither.
CREATE TABLE ghg_factor_pack_events (
    id             uuid PRIMARY KEY,
    edition_id     varchar(60) NOT NULL REFERENCES ghg_factor_pack_editions (edition_id) ON DELETE CASCADE,
    action         varchar(30) NOT NULL,
    actor_user_id  uuid,
    actor_email    varchar(320),
    detail         varchar(1000),
    occurred_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ghg_factor_pack_events_edition ON ghg_factor_pack_events (edition_id, occurred_at);

-- 6. What an organization's factor gains (specs 02.5 and 02.6). The edition a
--    version came from, whether a person edited it here, and the version that
--    replaced it. No foreign key to the catalogue: a factor is tenant data and
--    must not be held hostage to a catalogue row, and an import may deliver a
--    pack that is not in the catalogue at all.
ALTER TABLE ghg_emission_factors
    ADD COLUMN source_edition   varchar(60),
    ADD COLUMN locally_edited   boolean NOT NULL DEFAULT false,
    ADD COLUMN superseded_by_id uuid REFERENCES ghg_emission_factors (id) ON DELETE SET NULL,
    ADD COLUMN source_category  varchar(120),
    ADD COLUMN source_activity  varchar(200),
    ADD COLUMN source_detail    varchar(500);

-- The edition a row already held is the pack that delivered it: before the
-- catalogue there was one edition per pack. A hand-entered factor has no pack
-- and keeps a null.
UPDATE ghg_emission_factors SET source_edition = pack WHERE pack IS NOT NULL;

-- 7. A lineage holds one version per vintage (spec 02.6), so identity becomes
--    the organization, the publication row identifier, and the version's start.
--    NULLS NOT DISTINCT keeps at most one open-start version per lineage, which
--    is what every row holds today, so existing rows stay legal and stay unique.
DROP INDEX idx_ghg_emission_factors_pack_code;
CREATE UNIQUE INDEX idx_ghg_emission_factors_pack_code
    ON ghg_emission_factors (organization_id, pack_code, valid_from) NULLS NOT DISTINCT
    WHERE pack_code IS NOT NULL;
