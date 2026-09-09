package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * What an entity's parents contribute to its share in one inventory (spec
 * 03.3): the product of the parents' shares under the inventory's approach,
 * the product of their economic interests, and their names. Chapter 3 applies
 * the consolidation policy at every level, so a venture held by a subsidiary
 * carries the subsidiary's share as well as its own.
 */
public record EntityChain(BigDecimal shareFactor, BigDecimal interestFactor, List<String> names) {

	/** An entity held directly by the reporting company: no parents, factor one. */
	public static final EntityChain DIRECT = new EntityChain(BigDecimal.ONE, BigDecimal.ONE, List.of());

	/** The entity's own interest through the chain, to two decimals. */
	public BigDecimal effectiveInterestPercent(BigDecimal ownInterestPercent) {
		var interest = ownInterestPercent.multiply(interestFactor).setScale(2, RoundingMode.HALF_UP);
		return interest;
	}
}
