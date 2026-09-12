package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityReadiness;
import com.carbonos.ghg.internal.ActivityRecord;
import com.carbonos.ghg.internal.ActivityStatus;
import com.carbonos.ghg.internal.DataQuality;
import com.carbonos.ghg.internal.DataQualityTier;
import com.carbonos.ghg.internal.GhgService;

/**
 * An organizational fact: no scope, category, or factor; inventories decide
 * those. Quantity, unit and period are null only on a draft (spec 04.6).
 */
public record ActivityResponse(UUID id, int recordNo, String recordRef, boolean draft, ActivityStatus status,
		List<ActivityReadiness.Issue> issues, UUID facilityId, String facilityName, UUID streamId, String streamName,
		String activityType, BigDecimal quantity, String unit, LocalDate periodStart, LocalDate periodEnd,
		String dataSource, String evidenceRef, DataQuality dataQuality, String note, int dataQualityTier,
		String dataQualityTierLabel, BigDecimal uncertaintyPercent, boolean removed, Instant removedAt,
		String removedBy, String removeReason, long evidenceCount, long revisionCount, UUID importBatchId,
		Integer importRow, Instant createdAt) {

	public static ActivityResponse from(GhgService.ActivitySummary summary) {
		return from(summary.activity(), summary.evidenceCount(), summary.revisionCount(), summary.readiness());
	}

	public static ActivityResponse from(ActivityRecord activity, long evidenceCount, long revisionCount,
			ActivityReadiness readiness) {
		var stream = activity.getStream();
		return new ActivityResponse(activity.getId(), activity.getRecordNo(), activity.getRecordRef(),
				activity.isDraft(), readiness.status(), readiness.issues(), activity.getFacility().getId(),
				activity.getFacility().getName(), stream == null ? null : stream.getId(),
				stream == null ? null : stream.getName(), activity.getActivityType(), activity.getQuantity(),
				activity.getUnit(), activity.getPeriodStart(), activity.getPeriodEnd(), activity.getDataSource(),
				activity.getEvidenceRef(), activity.getDataQuality(), activity.getNote(), activity.getDataQualityTier(),
				DataQualityTier.label(activity.getDataQualityTier()), activity.getUncertaintyPercent(),
				activity.isDeleted(), activity.getDeletedAt(), activity.getDeletedBy(), activity.getDeleteReason(),
				evidenceCount, revisionCount, activity.getImportBatchId(), activity.getImportRow(),
				activity.getCreatedAt());
	}
}
