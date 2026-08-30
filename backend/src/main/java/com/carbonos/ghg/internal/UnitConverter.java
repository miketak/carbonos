package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.math.MathContext;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.stereotype.Component;

/**
 * A curated registry of measurement units and the pure, dimensional
 * conversions between them (litre&lt;-&gt;gallon, kWh&lt;-&gt;MWh&lt;-&gt;GJ, kg&lt;-&gt;tonne, ...).
 *
 * <p>Conversion factors are physical constants, so they live in reviewed code
 * rather than a runtime table. Two units convert only when they share a
 * {@link Dimension}; substance-specific conversions (gas m3 to kWh via
 * calorific value, volume to mass via density) are deliberately excluded — a
 * GHG accountant handles those by choosing a factor already in that unit.
 *
 * <p>Every unit is keyed by a normalized (lowercased, trimmed) string and by a
 * set of aliases, so {@code L}, {@code litre} and {@code litres} resolve to one
 * unit. Each seeded emission-factor unit must be registered here — a test
 * enforces it.
 */
@Component
public class UnitConverter {

	/** One registered unit: its canonical code, dimension, and size in the dimension's base unit. */
	public record UnitDef(String code, String label, Dimension dimension, BigDecimal toCanonical) {
	}

	private static final MathContext MC = MathContext.DECIMAL64;

	private final List<UnitDef> units;
	private final Map<String, UnitDef> byAlias;

	UnitConverter() {
		var defs = new LinkedHashMap<UnitDef, List<String>>();

		// ENERGY — canonical base: kWh
		put(defs, "kWh", "Kilowatt-hour", Dimension.ENERGY, "1", "kwh", "kwhr", "kilowatt-hour");
		put(defs, "MWh", "Megawatt-hour", Dimension.ENERGY, "1000", "mwh", "megawatt-hour");
		put(defs, "GWh", "Gigawatt-hour", Dimension.ENERGY, "1000000", "gwh", "gigawatt-hour");
		put(defs, "GJ", "Gigajoule", Dimension.ENERGY, "277.777778", "gj", "gigajoule");
		put(defs, "MJ", "Megajoule", Dimension.ENERGY, "0.277778", "mj", "megajoule");
		put(defs, "therm", "Therm", Dimension.ENERGY, "29.307107", "therms", "thm");

		// VOLUME — canonical base: m3
		put(defs, "m3", "Cubic metre", Dimension.VOLUME, "1", "m³", "cubic-metre", "cubic-meter", "cbm");
		put(defs, "litre", "Litre", Dimension.VOLUME, "0.001", "litres", "liter", "liters", "l");
		put(defs, "US-gallon", "US gallon", Dimension.VOLUME, "0.003785411784", "us-gallon", "usgal", "gallon-us",
				"gal-us");
		put(defs, "UK-gallon", "UK gallon", Dimension.VOLUME, "0.00454609", "uk-gallon", "ukgal", "gallon-uk", "gal-uk",
				"imperial-gallon");

		// MASS — canonical base: kg
		put(defs, "kg", "Kilogram", Dimension.MASS, "1", "kgs", "kilogram", "kilograms", "kilo");
		put(defs, "tonne", "Tonne", Dimension.MASS, "1000", "tonnes", "t", "metric-ton", "metric-tonne", "mt");
		put(defs, "g", "Gram", Dimension.MASS, "0.001", "gram", "grams");
		put(defs, "lb", "Pound", Dimension.MASS, "0.45359237", "lbs", "pound", "pounds");
		put(defs, "short-ton", "US short ton", Dimension.MASS, "907.18474", "us-ton", "ton-us");

		// DISTANCE — canonical base: km
		put(defs, "km", "Kilometre", Dimension.DISTANCE, "1", "kilometre", "kilometres", "kilometer", "kilometers");
		put(defs, "mile", "Mile", Dimension.DISTANCE, "1.609344", "miles", "mi");
		put(defs, "m", "Metre", Dimension.DISTANCE, "0.001", "metre", "metres", "meter", "meters");

		// PASSENGER_DISTANCE — canonical base: passenger-km
		put(defs, "passenger-km", "Passenger-kilometre", Dimension.PASSENGER_DISTANCE, "1", "passenger-kilometre",
				"pkm", "p-km", "passenger km");
		put(defs, "passenger-mile", "Passenger-mile", Dimension.PASSENGER_DISTANCE, "1.609344", "p-mile", "pmi",
				"passenger mile");

		this.units = List.copyOf(defs.keySet());
		var aliasMap = new LinkedHashMap<String, UnitDef>();
		for (var entry : defs.entrySet()) {
			var def = entry.getKey();
			aliasMap.put(normalize(def.code()), def);
			for (var alias : entry.getValue()) {
				aliasMap.put(normalize(alias), def);
			}
		}
		this.byAlias = Map.copyOf(aliasMap);
	}

	private static void put(Map<UnitDef, List<String>> defs, String code, String label, Dimension dimension,
			String toCanonical, String... aliases) {
		defs.put(new UnitDef(code, label, dimension, new BigDecimal(toCanonical)), List.of(aliases));
	}

	private static String normalize(String unit) {
		return unit == null ? "" : unit.strip().toLowerCase();
	}

	/** The registry in declaration order, for the UI's unit picker. */
	public List<UnitDef> all() {
		return units;
	}

	private Optional<UnitDef> lookup(String unit) {
		return Optional.ofNullable(byAlias.get(normalize(unit)));
	}

	/** The dimension of a unit, or empty if it is not a registered unit. */
	public Optional<Dimension> dimensionOf(String unit) {
		return lookup(unit).map(UnitDef::dimension);
	}

	/** Whether both units are registered and share a dimension (so a pure conversion exists). */
	public boolean canConvert(String from, String to) {
		var f = lookup(from);
		var t = lookup(to);
		return f.isPresent() && t.isPresent() && f.get().dimension() == t.get().dimension();
	}

	/** The multiplier taking a quantity in {@code from} to the equivalent in {@code to}. */
	public BigDecimal ratio(String from, String to) {
		var f = lookup(from).orElseThrow(() -> unknown(from));
		var t = lookup(to).orElseThrow(() -> unknown(to));
		if (f.dimension() != t.dimension()) {
			throw new IllegalArgumentException("Cannot convert " + f.code() + " (" + f.dimension() + ") to " + t.code()
					+ " (" + t.dimension() + ")");
		}
		return f.toCanonical().divide(t.toCanonical(), MC);
	}

	/** Converts a quantity from one unit to another of the same dimension. */
	public BigDecimal convert(BigDecimal quantity, String from, String to) {
		return quantity.multiply(ratio(from, to), MC);
	}

	private static IllegalArgumentException unknown(String unit) {
		return new IllegalArgumentException("Unknown unit: " + unit);
	}
}
