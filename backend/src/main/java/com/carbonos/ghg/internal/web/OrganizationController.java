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
import com.carbonos.ghg.internal.Organization;
import com.carbonos.ghg.internal.web.dto.OrganizationRequest;
import com.carbonos.ghg.internal.web.dto.OrganizationResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/ghg/organizations")
class OrganizationController {

	private final GhgService ghgService;

	OrganizationController(GhgService ghgService) {
		this.ghgService = ghgService;
	}

	@GetMapping
	List<OrganizationResponse> list() {
		return ghgService.listOrganizations().stream().map(this::toResponse).toList();
	}

	@GetMapping("/{id}")
	OrganizationResponse get(@PathVariable UUID id) {
		return toResponse(ghgService.getOrganization(id));
	}

	@PostMapping
	ResponseEntity<OrganizationResponse> create(@Valid @RequestBody OrganizationRequest body) {
		var organization = ghgService.createOrganization(body.name(), body.consolidationApproach());
		URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
			.buildAndExpand(organization.getId()).toUri();
		return ResponseEntity.created(location).body(toResponse(organization));
	}

	@PutMapping("/{id}")
	OrganizationResponse update(@PathVariable UUID id, @Valid @RequestBody OrganizationRequest body) {
		return toResponse(ghgService.updateOrganization(id, body.name(), body.consolidationApproach()));
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable UUID id) {
		ghgService.deleteOrganization(id);
	}

	private OrganizationResponse toResponse(Organization organization) {
		return OrganizationResponse.from(organization, ghgService.facilityCount(organization.getId()));
	}
}
