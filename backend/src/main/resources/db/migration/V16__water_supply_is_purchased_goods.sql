-- Spec 04.1 follow-up: WATER_SUPPLY was a seed-era category, not one of the
-- Scope 3 Standard's fifteen. Water is a purchased good; the factor and every
-- classification that used the old category move to category 1, so the
-- report's declaration and the categories reported line up.

UPDATE ghg_emission_factors SET default_category = 'PURCHASED_GOODS_SERVICES' WHERE default_category = 'WATER_SUPPLY';
UPDATE ghg_assignments SET category = 'PURCHASED_GOODS_SERVICES' WHERE category = 'WATER_SUPPLY';
UPDATE ghg_run_lines SET category = 'PURCHASED_GOODS_SERVICES' WHERE category = 'WATER_SUPPLY';

ALTER TABLE ghg_emission_factors DROP CONSTRAINT ghg_emission_factors_category_check;
ALTER TABLE ghg_emission_factors ADD CONSTRAINT ghg_emission_factors_category_check
    CHECK (default_category IN (
        'STATIONARY_COMBUSTION', 'MOBILE_COMBUSTION', 'PROCESS_EMISSIONS', 'FUGITIVE_EMISSIONS',
        'PURCHASED_ELECTRICITY', 'PURCHASED_HEAT_STEAM',
        'PURCHASED_GOODS_SERVICES', 'CAPITAL_GOODS', 'FUEL_ENERGY_RELATED', 'UPSTREAM_TRANSPORT',
        'WASTE_GENERATED', 'BUSINESS_TRAVEL', 'EMPLOYEE_COMMUTING', 'UPSTREAM_LEASED_ASSETS',
        'DOWNSTREAM_TRANSPORT', 'PROCESSING_SOLD_PRODUCTS', 'USE_SOLD_PRODUCTS',
        'END_OF_LIFE_SOLD_PRODUCTS', 'DOWNSTREAM_LEASED_ASSETS', 'FRANCHISES', 'INVESTMENTS'));
