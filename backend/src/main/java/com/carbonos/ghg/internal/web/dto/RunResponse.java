package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.ConsolidationApproach;
import com.carbonos.ghg.internal.GhgRun;

public record RunResponse(UUID id, String label, LocalDate periodStart, LocalDate periodEnd,
		ConsolidationApproach consolidationApproach, int activityCount, BigDecimal totalKgCo2e,
		BigDecimal scope1KgCo2e, BigDecimal scope2KgCo2e, BigDecimal scope3KgCo2e, Instant createdAt) {

	public static RunResponse from(GhgRun run) {
		return new RunResponse(run.getId(), run.getLabel(), run.getPeriodStart(), run.getPeriodEnd(),
				run.getConsolidationApproach(), run.getActivityCount(), run.getTotalKgCo2e(), run.getScope1KgCo2e(),
				run.getScope2KgCo2e(), run.getScope3KgCo2e(), run.getCreatedAt());
	}
}
