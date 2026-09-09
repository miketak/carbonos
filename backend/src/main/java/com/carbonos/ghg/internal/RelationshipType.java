package com.carbonos.ghg.internal;

import com.fasterxml.jackson.annotation.JsonCreator;

/**
 * The five financial accounting categories of Table 1 of the Corporate
 * Standard (spec 03.1, 03.3). The relationship, together with the
 * consolidation approach, the economic interest and the control facts,
 * determines the accounting share; see {@link Table1}.
 */
public enum RelationshipType {
	/** Group company or subsidiary: the company has financial control, at any ownership percentage. */
	SUBSIDIARY,
	/** Joint venture, partnership or operation under joint financial control, incorporated or not. */
	JOINT_VENTURE,
	/** Associate or affiliate: significant influence, no control. */
	ASSOCIATE,
	/** Fixed-asset investment: neither significant influence nor control. */
	FIXED_ASSET_INVESTMENT,
	/** Franchise: consolidated only where the franchiser holds equity rights or control. */
	FRANCHISE;

	/**
	 * Spec 03.3 retired two names. A request that still carries one is refused
	 * with the replacement named, rather than silently mapped.
	 */
	@JsonCreator
	static RelationshipType fromJson(String value) {
		return switch (value) {
			case "WHOLLY_OWNED" -> throw new IllegalArgumentException(
					"WHOLLY_OWNED was renamed SUBSIDIARY (a group company or subsidiary under financial control).");
			case "NON_INCORPORATED_JV" -> throw new IllegalArgumentException(
					"NON_INCORPORATED_JV was retired: use JOINT_VENTURE with operatedByCompany true.");
			default -> valueOf(value);
		};
	}
}
