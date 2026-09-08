package com.carbonos.ghg.internal;

import java.math.BigDecimal;

/**
 * Table 1 of the Corporate Standard, "accounting for emissions from various
 * types of legal structures" (spec 03.1): the share of an entity's emissions
 * the company accounts for under each consolidation approach.
 *
 * <pre>
 * Relationship                  Equity share       Financial control   Operational control
 * Wholly owned / subsidiary     economic interest  100%                100% if operated
 * JV, joint financial control   economic interest  economic interest   100% for the operator, else 0
 * Non-incorporated JV, operated economic interest  economic interest   100%
 * Associate                     economic interest  0                   0
 * Fixed-asset investment        0                  0                   0
 * </pre>
 */
public final class Table1 {

	private Table1() {
	}

	public static BigDecimal share(RelationshipType relationship, ConsolidationApproach approach,
			BigDecimal economicInterestPercent, boolean operatedByCompany) {
		var interest = economicInterestPercent.movePointLeft(2);
		return switch (approach) {
			case EQUITY_SHARE -> relationship == RelationshipType.FIXED_ASSET_INVESTMENT ? BigDecimal.ZERO : interest;
			case FINANCIAL_CONTROL -> switch (relationship) {
				case WHOLLY_OWNED -> BigDecimal.ONE;
				case JOINT_VENTURE, NON_INCORPORATED_JV -> interest;
				case ASSOCIATE, FIXED_ASSET_INVESTMENT -> BigDecimal.ZERO;
			};
			case OPERATIONAL_CONTROL -> switch (relationship) {
				case WHOLLY_OWNED, JOINT_VENTURE -> operatedByCompany ? BigDecimal.ONE : BigDecimal.ZERO;
				case NON_INCORPORATED_JV -> BigDecimal.ONE;
				case ASSOCIATE, FIXED_ASSET_INVESTMENT -> BigDecimal.ZERO;
			};
		};
	}

	/** The Table 1 row applied, in words, e.g. "JV under joint financial control, operational control: 100% (operator)". */
	public static String describe(RelationshipType relationship, ConsolidationApproach approach,
			BigDecimal economicInterestPercent, boolean operatedByCompany) {
		var interest = economicInterestPercent.stripTrailingZeros().toPlainString() + "% economic interest";
		var row = switch (relationship) {
			case WHOLLY_OWNED -> "wholly owned operation or subsidiary";
			case JOINT_VENTURE -> "joint venture under joint financial control";
			case NON_INCORPORATED_JV -> "non-incorporated joint venture the company operates";
			case ASSOCIATE -> "associate with significant influence, no control";
			case FIXED_ASSET_INVESTMENT -> "fixed-asset investment with no significant influence";
		};
		var rule = switch (approach) {
			case EQUITY_SHARE -> relationship == RelationshipType.FIXED_ASSET_INVESTMENT ? "0% (no significant influence)"
					: interest;
			case FINANCIAL_CONTROL -> switch (relationship) {
				case WHOLLY_OWNED -> "100% (controlled)";
				case JOINT_VENTURE, NON_INCORPORATED_JV -> interest + " (jointly controlled)";
				case ASSOCIATE, FIXED_ASSET_INVESTMENT -> "0% (not controlled)";
			};
			case OPERATIONAL_CONTROL -> switch (relationship) {
				case WHOLLY_OWNED, JOINT_VENTURE -> operatedByCompany ? "100% (operator)" : "0% (not the operator)";
				case NON_INCORPORATED_JV -> "100% (operator)";
				case ASSOCIATE, FIXED_ASSET_INVESTMENT -> "0% (not controlled)";
			};
		};
		return row + "; " + approach.name().toLowerCase().replace('_', ' ') + ": " + rule;
	}
}
