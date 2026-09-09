package com.carbonos.ghg.internal;

/**
 * The five data quality tiers of spec 04.4, after the Scope 3 Standard's data
 * quality indicators (chapter 7): 1 is metered or invoiced primary data, 5 an
 * assumption. The tier scores the figure; {@link DataQuality} names the method.
 */
public final class DataQualityTier {

	private DataQualityTier() {
	}

	public static String label(int tier) {
		return switch (tier) {
			case 1 -> "Metered or invoiced primary data";
			case 2 -> "Primary data with minor estimation";
			case 3 -> "Calculated from partial primary data";
			case 4 -> "Estimated from secondary or proxy data";
			case 5 -> "Rough estimate or assumption";
			default -> "Tier " + tier;
		};
	}

	/** The tier a record defaults to when only the method is recorded. */
	static int defaultFor(DataQuality quality) {
		return switch (quality) {
			case MEASURED -> 1;
			case CALCULATED -> 3;
			case ESTIMATED -> 4;
		};
	}

	static void require(int tier) {
		if (tier < 1 || tier > 5) {
			throw new GhgRuleViolationException("The data quality tier is 1 (best) to 5 (worst).");
		}
	}
}
