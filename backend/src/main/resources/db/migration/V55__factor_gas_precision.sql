-- Spec 02.6: a factor carries the gas masses its publication states.
--
-- The gas columns of an organization's factors were numeric(12, 6), and V42
-- left the rounding "where it happens today, on import". DESNZ states methane
-- and nitrous oxide to eight decimals (diesel: 0.00001036 and 0.00012483 kg
-- per litre), so the import truncated them to 0.00001 and 0.000125 and the run,
-- which rebuilds CO2e from the gas split under the inventory's GWP set, priced
-- a litre of diesel at 2.661585 kg instead of the published 2.66155. The
-- catalogue rows (V42) keep the publisher's scale; the organization's copies
-- and the run's factor snapshot now do too.
ALTER TABLE ghg_emission_factors
    ALTER COLUMN co2_kg_per_unit          TYPE numeric(20, 10),
    ALTER COLUMN ch4_kg_per_unit          TYPE numeric(20, 10),
    ALTER COLUMN n2o_kg_per_unit          TYPE numeric(20, 10),
    ALTER COLUMN hfcs_kg_per_unit         TYPE numeric(20, 10),
    ALTER COLUMN pfcs_kg_per_unit         TYPE numeric(20, 10),
    ALTER COLUMN sf6_kg_per_unit          TYPE numeric(20, 10),
    ALTER COLUMN nf3_kg_per_unit          TYPE numeric(20, 10),
    ALTER COLUMN biogenic_co2_kg_per_unit TYPE numeric(20, 10);

ALTER TABLE ghg_run_factors
    ALTER COLUMN co2_kg_per_unit          TYPE numeric(20, 10),
    ALTER COLUMN ch4_kg_per_unit          TYPE numeric(20, 10),
    ALTER COLUMN n2o_kg_per_unit          TYPE numeric(20, 10),
    ALTER COLUMN hfcs_kg_per_unit         TYPE numeric(20, 10),
    ALTER COLUMN pfcs_kg_per_unit         TYPE numeric(20, 10),
    ALTER COLUMN sf6_kg_per_unit          TYPE numeric(20, 10),
    ALTER COLUMN nf3_kg_per_unit          TYPE numeric(20, 10),
    ALTER COLUMN biogenic_co2_kg_per_unit TYPE numeric(20, 10);

-- A factor an organization imported before this migration carries the rounded
-- masses. It is restored to the figures of the edition row it came from, unless
-- the organization edited it locally (spec 02.6 rule 4): the values are the
-- publisher's own, so this changes no accounting decision, and every run
-- already completed keeps the snapshot it reported with. The next run prices
-- with the published figures.
UPDATE ghg_emission_factors f
   SET co2_kg_per_unit          = COALESCE(r.co2_kg_per_unit, 0),
       ch4_kg_per_unit          = COALESCE(r.ch4_kg_per_unit, 0),
       n2o_kg_per_unit          = COALESCE(r.n2o_kg_per_unit, 0),
       hfcs_kg_per_unit         = COALESCE(r.hfcs_kg_per_unit, 0),
       pfcs_kg_per_unit         = COALESCE(r.pfcs_kg_per_unit, 0),
       sf6_kg_per_unit          = COALESCE(r.sf6_kg_per_unit, 0),
       nf3_kg_per_unit          = COALESCE(r.nf3_kg_per_unit, 0),
       biogenic_co2_kg_per_unit = COALESCE(r.biogenic_co2_kg_per_unit, 0)
  FROM ghg_factor_pack_rows r
 WHERE f.pack_code = r.code
   AND f.source_edition = r.edition_id
   AND f.locally_edited = false;
