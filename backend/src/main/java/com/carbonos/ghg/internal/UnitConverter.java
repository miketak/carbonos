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

	/**
	 * One unit: its canonical code, dimension, size in the dimension's base
	 * unit, and, for a custom unit (spec 02.2), the definition it prints.
	 */
	public record UnitDef(String code, String label, Dimension dimension, BigDecimal toCanonical, String definition) {
		public UnitDef(String code, String label, Dimension dimension, BigDecimal toCanonical) {
			this(code, label, dimension, toCanonical, null);
		}

		public boolean isCustom() {
			return definition != null;
		}
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
		put(defs, "mmBtu", "Million BTU", Dimension.ENERGY, "293.07107", "mmbtu", "million btu", "mmbtu (hhv)");

		// VOLUME — canonical base: m3
		put(defs, "m3", "Cubic metre", Dimension.VOLUME, "1", "m³", "cubic-metre", "cubic-meter", "cbm");
		put(defs, "litre", "Litre", Dimension.VOLUME, "0.001", "litres", "liter", "liters", "l");
		put(defs, "US-gallon", "US gallon", Dimension.VOLUME, "0.003785411784", "us-gallon", "usgal", "gallon-us",
				"gal-us");
		put(defs, "UK-gallon", "UK gallon", Dimension.VOLUME, "0.00454609", "uk-gallon", "ukgal", "gallon-uk", "gal-uk",
				"imperial-gallon");
		put(defs, "scf", "Standard cubic foot", Dimension.VOLUME, "0.028316846592", "standard cubic foot", "ft3",
				"cubic-foot");
		// spec 02.4: the IPCC flaring defaults are published per 10^3 m3 and per 10^6 m3 of throughput;
		// a factor per thousand cubic metres keeps components a per-m3 row would round away
		put(defs, "1000m3", "Thousand cubic metres", Dimension.VOLUME, "1000", "1000 m3", "thousand-m3", "10^3 m3",
				"e3m3");

		// MASS — canonical base: kg
		put(defs, "kg", "Kilogram", Dimension.MASS, "1", "kgs", "kilogram", "kilograms", "kilo");
		put(defs, "tonne", "Tonne", Dimension.MASS, "1000", "tonnes", "t", "metric-ton", "metric-tonne", "mt");
		put(defs, "g", "Gram", Dimension.MASS, "0.001", "gram", "grams");
		put(defs, "lb", "Pound", Dimension.MASS, "0.45359237", "lbs", "pound", "pounds");
		put(defs, "short-ton", "US short ton", Dimension.MASS, "907.18474", "us-ton", "ton-us");

		// DISTANCE — canonical base: km
		put(defs, "km", "Kilometre", Dimension.DISTANCE, "1", "kilometre", "kilometres", "kilometer", "kilometers",
				"vehicle-km", "vehicle.km", "vkm");
		put(defs, "mile", "Mile", Dimension.DISTANCE, "1.609344", "miles", "mi", "vehicle-mile", "vehicle-miles");
		put(defs, "m", "Metre", Dimension.DISTANCE, "0.001", "metre", "metres", "meter", "meters");

		// PASSENGER_DISTANCE — canonical base: passenger-km
		put(defs, "passenger-km", "Passenger-kilometre", Dimension.PASSENGER_DISTANCE, "1", "passenger-kilometre",
				"pkm", "p-km", "passenger km");
		put(defs, "passenger-mile", "Passenger-mile", Dimension.PASSENGER_DISTANCE, "1.609344", "p-mile", "pmi",
				"passenger mile");

		// FREIGHT — canonical base: tonne-km
		put(defs, "tonne-km", "Tonne-kilometre", Dimension.FREIGHT, "1", "tonne.km", "tkm", "t-km", "tonne km");
		put(defs, "short-ton-mile", "Short ton-mile", Dimension.FREIGHT, "1.459972", "ton-mile", "short ton-mile",
				"ton-miles");

		// AREA, canonical base hectare (land clearing, spec 02.4)
		put(defs, "hectare", "Hectare", Dimension.AREA, "1", "hectares", "ha");
		put(defs, "km2", "Square kilometre", Dimension.AREA, "100", "square-kilometre", "sq-km");
		put(defs, "m2", "Square metre", Dimension.AREA, "0.0001", "square-metre", "sqm");

		// COUNT — things counted, not measured: hotel nights
		put(defs, "room-night", "Room-night", Dimension.COUNT, "1", "room per night", "room night", "room-nights",
				"nights");

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

	/**
	 * The registry plus an organization's custom units (spec 02.2), each a
	 * multiple of a registered unit. A custom code shadows nothing: a code
	 * already in the registry is refused when the unit is defined.
	 */
	public Scoped with(List<CustomUnit> customUnits) {
		var extra = new LinkedHashMap<String, UnitDef>();
		var defs = new java.util.ArrayList<UnitDef>(units);
		for (var custom : customUnits) {
			var base = lookup(custom.getBaseUnit());
			if (base.isEmpty()) {
				continue;
			}
			var def = new UnitDef(custom.getCode(), custom.getLabel(), base.get().dimension(),
					base.get().toCanonical().multiply(custom.getFactor(), MC), custom.definition());
			extra.put(normalize(custom.getCode()), def);
			defs.add(def);
		}
		return new Scoped(List.copyOf(defs), Map.copyOf(extra));
	}

	/** The dimension of a registered base unit, for defining a custom unit. */
	public Optional<UnitDef> registered(String unit) {
		return lookup(unit);
	}

	/** The registry seen through one organization's custom units. */
	public final class Scoped {

		private final List<UnitDef> all;
		private final Map<String, UnitDef> custom;

		private Scoped(List<UnitDef> all, Map<String, UnitDef> custom) {
			this.all = all;
			this.custom = custom;
		}

		public List<UnitDef> all() {
			return all;
		}

		public Optional<UnitDef> find(String unit) {
			var own = custom.get(normalize(unit));
			return own != null ? Optional.of(own) : lookup(unit);
		}

		public Optional<Dimension> dimensionOf(String unit) {
			return find(unit).map(UnitDef::dimension);
		}

		public boolean canConvert(String from, String to) {
			var f = find(from);
			var t = find(to);
			return f.isPresent() && t.isPresent() && f.get().dimension() == t.get().dimension();
		}

		public BigDecimal ratio(String from, String to) {
			var f = find(from).orElseThrow(() -> unknown(from));
			var t = find(to).orElseThrow(() -> unknown(to));
			if (f.dimension() != t.dimension()) {
				throw new IllegalArgumentException("Cannot convert " + f.code() + " (" + f.dimension() + ") to "
						+ t.code() + " (" + t.dimension() + ")");
			}
			return f.toCanonical().divide(t.toCanonical(), MC);
		}

		public BigDecimal convert(BigDecimal quantity, String from, String to) {
			return quantity.multiply(ratio(from, to), MC);
		}

		/** The custom-unit definitions a conversion between two units relies on, for the line's note. */
		public String definitionsBehind(String from, String to) {
			var parts = new java.util.ArrayList<String>();
			find(from).filter(UnitDef::isCustom).map(UnitDef::definition).ifPresent(parts::add);
			find(to).filter(UnitDef::isCustom).map(UnitDef::definition).ifPresent(parts::add);
			return parts.isEmpty() ? null : String.join("; ", parts);
		}
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
