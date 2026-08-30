package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

import com.carbonos.ghg.internal.BoundaryTreatment;
import com.carbonos.ghg.internal.ConsolidationApproach;
import com.carbonos.ghg.internal.Facility;

/**
 * One facility as one inventory's boundary sees it: its treatment when in the
 * boundary (with the share the consolidation approach derives), or nulls when
 * outside it.
 */
public record BoundaryEntryResponse(UUID facilityId, String facilityName, String location, boolean inBoundary,
		BigDecimal ownershipPercent, Boolean financialControl, Boolean operationalControl,
		BigDecimal accountingShare) {

	public static BoundaryEntryResponse of(Facility facility, BoundaryTreatment treatment,
			ConsolidationApproach approach) {
		if (treatment == null) {
			return new BoundaryEntryResponse(facility.getId(), facility.getName(), facility.getLocation(), false,
					null, null, null, null);
		}
		return new BoundaryEntryResponse(facility.getId(), facility.getName(), facility.getLocation(), true,
				treatment.getOwnershipPercent(), treatment.isFinancialControl(), treatment.isOperationalControl(),
				treatment.accountingShare(approach));
	}
}
