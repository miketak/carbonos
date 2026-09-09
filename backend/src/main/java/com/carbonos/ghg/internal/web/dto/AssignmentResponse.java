package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.DataQuality;
import com.carbonos.ghg.internal.ExclusionReason;
import com.carbonos.ghg.internal.InventoryAssignment;
import com.carbonos.ghg.internal.LeaseType;
import com.carbonos.ghg.internal.Scope;
import com.carbonos.ghg.internal.StreamKind;
import java.util.List;

/** The fact (activity fields) plus this inventory's accounting decision about it. */
public record AssignmentResponse(UUID id, UUID activityId, UUID facilityId, String facilityName,
		UUID streamId, String streamName, StreamKind streamKind, Boolean contractorOperated, Scope defaultScope,
		ActivityCategory defaultCategory, List<ActivityCategory> allowedCategories, String activityType, BigDecimal quantity, String unit, LocalDate periodStart, LocalDate periodEnd,
		DataQuality dataQuality,
		String evidenceRef, boolean included, ExclusionReason exclusionReason, String exclusionDetail,
		boolean classified, Scope scope, ActivityCategory category, LeaseType leaseType, UUID emissionFactorId,
		String factorName, String scopeJustification, boolean proxy, String proxyJustification) {

	public static AssignmentResponse from(InventoryAssignment assignment) {
		var activity = assignment.getActivity();
		var factor = assignment.getEmissionFactor();
		var stream = activity.getStream();
		return new AssignmentResponse(assignment.getId(), activity.getId(), activity.getFacility().getId(),
				activity.getFacility().getName(), stream == null ? null : stream.getId(),
				stream == null ? null : stream.getName(), stream == null ? null : stream.getKind(),
				stream == null ? null : stream.isContractorOperated(),
				stream == null ? null : stream.defaultScope(), stream == null ? null : stream.defaultCategory(),
				stream == null ? null : stream.getKind().categories(), activity.getActivityType(), activity.getQuantity(),
				activity.getUnit(), activity.getPeriodStart(), activity.getPeriodEnd(), activity.getDataQuality(),
				activity.getEvidenceRef(),
				assignment.isIncluded(), assignment.getExclusionReason(), assignment.getExclusionDetail(),
				assignment.isClassified(), assignment.getScope(), assignment.getCategory(),
				assignment.getLeaseType(), factor == null ? null : factor.getId(),
				factor == null ? null : factor.getName(), assignment.getScopeJustification(), assignment.isProxy(),
				assignment.getProxyJustification());
	}
}
