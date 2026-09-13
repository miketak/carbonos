package com.carbonos.ghg.internal;

/**
 * Which tier of the factor library a query wants: the shared, read-only rows,
 * the organization's own, or both (spec 02.1). The picker asks for both and
 * puts the organization's own first (spec 02.3); the emission factors page
 * pages the two tiers apart, because it renders them as two tables.
 */
public enum FactorTier {

	ALL, OWN, LIBRARY

}
