-- Spec 05.4: copying a view across consolidation approaches. The copy records
-- what it did (boundary rebuilt from Table 1, leased assignments re-derived,
-- boundary exclusions dropped and why) as JSON, so the inventory page can say
-- so until the inventory is frozen. Assignments and boundary tables are
-- unchanged: the copy writes different rows into them.
ALTER TABLE ghg_inventories ADD COLUMN inheritance_notes text;
