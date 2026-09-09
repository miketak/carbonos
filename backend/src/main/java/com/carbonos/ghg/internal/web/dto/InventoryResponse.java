package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.AssuranceLevel;
import com.carbonos.ghg.internal.ConsolidationApproach;
import com.carbonos.ghg.internal.GwpSet;
import com.carbonos.ghg.internal.Inventory;
import com.carbonos.ghg.internal.InventoryStatus;
import com.carbonos.ghg.internal.StraddleTreatment;

public record InventoryResponse(UUID id, UUID organizationId, String name, LocalDate periodStart,
		LocalDate periodEnd, String purpose, Integer baseYear, ConsolidationApproach consolidationApproach,
		GwpSet gwpSet, StraddleTreatment straddleTreatment, String periodLabel, String approvedBy,
		String publishedBy, AssuranceLevel assuranceLevel, String assuranceProvider, String assuranceStatement,
		String uncertaintyStatement,
		List<ActivityCategory> scope3Categories, String scope3ExclusionsRationale,
		List<Inventory.NotQuantified> scope3NotQuantified,
		Boolean residualMixAvailable, BigDecimal residualMixKgCo2ePerKwh, UUID finalRunId,
		InventoryStatus status, UUID supersededById, UUID copiedFromId, String correctionReason, Instant publishedAt,
		UUID currentBoundaryVersionId,
		Integer currentBoundaryVersionNo, Instant createdAt) {

	public static InventoryResponse from(Inventory inventory) {
		return new InventoryResponse(inventory.getId(), inventory.getOrganization().getId(), inventory.getName(),
				inventory.getPeriodStart(), inventory.getPeriodEnd(), inventory.getPurpose(),
				inventory.getBaseYear(), inventory.getConsolidationApproach(), inventory.getGwpSet(),
				inventory.getStraddleTreatment(), inventory.periodLabel(), inventory.getApprovedBy(),
				inventory.getPublishedBy(), inventory.getAssuranceLevel(), inventory.getAssuranceProvider(),
				inventory.getAssuranceStatement(), inventory.getUncertaintyStatement(), inventory.getScope3Categories(), inventory.getScope3ExclusionsRationale(),
				inventory.getScope3NotQuantified(),
				inventory.getResidualMixAvailable(), inventory.getResidualMixKgCo2ePerKwh(), inventory.getFinalRunId(), inventory.getStatus(), inventory.getSupersededById(),
				inventory.getCopiedFromId(), inventory.getCorrectionReason(),
				inventory.getPublishedAt(), inventory.getCurrentBoundaryVersionId(),
				inventory.getCurrentBoundaryVersionNo(), inventory.getCreatedAt());
	}
}
