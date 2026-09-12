-- Spec 02.4 (audit 2026-09-11, finding F56 and the factor part of F26): a gas
-- can be recorded as itself, a Montreal Protocol gas is reported outside the
-- scopes rather than inside scope 1, and the sector packs gain the rows their
-- cards promise.
--
-- This migration rewrites data: it sets the reporting basis on organization
-- copies of the DEFRA Montreal Protocol rows already imported, which moves
-- their emissions out of the scope totals of any run launched after it. It is
-- replayed with psql on a copy of a seeded database before it is deployed, as
-- docs/how-to/add-a-migration.md requires.

-- 1. The reporting basis: whether a factor's emissions belong in a scope at
--    all. Chapter 4 counts the seven Kyoto gas groups; a Montreal Protocol gas
--    is disclosed separately with the CO2e its source publishes.
ALTER TABLE ghg_emission_factors
    ADD COLUMN reporting_basis varchar(30) NOT NULL DEFAULT 'SCOPES'
        CHECK (reporting_basis IN ('SCOPES', 'OUTSIDE_SCOPES_NON_KYOTO'));
ALTER TABLE ghg_run_factors
    ADD COLUMN reporting_basis varchar(30) NOT NULL DEFAULT 'SCOPES'
        CHECK (reporting_basis IN ('SCOPES', 'OUTSIDE_SCOPES_NON_KYOTO'));
ALTER TABLE ghg_run_lines
    ADD COLUMN reporting_basis varchar(30) NOT NULL DEFAULT 'SCOPES'
        CHECK (reporting_basis IN ('SCOPES', 'OUTSIDE_SCOPES_NON_KYOTO'));

-- 2. Gases as themselves: one kilogram of gas per kilogram, so the CO2e
--    follows the inventory's GWP set through the per-gas arithmetic. The
--    stated kg_co2e_per_unit is the AR5 value. Methane appears twice because
--    AR6 gives fossil and biogenic methane different potentials.
INSERT INTO ghg_emission_factors (id, name, default_scope, default_category, scope_agnostic, unit,
                                  kg_co2e_per_unit, co2_kg_per_unit, ch4_kg_per_unit, ch4_fossil, n2o_kg_per_unit,
                                  sf6_kg_per_unit, nf3_kg_per_unit, source, source_url, publication_year, data_year,
                                  note, approved)
VALUES ('c4a1f001-0000-4000-8000-000000000018', 'Methane (CH4) emitted as gas, fossil origin', 'SCOPE_1',
        'FUGITIVE_EMISSIONS', true, 'kg', 28.000000, 0, 1.000000, true, 0, 0, 0,
        'IPCC AR5 WG1 Table 8.A.1; IPCC AR6 WG1 Table 7.SM.7 (fossil methane Table 7.15), 100-year GWP; the mass is the activity datum',
        'https://www.ipcc.ch/report/ar6/wg1/', 2021, 2021,
        'Record the kilograms of methane vented or leaked. The CO2e follows the inventory''s GWP set: 28 under AR5, 29.8 under AR6.',
        true),
       ('c4a1f001-0000-4000-8000-000000000019', 'Methane (CH4) emitted as gas, biogenic origin', 'SCOPE_1',
        'FUGITIVE_EMISSIONS', true, 'kg', 28.000000, 0, 1.000000, false, 0, 0, 0,
        'IPCC AR5 WG1 Table 8.A.1; IPCC AR6 WG1 Table 7.SM.7, 100-year GWP; the mass is the activity datum',
        'https://www.ipcc.ch/report/ar6/wg1/', 2021, 2021,
        'Methane from landfill, digestion or biomass. The CO2e follows the inventory''s GWP set: 28 under AR5, 27.9 under AR6.',
        true),
       ('c4a1f001-0000-4000-8000-000000000020', 'Nitrous oxide (N2O) emitted as gas', 'SCOPE_1', 'FUGITIVE_EMISSIONS',
        true, 'kg', 265.000000, 0, 0, true, 1.000000, 0, 0,
        'IPCC AR5 WG1 Table 8.A.1; IPCC AR6 WG1 Table 7.SM.7, 100-year GWP; the mass is the activity datum',
        'https://www.ipcc.ch/report/ar6/wg1/', 2021, 2021,
        'Record the kilograms of nitrous oxide released. The CO2e follows the inventory''s GWP set: 265 under AR5, 273 under AR6.',
        true),
       ('c4a1f001-0000-4000-8000-000000000021', 'Carbon dioxide (CO2) emitted as gas', 'SCOPE_1', 'FUGITIVE_EMISSIONS',
        true, 'kg', 1.000000, 1.000000, 0, true, 0, 0, 0,
        'IPCC AR5 WG1 Table 8.A.1; IPCC AR6 WG1 Table 7.SM.7, 100-year GWP; the mass is the activity datum',
        'https://www.ipcc.ch/report/ar6/wg1/', 2021, 2021,
        'Record the kilograms of carbon dioxide released, for example from a CO2 system or an acid-gas vent. Fossil CO2 only; biogenic CO2 is reported outside the scopes.',
        true),
       ('c4a1f001-0000-4000-8000-000000000022', 'Sulfur hexafluoride (SF6) emitted as gas', 'SCOPE_1',
        'FUGITIVE_EMISSIONS', true, 'kg', 23500.000000, 0, 0, true, 0, 1.000000, 0,
        'IPCC AR5 WG1 Table 8.A.1; IPCC AR6 WG1 Table 7.SM.7, 100-year GWP; the mass is the activity datum',
        'https://www.ipcc.ch/report/ar6/wg1/', 2021, 2021,
        'Switchgear top-up or leakage. The CO2e follows the inventory''s GWP set: 23,500 under AR5, 25,200 under AR6.',
        true),
       ('c4a1f001-0000-4000-8000-000000000023', 'Nitrogen trifluoride (NF3) emitted as gas', 'SCOPE_1',
        'FUGITIVE_EMISSIONS', true, 'kg', 16100.000000, 0, 0, true, 0, 0, 1.000000,
        'IPCC AR5 WG1 Table 8.A.1; IPCC AR6 WG1 Table 7.SM.7, 100-year GWP; the mass is the activity datum',
        'https://www.ipcc.ch/report/ar6/wg1/', 2021, 2021,
        'The CO2e follows the inventory''s GWP set: 16,100 under AR5, 17,400 under AR6.', true);

-- 3. Montreal Protocol gases already imported from the DEFRA pack move out of
--    the scopes. A run launched before this change keeps its figures: run
--    lines and run factors are snapshots and are not touched.
UPDATE ghg_emission_factors
SET reporting_basis = 'OUTSIDE_SCOPES_NON_KYOTO'
WHERE pack_code LIKE 'DEFRA:Refrigerant_other:Montreal_protocol_products%';
