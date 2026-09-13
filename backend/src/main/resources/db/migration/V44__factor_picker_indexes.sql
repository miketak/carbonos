-- FU-03: the factor picker filters, orders and pages in SQL instead of loading
-- every factor an organization can see. This migration adds the indexes that
-- query needs and nothing else: no column changes, no data rewritten.
--
-- Chosen from EXPLAIN ANALYZE against a database holding the defra-2026 edition
-- imported into one organization (1,868 own factors plus the 23 shared library
-- rows), not from guesswork. The numbers below are that measurement.

-- 1. The picker's default page. The order is the grouping made durable across
--    pages: the organization's own rows first (a non-null owner sorts before
--    the library's null under ASC NULLS LAST), then scope, name, unit, id.
--    Walking this index in order serves the ORDER BY and stops at the LIMIT.
--    Measured: seq scan + top-N sort of 1,891 rows, 30.6 ms -> index scan of
--    50 rows, 2.7 ms. It also answers the unit facet as an index-only scan.
CREATE INDEX idx_ghg_emission_factors_browse
    ON ghg_emission_factors (organization_id, default_scope, name, unit, id);

-- 2. The page's totals: how many rows match, and how many of those the
--    approval toggle is hiding. Measured: seq scan 18.6 ms -> index-only scan
--    4.3 ms.
CREATE INDEX idx_ghg_emission_factors_approval
    ON ghg_emission_factors (organization_id, approved);

-- 3. The publisher's taxonomy (spec 02.5), which is how a preparer narrows
--    1,868 rows without typing a search. Partial, because a hand-entered
--    factor has no publisher taxonomy and never matches these filters.
--    Measured on source_category: seq scan 6.4 ms -> bitmap scan 0.3 ms, and
--    the category facet becomes an index-only scan.
CREATE INDEX idx_ghg_emission_factors_source_category
    ON ghg_emission_factors (organization_id, source_category) WHERE source_category IS NOT NULL;

CREATE INDEX idx_ghg_emission_factors_source_activity
    ON ghg_emission_factors (organization_id, source_activity) WHERE source_activity IS NOT NULL;

-- 4. The unit filter: the classification picker offers only the factors a
--    record's unit converts into, which is a set of unit spellings, and the
--    factors page filters on one unit. Measured: the filter stops reading at
--    70 index entries instead of 1,891 heap rows.
CREATE INDEX idx_ghg_emission_factors_unit
    ON ghg_emission_factors (organization_id, lower(unit));

-- Deliberately not added: trigram (pg_trgm) indexes for the text search. With
-- all five built, the planner never chose one: the search is an OR across five
-- columns and an EXISTS over the pack tags, and one branch an index cannot
-- answer forces a full pass whatever the others offer. They would cost every
-- write and buy nothing, and CREATE EXTENSION is a privilege we would rather
-- not require of a deployment. The search is bounded by the filters above and
-- measured at about 110 ms over 1,891 rows; revisit with a stored search
-- column if a library an order of magnitude larger appears.
--
-- Also not added: an index on source_detail. It is nearly unique per row, so a
-- filter on it is already narrowed by the category and activity indexes above.
