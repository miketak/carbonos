-- Unit conversion: a run line now records the emission factor's unit and the
-- converted quantity, so the audit snapshot faithfully shows the conversion
-- applied (e.g. 10,000 US-gallon x 3.785412 = 37,854.12 litre x 2.66 x 0.8).
-- The stored quantity/unit remain the ORIGINAL recorded fact.

ALTER TABLE ghg_run_lines
    ADD COLUMN factor_unit        varchar(30),
    ADD COLUMN converted_quantity numeric(20, 6),
    ADD COLUMN conversion_factor  numeric(20, 10);

-- Backfill existing lines: before this change activity unit == factor unit,
-- so the conversion was the identity.
UPDATE ghg_run_lines
SET factor_unit        = unit,
    converted_quantity = quantity,
    conversion_factor  = 1
WHERE factor_unit IS NULL;

ALTER TABLE ghg_run_lines
    ALTER COLUMN factor_unit SET NOT NULL,
    ALTER COLUMN converted_quantity SET NOT NULL,
    ALTER COLUMN conversion_factor SET NOT NULL;
