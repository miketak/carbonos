-- T-03 (audit findings F17, F19, F20, F51; spec 02.1): organizations add
-- their own factors with full provenance, packs are importable, and the
-- seeded library cites its sources exactly.

ALTER TABLE ghg_emission_factors
    ADD COLUMN organization_id  uuid REFERENCES ghg_organizations (id) ON DELETE CASCADE,
    ADD COLUMN source_url       varchar(500),
    ADD COLUMN publication_year integer,
    ADD COLUMN data_year        integer,
    ADD COLUMN valid_from       date,
    ADD COLUMN valid_to         date,
    ADD COLUMN note             varchar(500),
    ADD COLUMN approved         boolean     NOT NULL DEFAULT true,
    ADD COLUMN pack             varchar(60),
    ADD COLUMN pack_code        varchar(200),
    ADD COLUMN created_at       timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN updated_at       timestamptz NOT NULL DEFAULT now(),
    ALTER COLUMN source TYPE varchar(500),
    ADD CONSTRAINT chk_ghg_emission_factors_validity CHECK (valid_from IS NULL OR valid_to IS NULL OR valid_from <= valid_to);
CREATE INDEX idx_ghg_emission_factors_organization ON ghg_emission_factors (organization_id);
-- the run's frozen copy of a factor carries the same citation
ALTER TABLE ghg_run_factors ALTER COLUMN source TYPE varchar(500);
CREATE UNIQUE INDEX idx_ghg_emission_factors_pack_code
    ON ghg_emission_factors (organization_id, pack, pack_code) WHERE pack IS NOT NULL;

-- The seeded library, cited exactly. Values that were labelled "(approx.)" or
-- attributed to an internal library are restated from their primary source.
UPDATE ghg_emission_factors SET name = 'Natural gas', source = 'UK Government GHG Conversion Factors for Company Reporting 2025, Fuels, Gaseous fuels: Natural gas, per cubic metre (gross CV)', source_url = 'https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting', publication_year = 2025, data_year = 2025 WHERE id = 'c4a1f001-0000-4000-8000-000000000001';
UPDATE ghg_emission_factors SET name = 'LPG', source = 'UK Government GHG Conversion Factors for Company Reporting 2025, Fuels, Liquid fuels: LPG, per litre', source_url = 'https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting', publication_year = 2025, data_year = 2025 WHERE id = 'c4a1f001-0000-4000-8000-000000000002';
UPDATE ghg_emission_factors SET name = 'Diesel (100% mineral diesel)', source = 'UK Government GHG Conversion Factors for Company Reporting 2025, Fuels, Liquid fuels: Diesel (100% mineral diesel), per litre, rounded to 2.66 kg CO2e (published 2.66155, CO2 2.62818); the gas split apportions the rounded total. Import the defra pack for the unrounded row', source_url = 'https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting', publication_year = 2025, data_year = 2025 WHERE id = 'c4a1f001-0000-4000-8000-000000000003';
UPDATE ghg_emission_factors SET name = 'Petrol (100% mineral petrol)', source = 'UK Government GHG Conversion Factors for Company Reporting 2025, Fuels, Liquid fuels: Petrol (100% mineral petrol), per litre', source_url = 'https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting', publication_year = 2025, data_year = 2025 WHERE id = 'c4a1f001-0000-4000-8000-000000000004';
UPDATE ghg_emission_factors SET source = 'IPCC AR5 WG1 Table 8.A.1 100-year potentials (HFC-32 677, HFC-125 3,170) applied to the ASHRAE composition of R-410A (50% HFC-32, 50% HFC-125 by mass), EPA GHG Emission Factors Hub Table 12', source_url = 'https://www.epa.gov/climateleadership/ghg-emission-factors-hub', publication_year = 2025, data_year = 2025 WHERE id = 'c4a1f001-0000-4000-8000-000000000005';
UPDATE ghg_emission_factors SET name = 'Grid electricity (Ghana, Ecoriv 2025)', source = 'Ecoriv factor library 2025: a secondary estimate with no published derivation or data year; CO2 only. Ember publishes 0.469 kg CO2e/kWh for Ghana in 2024 (ghana pack)', source_url = 'https://ember-energy.org/data/yearly-electricity-data/', publication_year = 2025, note = 'Prefer the ghana pack''s Ember figure for the data year, or a national or IFI factor, and say which in the report.' WHERE id = 'c4a1f001-0000-4000-8000-000000000006';
UPDATE ghg_emission_factors SET name = 'Grid electricity (UK, 2025)', source = 'UK Government GHG Conversion Factors for Company Reporting 2025, UK electricity, generation, per kWh (location-based)', source_url = 'https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting', publication_year = 2025, data_year = 2023 WHERE id = 'c4a1f001-0000-4000-8000-000000000007';
UPDATE ghg_emission_factors SET source = 'UK Government GHG Conversion Factors for Company Reporting 2025, Heat and steam, onsite heat and steam, per kWh', source_url = 'https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting', publication_year = 2025, data_year = 2025 WHERE id = 'c4a1f001-0000-4000-8000-000000000008';
UPDATE ghg_emission_factors SET source = 'UK Government GHG Conversion Factors for Company Reporting 2025, Business travel: land, Cars (by size), Average car, unknown fuel, per km', source_url = 'https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting', publication_year = 2025, data_year = 2025 WHERE id = 'c4a1f001-0000-4000-8000-000000000009';
UPDATE ghg_emission_factors SET source = 'UK Government GHG Conversion Factors for Company Reporting 2025, Business travel: air, Flights, Long-haul to/from non-UK, average passenger, with radiative forcing, per passenger-km', source_url = 'https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting', publication_year = 2025, data_year = 2025 WHERE id = 'c4a1f001-0000-4000-8000-000000000010';
UPDATE ghg_emission_factors SET source = 'UK Government GHG Conversion Factors for Company Reporting 2025, Business travel: land, Bus, Local bus (not London), per passenger-km', source_url = 'https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting', publication_year = 2025, data_year = 2025 WHERE id = 'c4a1f001-0000-4000-8000-000000000011';
UPDATE ghg_emission_factors SET name = 'Commercial and industrial waste to landfill', source = 'UK Government GHG Conversion Factors for Company Reporting 2025, Waste disposal, Refuse: Commercial and industrial waste, Landfill, per tonne; CH4 is landfill gas (biogenic)', source_url = 'https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting', publication_year = 2025, data_year = 2025 WHERE id = 'c4a1f001-0000-4000-8000-000000000012';
UPDATE ghg_emission_factors SET source = 'UK Government GHG Conversion Factors for Company Reporting 2025, Water supply, per cubic metre', source_url = 'https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting', publication_year = 2025, data_year = 2025 WHERE id = 'c4a1f001-0000-4000-8000-000000000013';
UPDATE ghg_emission_factors SET name = 'Explosives detonation (ANFO, emulsion)', source = 'Australian National Greenhouse Accounts Factors 2024, explosives: 0.17 t CO2-e per t of explosive, all types; IPCC 2006 publishes no explosives factor', source_url = 'https://www.dcceew.gov.au/climate-change/publications/national-greenhouse-accounts-factors', publication_year = 2024, data_year = 2024 WHERE id = 'c4a1f001-0000-4000-8000-000000000014';
UPDATE ghg_emission_factors SET source = 'Stoichiometric CO2 of CaO calcination, 0.785 t per t CaO (IPCC 2006 Guidelines Vol. 3, Ch. 2, Table 2.4, which gives 0.75 for typical high-calcium lime at 95% CaO; import the ipcc-2006-process pack for that row)', source_url = 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol3.html', publication_year = 2006, data_year = 2006 WHERE id = 'c4a1f001-0000-4000-8000-000000000015';
UPDATE ghg_emission_factors SET source = 'UK Government GHG Conversion Factors for Company Reporting 2025, Bioenergy, Biomass: Wood pellets, per tonne (CH4 and N2O in the scopes); Outside of scopes, biogenic CO2 per tonne', source_url = 'https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting', publication_year = 2025, data_year = 2025 WHERE id = 'c4a1f001-0000-4000-8000-000000000016';
UPDATE ghg_emission_factors SET source = 'Ecoriv assumption: no published district cooling factor; 0.12 kg CO2e/kWh delivered stands in until the supplier discloses its factor', note = 'An assumption, not a published factor: replace it with the supplier''s figure and say so in the report.', publication_year = 2025, data_year = 2025 WHERE id = 'c4a1f001-0000-4000-8000-000000000017';
