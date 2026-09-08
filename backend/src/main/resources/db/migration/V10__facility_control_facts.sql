-- Spec 006: a facility records financial and operational control as separate
-- facts, as Table 1 of the GHG Protocol Corporate Standard needs, instead of
-- one "controlled" flag. Boundary treatments prefill from these.

ALTER TABLE ghg_facilities
    ADD COLUMN financial_control   boolean,
    ADD COLUMN operational_control boolean;

-- A facility that was "controlled" is taken to have been both. Where an
-- inventory's treatment was corrected by hand to something else, the BOUNDARY
-- gate's drift warning surfaces the difference for the accountant to reconcile.
UPDATE ghg_facilities
SET financial_control   = controlled,
    operational_control = controlled;

ALTER TABLE ghg_facilities
    ALTER COLUMN financial_control SET NOT NULL,
    ALTER COLUMN operational_control SET NOT NULL,
    DROP COLUMN controlled;
