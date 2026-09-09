package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.BoundaryExclusion;
import com.carbonos.ghg.internal.ConsolidationApproach;
import com.carbonos.ghg.internal.ExclusionReason;
import com.carbonos.ghg.internal.InventoryService;
import com.carbonos.ghg.internal.RelationshipType;
import com.carbonos.ghg.internal.Table1;

/**
 * One legal entity as one inventory's boundary sees it (spec 03.1, 03.3): its
 * treatment when in the boundary (with the Table 1 row applied, the share it
 * derives through its chain of parents, and the membership window), or nulls
 * when outside it, plus its facilities and whether each is included, and the
 * exclusion recorded for it or for any of its facilities (spec 07.2).
 */
public record BoundaryEntityResponse(UUID entityId, String entityName, boolean reportingCompany, boolean inBoundary,
		RelationshipType relationshipType, BigDecimal economicInterestPercent, Boolean operatedByCompany,
		Boolean controlledByCompany, BigDecimal effectiveEconomicInterestPercent, List<String> chain,
		BigDecimal accountingShare, String table1Row, LocalDate effectiveFrom, LocalDate effectiveTo,
		Exclusion exclusion, List<FacilityMember> facilities) {

	public record Exclusion(ExclusionReason reason, String detail) {
		static Exclusion from(BoundaryExclusion exclusion) {
			return exclusion == null ? null : new Exclusion(exclusion.getReason(), exclusion.getDetail());
		}
	}

	public record FacilityMember(UUID facilityId, String facilityName, String location, boolean inBoundary,
			Exclusion exclusion) {
	}

	public static BoundaryEntityResponse of(InventoryService.BoundaryEntityView view, ConsolidationApproach approach) {
		var entity = view.entity();
		var treatment = view.treatment();
		var members = view.facilities()
			.stream()
			.map(facility -> new FacilityMember(facility.getId(), facility.getName(), facility.getLocation(),
					treatment != null && treatment.includes(facility.getId()),
					Exclusion.from(view.facilityExclusions().get(facility.getId()))))
			.toList();
		var exclusion = Exclusion.from(view.entityExclusion());
		if (treatment == null) {
			return new BoundaryEntityResponse(entity.getId(), entity.getName(), entity.isReportingCompany(), false,
					null, null, null, null, entity.effectiveEconomicInterestPercent(), entity.chain(), null, null, null,
					null, exclusion, members);
		}
		var chain = view.chain();
		return new BoundaryEntityResponse(entity.getId(), entity.getName(), entity.isReportingCompany(), true,
				treatment.getRelationshipType(), treatment.getEconomicInterestPercent(),
				treatment.isOperatedByCompany(), treatment.isControlledByCompany(),
				chain.effectiveInterestPercent(treatment.getEconomicInterestPercent()), chain.names(),
				treatment.accountingShare(approach, chain.shareFactor()),
				Table1.describe(treatment.getRelationshipType(), approach, treatment.getEconomicInterestPercent(),
						treatment.isOperatedByCompany(), treatment.isControlledByCompany())
						+ (chain.names().isEmpty() ? "" : "; held through " + String.join(" > ", chain.names())),
				treatment.getEffectiveFrom(), treatment.getEffectiveTo(), exclusion, members);
	}
}
