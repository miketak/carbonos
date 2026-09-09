package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.ExclusionReason;
import com.carbonos.ghg.internal.GhgRunExclusion;

/** An assignment a run left out, with the activity's facts and the documented reason (spec 05.1). */
public record RunExclusionResponse(UUID id, UUID activityId, String facilityName, String activityType,
		BigDecimal quantity, String unit, LocalDate periodStart, LocalDate periodEnd, ExclusionReason exclusionReason,
		String exclusionDetail) {

	public static RunExclusionResponse from(GhgRunExclusion exclusion) {
		return new RunExclusionResponse(exclusion.getId(), exclusion.getActivityId(), exclusion.getFacilityName(),
				exclusion.getActivityType(), exclusion.getQuantity(), exclusion.getUnit(),
				exclusion.getPeriodStart(), exclusion.getPeriodEnd(), exclusion.getExclusionReason(),
				exclusion.getExclusionDetail());
	}
}
