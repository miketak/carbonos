-- T-02, T-09 (audit findings F23, F32; spec 07.6): each Scope 2 Quality
-- Criterion is answered on its own, instruments carry their certificate
-- details, and the scope 3 declaration says why a declared category is not
-- quantified.

ALTER TABLE ghg_market_factors
    ADD COLUMN certificate_id   varchar(120),
    ADD COLUMN registry         varchar(120),
    ADD COLUMN vintage          integer CHECK (vintage BETWEEN 1990 AND 2100),
    ADD COLUMN retirement_date  date,
    -- one character per criterion, in the Guidance's order: Y met, N not met, U unanswered
    ADD COLUMN criteria_answers varchar(8) NOT NULL DEFAULT 'UUUUUUUU';
UPDATE ghg_market_factors SET criteria_answers = 'YYYYYYYY' WHERE meets_quality_criteria;

ALTER TABLE ghg_inventories ADD COLUMN scope3_not_quantified text;
