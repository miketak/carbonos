package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.DataQuality;
import com.carbonos.ghg.internal.ExclusionReason;
import com.carbonos.ghg.internal.InventoryAssignment;
import com.carbonos.ghg.internal.InventoryService;
import com.carbonos.ghg.internal.LeaseType;
import com.carbonos.ghg.internal.Scope;
import com.carbonos.ghg.internal.StreamKind;
import java.util.List;

/** The fact (activity fields) plus this inventory's accounting decision about it. */
public record AssignmentResponse(UUID id, UUID activityId, UUID facilityId, String facilityName,
		UUID streamId, String streamName, StreamKind streamKind, Boolean contractorOperated, Scope defaultScope,
		ActivityCategory defaultCategory, List<ActivityCategory> allowedCategories, String activityType, BigDecimal quantity, String unit, LocalDate periodStart, LocalDate periodEnd,
		DataQuality dataQuality, int dataQualityTier, BigDecimal uncertaintyPercent,
		String evidenceRef, boolean included, ExclusionReason exclusionReason, String exclusionDetail,
		String exclusionJustification, BigDecimal estimatedKgCo2e,
		boolean classified, Scope scope, ActivityCategory category, LeaseType leaseType, UUID emissionFactorId,
		String factorName, String scopeJustification, boolean proxy, String proxyJustification, UUID densityId,
		String densityMaterial, BigDecimal densityKgPerLitre, LeaseType inheritedLeaseType, UUID suggestedFactorId,
		String suggestedFactorName) {

	public static AssignmentResponse from(InventoryAssignment assignment) {
		return from(assignment, null);
	}

	/** With the grid factor suggested for the record's facility (spec 03.4), when there is one. */
	public static AssignmentResponse from(InventoryAssignment assignment, InventoryService.Suggestion suggestion) {
		var activity = assignment.getActivity();
		var inheritedLease = activity.getFacility().leaseOver(activity.getPeriodStart(), activity.getPeriodEnd());
		var factor = assignment.getEmissionFactor();
		var stream = activity.getStream();
		var density = assignment.getDensity();
		return new AssignmentResponse(assignment.getId(), activity.getId(), activity.getFacility().getId(),
				activity.getFacility().getName(), stream == null ? null : stream.getId(),
				stream == null ? null : stream.getName(), stream == null ? null : stream.getKind(),
				stream == null ? null : stream.isContractorOperated(),
				stream == null ? null : stream.defaultScope(), stream == null ? null : stream.defaultCategory(),
				stream == null ? null : stream.getKind().categories(), activity.getActivityType(), activity.getQuantity(),
				activity.getUnit(), activity.getPeriodStart(), activity.getPeriodEnd(), activity.getDataQuality(),
				activity.getDataQualityTier(), activity.getUncertaintyPercent(), activity.getEvidenceRef(),
				assignment.isIncluded(), assignment.getExclusionReason(), assignment.getExclusionDetail(),
				assignment.getExclusionJustification(), assignment.getEstimatedKgCo2e(),
				assignment.isClassified(), assignment.getScope(), assignment.getCategory(),
				assignment.getLeaseType(), factor == null ? null : factor.getId(),
				factor == null ? null : factor.getName(), assignment.getScopeJustification(), assignment.isProxy(),
				assignment.getProxyJustification(), density == null ? null : density.getId(),
				density == null ? null : density.getMaterial(), density == null ? null : density.getKgPerLitre(),
				inheritedLease, suggestion == null ? null : suggestion.factorId(),
				suggestion == null ? null : suggestion.factorName());
	}
}
