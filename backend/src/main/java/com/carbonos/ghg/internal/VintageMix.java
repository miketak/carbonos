package com.carbonos.ghg.internal;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.TreeMap;
import java.util.function.Function;

import com.carbonos.ghg.internal.Validation.Finding;
import com.carbonos.ghg.internal.Validation.Severity;

/**
 * ECO-23. Two editions of one publication in one run, or two data years of one
 * grid region, is a vintage mix the Corporate Standard's consistency principle
 * (chapter 1) and ISO 14064-1 9.3.1 make a verifier query. Both are WARNINGs
 * on the factor gate and not ERRORs: a fiscal year straddling an edition's
 * applies-from date, or a row only the newer edition carries, is a legitimate
 * reason, and the report names both editions beside every line so the reason
 * can be read against them.
 */
final class VintageMix {

	private VintageMix() {
	}

	/**
	 * The findings for the classified assignments in the boundary.
	 * {@code editionLookup} resolves edition ids to editions, so the family and
	 * the applies-from date can be named.
	 */
	static List<Finding> findings(List<InventoryAssignment> included,
			Function<Set<String>, List<FactorPackEdition>> editionLookup) {
		var findings = new ArrayList<Finding>();
		var recordsByEdition = new TreeMap<String, Integer>();
		var recordsByGridYear = new TreeMap<String, TreeMap<Integer, Integer>>();
		for (var assignment : included) {
			if (!assignment.isClassified()) {
				continue;
			}
			var chosen = assignment.getEmissionFactor();
			if (chosen.getSourceEdition() != null) {
				recordsByEdition.merge(chosen.getSourceEdition(), 1, Integer::sum);
			}
			if (chosen.getGridRegion() != null && chosen.getDataYear() != null) {
				recordsByGridYear.computeIfAbsent(chosen.getGridRegion(), k -> new TreeMap<>())
					.merge(chosen.getDataYear(), 1, Integer::sum);
			}
		}
		if (recordsByEdition.size() > 1) {
			var byFamily = new TreeMap<String, List<FactorPackEdition>>();
			for (var edition : editionLookup.apply(recordsByEdition.keySet())) {
				byFamily.computeIfAbsent(edition.getPackKey(), k -> new ArrayList<>()).add(edition);
			}
			for (var family : byFamily.entrySet()) {
				if (family.getValue().size() < 2) {
					continue;
				}
				var named = family.getValue()
					.stream()
					.sorted(Comparator.comparing(FactorPackEdition::getEditionId))
					.map(edition -> edition.getEditionId() + " (applies from " + edition.getAppliesFrom() + ", "
							+ records(recordsByEdition.get(edition.getEditionId())) + ")")
					.toList();
				findings.add(new Finding(Severity.WARNING, "'" + family.getKey() + "' is applied in "
						+ count(named.size()) + " editions: " + String.join(" and ", named)
						+ ". A final run is expected on one edition per publication. If the period straddles an "
						+ "applies-from date, or the newer edition alone carries a row, record why; the report names "
						+ "both editions and the lines on each."));
			}
		}
		for (var grid : recordsByGridYear.entrySet()) {
			if (grid.getValue().size() < 2) {
				continue;
			}
			var named = grid.getValue()
				.entrySet()
				.stream()
				.map(year -> year.getKey() + " (" + records(year.getValue()) + ")")
				.toList();
			findings.add(new Finding(Severity.WARNING, "Grid electricity for " + grid.getKey() + " is applied with "
					+ count(named.size()) + " data years: " + String.join(" and ", named)
					+ ". A run is expected on one data year per grid: choose the year that matches the reporting "
					+ "period, or record why another was used."));
		}
		return findings;
	}

	private static String count(int n) {
		return n == 2 ? "two" : n == 3 ? "three" : String.valueOf(n);
	}

	private static String records(int count) {
		return count + (count == 1 ? " record" : " records");
	}
}
