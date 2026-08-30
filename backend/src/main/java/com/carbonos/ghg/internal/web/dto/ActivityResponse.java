package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityRecord;
import com.carbonos.ghg.internal.DataQuality;

/** An organizational fact: no scope, category, or factor — inventories decide those. */
public record ActivityResponse(UUID id, UUID facilityId, String facilityName, String activityType,
		BigDecimal quantity, String unit, LocalDate activityDate, String dataSource, String evidenceRef,
		DataQuality dataQuality, String note) {

	public static ActivityResponse from(ActivityRecord activity) {
		return new ActivityResponse(activity.getId(), activity.getFacility().getId(),
				activity.getFacility().getName(), activity.getActivityType(), activity.getQuantity(),
				activity.getUnit(), activity.getActivityDate(), activity.getDataSource(), activity.getEvidenceRef(),
				activity.getDataQuality(), activity.getNote());
	}
}
