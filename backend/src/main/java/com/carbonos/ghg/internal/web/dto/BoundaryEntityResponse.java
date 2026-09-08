package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.BoundaryTreatment;
import com.carbonos.ghg.internal.ConsolidationApproach;
import com.carbonos.ghg.internal.Facility;
import com.carbonos.ghg.internal.LegalEntity;
import com.carbonos.ghg.internal.RelationshipType;
import com.carbonos.ghg.internal.Table1;

/**
 * One legal entity as one inventory's boundary sees it (spec 03.1): its
 * treatment when in the boundary (with the Table 1 row applied and the share
 * it derives, and the membership window), or nulls when outside it, plus its
 * facilities and whether each is included.
 */
public record BoundaryEntityResponse(UUID entityId, String entityName, boolean reportingCompany, boolean inBoundary,
		RelationshipType relationshipType, BigDecimal economicInterestPercent, Boolean operatedByCompany,
		BigDecimal accountingShare, String table1Row, LocalDate effectiveFrom, LocalDate effectiveTo,
		List<FacilityMember> facilities) {

	public record FacilityMember(UUID facilityId, String facilityName, String location, boolean inBoundary) {
	}

	public static BoundaryEntityResponse of(LegalEntity entity, List<Facility> facilities, BoundaryTreatment treatment,
			ConsolidationApproach approach) {
		var members = facilities.stream()
			.map(facility -> new FacilityMember(facility.getId(), facility.getName(), facility.getLocation(),
					treatment != null && treatment.includes(facility.getId())))
			.toList();
		if (treatment == null) {
			return new BoundaryEntityResponse(entity.getId(), entity.getName(), entity.isReportingCompany(), false,
					null, null, null, null, null, null, null, members);
		}
		return new BoundaryEntityResponse(entity.getId(), entity.getName(), entity.isReportingCompany(), true,
				treatment.getRelationshipType(), treatment.getEconomicInterestPercent(),
				treatment.isOperatedByCompany(), treatment.accountingShare(approach),
				Table1.describe(treatment.getRelationshipType(), approach, treatment.getEconomicInterestPercent(),
						treatment.isOperatedByCompany()),
				treatment.getEffectiveFrom(), treatment.getEffectiveTo(), members);
	}
}
