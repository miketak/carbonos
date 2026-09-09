package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.math.MathContext;
import java.util.Optional;

/**
 * How a record's quantity becomes the factor's unit (spec 02.2): a pure
 * conversion within a dimension (custom units included), or mass to volume
 * and back through a density in kg per litre. Every conversion prints what
 * it applied, so the line reads like the arithmetic.
 */
public record Conversion(BigDecimal convertedQuantity, BigDecimal factor, String note, boolean viaDensity) {

	private static final MathContext MC = MathContext.DECIMAL64;

	/** Whether a density is what stands between the two units. */
	static boolean needsDensity(UnitConverter.Scoped units, String from, String to) {
		var f = units.dimensionOf(from);
		var t = units.dimensionOf(to);
		return f.isPresent() && t.isPresent() && f.get() != t.get()
				&& ((f.get() == Dimension.MASS && t.get() == Dimension.VOLUME)
						|| (f.get() == Dimension.VOLUME && t.get() == Dimension.MASS));
	}

	/**
	 * The conversion, or empty when the units cannot be reconciled: no shared
	 * dimension and no density to bridge mass and volume. Identical custom
	 * strings pass through unchanged.
	 */
	static Optional<Conversion> of(UnitConverter.Scoped units, BigDecimal quantity, String from, String to,
			Density density) {
		if (units.canConvert(from, to)) {
			var ratio = units.ratio(from, to);
			return Optional.of(new Conversion(quantity.multiply(ratio, MC), ratio, units.definitionsBehind(from, to),
					false));
		}
		if (needsDensity(units, from, to) && density != null) {
			var fromMass = units.dimensionOf(from).orElseThrow() == Dimension.MASS;
			if (fromMass) {
				var kg = units.convert(quantity, from, "kg");
				var litres = kg.divide(density.getKgPerLitre(), MC);
				var converted = units.convert(litres, "litre", to);
				var ratio = quantity.signum() == 0 ? BigDecimal.ZERO : converted.divide(quantity, MC);
				return Optional.of(new Conversion(converted, ratio, plain(quantity) + " " + from + " = " + plain(kg)
						+ " kg ÷ " + plain(density.getKgPerLitre()) + " kg/litre = " + plain(litres) + " litre"
						+ (to.equalsIgnoreCase("litre") ? "" : " = " + plain(converted) + " " + to) + " (density of "
						+ density.getMaterial() + (density.isTypical() ? ", typical value" : "") + ")", true));
			}
			var litres = units.convert(quantity, from, "litre");
			var kg = litres.multiply(density.getKgPerLitre(), MC);
			var converted = units.convert(kg, "kg", to);
			var ratio = quantity.signum() == 0 ? BigDecimal.ZERO : converted.divide(quantity, MC);
			return Optional.of(new Conversion(converted, ratio, plain(quantity) + " " + from + " = " + plain(litres)
					+ " litre × " + plain(density.getKgPerLitre()) + " kg/litre = " + plain(kg) + " kg"
					+ (to.equalsIgnoreCase("kg") ? "" : " = " + plain(converted) + " " + to) + " (density of "
					+ density.getMaterial() + (density.isTypical() ? ", typical value" : "") + ")", true));
		}
		if (from.equalsIgnoreCase(to)) {
			return Optional.of(new Conversion(quantity, BigDecimal.ONE, null, false));
		}
		return Optional.empty();
	}

	private static String plain(BigDecimal value) {
		return value.setScale(6, java.math.RoundingMode.HALF_UP).stripTrailingZeros().toPlainString();
	}
}
