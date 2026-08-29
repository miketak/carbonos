package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.ActivityRecord;
import com.carbonos.ghg.internal.Scope;

public record ActivityResponse(UUID id, UUID facilityId, String facilityName, UUID emissionFactorId,
		String factorName, Scope scope, ActivityCategory category, BigDecimal quantity, String unit,
		LocalDate activityDate, String note, BigDecimal unweightedKgCo2e) {

	public static ActivityResponse from(ActivityRecord activity) {
		var factor = activity.getEmissionFactor();
		var unweighted = activity.getQuantity().multiply(factor.getKgCo2ePerUnit()).setScale(3, RoundingMode.HALF_UP);
		return new ActivityResponse(activity.getId(), activity.getFacility().getId(),
				activity.getFacility().getName(), factor.getId(), factor.getName(), factor.getScope(),
				factor.getCategory(), activity.getQuantity(), factor.getUnit(), activity.getActivityDate(),
				activity.getNote(), unweighted);
	}
}
