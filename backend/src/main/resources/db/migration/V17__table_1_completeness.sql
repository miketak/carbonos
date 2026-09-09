-- Spec 03.3: Table 1 completeness. The subsidiary row is named as the
-- Standard names it, the redundant NON_INCORPORATED_JV type folds into the
-- joint-control row, franchises join as the fifth row with a financial-control
-- fact, and an entity may name the parent the company holds it through so the
-- consolidation policy applies at every level of the group (Chapter 3).

-- 1. Rename and retire, on the facts, the treatments and the frozen entries.
--    The old checks go first: they still name the old values, so the rewrite
--    would violate them.
ALTER TABLE ghg_entities DROP CONSTRAINT ghg_entities_relationship_type_check;
ALTER TABLE ghg_boundary_treatments DROP CONSTRAINT ghg_boundary_treatments_relationship_type_check;

UPDATE ghg_entities SET relationship_type = 'SUBSIDIARY' WHERE relationship_type = 'WHOLLY_OWNED';
UPDATE ghg_entities SET relationship_type = 'JOINT_VENTURE', operated_by_company = true
    WHERE relationship_type = 'NON_INCORPORATED_JV';
UPDATE ghg_boundary_treatments SET relationship_type = 'SUBSIDIARY' WHERE relationship_type = 'WHOLLY_OWNED';
UPDATE ghg_boundary_treatments SET relationship_type = 'JOINT_VENTURE', operated_by_company = true
    WHERE relationship_type = 'NON_INCORPORATED_JV';
UPDATE ghg_boundary_version_entries SET relationship_type = 'SUBSIDIARY' WHERE relationship_type = 'WHOLLY_OWNED';
UPDATE ghg_boundary_version_entries SET relationship_type = 'JOINT_VENTURE', operated_by_company = true
    WHERE relationship_type = 'NON_INCORPORATED_JV';

ALTER TABLE ghg_entities ADD CONSTRAINT ghg_entities_relationship_type_check
    CHECK (relationship_type IN ('SUBSIDIARY', 'JOINT_VENTURE', 'ASSOCIATE', 'FIXED_ASSET_INVESTMENT', 'FRANCHISE'));
ALTER TABLE ghg_boundary_treatments ADD CONSTRAINT ghg_boundary_treatments_relationship_type_check
    CHECK (relationship_type IN ('SUBSIDIARY', 'JOINT_VENTURE', 'ASSOCIATE', 'FIXED_ASSET_INVESTMENT', 'FRANCHISE'));

-- 2. Financial control as a fact (franchises only; the subsidiary row implies
--    it, the others rule it out) and the parent chain.
ALTER TABLE ghg_entities
    ADD COLUMN controlled_by_company boolean NOT NULL DEFAULT false,
    ADD COLUMN parent_entity_id uuid REFERENCES ghg_entities (id);
UPDATE ghg_entities SET controlled_by_company = true WHERE relationship_type = 'SUBSIDIARY';
CREATE INDEX idx_ghg_entities_parent ON ghg_entities (parent_entity_id);

ALTER TABLE ghg_boundary_treatments ADD COLUMN controlled_by_company boolean NOT NULL DEFAULT false;
UPDATE ghg_boundary_treatments SET controlled_by_company = true WHERE relationship_type = 'SUBSIDIARY';

-- 3. A version copies the effective interest through the chain and the
--    parents' names. Entries frozen before this change were held directly.
ALTER TABLE ghg_boundary_version_entries
    ADD COLUMN controlled_by_company boolean NOT NULL DEFAULT false,
    ADD COLUMN effective_economic_interest_percent numeric(5, 2),
    ADD COLUMN chain_names varchar(1000);
UPDATE ghg_boundary_version_entries SET controlled_by_company = true WHERE relationship_type = 'SUBSIDIARY';
UPDATE ghg_boundary_version_entries SET effective_economic_interest_percent = economic_interest_percent;
ALTER TABLE ghg_boundary_version_entries ALTER COLUMN effective_economic_interest_percent SET NOT NULL;
