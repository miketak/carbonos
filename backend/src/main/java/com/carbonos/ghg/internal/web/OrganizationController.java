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
import com.carbonos.ghg.internal.SupportAccessService;
import com.carbonos.ghg.internal.web.dto.AuditEventResponse;
import com.carbonos.ghg.internal.web.dto.DeleteOrganizationRequest;
import com.carbonos.ghg.internal.web.dto.OrganizationRequest;
import com.carbonos.ghg.internal.web.dto.OrganizationResponse;
import com.carbonos.ghg.internal.web.dto.SupportAccessRequest;
import com.carbonos.ghg.internal.web.dto.SupportAccessResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/ghg/organizations")
class OrganizationController {

	private final GhgService ghgService;
	private final SupportAccessService supportAccess;

	OrganizationController(GhgService ghgService, SupportAccessService supportAccess) {
		this.ghgService = ghgService;
		this.supportAccess = supportAccess;
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
		var organization = ghgService.createOrganization(body.name(), body.address(), body.contact());
		URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
			.buildAndExpand(organization.getId()).toUri();
		return ResponseEntity.created(location).body(toResponse(organization));
	}

	@PutMapping("/{id}")
	OrganizationResponse update(@PathVariable UUID id, @Valid @RequestBody OrganizationRequest body) {
		return toResponse(ghgService.updateOrganization(id, body.name(), body.address(), body.contact()));
	}

	/** Removes the organization with a tombstone (spec 01.3): the owner types the name and a reason. */
	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable UUID id, @Valid @RequestBody DeleteOrganizationRequest body) {
		ghgService.deleteOrganization(id, body.name(), body.reason());
	}

	/** The organization-level history (spec 01.3): support access and the deletion. */
	@GetMapping("/{id}/events")
	List<AuditEventResponse> events(@PathVariable UUID id) {
		return ghgService.organizationEvents(id).stream().map(AuditEventResponse::from).toList();
	}

	/** A platform administrator assumes support access for 24 hours (spec 01.3). */
	@PostMapping("/{id}/support-access")
	@ResponseStatus(HttpStatus.CREATED)
	SupportAccessResponse assumeSupportAccess(@PathVariable UUID id, @Valid @RequestBody SupportAccessRequest body) {
		return SupportAccessResponse.from(supportAccess.assume(id, body.reason()));
	}

	@DeleteMapping("/{id}/support-access")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void endSupportAccess(@PathVariable UUID id) {
		supportAccess.end(id);
	}

	private OrganizationResponse toResponse(Organization organization) {
		return OrganizationResponse.from(organization, ghgService.facilityCount(organization.getId()),
				ghgService.roleIn(organization),
				ghgService.activeSupportAccess(organization).stream().map(SupportAccessResponse::from).toList());
	}
}
