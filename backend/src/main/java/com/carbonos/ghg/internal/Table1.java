package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Table 1 of the Corporate Standard, "accounting for emissions from various
 * types of legal structures" (spec 03.1, 03.3): the share of an entity's
 * emissions the company accounts for under each consolidation approach. The
 * operational-control column comes from the text of Chapter 3: 100% of an
 * operation the company operates, otherwise nothing.
 *
 * <pre>
 * Row                            Equity share       Financial control          Operational control
 * Group company or subsidiary    economic interest  100%                       100% if operated
 * Joint financial control        economic interest  economic interest          100% for the operator
 * Associate or affiliate         economic interest  0                          0
 * Fixed-asset investment         0                  0                          0
 * Franchise                      economic interest  100% if controlled, else 0 100% if operated
 * </pre>
 *
 * <p>A franchise is normally outside every boundary: the Standard says the
 * franchiser "will not have equity rights or control", but "if the franchiser
 * does have equity rights or operational/financial control, then the same
 * rules for consolidation under the equity or control approaches apply". Its
 * economic interest is 0 when it holds no equity rights.
 */
public final class Table1 {

	private Table1() {
	}

	/** A share rounded to four decimals with trailing zeros dropped, so 1.0000 reads as 1 and 0.4000 as 0.4. */
	static BigDecimal tidy(BigDecimal share) {
		var rounded = share.setScale(4, RoundingMode.HALF_UP).stripTrailingZeros();
		return rounded.scale() < 0 ? rounded.setScale(0) : rounded;
	}

	public static BigDecimal share(RelationshipType relationship, ConsolidationApproach approach,
			BigDecimal economicInterestPercent, boolean operatedByCompany, boolean controlledByCompany) {
		var interest = economicInterestPercent.movePointLeft(2);
		return switch (approach) {
			case EQUITY_SHARE -> relationship == RelationshipType.FIXED_ASSET_INVESTMENT ? BigDecimal.ZERO : interest;
			case FINANCIAL_CONTROL -> switch (relationship) {
				case SUBSIDIARY -> BigDecimal.ONE;
				case JOINT_VENTURE -> interest;
				case ASSOCIATE, FIXED_ASSET_INVESTMENT -> BigDecimal.ZERO;
				case FRANCHISE -> controlledByCompany ? BigDecimal.ONE : BigDecimal.ZERO;
			};
			case OPERATIONAL_CONTROL -> switch (relationship) {
				case SUBSIDIARY, JOINT_VENTURE, FRANCHISE -> operatedByCompany ? BigDecimal.ONE : BigDecimal.ZERO;
				case ASSOCIATE, FIXED_ASSET_INVESTMENT -> BigDecimal.ZERO;
			};
		};
	}

	/** The Table 1 row applied, in words, e.g. "joint venture under joint financial control; operational control: 100% (operator)". */
	public static String describe(RelationshipType relationship, ConsolidationApproach approach,
			BigDecimal economicInterestPercent, boolean operatedByCompany, boolean controlledByCompany) {
		var interest = economicInterestPercent.stripTrailingZeros().toPlainString() + "% economic interest";
		var row = switch (relationship) {
			case SUBSIDIARY -> "group company or subsidiary under financial control";
			case JOINT_VENTURE -> "joint venture under joint financial control";
			case ASSOCIATE -> "associate with significant influence, no control";
			case FIXED_ASSET_INVESTMENT -> "fixed-asset investment with no significant influence";
			case FRANCHISE -> "franchise";
		};
		var rule = switch (approach) {
			case EQUITY_SHARE -> relationship == RelationshipType.FIXED_ASSET_INVESTMENT ? "0% (no significant influence)"
					: relationship == RelationshipType.FRANCHISE && economicInterestPercent.signum() == 0
							? "0% (no equity rights)" : interest;
			case FINANCIAL_CONTROL -> switch (relationship) {
				case SUBSIDIARY -> "100% (controlled)";
				case JOINT_VENTURE -> interest + " (jointly controlled)";
				case ASSOCIATE, FIXED_ASSET_INVESTMENT -> "0% (not controlled)";
				case FRANCHISE -> controlledByCompany ? "100% (controlled)" : "0% (not controlled)";
			};
			case OPERATIONAL_CONTROL -> switch (relationship) {
				case SUBSIDIARY, JOINT_VENTURE, FRANCHISE -> operatedByCompany ? "100% (operator)"
						: "0% (not the operator)";
				case ASSOCIATE, FIXED_ASSET_INVESTMENT -> "0% (not controlled)";
			};
		};
		return row + "; " + approach.name().toLowerCase().replace('_', ' ') + ": " + rule;
	}
}
