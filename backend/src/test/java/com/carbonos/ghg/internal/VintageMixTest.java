package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.carbonos.ghg.internal.Validation.Severity;

/**
 * ECO-23: a run on two editions of one publication, or two data years of one
 * grid, is warned about by name; one edition per publication is silent.
 */
class VintageMixTest {

	private final EngineFixtures fixtures = new EngineFixtures();

	private final Inventory inventory = fixtures.inventory("OPERATIONAL_CONTROL", "AR5",
			new EngineVectors.Period("2025-01-01", "2025-12-31"));

	private FactorPackEdition edition(String id, String family, LocalDate appliesFrom) {
		return new FactorPackEdition(id, family,
				new FactorPackEdition.Facts("A test edition", "A publication", "https://example.test", 2025, "AR5",
						"OGL", "2026-09-08", null, appliesFrom),
				UUID.randomUUID(), "curator@example.test", "A curator");
	}

	private EmissionFactor factor(String name, String edition, String gridRegion, Integer dataYear) {
		var gases = new EmissionFactor.Gases(new BigDecimal("2.5"), BigDecimal.ZERO, true, BigDecimal.ZERO,
				BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
		var provenance = new EmissionFactor.Provenance("A publication", null, 2025, dataYear, null, null, null);
		var factor = new EmissionFactor(fixtures.organization.getId(), name, Scope.SCOPE_1,
				ActivityCategory.STATIONARY_COMBUSTION, false, "litre", new BigDecimal("2.5"), gases, null, null,
				provenance, true, edition, null);
		factor.setSourceEdition(edition);
		factor.setGridRegion(gridRegion);
		return factor;
	}

	private InventoryAssignment classified(EmissionFactor factor) {
		var activity = new ActivityRecord(1, false, fixtures.facility("Plant"), null, "Diesel", new BigDecimal("10"),
				"litre", LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31), "A test", null, "REF-1",
				DataQuality.MEASURED, null, null, null);
		var assignment = new InventoryAssignment(inventory, activity);
		assignment.classify(factor, factor.getDefaultScope(), factor.getDefaultCategory(), null, null, false, null,
				null);
		return assignment;
	}

	@Test
	void twoEditionsOfOnePublicationAreNamedWithTheirDatesAndRecordCounts() {
		var older = factor("Diesel", "defra-2025", null, null);
		var newer = factor("Petrol", "defra-2026", null, null);
		var included = List.of(classified(older), classified(older), classified(newer));

		var findings = VintageMix.findings(included, ids -> List.of(
				edition("defra-2025", "defra", LocalDate.of(2025, 1, 1)),
				edition("defra-2026", "defra", LocalDate.of(2026, 1, 1))));

		assertThat(findings).hasSize(1);
		assertThat(findings.getFirst().severity()).isEqualTo(Severity.WARNING);
		assertThat(findings.getFirst().message())
			.startsWith("'defra' is applied in two editions: defra-2025 (applies from 2025-01-01, 2 records) and "
					+ "defra-2026 (applies from 2026-01-01, 1 record).")
			.contains("one edition per publication");
	}

	@Test
	void editionsOfDifferentPublicationsAreNotAMix() {
		var included = List.of(classified(factor("Diesel", "defra-2026", null, null)),
				classified(factor("Grid", "ghana", null, null)));

		var findings = VintageMix.findings(included, ids -> List.of(
				edition("defra-2026", "defra", LocalDate.of(2026, 1, 1)),
				edition("ghana", "ghana", LocalDate.of(2025, 1, 1))));

		assertThat(findings).isEmpty();
	}

	@Test
	void twoDataYearsOfOneGridAreNamed() {
		var included = List.of(classified(factor("Grid 2023", "ghana", "GHA", 2023)),
				classified(factor("Grid 2024", "ghana", "GHA", 2024)),
				classified(factor("Grid 2024", "ghana", "GHA", 2024)));

		var findings = VintageMix.findings(included, ids -> List.of(edition("ghana", "ghana", LocalDate.of(2025, 1, 1))));

		assertThat(findings).hasSize(1);
		assertThat(findings.getFirst().message())
			.startsWith("Grid electricity for GHA is applied with two data years: 2023 (1 record) and 2024 (2 records).");
	}

	@Test
	void aHandEnteredFactorNamesNoEditionAndIsLeftOut() {
		var included = List.of(classified(factor("Diesel", "defra-2026", null, null)),
				classified(factor("Supplier factor", null, null, null)));

		var findings = VintageMix.findings(included, ids -> List.of(edition("defra-2026", "defra", LocalDate.of(2026, 1, 1))));

		assertThat(findings).isEmpty();
	}
}
