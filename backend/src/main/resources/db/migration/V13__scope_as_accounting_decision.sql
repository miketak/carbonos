-- Spec 04.1: scope is determined by the reporter's relationship to the
-- source, not by the physics. A factor now carries a *default* scope and
-- category; the accountant chooses the scope and category on classification.

ALTER TABLE ghg_emission_factors RENAME COLUMN scope TO default_scope;
ALTER TABLE ghg_emission_factors RENAME COLUMN category TO default_category;
ALTER TABLE ghg_emission_factors ADD COLUMN scope_agnostic boolean NOT NULL DEFAULT false;

-- the category list grows to the Standard's scope 1 kinds and the Scope 3
-- Standard's fifteen categories
ALTER TABLE ghg_emission_factors DROP CONSTRAINT ghg_emission_factors_category_check;
ALTER TABLE ghg_emission_factors ADD CONSTRAINT ghg_emission_factors_category_check
    CHECK (default_category IN (
        'STATIONARY_COMBUSTION', 'MOBILE_COMBUSTION', 'PROCESS_EMISSIONS', 'FUGITIVE_EMISSIONS',
        'PURCHASED_ELECTRICITY', 'PURCHASED_HEAT_STEAM',
        'PURCHASED_GOODS_SERVICES', 'CAPITAL_GOODS', 'FUEL_ENERGY_RELATED', 'UPSTREAM_TRANSPORT',
        'WASTE_GENERATED', 'BUSINESS_TRAVEL', 'EMPLOYEE_COMMUTING', 'UPSTREAM_LEASED_ASSETS',
        'DOWNSTREAM_TRANSPORT', 'PROCESSING_SOLD_PRODUCTS', 'USE_SOLD_PRODUCTS',
        'END_OF_LIFE_SOLD_PRODUCTS', 'DOWNSTREAM_LEASED_ASSETS', 'FRANCHISES', 'INVESTMENTS',
        'WATER_SUPPLY'));

-- fuels are the same physics whoever burns them: scope 1 in the company's
-- own fleet, scope 3 in a contractor's
UPDATE ghg_emission_factors SET scope_agnostic = true
WHERE name IN ('Natural gas', 'LPG', 'Diesel', 'Petrol');

-- Appendix F: a leased asset's scope follows the lease type and the approach
ALTER TABLE ghg_assignments ADD COLUMN lease_type varchar(30)
    CHECK (lease_type IS NULL OR lease_type IN ('FINANCE_LEASE_IN', 'OPERATING_LEASE_IN',
                                                 'FINANCE_LEASE_OUT', 'OPERATING_LEASE_OUT'));
ALTER TABLE ghg_run_lines ADD COLUMN lease_type varchar(30);

-- process-emission factors so a mining client can classify explosives and lime
INSERT INTO ghg_emission_factors (id, name, default_scope, default_category, unit, kg_co2e_per_unit, source, scope_agnostic) VALUES
    ('c4a1f001-0000-4000-8000-000000000014', 'ANFO explosives detonation', 'SCOPE_1', 'PROCESS_EMISSIONS', 'tonne', 170.000000, 'IPCC 2006 Vol. 3 (approx.)', true),
    ('c4a1f001-0000-4000-8000-000000000015', 'Quicklime (CaO) calcination', 'SCOPE_1', 'PROCESS_EMISSIONS', 'tonne', 785.000000, 'IPCC 2006 Vol. 3 (approx.)', true);
