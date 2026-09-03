package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

import com.carbonos.ghg.internal.BoundaryVersionEntry;

public record BoundaryVersionEntryResponse(UUID facilityId, String facilityName, String location,
		BigDecimal ownershipPercent, boolean financialControl, boolean operationalControl,
		BigDecimal accountingShare) {

	public static BoundaryVersionEntryResponse from(BoundaryVersionEntry entry) {
		return new BoundaryVersionEntryResponse(entry.getFacilityId(), entry.getFacilityName(), entry.getLocation(),
				entry.getOwnershipPercent(), entry.isFinancialControl(), entry.isOperationalControl(),
				entry.getAccountingShare());
	}
}
