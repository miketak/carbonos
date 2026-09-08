package com.carbonos.ghg.internal;

/**
 * The legal structures of Table 1 of the Corporate Standard (spec 03.1). The
 * relationship, together with the consolidation approach and the economic
 * interest, determines the accounting share; see {@link Table1}.
 */
public enum RelationshipType {
	/** Wholly owned operation or subsidiary: the company has control. */
	WHOLLY_OWNED,
	/** Incorporated joint venture or partnership under joint financial control. */
	JOINT_VENTURE,
	/** Non-incorporated joint venture or partnership that the company operates. */
	NON_INCORPORATED_JV,
	/** Associate or affiliate: significant influence, no control. */
	ASSOCIATE,
	/** Fixed-asset investment: no significant influence. */
	FIXED_ASSET_INVESTMENT
}
