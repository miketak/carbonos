package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityRecord;
import com.carbonos.ghg.internal.DataQuality;

/** An organizational fact: no scope, category, or factor — inventories decide those. */
public record ActivityResponse(UUID id, UUID facilityId, String facilityName, UUID streamId, String streamName,
		String activityType,
		BigDecimal quantity, String unit, LocalDate periodStart, LocalDate periodEnd, String dataSource,
		String evidenceRef,
		DataQuality dataQuality, String note) {

	public static ActivityResponse from(ActivityRecord activity) {
		var stream = activity.getStream();
		return new ActivityResponse(activity.getId(), activity.getFacility().getId(),
				activity.getFacility().getName(), stream == null ? null : stream.getId(),
				stream == null ? null : stream.getName(), activity.getActivityType(), activity.getQuantity(),
				activity.getUnit(), activity.getPeriodStart(), activity.getPeriodEnd(), activity.getDataSource(),
				activity.getEvidenceRef(),
				activity.getDataQuality(), activity.getNote());
	}
}
