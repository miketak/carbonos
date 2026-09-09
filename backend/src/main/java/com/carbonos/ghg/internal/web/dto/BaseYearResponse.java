package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.BaseYear;
import com.carbonos.ghg.internal.BaseYearRecalculation;
import com.carbonos.ghg.internal.RecalculationStatus;
import com.carbonos.ghg.internal.RecalculationTrigger;
import com.carbonos.ghg.internal.StructuralChangeConvention;

public record BaseYearResponse(UUID id, UUID inventoryId, String inventoryName, int year,
		BigDecimal thresholdPercent, String reason, StructuralChangeConvention structuralChangeConvention,
		UUID baseRunId, List<RecalculationResponse> recalculations, Instant createdAt) {

	public record RecalculationResponse(UUID id, RecalculationTrigger triggerType, String reason,
			UUID triggeringInventoryId, UUID boundaryVersionId, Integer boundaryVersionNo, BigDecimal affectedPercent,
			BigDecimal cumulativePercent, boolean aboveThreshold, String raisedBy, RecalculationStatus status,
			UUID runId, String decisionNote, String decidedBy, Instant decidedAt, Instant createdAt,
			UUID comparisonRunId) {

		public static RecalculationResponse from(BaseYearRecalculation recalculation) {
			return new RecalculationResponse(recalculation.getId(), recalculation.getTriggerType(),
					recalculation.getReason(), recalculation.getTriggeringInventoryId(),
					recalculation.getBoundaryVersionId(), recalculation.getBoundaryVersionNo(),
					recalculation.getAffectedPercent(), recalculation.getCumulativePercent(),
					recalculation.isAboveThreshold(), recalculation.getRaisedBy(), recalculation.getStatus(),
					recalculation.getRunId(), recalculation.getDecisionNote(), recalculation.getDecidedBy(),
					recalculation.getDecidedAt(), recalculation.getCreatedAt(), recalculation.getComparisonRunId());
		}
	}

	public static BaseYearResponse from(BaseYear baseYear) {
		var inventory = baseYear.getInventory();
		return new BaseYearResponse(baseYear.getId(), inventory.getId(), inventory.getName(), baseYear.year(),
				baseYear.getThresholdPercent(), baseYear.getReason(), baseYear.getStructuralChangeConvention(),
				inventory.getFinalRunId(),
				baseYear.getRecalculations().stream().map(RecalculationResponse::from).toList(),
				baseYear.getCreatedAt());
	}
}
