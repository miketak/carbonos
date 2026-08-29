CREATE TABLE ghg_organizations (
    id                     uuid PRIMARY KEY,
    name                   varchar(120) NOT NULL UNIQUE,
    consolidation_approach varchar(30)  NOT NULL
        CHECK (consolidation_approach IN ('EQUITY_SHARE', 'FINANCIAL_CONTROL', 'OPERATIONAL_CONTROL')),
    created_at             timestamptz  NOT NULL DEFAULT now(),
    updated_at             timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE ghg_facilities (
    id                   uuid PRIMARY KEY,
    organization_id      uuid          NOT NULL REFERENCES ghg_organizations (id) ON DELETE CASCADE,
    name                 varchar(120)  NOT NULL,
    location             varchar(120)  NOT NULL,
    equity_share_percent numeric(5, 2) NOT NULL
        CHECK (equity_share_percent >= 0 AND equity_share_percent <= 100),
    controlled           boolean       NOT NULL,
    created_at           timestamptz   NOT NULL DEFAULT now(),
    updated_at           timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX idx_ghg_facilities_organization ON ghg_facilities (organization_id);

CREATE TABLE ghg_emission_factors (
    id              uuid PRIMARY KEY,
    name            varchar(120)   NOT NULL,
    scope           varchar(10)    NOT NULL CHECK (scope IN ('SCOPE_1', 'SCOPE_2', 'SCOPE_3')),
    category        varchar(40)    NOT NULL CHECK (category IN (
        'STATIONARY_COMBUSTION', 'MOBILE_COMBUSTION', 'FUGITIVE_EMISSIONS',
        'PURCHASED_ELECTRICITY', 'PURCHASED_HEAT_STEAM',
        'BUSINESS_TRAVEL', 'EMPLOYEE_COMMUTING', 'WASTE_GENERATED', 'WATER_SUPPLY')),
    unit            varchar(30)    NOT NULL,
    kg_co2e_per_unit numeric(12, 6) NOT NULL,
    source          varchar(120)   NOT NULL
);

CREATE TABLE ghg_activities (
    id                 uuid PRIMARY KEY,
    facility_id        uuid           NOT NULL REFERENCES ghg_facilities (id) ON DELETE CASCADE,
    emission_factor_id uuid           NOT NULL REFERENCES ghg_emission_factors (id),
    quantity           numeric(14, 3) NOT NULL CHECK (quantity > 0),
    activity_date      date           NOT NULL,
    note               varchar(255),
    created_at         timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX idx_ghg_activities_facility ON ghg_activities (facility_id);

CREATE TABLE ghg_runs (
    id                     uuid PRIMARY KEY,
    organization_id        uuid           NOT NULL REFERENCES ghg_organizations (id) ON DELETE CASCADE,
    label                  varchar(120)   NOT NULL,
    period_start           date           NOT NULL,
    period_end             date           NOT NULL,
    consolidation_approach varchar(30)    NOT NULL,
    activity_count         integer        NOT NULL,
    total_kg_co2e          numeric(18, 3) NOT NULL,
    scope1_kg_co2e         numeric(18, 3) NOT NULL,
    scope2_kg_co2e         numeric(18, 3) NOT NULL,
    scope3_kg_co2e         numeric(18, 3) NOT NULL,
    created_at             timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX idx_ghg_runs_organization ON ghg_runs (organization_id);

CREATE TABLE ghg_run_lines (
    id               uuid PRIMARY KEY,
    run_id           uuid           NOT NULL REFERENCES ghg_runs (id) ON DELETE CASCADE,
    activity_id      uuid           NOT NULL,
    facility_name    varchar(120)   NOT NULL,
    factor_name      varchar(120)   NOT NULL,
    scope            varchar(10)    NOT NULL,
    category         varchar(40)    NOT NULL,
    quantity         numeric(14, 3) NOT NULL,
    unit             varchar(30)    NOT NULL,
    kg_co2e_per_unit numeric(12, 6) NOT NULL,
    weight           numeric(7, 4)  NOT NULL,
    kg_co2e          numeric(18, 3) NOT NULL
);

CREATE INDEX idx_ghg_run_lines_run ON ghg_run_lines (run_id);

-- Seed factor library. Values follow published DEFRA/IPCC figures closely
-- enough for the spike; a curated library replaces this before production.
INSERT INTO ghg_emission_factors (id, name, scope, category, unit, kg_co2e_per_unit, source) VALUES
    ('c4a1f001-0000-4000-8000-000000000001', 'Natural gas', 'SCOPE_1', 'STATIONARY_COMBUSTION', 'm3', 2.045000, 'DEFRA 2025'),
    ('c4a1f001-0000-4000-8000-000000000002', 'LPG', 'SCOPE_1', 'STATIONARY_COMBUSTION', 'litre', 1.557000, 'DEFRA 2025'),
    ('c4a1f001-0000-4000-8000-000000000003', 'Diesel', 'SCOPE_1', 'MOBILE_COMBUSTION', 'litre', 2.660000, 'DEFRA 2025'),
    ('c4a1f001-0000-4000-8000-000000000004', 'Petrol', 'SCOPE_1', 'MOBILE_COMBUSTION', 'litre', 2.162000, 'DEFRA 2025'),
    ('c4a1f001-0000-4000-8000-000000000005', 'Refrigerant R-410A leakage', 'SCOPE_1', 'FUGITIVE_EMISSIONS', 'kg', 2088.000000, 'IPCC AR5 GWP100'),
    ('c4a1f001-0000-4000-8000-000000000006', 'Grid electricity (Ghana)', 'SCOPE_2', 'PURCHASED_ELECTRICITY', 'kWh', 0.441000, 'Ecoriv factor library 2025'),
    ('c4a1f001-0000-4000-8000-000000000007', 'Grid electricity (UK)', 'SCOPE_2', 'PURCHASED_ELECTRICITY', 'kWh', 0.207000, 'DEFRA 2025'),
    ('c4a1f001-0000-4000-8000-000000000008', 'District heat and steam', 'SCOPE_2', 'PURCHASED_HEAT_STEAM', 'kWh', 0.171000, 'DEFRA 2025'),
    ('c4a1f001-0000-4000-8000-000000000009', 'Business travel - average car', 'SCOPE_3', 'BUSINESS_TRAVEL', 'km', 0.170000, 'DEFRA 2025'),
    ('c4a1f001-0000-4000-8000-000000000010', 'Business travel - long-haul flight', 'SCOPE_3', 'BUSINESS_TRAVEL', 'passenger-km', 0.195000, 'DEFRA 2025'),
    ('c4a1f001-0000-4000-8000-000000000011', 'Employee commuting - bus', 'SCOPE_3', 'EMPLOYEE_COMMUTING', 'passenger-km', 0.102000, 'DEFRA 2025'),
    ('c4a1f001-0000-4000-8000-000000000012', 'Waste to landfill', 'SCOPE_3', 'WASTE_GENERATED', 'tonne', 446.200000, 'DEFRA 2025'),
    ('c4a1f001-0000-4000-8000-000000000013', 'Water supply', 'SCOPE_3', 'WATER_SUPPLY', 'm3', 0.149000, 'DEFRA 2025');
