package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.util.Map;

/**
 * IPCC 100-year global warming potentials (spec 07.1, 07.2). Factors record
 * kg of each single-species gas per unit; the reporting set turns them into
 * CO2e. An HFC or PFC blend with a recorded composition is converted from its
 * component species with the same set; a blend without one keeps the CO2e
 * its source applied.
 *
 * <p>Sources: IPCC AR5 WG1 Table 8.A.1 (no climate-carbon feedback); IPCC AR6
 * WG1 Table 7.SM.7, with fossil methane from Table 7.15 (29.8, which counts
 * the CO2 the fossil carbon oxidizes into). AR5 publishes one methane value.
 */
public enum GwpSet {

	AR5(new BigDecimal("28"), new BigDecimal("28"), new BigDecimal("265"), new BigDecimal("23500"),
			new BigDecimal("16100"),
			Map.ofEntries(Map.entry("HFC-23", "12400"), Map.entry("HFC-32", "677"), Map.entry("HFC-41", "116"),
					Map.entry("HFC-125", "3170"), Map.entry("HFC-134a", "1300"), Map.entry("HFC-143a", "4800"),
					Map.entry("HFC-152a", "138"), Map.entry("HFC-227ea", "3350"), Map.entry("HFC-236fa", "8060"),
					Map.entry("HFC-245fa", "858"), Map.entry("HFC-365mfc", "804"), Map.entry("HFC-43-10mee", "1650"),
					Map.entry("PFC-14", "6630"), Map.entry("PFC-116", "11100"), Map.entry("PFC-218", "8900"),
					Map.entry("PFC-318", "9540"), Map.entry("PFC-3-1-10", "9200"))),
	AR6(new BigDecimal("29.8"), new BigDecimal("27.9"), new BigDecimal("273"), new BigDecimal("25200"),
			new BigDecimal("17400"),
			Map.ofEntries(Map.entry("HFC-23", "14600"), Map.entry("HFC-32", "771"), Map.entry("HFC-41", "135"),
					Map.entry("HFC-125", "3740"), Map.entry("HFC-134a", "1530"), Map.entry("HFC-143a", "5810"),
					Map.entry("HFC-152a", "164"), Map.entry("HFC-227ea", "3600"), Map.entry("HFC-236fa", "8690"),
					Map.entry("HFC-245fa", "962"), Map.entry("HFC-365mfc", "914"), Map.entry("HFC-43-10mee", "1600"),
					Map.entry("PFC-14", "7380"), Map.entry("PFC-116", "12400"), Map.entry("PFC-218", "9290"),
					Map.entry("PFC-318", "10200"), Map.entry("PFC-3-1-10", "10000")));

	private final BigDecimal ch4Fossil;
	private final BigDecimal ch4NonFossil;
	private final BigDecimal n2o;
	private final BigDecimal sf6;
	private final BigDecimal nf3;
	private final Map<String, BigDecimal> species;

	GwpSet(BigDecimal ch4Fossil, BigDecimal ch4NonFossil, BigDecimal n2o, BigDecimal sf6, BigDecimal nf3,
			Map<String, String> species) {
		this.ch4Fossil = ch4Fossil;
		this.ch4NonFossil = ch4NonFossil;
		this.n2o = n2o;
		this.sf6 = sf6;
		this.nf3 = nf3;
		var parsed = new java.util.HashMap<String, BigDecimal>();
		species.forEach((name, value) -> parsed.put(name.toUpperCase(java.util.Locale.ROOT), new BigDecimal(value)));
		this.species = Map.copyOf(parsed);
	}

	/** The methane potential: fossil-origin methane (fuel combustion, venting) or biogenic (landfill, biomass). */
	public BigDecimal ch4(boolean fossil) {
		return fossil ? ch4Fossil : ch4NonFossil;
	}

	public BigDecimal n2o() {
		return n2o;
	}

	public BigDecimal sf6() {
		return sf6;
	}

	public BigDecimal nf3() {
		return nf3;
	}

	/** The potential of one HFC or PFC species, by its common name (for example "HFC-32"), or null if unknown. */
	public BigDecimal species(String name) {
		return name == null ? null : species.get(name.trim().toUpperCase(java.util.Locale.ROOT));
	}

	/** Whether this set knows the species, so a blend composition can be converted with it. */
	public boolean knows(String name) {
		return species(name) != null;
	}
}
