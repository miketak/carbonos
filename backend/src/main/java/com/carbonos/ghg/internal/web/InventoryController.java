package com.carbonos.ghg.internal.web;

import java.net.URI;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

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
import com.carbonos.ghg.internal.Facility;
import com.carbonos.ghg.internal.GhgService;
import com.carbonos.ghg.internal.Inventory;
import com.carbonos.ghg.internal.InventoryService;
import com.carbonos.ghg.internal.web.dto.AssignmentResponse;
import com.carbonos.ghg.internal.web.dto.BoundaryEntityResponse;
import com.carbonos.ghg.internal.web.dto.BoundaryTreatmentRequest;
import com.carbonos.ghg.internal.web.dto.BoundaryVersionResponse;
import com.carbonos.ghg.internal.web.dto.BoundaryVersionSummaryResponse;
import com.carbonos.ghg.internal.web.dto.ClassifyRequest;
import com.carbonos.ghg.internal.web.dto.ExcludeRequest;
import com.carbonos.ghg.internal.web.dto.FinalizeRequest;
import com.carbonos.ghg.internal.web.dto.InventoryRequest;
import com.carbonos.ghg.internal.web.dto.InventoryResponse;
import com.carbonos.ghg.internal.web.dto.MarketFactorRequest;
import com.carbonos.ghg.internal.web.dto.MarketFactorResponse;
import com.carbonos.ghg.internal.web.dto.OperationalBoundaryRequest;
import com.carbonos.ghg.internal.web.dto.SupersedeRequest;
import com.carbonos.ghg.internal.web.dto.ValidationReportResponse;

import jakarta.validation.Valid;

/** Accounting views (spec 05): inventories, their lifecycle, boundaries, assignments, validation. */
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
				body.purpose(), body.baseYear(), body.consolidationApproach(), body.gwpSet());
		URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
			.path("/api/ghg/inventories/{id}")
			.buildAndExpand(inventory.getId())
			.toUri();
		return ResponseEntity.created(location).body(InventoryResponse.from(inventory));
	}

	@GetMapping("/inventories/{id}")
	InventoryResponse get(@PathVariable UUID id) {
		return InventoryResponse.from(inventoryService.get(id));
	}

	@PutMapping("/inventories/{id}")
	InventoryResponse update(@PathVariable UUID id, @Valid @RequestBody InventoryRequest body) {
		return InventoryResponse.from(inventoryService.update(id, body.name(), body.periodStart(), body.periodEnd(),
				body.purpose(), body.baseYear(), body.consolidationApproach(), body.gwpSet()));
	}

	@DeleteMapping("/inventories/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable UUID id) {
		inventoryService.delete(id);
	}

	@PutMapping("/inventories/{id}/operational-boundary")
	InventoryResponse operationalBoundary(@PathVariable UUID id, @Valid @RequestBody OperationalBoundaryRequest body) {
		return InventoryResponse
			.from(inventoryService.setOperationalBoundary(id, body.scope3Categories(), body.exclusionsRationale()));
	}

	// --- boundary (spec 03.1, 03.2) -------------------------------------------

	@GetMapping("/inventories/{id}/boundary")
	List<BoundaryEntityResponse> boundary(@PathVariable UUID id) {
		var inventory = inventoryService.get(id);
		return boundaryOf(inventory);
	}

	private List<BoundaryEntityResponse> boundaryOf(Inventory inventory) {
		var organizationId = inventory.getOrganization().getId();
		var treatments = inventoryService.boundary(inventory.getId())
			.stream()
			.collect(Collectors.toMap(treatment -> treatment.getEntity().getId(),
					Function.<BoundaryTreatment>identity()));
		var facilitiesByEntity = ghgService.listFacilities(organizationId)
			.stream()
			.collect(Collectors.groupingBy(facility -> facility.getEntity().getId()));
		return ghgService.listEntities(organizationId)
			.stream()
			.map(entity -> BoundaryEntityResponse.of(entity,
					facilitiesByEntity.getOrDefault(entity.getId(), List.<Facility>of()), treatments.get(entity.getId()),
					inventory.getConsolidationApproach()))
			.toList();
	}

	private BoundaryEntityResponse entityEntry(Inventory inventory, UUID entityId) {
		return boundaryOf(inventory).stream()
			.filter(entry -> entry.entityId().equals(entityId))
			.findFirst()
			.orElseThrow();
	}

	@PutMapping("/inventories/{id}/boundary/entities/{entityId}")
	BoundaryEntityResponse setEntityTreatment(@PathVariable UUID id, @PathVariable UUID entityId,
			@Valid @RequestBody BoundaryTreatmentRequest body) {
		var inventory = inventoryService.get(id);
		inventoryService.setEntityTreatment(id, entityId, body.toInput());
		return entityEntry(inventory, entityId);
	}

	@DeleteMapping("/inventories/{id}/boundary/entities/{entityId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void removeEntityTreatment(@PathVariable UUID id, @PathVariable UUID entityId) {
		inventoryService.removeEntityTreatment(id, entityId);
	}

	@PutMapping("/inventories/{id}/boundary/{facilityId}")
	BoundaryEntityResponse includeFacility(@PathVariable UUID id, @PathVariable UUID facilityId,
			@Valid @RequestBody BoundaryTreatmentRequest body) {
		var inventory = inventoryService.get(id);
		var treatment = inventoryService.includeFacility(id, facilityId, body.toInput());
		return entityEntry(inventory, treatment.getEntity().getId());
	}

	@DeleteMapping("/inventories/{id}/boundary/{facilityId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void removeFacility(@PathVariable UUID id, @PathVariable UUID facilityId) {
		inventoryService.removeFacility(id, facilityId);
	}

	@GetMapping("/inventories/{id}/boundary/versions")
	List<BoundaryVersionSummaryResponse> boundaryVersions(@PathVariable UUID id) {
		return inventoryService.listBoundaryVersions(id).stream().map(BoundaryVersionSummaryResponse::from).toList();
	}

	@GetMapping("/boundary-versions/{id}")
	BoundaryVersionResponse boundaryVersion(@PathVariable UUID id) {
		return BoundaryVersionResponse.from(inventoryService.getBoundaryVersion(id));
	}

	// --- lifecycle (spec 05.1) --------------------------------------------------

	@PostMapping("/inventories/{id}/freeze")
	BoundaryVersionResponse freeze(@PathVariable UUID id) {
		return BoundaryVersionResponse.from(inventoryService.freeze(id));
	}

	@PostMapping("/inventories/{id}/reopen")
	InventoryResponse reopen(@PathVariable UUID id) {
		return InventoryResponse.from(inventoryService.reopen(id));
	}

	@PostMapping("/inventories/{id}/finalize")
	InventoryResponse finalizeInventory(@PathVariable UUID id, @Valid @RequestBody FinalizeRequest body) {
		return InventoryResponse.from(inventoryService.designateFinal(id, body.runId()));
	}

	@PostMapping("/inventories/{id}/withdraw-final")
	InventoryResponse withdrawFinal(@PathVariable UUID id) {
		return InventoryResponse.from(inventoryService.withdrawFinal(id));
	}

	@PostMapping("/inventories/{id}/publish")
	InventoryResponse publish(@PathVariable UUID id) {
		return InventoryResponse.from(inventoryService.publish(id));
	}

	@PostMapping("/inventories/{id}/supersede")
	ResponseEntity<InventoryResponse> supersede(@PathVariable UUID id,
			@Valid @RequestBody(required = false) SupersedeRequest body) {
		var successor = inventoryService.supersede(id, body == null ? null : body.name());
		URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
			.path("/api/ghg/inventories/{id}")
			.buildAndExpand(successor.getId())
			.toUri();
		return ResponseEntity.created(location).body(InventoryResponse.from(successor));
	}

	// --- market-based scope 2 (spec 07.1) ---------------------------------------

	@GetMapping("/inventories/{id}/market-factors")
	List<MarketFactorResponse> marketFactors(@PathVariable UUID id) {
		return inventoryService.marketFactors(id).stream().map(MarketFactorResponse::from).toList();
	}

	@PutMapping("/inventories/{id}/market-factors/{facilityId}")
	MarketFactorResponse setMarketFactor(@PathVariable UUID id, @PathVariable UUID facilityId,
			@Valid @RequestBody MarketFactorRequest body) {
		return MarketFactorResponse.from(inventoryService.setMarketFactor(id, facilityId, body.instrumentType(),
				body.kgCo2ePerKwh(), body.source()));
	}

	@DeleteMapping("/inventories/{id}/market-factors/{facilityId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void removeMarketFactor(@PathVariable UUID id, @PathVariable UUID facilityId) {
		inventoryService.removeMarketFactor(id, facilityId);
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
		return AssignmentResponse.from(inventoryService.classify(id, body.emissionFactorId(), body.scope(),
				body.category(), body.leaseType()));
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
