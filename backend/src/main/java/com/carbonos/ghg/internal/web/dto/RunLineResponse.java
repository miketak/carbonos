package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.GhgRunLine;
import com.carbonos.ghg.internal.Scope;

public record RunLineResponse(UUID id, UUID activityId, String facilityName, String factorName, Scope scope,
		ActivityCategory category, BigDecimal quantity, String unit, BigDecimal kgCo2ePerUnit, BigDecimal weight,
		BigDecimal kgCo2e) {

	public static RunLineResponse from(GhgRunLine line) {
		return new RunLineResponse(line.getId(), line.getActivityId(), line.getFacilityName(), line.getFactorName(),
				line.getScope(), line.getCategory(), line.getQuantity(), line.getUnit(), line.getKgCo2ePerUnit(),
				line.getWeight(), line.getKgCo2e());
	}
}
