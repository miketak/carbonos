package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.ConsolidationApproach;
import com.carbonos.ghg.internal.GhgRun;
import com.carbonos.ghg.internal.GwpSet;

public record RunResponse(UUID id, UUID inventoryId, String label, LocalDate periodStart, LocalDate periodEnd,
		ConsolidationApproach consolidationApproach, GwpSet gwpSet, int activityCount, BigDecimal totalKgCo2e,
		BigDecimal scope1KgCo2e, BigDecimal scope2KgCo2e, BigDecimal scope3KgCo2e,
		BigDecimal scope2MarketBasedKgCo2e, ByGas byGas, BigDecimal biogenicCo2Kg, boolean isFinal,
		UUID boundaryVersionId, Integer boundaryVersionNo, Instant createdAt) {

	/** Totals per gas: kg of each gas, and for the HFC and PFC blends also the kg CO2e their source applied. */
	public record ByGas(BigDecimal co2Kg, BigDecimal ch4Kg, BigDecimal n2oKg, BigDecimal hfcsKg, BigDecimal pfcsKg,
			BigDecimal hfcsKgCo2e, BigDecimal pfcsKgCo2e, BigDecimal sf6Kg, BigDecimal nf3Kg) {
	}

	public static RunResponse from(GhgRun run) {
		var inventory = run.getInventory();
		return new RunResponse(run.getId(), inventory.getId(), run.getLabel(), run.getPeriodStart(),
				run.getPeriodEnd(), run.getConsolidationApproach(), run.getGwpSet(), run.getActivityCount(),
				run.getTotalKgCo2e(), run.getScope1KgCo2e(), run.getScope2KgCo2e(), run.getScope3KgCo2e(),
				run.getScope2MarketBasedKgCo2e(),
				new ByGas(run.getCo2Kg(), run.getCh4Kg(), run.getN2oKg(), run.getHfcsKg(), run.getPfcsKg(),
						run.getHfcsKgCo2e(), run.getPfcsKgCo2e(), run.getSf6Kg(), run.getNf3Kg()),
				run.getBiogenicCo2Kg(), run.getId().equals(inventory.getFinalRunId()), run.getBoundaryVersionId(),
				run.getBoundaryVersionNo(), run.getCreatedAt());
	}
}
