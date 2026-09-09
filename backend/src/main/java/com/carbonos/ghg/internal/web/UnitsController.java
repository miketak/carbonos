package com.carbonos.ghg.internal.web;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.ghg.internal.GhgService;
import com.carbonos.ghg.internal.web.dto.CustomUnitRequest;
import com.carbonos.ghg.internal.web.dto.CustomUnitResponse;
import com.carbonos.ghg.internal.web.dto.DensityRequest;
import com.carbonos.ghg.internal.web.dto.DensityResponse;
import com.carbonos.ghg.internal.web.dto.UnitResponse;

import jakarta.validation.Valid;

/** An organization's units: the registry with its custom units, and its densities (spec 02.2). */
@RestController
@RequestMapping("/api/ghg")
class UnitsController {

	private final GhgService ghgService;

	UnitsController(GhgService ghgService) {
		this.ghgService = ghgService;
	}

	@GetMapping("/organizations/{organizationId}/units")
	List<UnitResponse> units(@PathVariable UUID organizationId) {
		return ghgService.listUnits(organizationId).stream().map(UnitResponse::from).toList();
	}

	@GetMapping("/organizations/{organizationId}/custom-units")
	List<CustomUnitResponse> customUnits(@PathVariable UUID organizationId) {
		return ghgService.listCustomUnits(organizationId).stream().map(CustomUnitResponse::from).toList();
	}

	@PostMapping("/organizations/{organizationId}/custom-units")
	@ResponseStatus(HttpStatus.CREATED)
	CustomUnitResponse createCustomUnit(@PathVariable UUID organizationId, @Valid @RequestBody CustomUnitRequest body) {
		return CustomUnitResponse.from(ghgService.createCustomUnit(organizationId, body.toFacts()));
	}

	@PutMapping("/custom-units/{id}")
	CustomUnitResponse updateCustomUnit(@PathVariable UUID id, @Valid @RequestBody CustomUnitRequest body) {
		return CustomUnitResponse.from(ghgService.updateCustomUnit(id, body.toFacts()));
	}

	@DeleteMapping("/custom-units/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void deleteCustomUnit(@PathVariable UUID id) {
		ghgService.deleteCustomUnit(id);
	}

	@GetMapping("/organizations/{organizationId}/densities")
	List<DensityResponse> densities(@PathVariable UUID organizationId) {
		return ghgService.listDensities(organizationId).stream().map(DensityResponse::from).toList();
	}

	@PostMapping("/organizations/{organizationId}/densities")
	@ResponseStatus(HttpStatus.CREATED)
	DensityResponse createDensity(@PathVariable UUID organizationId, @Valid @RequestBody DensityRequest body) {
		return DensityResponse.from(ghgService.createDensity(organizationId, body.toFacts()));
	}

	@PutMapping("/densities/{id}")
	DensityResponse updateDensity(@PathVariable UUID id, @Valid @RequestBody DensityRequest body) {
		return DensityResponse.from(ghgService.updateDensity(id, body.toFacts()));
	}

	@DeleteMapping("/densities/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void deleteDensity(@PathVariable UUID id) {
		ghgService.deleteDensity(id);
	}
}
