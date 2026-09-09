package com.carbonos.ghg.internal.web;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.ghg.internal.BaseYearService;
import com.carbonos.ghg.internal.web.dto.BaseYearRequest;
import com.carbonos.ghg.internal.web.dto.BaseYearResponse;
import com.carbonos.ghg.internal.web.dto.RaiseRecalculationRequest;
import com.carbonos.ghg.internal.web.dto.RecalculationDecisionRequest;

import jakarta.validation.Valid;

/** The organization's base year and recalculation policy (spec 06). */
@RestController
@RequestMapping("/api/ghg/organizations/{organizationId}/base-year")
class BaseYearController {

	private final BaseYearService baseYearService;

	BaseYearController(BaseYearService baseYearService) {
		this.baseYearService = baseYearService;
	}

	/** 204 when the organization has not designated a base year. */
	@GetMapping
	ResponseEntity<BaseYearResponse> get(@PathVariable UUID organizationId) {
		return baseYearService.find(organizationId)
			.map(baseYear -> ResponseEntity.ok(BaseYearResponse.from(baseYear)))
			.orElseGet(() -> ResponseEntity.noContent().build());
	}

	@PutMapping
	BaseYearResponse set(@PathVariable UUID organizationId, @Valid @RequestBody BaseYearRequest body) {
		return BaseYearResponse.from(baseYearService.set(organizationId, body.inventoryId(), body.thresholdPercent(),
				body.reason(), body.structuralChangeConvention()));
	}

	@DeleteMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void clear(@PathVariable UUID organizationId) {
		baseYearService.clear(organizationId);
	}

	/** The accountant raises a methodology-change or error-correction candidate (spec 06.1). */
	@PostMapping("/recalculations")
	@ResponseStatus(HttpStatus.CREATED)
	BaseYearResponse raise(@PathVariable UUID organizationId, @Valid @RequestBody RaiseRecalculationRequest body) {
		return BaseYearResponse.from(baseYearService.raise(organizationId, body.trigger(), body.reason(),
				body.affectedPercent(), body.comparisonRunId()));
	}

	@PostMapping("/recalculations/{recalculationId}/decide")
	BaseYearResponse decide(@PathVariable UUID organizationId, @PathVariable UUID recalculationId,
			@Valid @RequestBody RecalculationDecisionRequest body) {
		return BaseYearResponse.from(baseYearService.decide(organizationId, recalculationId, body.decision(),
				body.runId(), body.note()));
	}
}
