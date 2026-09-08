package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.BoundaryVersionEntry;
import com.carbonos.ghg.internal.BoundaryVersionFacility;
import com.carbonos.ghg.internal.ConsolidationApproach;
import com.carbonos.ghg.internal.RelationshipType;
import com.carbonos.ghg.internal.Table1;

/** One entity as a version recorded it, with the facilities beneath it and whether it stood excluded. */
public record BoundaryVersionEntryResponse(UUID entityId, String entityName, RelationshipType relationshipType,
		BigDecimal economicInterestPercent, boolean operatedByCompany, BigDecimal accountingShare, String table1Row,
		LocalDate effectiveFrom, LocalDate effectiveTo, boolean excluded, String exclusionReason,
		List<VersionFacility> facilities) {

	public record VersionFacility(UUID facilityId, String facilityName, String location) {
		static VersionFacility from(BoundaryVersionFacility facility) {
			return new VersionFacility(facility.getFacilityId(), facility.getFacilityName(), facility.getLocation());
		}
	}

	public static BoundaryVersionEntryResponse from(BoundaryVersionEntry entry, ConsolidationApproach approach) {
		return new BoundaryVersionEntryResponse(entry.getEntityId(), entry.getEntityName(),
				entry.getRelationshipType(), entry.getEconomicInterestPercent(), entry.isOperatedByCompany(),
				entry.getAccountingShare(),
				Table1.describe(entry.getRelationshipType(), approach, entry.getEconomicInterestPercent(),
						entry.isOperatedByCompany()),
				entry.getEffectiveFrom(), entry.getEffectiveTo(), entry.isExcluded(), entry.getExclusionReason(),
				entry.getFacilities().stream().map(VersionFacility::from).toList());
	}
}
