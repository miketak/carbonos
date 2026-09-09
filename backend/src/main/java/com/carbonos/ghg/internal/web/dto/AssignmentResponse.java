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
		String suggestedFactorName, boolean inherited, List<String> changedSincePublication) {

	public static AssignmentResponse from(InventoryAssignment assignment) {
		return from(assignment, null);
	}

	/** With the grid factor suggested for the record's facility (spec 03.4), when there is one. */
	public static AssignmentResponse from(InventoryAssignment assignment, InventoryService.Suggestion suggestion) {
		return from(assignment, suggestion, null);
	}

	/**
	 * For a published inventory (spec 05.3): the facts as the published run
	 * snapshotted them, and which fields have changed since.
	 */
	public static AssignmentResponse from(InventoryAssignment assignment, InventoryService.Suggestion suggestion,
			InventoryService.PublishedFact published) {
		var activity = assignment.getActivity();
		var inheritedLease = activity.getFacility().leaseOver(activity.getPeriodStart(), activity.getPeriodEnd());
		List<String> changed = null;
		var activityType = activity.getActivityType();
		var quantity = activity.getQuantity();
		var unit = activity.getUnit();
		var periodStart = activity.getPeriodStart();
		var periodEnd = activity.getPeriodEnd();
		var evidenceRef = activity.getEvidenceRef();
		if (published != null) {
			changed = new java.util.ArrayList<>();
			if (!published.activityType().equals(activityType)) changed.add("activityType");
			if (published.quantity().compareTo(quantity) != 0) changed.add("quantity");
			if (!published.unit().equalsIgnoreCase(unit)) changed.add("unit");
			if (!published.periodStart().equals(periodStart)) changed.add("periodStart");
			if (!published.periodEnd().equals(periodEnd)) changed.add("periodEnd");
			if (published.evidenceRef() != null && !published.evidenceRef().equals(evidenceRef)) changed.add("evidenceRef");
			if (activity.isDeleted()) changed.add("removed");
			activityType = published.activityType();
			quantity = published.quantity();
			unit = published.unit();
			periodStart = published.periodStart();
			periodEnd = published.periodEnd();
			evidenceRef = published.evidenceRef() != null ? published.evidenceRef() : evidenceRef;
		}
		var factor = assignment.getEmissionFactor();
		var stream = activity.getStream();
		var density = assignment.getDensity();
		return new AssignmentResponse(assignment.getId(), activity.getId(), activity.getFacility().getId(),
				activity.getFacility().getName(), stream == null ? null : stream.getId(),
				stream == null ? null : stream.getName(), stream == null ? null : stream.getKind(),
				stream == null ? null : stream.isContractorOperated(),
				stream == null ? null : stream.defaultScope(), stream == null ? null : stream.defaultCategory(),
				stream == null ? null : stream.getKind().categories(), activityType, quantity, unit, periodStart,
				periodEnd, activity.getDataQuality(), activity.getDataQualityTier(), activity.getUncertaintyPercent(),
				evidenceRef,
				assignment.isIncluded(), assignment.getExclusionReason(), assignment.getExclusionDetail(),
				assignment.getExclusionJustification(), assignment.getEstimatedKgCo2e(),
				assignment.isClassified(), assignment.getScope(), assignment.getCategory(),
				assignment.getLeaseType(), factor == null ? null : factor.getId(),
				factor == null ? null : factor.getName(), assignment.getScopeJustification(), assignment.isProxy(),
				assignment.getProxyJustification(), density == null ? null : density.getId(),
				density == null ? null : density.getMaterial(), density == null ? null : density.getKgPerLitre(),
				inheritedLease, suggestion == null ? null : suggestion.factorId(),
				suggestion == null ? null : suggestion.factorName(), assignment.isInherited(),
				changed == null ? null : List.copyOf(changed));
	}
}
