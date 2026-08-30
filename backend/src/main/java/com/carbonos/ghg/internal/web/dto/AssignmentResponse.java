package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.DataQuality;
import com.carbonos.ghg.internal.ExclusionReason;
import com.carbonos.ghg.internal.InventoryAssignment;
import com.carbonos.ghg.internal.Scope;

/** The fact (activity fields) plus this inventory's accounting decision about it. */
public record AssignmentResponse(UUID id, UUID activityId, UUID facilityId, String facilityName,
		String activityType, BigDecimal quantity, String unit, LocalDate activityDate, DataQuality dataQuality,
		String evidenceRef, boolean included, ExclusionReason exclusionReason, boolean classified, Scope scope,
		ActivityCategory category, UUID emissionFactorId, String factorName) {

	public static AssignmentResponse from(InventoryAssignment assignment) {
		var activity = assignment.getActivity();
		var factor = assignment.getEmissionFactor();
		return new AssignmentResponse(assignment.getId(), activity.getId(), activity.getFacility().getId(),
				activity.getFacility().getName(), activity.getActivityType(), activity.getQuantity(),
				activity.getUnit(), activity.getActivityDate(), activity.getDataQuality(), activity.getEvidenceRef(),
				assignment.isIncluded(), assignment.getExclusionReason(), assignment.isClassified(),
				assignment.getScope(), assignment.getCategory(), factor == null ? null : factor.getId(),
				factor == null ? null : factor.getName());
	}
}
