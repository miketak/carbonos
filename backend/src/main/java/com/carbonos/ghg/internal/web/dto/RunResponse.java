package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.ConsolidationApproach;
import com.carbonos.ghg.internal.GhgRun;
import com.carbonos.ghg.internal.GwpSet;
import com.carbonos.ghg.internal.Scope2MarketBasis;

public record RunResponse(UUID id, UUID inventoryId, int runNo, String label, LocalDate periodStart,
		LocalDate periodEnd,
		ConsolidationApproach consolidationApproach, GwpSet gwpSet, int activityCount, BigDecimal totalKgCo2e,
		BigDecimal scope1KgCo2e, BigDecimal scope2KgCo2e, BigDecimal scope3KgCo2e,
		BigDecimal scope2MarketBasedKgCo2e, Scope2MarketBasis scope2MarketBasis, ByGas byGas,
		BigDecimal biogenicCo2Kg, boolean isFinal, boolean voided, Instant voidedAt, String voidedBy,
		String voidReason, UUID boundaryVersionId, Integer boundaryVersionNo, String createdBy, Instant createdAt) {

	/**
	 * Totals per gas: kg of each gas, the fossil part of the methane, for the
	 * HFC and PFC blends also their kg CO2e under the run's set, and the CO2e
	 * of the lines whose factor published no gas split (spec 07.7).
	 */
	public record ByGas(BigDecimal co2Kg, BigDecimal ch4Kg, BigDecimal ch4FossilKg, BigDecimal n2oKg,
			BigDecimal hfcsKg, BigDecimal pfcsKg, BigDecimal hfcsKgCo2e, BigDecimal pfcsKgCo2e, BigDecimal sf6Kg,
			BigDecimal nf3Kg, BigDecimal co2eUnsplitKg) {
	}

	public static RunResponse from(GhgRun run) {
		var inventory = run.getInventory();
		return new RunResponse(run.getId(), inventory.getId(), run.getRunNo(), run.getLabel(), run.getPeriodStart(),
				run.getPeriodEnd(), run.getConsolidationApproach(), run.getGwpSet(), run.getActivityCount(),
				run.getTotalKgCo2e(), run.getScope1KgCo2e(), run.getScope2KgCo2e(), run.getScope3KgCo2e(),
				run.getScope2MarketBasedKgCo2e(), run.getScope2MarketBasis(),
				new ByGas(run.getCo2Kg(), run.getCh4Kg(), run.getCh4FossilKg(), run.getN2oKg(), run.getHfcsKg(),
						run.getPfcsKg(),
						run.getHfcsKgCo2e(), run.getPfcsKgCo2e(), run.getSf6Kg(), run.getNf3Kg(), run.co2eUnsplitKg()),
				run.getBiogenicCo2Kg(), run.getId().equals(inventory.getFinalRunId()), run.isVoided(),
				run.getVoidedAt(), run.getVoidedBy(), run.getVoidReason(), run.getBoundaryVersionId(),
				run.getBoundaryVersionNo(), run.getCreatedBy(), run.getCreatedAt());
	}
}
