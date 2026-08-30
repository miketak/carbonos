package com.carbonos.ghg.internal.web;

import java.net.URI;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;

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

import com.carbonos.ghg.internal.BoundaryTreatment;
import com.carbonos.ghg.internal.GhgService;
import com.carbonos.ghg.internal.InventoryService;
import com.carbonos.ghg.internal.web.dto.AssignmentResponse;
import com.carbonos.ghg.internal.web.dto.BoundaryEntryResponse;
import com.carbonos.ghg.internal.web.dto.BoundaryTreatmentRequest;
import com.carbonos.ghg.internal.web.dto.ClassifyRequest;
import com.carbonos.ghg.internal.web.dto.ExcludeRequest;
import com.carbonos.ghg.internal.web.dto.InventoryRequest;
import com.carbonos.ghg.internal.web.dto.InventoryResponse;
import com.carbonos.ghg.internal.web.dto.ValidationReportResponse;

import jakarta.validation.Valid;

/** Accounting views (spec 003): inventories, boundaries, assignments, validation. */
@RestController
@RequestMapping("/api/ghg")
class InventoryController {

	private final InventoryService inventoryService;
	private final GhgService ghgService;

	InventoryController(InventoryService inventoryService, GhgService ghgService) {
		this.inventoryService = inventoryService;
		this.ghgService = ghgService;
	}

	// --- inventories --------------------------------------------------------

	@GetMapping("/organizations/{organizationId}/inventories")
	List<InventoryResponse> list(@PathVariable UUID organizationId) {
		return inventoryService.list(organizationId).stream().map(InventoryResponse::from).toList();
	}

	@PostMapping("/organizations/{organizationId}/inventories")
	ResponseEntity<InventoryResponse> create(@PathVariable UUID organizationId,
			@Valid @RequestBody InventoryRequest body) {
		var inventory = inventoryService.create(organizationId, body.name(), body.periodStart(), body.periodEnd(),
				body.purpose(), body.baseYear(), body.consolidationApproach());
		URI location = ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/ghg/inventories/{id}")
			.buildAndExpand(inventory.getId()).toUri();
		return ResponseEntity.created(location).body(InventoryResponse.from(inventory));
	}

	@GetMapping("/inventories/{id}")
	InventoryResponse get(@PathVariable UUID id) {
		return InventoryResponse.from(inventoryService.get(id));
	}

	@PutMapping("/inventories/{id}")
	InventoryResponse update(@PathVariable UUID id, @Valid @RequestBody InventoryRequest body) {
		return InventoryResponse.from(inventoryService.update(id, body.name(), body.periodStart(), body.periodEnd(),
				body.purpose(), body.baseYear(), body.consolidationApproach()));
	}

	@DeleteMapping("/inventories/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable UUID id) {
		inventoryService.delete(id);
	}

	// --- boundary -----------------------------------------------------------

	@GetMapping("/inventories/{id}/boundary")
	List<BoundaryEntryResponse> boundary(@PathVariable UUID id) {
		var inventory = inventoryService.get(id);
		var treatments = inventoryService.boundary(id)
			.stream()
			.collect(java.util.stream.Collectors.toMap(treatment -> treatment.getFacility().getId(),
					Function.<BoundaryTreatment>identity()));
		return ghgService.listFacilities(inventory.getOrganization().getId())
			.stream()
			.map(facility -> BoundaryEntryResponse.of(facility, treatments.get(facility.getId()),
					inventory.getConsolidationApproach()))
			.toList();
	}

	@PutMapping("/inventories/{id}/boundary/{facilityId}")
	BoundaryEntryResponse setTreatment(@PathVariable UUID id, @PathVariable UUID facilityId,
			@Valid @RequestBody BoundaryTreatmentRequest body) {
		var inventory = inventoryService.get(id);
		var treatment = inventoryService.setBoundaryTreatment(id, facilityId, body.ownershipPercent(),
				body.financialControl(), body.operationalControl());
		return BoundaryEntryResponse.of(treatment.getFacility(), treatment, inventory.getConsolidationApproach());
	}

	@DeleteMapping("/inventories/{id}/boundary/{facilityId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void removeTreatment(@PathVariable UUID id, @PathVariable UUID facilityId) {
		inventoryService.removeBoundaryTreatment(id, facilityId);
	}

	// --- assignments --------------------------------------------------------

	@GetMapping("/inventories/{id}/assignments")
	List<AssignmentResponse> assignments(@PathVariable UUID id) {
		return inventoryService.listAssignments(id).stream().map(AssignmentResponse::from).toList();
	}

	@PostMapping("/inventories/{id}/assignments/sync")
	InventoryService.SyncResult sync(@PathVariable UUID id) {
		return inventoryService.syncAssignments(id);
	}

	@PutMapping("/assignments/{id}/classify")
	AssignmentResponse classify(@PathVariable UUID id, @Valid @RequestBody ClassifyRequest body) {
		return AssignmentResponse.from(inventoryService.classify(id, body.emissionFactorId()));
	}

	@PutMapping("/assignments/{id}/exclude")
	AssignmentResponse exclude(@PathVariable UUID id, @Valid @RequestBody ExcludeRequest body) {
		return AssignmentResponse.from(inventoryService.exclude(id, body.reason()));
	}

	@PutMapping("/assignments/{id}/include")
	AssignmentResponse include(@PathVariable UUID id) {
		return AssignmentResponse.from(inventoryService.include(id));
	}

	// --- validation ---------------------------------------------------------

	@GetMapping("/inventories/{id}/validation")
	ValidationReportResponse validation(@PathVariable UUID id) {
		return ValidationReportResponse.from(inventoryService.validate(id));
	}
}
