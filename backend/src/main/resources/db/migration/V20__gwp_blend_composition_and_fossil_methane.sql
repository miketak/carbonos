-- T-04 (audit findings F18, F37; spec 07.2): refrigerant blends are stored by
-- composition and converted with the inventory's GWP set, and methane carries
-- its origin so AR6 can apply its fossil and biogenic potentials.

-- 1. Blend composition and methane origin on factors.
ALTER TABLE ghg_emission_factors
    ADD COLUMN blend_composition varchar(255),
    ADD COLUMN ch4_fossil boolean NOT NULL DEFAULT true;

-- landfill gas and biomass methane are biogenic; every other seeded methane is from fossil fuel
UPDATE ghg_emission_factors SET ch4_fossil = false
    WHERE id IN ('c4a1f001-0000-4000-8000-000000000012', 'c4a1f001-0000-4000-8000-000000000016');

-- 2. R-410A was seeded at 2,088 kg CO2e/kg, the IPCC AR4 blend value, but
--    labelled AR5. Its composition is 50% HFC-32 and 50% HFC-125 by mass;
--    under AR5 (677 and 3,170) that is 1,923.5 kg CO2e/kg, under AR6 (771 and
--    3,740) 2,255.5. The stored CO2e is restated on the AR5 basis; runs derive
--    the figure from the composition and the inventory's set.
UPDATE ghg_emission_factors
SET blend_composition     = 'HFC-32:0.5,HFC-125:0.5',
    kg_co2e_per_unit      = 1923.500000,
    hfcs_kg_co2e_per_unit = 1923.500000,
    blend_gwp_source      = 'AR5',
    source                = 'IPCC AR5 WG1 Table 8.A.1 (HFC-32 677, HFC-125 3,170), 50/50 blend by mass'
WHERE id = 'c4a1f001-0000-4000-8000-000000000005';

-- 3. Lines and runs carry the fossil part of their methane. Earlier lines are
--    backfilled from the factor they cite by name; a line whose factor cannot
--    be found keeps the default (fossil), which is what AR5 assumed anyway.
ALTER TABLE ghg_run_lines ADD COLUMN ch4_fossil boolean NOT NULL DEFAULT true;
UPDATE ghg_run_lines l SET ch4_fossil = f.ch4_fossil
    FROM ghg_emission_factors f WHERE f.name = l.factor_name;
ALTER TABLE ghg_runs ADD COLUMN ch4_fossil_kg numeric(18, 3) NOT NULL DEFAULT 0;
UPDATE ghg_runs r SET ch4_fossil_kg = (SELECT COALESCE(SUM(l.ch4_kg), 0) FROM ghg_run_lines l
                                       WHERE l.run_id = r.id AND l.ch4_fossil);
-- earlier runs keep the R-410A figure they calculated; the line's blend_gwp_source
-- already says which report it was on
