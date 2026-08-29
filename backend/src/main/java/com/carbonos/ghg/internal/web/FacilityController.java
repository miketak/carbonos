package com.carbonos.ghg.internal.web;

import java.net.URI;
import java.util.List;
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
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.carbonos.ghg.internal.GhgService;
import com.carbonos.ghg.internal.web.dto.FacilityRequest;
import com.carbonos.ghg.internal.web.dto.FacilityResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/ghg")
class FacilityController {

	private final GhgService ghgService;

	FacilityController(GhgService ghgService) {
		this.ghgService = ghgService;
	}

	@GetMapping("/organizations/{organizationId}/facilities")
	List<FacilityResponse> list(@PathVariable UUID organizationId) {
		return ghgService.listFacilities(organizationId).stream().map(FacilityResponse::from).toList();
	}

	@PostMapping("/organizations/{organizationId}/facilities")
	ResponseEntity<FacilityResponse> create(@PathVariable UUID organizationId,
			@Valid @RequestBody FacilityRequest body) {
		var facility = ghgService.createFacility(organizationId, body.name(), body.location(),
				body.equitySharePercent(), body.controlled());
		URI location = ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/ghg/facilities/{id}")
			.buildAndExpand(facility.getId()).toUri();
		return ResponseEntity.created(location).body(FacilityResponse.from(facility));
	}

	@PutMapping("/facilities/{id}")
	FacilityResponse update(@PathVariable UUID id, @Valid @RequestBody FacilityRequest body) {
		return FacilityResponse
			.from(ghgService.updateFacility(id, body.name(), body.location(), body.equitySharePercent(),
					body.controlled()));
	}

	@DeleteMapping("/facilities/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable UUID id) {
		ghgService.deleteFacility(id);
	}
}
