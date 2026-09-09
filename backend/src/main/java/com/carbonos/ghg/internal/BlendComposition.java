package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.math.MathContext;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * The mass composition of an HFC or PFC refrigerant blend, stored as
 * {@code "HFC-32:0.5,HFC-125:0.5"} (spec 07.2): species name to mass
 * fraction. With a composition the blend's CO2e per kg of gas is the
 * fraction-weighted sum of the species' potentials under the reporting GWP
 * set, so R-410A is 1,923.5 under AR5 and 2,255.5 under AR6 rather than a
 * number frozen on the source's basis.
 */
record BlendComposition(Map<String, BigDecimal> fractions) {

	private static final MathContext MC = MathContext.DECIMAL64;

	/** Parses the stored form; null or blank means no composition is recorded. */
	static BlendComposition parse(String stored) {
		if (stored == null || stored.isBlank()) {
			return null;
		}
		var fractions = new LinkedHashMap<String, BigDecimal>();
		for (var part : stored.split(",")) {
			var pair = part.split(":");
			if (pair.length != 2) {
				throw new IllegalArgumentException("Malformed blend composition: " + stored);
			}
			fractions.put(pair[0].trim(), new BigDecimal(pair[1].trim()));
		}
		return new BlendComposition(Map.copyOf(fractions));
	}

	/** kg CO2e per kg of blend under the set, or null when the set lacks a species of it. */
	BigDecimal kgCo2ePerKg(GwpSet gwp) {
		var total = BigDecimal.ZERO;
		for (var entry : fractions.entrySet()) {
			var potential = gwp.species(entry.getKey());
			if (potential == null) {
				return null;
			}
			total = total.add(entry.getValue().multiply(potential, MC));
		}
		return total;
	}

	/** "50% HFC-32, 50% HFC-125" for reports and the factor library. */
	String describe() {
		var parts = new java.util.ArrayList<String>();
		fractions.forEach((species, fraction) -> parts
			.add(fraction.movePointRight(2).stripTrailingZeros().toPlainString() + "% " + species));
		return String.join(", ", parts);
	}
}
