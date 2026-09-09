package com.carbonos.ghg.internal.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.carbonos.ghg.internal.MarketFactor;
import com.carbonos.ghg.internal.MarketInstrument;
import com.carbonos.ghg.internal.Scope2Criterion;

public record MarketFactorResponse(UUID id, UUID facilityId, String facilityName, MarketInstrument instrumentType,
		BigDecimal kgCo2ePerKwh, String source, boolean meetsQualityCriteria, String qualityNotes,
		List<Criterion> criteria, long unansweredCount, long notMetCount, String certificateId, String registry,
		Integer vintage, LocalDate retirementDate, BigDecimal coveredKwh, LocalDate periodStart,
		LocalDate periodEnd) {

	/** One criterion and the instrument's answer (spec 07.6). */
	public record Criterion(String code, String title, Scope2Criterion.Answer answer) {
	}

	public static MarketFactorResponse from(MarketFactor factor) {
		var answers = factor.criteriaAnswers();
		var criteria = new java.util.ArrayList<Criterion>();
		var definitions = Scope2Criterion.values();
		for (int i = 0; i < definitions.length; i++) {
			criteria.add(new Criterion(definitions[i].name(), definitions[i].title(), answers.get(i)));
		}
		return new MarketFactorResponse(factor.getId(), factor.getFacility().getId(), factor.getFacility().getName(),
				factor.getInstrumentType(), factor.getKgCo2ePerKwh(), factor.getSource(),
				factor.isMeetsQualityCriteria(), factor.getQualityNotes(), List.copyOf(criteria),
				factor.unansweredCount(), factor.notMetCount(), factor.getCertificateId(), factor.getRegistry(),
				factor.getVintage(), factor.getRetirementDate(), factor.getCoveredKwh(), factor.getPeriodStart(),
				factor.getPeriodEnd());
	}
}
