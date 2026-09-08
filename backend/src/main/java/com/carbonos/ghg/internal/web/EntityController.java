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
import com.carbonos.ghg.internal.web.dto.EntityRequest;
import com.carbonos.ghg.internal.web.dto.EntityResponse;

import jakarta.validation.Valid;

/** Legal entities and their Table 1 facts (spec 03.1). */
@RestController
@RequestMapping("/api/ghg")
class EntityController {

	private final GhgService ghgService;

	EntityController(GhgService ghgService) {
		this.ghgService = ghgService;
	}

	@GetMapping("/organizations/{organizationId}/entities")
	List<EntityResponse> list(@PathVariable UUID organizationId) {
		return ghgService.listEntities(organizationId).stream().map(EntityResponse::from).toList();
	}

	@PostMapping("/organizations/{organizationId}/entities")
	ResponseEntity<EntityResponse> create(@PathVariable UUID organizationId, @Valid @RequestBody EntityRequest body) {
		var entity = ghgService.createEntity(organizationId, body.name(), body.relationshipType(),
				body.economicInterestPercent(), body.legalOwnershipPercent(), body.operatedByCompany());
		URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
			.path("/api/ghg/entities/{id}")
			.buildAndExpand(entity.getId())
			.toUri();
		return ResponseEntity.created(location).body(EntityResponse.from(entity));
	}

	@PutMapping("/entities/{id}")
	EntityResponse update(@PathVariable UUID id, @Valid @RequestBody EntityRequest body) {
		return EntityResponse.from(ghgService.updateEntity(id, body.name(), body.relationshipType(),
				body.economicInterestPercent(), body.legalOwnershipPercent(), body.operatedByCompany()));
	}

	@DeleteMapping("/entities/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable UUID id) {
		ghgService.deleteEntity(id);
	}
}
