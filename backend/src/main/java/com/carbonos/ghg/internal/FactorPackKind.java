package com.carbonos.ghg.internal;

/**
 * What a pack family is (spec 02.5): the lineage of one published table, or a
 * selection assembled from others for a sector (spec 02.4).
 */
public enum FactorPackKind {

	/** One publisher's table, released edition by edition: DESNZ, the EPA Hub, Ember. */
	SOURCE,

	/** A selection from other packs, gathered for one sector. */
	SECTOR
}
