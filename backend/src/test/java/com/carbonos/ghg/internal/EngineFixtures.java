package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.carbonos.ghg.internal.EngineVectors.CustomUnit;
import com.carbonos.ghg.internal.EngineVectors.Factor;
import com.carbonos.ghg.internal.EngineVectors.Instrument;
import com.carbonos.ghg.internal.EngineVectors.Period;
import com.carbonos.ghg.internal.EngineVectors.Record;

/**
 * Builds the entities a vector names with their package-private constructors:
 * no Spring, no database, the ids random. One organization, one entity, one
 * facility per name, so a line's facility is what the vector called it.
 */
final class EngineFixtures {

	final Organization organization = new Organization("Adansi Foods Ltd", UUID.randomUUID(), 1);

	final LegalEntity entity = new LegalEntity(organization, "Adansi Foods Ltd", RelationshipType.SUBSIDIARY,
			new BigDecimal("100.00"), new BigDecimal("100.00"), true, true, null, true);

	private final Map<String, Facility> facilities = new LinkedHashMap<>();

	private final Map<String, EmissionFactor> factors = new LinkedHashMap<>();

	Facility facility(String name) {
		return facilities.computeIfAbsent(name, n -> new Facility(organization, entity, n, "Kumasi, Ghana", "GH"));
	}

	static LocalDate date(String iso) {
		return iso == null ? null : LocalDate.parse(iso);
	}

	static BigDecimal decimal(String value) {
		return EngineVectors.decimal(value);
	}

	private static BigDecimal zero(String value) {
		return value == null ? BigDecimal.ZERO : new BigDecimal(value);
	}

	Inventory inventory(String approach, String gwpSet, Period period) {
		return new Inventory(organization, "FY" + date(period.start()).getYear(), date(period.start()),
				date(period.end()), null, null, ConsolidationApproach.valueOf(approach), GwpSet.valueOf(gwpSet),
				StraddleTreatment.PRO_RATE);
	}

	/** The factor the vector file defines under the key, built once per fixture so a lineage key is stable. */
	EmissionFactor factor(String key) {
		return factors.computeIfAbsent(key, k -> {
			var spec = EngineVectors.load().factors().get(k);
			if (spec == null) {
				throw new IllegalArgumentException("no factor '" + k + "' in the vector file");
			}
			return factor(spec);
		});
	}

	EmissionFactor factor(Factor spec) {
		var gases = new EmissionFactor.Gases(zero(spec.co2()), zero(spec.ch4()), Boolean.TRUE.equals(spec.ch4Fossil()),
				zero(spec.n2o()), zero(spec.hfcsKg()), BigDecimal.ZERO, zero(spec.sf6()), BigDecimal.ZERO,
				zero(spec.biogenicCo2()));
		var provenance = new EmissionFactor.Provenance("Test vectors", null, null, null, null, null, null);
		var factor = new EmissionFactor(organization.getId(), spec.name(), Scope.valueOf(spec.scope()),
				ActivityCategory.valueOf(spec.category()), false, spec.unit(), new BigDecimal(spec.kgCo2ePerUnit()),
				gases, spec.blendComposition(), spec.blendGwpSource(), provenance, true, null, null);
		if (spec.reportingBasis() != null) {
			factor.setReportingBasis(ReportingBasis.valueOf(spec.reportingBasis()));
		}
		return factor;
	}

	ActivityRecord activity(Record spec) {
		return new ActivityRecord(spec.ref(), false, facility(spec.facility()), null, spec.activityType(),
				new BigDecimal(spec.quantity()), spec.unit(), date(spec.period().start()), date(spec.period().end()),
				"Test vectors", null, "REF-" + spec.ref(), DataQuality.MEASURED, null, null, null);
	}

	Density density(EngineVectors.Density spec) {
		return spec == null ? null
				: new Density(spec.typical() ? null : organization.getId(), spec.material(),
						new BigDecimal(spec.kgPerLitre()), "Test vectors", null);
	}

	/** The record classified as the vector says: the factor's own scope and category unless it names others. */
	InventoryAssignment assignment(Inventory inventory, Record spec) {
		var factor = factor(spec.factor());
		var assignment = new InventoryAssignment(inventory, activity(spec));
		assignment.classify(factor, factor.getDefaultScope(), factor.getDefaultCategory(), null, null, false, null,
				density(spec.density()));
		return assignment;
	}

	MarketFactor instrument(Inventory inventory, Instrument spec) {
		return new MarketFactor(inventory, facility(spec.facility()), MarketInstrument.valueOf(spec.type()),
				new BigDecimal(spec.kgCo2ePerKwh()), "Test vectors",
				spec.meetsQualityCriteria() == null || spec.meetsQualityCriteria(), null,
				new MarketFactor.Coverage(new BigDecimal(spec.coveredKwh()), date(spec.periodStart()),
						date(spec.periodEnd())));
	}

	UnitConverter.Scoped units(List<CustomUnit> custom) {
		var units = new ArrayList<com.carbonos.ghg.internal.CustomUnit>();
		for (var c : custom == null ? List.<CustomUnit>of() : custom) {
			units.add(new com.carbonos.ghg.internal.CustomUnit(organization.getId(), c.code(), c.code(), c.base(),
					new BigDecimal(c.factor())));
		}
		return new UnitConverter().with(units);
	}

	static BoundaryVersion.Coverage coverage(EngineVectors.Coverage spec) {
		return new BoundaryVersion.Coverage(new BigDecimal(spec.share()), spec.coveredDays(), spec.totalDays());
	}

	/** A frozen boundary of one entity holding the facility, with the membership window the vector gives. */
	BoundaryVersion boundary(Inventory inventory, Facility facility, LocalDate windowFrom, LocalDate windowTo) {
		var treatment = new BoundaryTreatment(inventory, entity);
		treatment.update(RelationshipType.SUBSIDIARY, new BigDecimal("100.00"), true, true, windowFrom, windowTo);
		treatment.includeFacility(facility);
		return new BoundaryVersion(inventory, 1, List.of(treatment), t -> EntityChain.DIRECT, List.of(), null, "test");
	}
}
