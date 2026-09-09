package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import com.carbonos.ghg.internal.MarketFactor;
import com.carbonos.ghg.internal.MarketInstrument;

public record MarketFactorResponse(UUID id, UUID facilityId, String facilityName, MarketInstrument instrumentType,
		BigDecimal kgCo2ePerKwh, String source, boolean meetsQualityCriteria, String qualityNotes,
		BigDecimal coveredKwh, LocalDate periodStart, LocalDate periodEnd) {

	public static MarketFactorResponse from(MarketFactor factor) {
		return new MarketFactorResponse(factor.getId(), factor.getFacility().getId(), factor.getFacility().getName(),
				factor.getInstrumentType(), factor.getKgCo2ePerKwh(), factor.getSource(),
				factor.isMeetsQualityCriteria(), factor.getQualityNotes(), factor.getCoveredKwh(),
				factor.getPeriodStart(), factor.getPeriodEnd());
	}
}
