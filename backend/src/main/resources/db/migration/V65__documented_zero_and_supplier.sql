-- ECO-27 (spec 04.12): a documented zero, and the supplier or counterparty behind a record.

-- 1. A quantity of 0 is a fact (with a note, a data source and evidence); only a negative quantity is refused.
--    No row holds 0 before this migration, so the widening changes nothing on seeded data.
ALTER TABLE ghg_activities DROP CONSTRAINT ghg_activities_quantity_check;
ALTER TABLE ghg_activities ADD CONSTRAINT ghg_activities_quantity_check CHECK (quantity >= 0);

-- 2. Who sold or billed the quantity; the data source stays what showed the figure.
ALTER TABLE ghg_activities ADD COLUMN supplier varchar(120);
