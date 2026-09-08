package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.carbonos.ghg.internal.Facility;

public record FacilityResponse(UUID id, String name, String location, BigDecimal equitySharePercent,
		boolean financialControl, boolean operationalControl, Instant createdAt) {

	public static FacilityResponse from(Facility facility) {
		return new FacilityResponse(facility.getId(), facility.getName(), facility.getLocation(),
				facility.getEquitySharePercent(), facility.isFinancialControl(), facility.isOperationalControl(),
				facility.getCreatedAt());
	}
}
