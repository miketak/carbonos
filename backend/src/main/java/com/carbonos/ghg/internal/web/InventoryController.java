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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.carbonos.ghg.internal.GhgService;
import com.carbonos.ghg.internal.Inventory;
import com.carbonos.ghg.internal.Scope;
import com.carbonos.ghg.internal.ActivityCategory;
import com.carbonos.ghg.internal.LeaseType;
import com.carbonos.ghg.internal.InventoryService;
import com.carbonos.ghg.internal.web.dto.AssignmentPageResponse;
import com.carbonos.ghg.internal.web.dto.AssignmentResponse;
import com.carbonos.ghg.internal.web.dto.AuditEventResponse;
import com.carbonos.ghg.internal.web.dto.BoundaryEntityResponse;
import com.carbonos.ghg.internal.web.dto.BoundaryExclusionRequest;
import com.carbonos.ghg.internal.web.dto.BoundaryExclusionResponse;
import com.carbonos.ghg.internal.web.dto.BoundaryTreatmentRequest;
import com.carbonos.ghg.internal.web.dto.BoundaryVersionResponse;
import com.carbonos.ghg.internal.web.dto.BoundaryVersionSummaryResponse;
import com.carbonos.ghg.internal.web.dto.ClassifyRequest;
import com.carbonos.ghg.internal.web.dto.ExcludeRequest;
import com.carbonos.ghg.internal.web.dto.FinalizeRequest;
import com.carbonos.ghg.internal.web.dto.ReopenRequest;
import com.carbonos.ghg.internal.web.dto.InventoryRequest;
import com.carbonos.ghg.internal.web.dto.InventoryResponse;
import com.carbonos.ghg.internal.web.dto.MarketFactorRequest;
import com.carbonos.ghg.internal.web.dto.MarketFactorResponse;
import com.carbonos.ghg.internal.web.dto.OperationalBoundaryRequest;
import com.carbonos.ghg.internal.web.dto.ReasonRequest;
import com.carbonos.ghg.internal.web.dto.ReportMetadataRequest;
import com.carbonos.ghg.internal.web.dto.ResidualMixRequest;
import com.carbonos.ghg.internal.web.dto.SupersedeRequest;
import com.carbonos.ghg.internal.web.dto.UpstreamRuleRequest;
import com.carbonos.ghg.internal.web.dto.UpstreamRuleResponse;
import com.carbonos.ghg.internal.web.dto.ValidationReportResponse;

import jakarta.validation.Valid;

/** Accounting views (spec 05): inventories, their lifecycle, boundaries, assignments, validation. */
@RestController
@RequestMapping("/api/ghg")
class InventoryController {

	private final InventoryService inventoryService;
	private final GhgService ghgService;
	private final ReportAssembler reports;

	InventoryController(InventoryService inventoryService, GhgService ghgService, ReportAssembler reports) {
		this.inventoryService = inventoryService;
		this.ghgService = ghgService;
		this.reports = reports;
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
				body.purpose(), body.baseYear(), body.consolidationApproach(), body.gwpSet(), body.straddleTreatment(),
				Boolean.TRUE.equals(body.prefillBoundary()), body.copyFromInventoryId());
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
				body.purpose(), body.baseYear(), body.consolidationApproach(), body.gwpSet(), body.straddleTreatment()));
	}

	/** Which months of the period have data, per facility and activity type (spec 04.2). */
	@GetMapping("/inventories/{id}/coverage")
	List<InventoryService.CoverageRow> coverage(@PathVariable UUID id) {
		return inventoryService.coverage(id);
	}

	@DeleteMapping("/inventories/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable UUID id) {
		inventoryService.delete(id);
	}

	@PutMapping("/inventories/{id}/operational-boundary")
	InventoryResponse operationalBoundary(@PathVariable UUID id, @Valid @RequestBody OperationalBoundaryRequest body) {
		return InventoryResponse.from(inventoryService.setOperationalBoundary(id, body.scope3Categories(),
				body.exclusionsRationale(), body.notQuantified() == null ? java.util.List.of()
						: body.notQuantified()
							.stream()
							.map(entry -> new com.carbonos.ghg.internal.Inventory.NotQuantified(entry.category(),
									entry.reason()))
							.toList()));
	}

	// --- boundary (spec 03.1, 03.2) -------------------------------------------

	@GetMapping("/inventories/{id}/boundary")
	List<BoundaryEntityResponse> boundary(@PathVariable UUID id) {
		var inventory = inventoryService.get(id);
		return boundaryOf(inventory);
	}

	private List<BoundaryEntityResponse> boundaryOf(Inventory inventory) {
		return inventoryService.boundaryView(inventory.getId())
			.stream()
			.map(view -> BoundaryEntityResponse.of(view, inventory.getConsolidationApproach()))
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

	// --- boundary exclusions (spec 07.2) --------------------------------------------

	@GetMapping("/inventories/{id}/boundary/exclusions")
	List<BoundaryExclusionResponse> boundaryExclusions(@PathVariable UUID id) {
		return inventoryService.boundaryExclusions(id).stream().map(BoundaryExclusionResponse::from).toList();
	}

	@PutMapping("/inventories/{id}/boundary/entities/{entityId}/exclude")
	BoundaryEntityResponse excludeEntity(@PathVariable UUID id, @PathVariable UUID entityId,
			@Valid @RequestBody BoundaryExclusionRequest body) {
		var inventory = inventoryService.get(id);
		inventoryService.excludeEntity(id, entityId, body.reason(), body.detail());
		return entityEntry(inventory, entityId);
	}

	@DeleteMapping("/inventories/{id}/boundary/entities/{entityId}/exclude")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void clearEntityExclusion(@PathVariable UUID id, @PathVariable UUID entityId) {
		inventoryService.clearEntityExclusion(id, entityId);
	}

	@PutMapping("/inventories/{id}/boundary/{facilityId}/exclude")
	BoundaryEntityResponse excludeFacility(@PathVariable UUID id, @PathVariable UUID facilityId,
			@Valid @RequestBody BoundaryExclusionRequest body) {
		var inventory = inventoryService.get(id);
		var exclusion = inventoryService.excludeFacility(id, facilityId, body.reason(), body.detail());
		return entityEntry(inventory, exclusion.getEntity().getId());
	}

	@DeleteMapping("/inventories/{id}/boundary/{facilityId}/exclude")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void clearFacilityExclusion(@PathVariable UUID id, @PathVariable UUID facilityId) {
		inventoryService.clearFacilityExclusion(id, facilityId);
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

	/** Reopening needs a reason (spec 05.5); the version it supersedes records it. */
	@PostMapping("/inventories/{id}/reopen")
	InventoryResponse reopen(@PathVariable UUID id, @RequestBody(required = false) ReopenRequest body) {
		return InventoryResponse.from(inventoryService.reopen(id, body == null ? null : body.reason()));
	}

	/** Designates the final run, with the reviewer's optional note (spec 05.5). */
	@PostMapping("/inventories/{id}/finalize")
	InventoryResponse finalizeInventory(@PathVariable UUID id, @Valid @RequestBody FinalizeRequest body) {
		return InventoryResponse.from(inventoryService.designateFinal(id, body.runId(), body.note()));
	}

	@PostMapping("/inventories/{id}/withdraw-final")
	InventoryResponse withdrawFinal(@PathVariable UUID id, @Valid @RequestBody ReasonRequest body) {
		return InventoryResponse.from(inventoryService.withdrawFinal(id, body.reason()));
	}

	/** The report header: approver, assurance, intensity denominators (spec 07.4). */
	@PutMapping("/inventories/{id}/report-metadata")
	InventoryResponse reportMetadata(@PathVariable UUID id, @Valid @RequestBody ReportMetadataRequest body) {
		return InventoryResponse.from(inventoryService.setReportMetadata(id, body.approvedBy(),
				body.assuranceLevel(), body.assuranceProvider(), body.assuranceStatement(), body.uncertaintyStatement(),
				body.intensityMetrics()
					.stream()
					.map(m -> new InventoryService.IntensityInput(m.name(), m.value(), m.unit()))
					.toList()));
	}

	/** The recorded acts on the inventory, newest first (spec 05.2). */
	@GetMapping("/inventories/{id}/events")
	List<AuditEventResponse> events(@PathVariable UUID id) {
		return inventoryService.events(id).stream().map(AuditEventResponse::from).toList();
	}

	/** Publishes, then keeps the final run's report exactly as it reads now (spec 05.3). */
	@PostMapping("/inventories/{id}/publish")
	InventoryResponse publish(@PathVariable UUID id) {
		var inventory = inventoryService.publish(id);
		reports.snapshotPublished(inventory.getId(), inventory.getFinalRunId());
		return InventoryResponse.from(inventoryService.get(id));
	}

	/** What the inventory inherited from its source (spec 05.3); 204 when nothing was copied. */
	@GetMapping("/inventories/{id}/inheritance")
	ResponseEntity<InventoryService.Inheritance> inheritance(@PathVariable UUID id) {
		return inventoryService.inheritance(id)
			.map(ResponseEntity::ok)
			.orElseGet(() -> ResponseEntity.noContent().build());
	}

	@PostMapping("/inventories/{id}/supersede")
	ResponseEntity<InventoryResponse> supersede(@PathVariable UUID id,
			@Valid @RequestBody(required = false) SupersedeRequest body) {
		var successor = inventoryService.supersede(id, body == null ? null : body.name(),
				body == null ? null : body.reason());
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
				body.kgCo2ePerKwh(), body.source(), body.qualityNotes(), body.coverage(), body.quality()));
	}

	/** Whether a residual mix is available for the instruments' markets (spec 07.2). */
	@PutMapping("/inventories/{id}/residual-mix")
	InventoryResponse residualMix(@PathVariable UUID id, @Valid @RequestBody ResidualMixRequest body) {
		return InventoryResponse.from(inventoryService.setResidualMix(id, body.available(), body.kgCo2ePerKwh()));
	}

	@DeleteMapping("/inventories/{id}/market-factors/{facilityId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void removeMarketFactor(@PathVariable UUID id, @PathVariable UUID facilityId) {
		inventoryService.removeMarketFactor(id, facilityId);
	}

	// --- upstream rules (spec 04.7) ---------------------------------------------

	@GetMapping("/inventories/{id}/upstream-rules")
	List<UpstreamRuleResponse> upstreamRules(@PathVariable UUID id) {
		return inventoryService.upstreamRules(id).stream().map(UpstreamRuleResponse::from).toList();
	}

	@PostMapping("/inventories/{id}/upstream-rules")
	@ResponseStatus(HttpStatus.CREATED)
	UpstreamRuleResponse addUpstreamRule(@PathVariable UUID id, @Valid @RequestBody UpstreamRuleRequest body) {
		var rule = inventoryService.addUpstreamRule(id, body.primaryFactorId(), body.upstreamFactorId(), body.kind());
		return UpstreamRuleResponse.from(new InventoryService.UpstreamRuleView(rule, 0));
	}

	@DeleteMapping("/inventories/{id}/upstream-rules/{ruleId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void removeUpstreamRule(@PathVariable UUID id, @PathVariable UUID ruleId) {
		inventoryService.removeUpstreamRule(id, ruleId);
	}

	// --- assignments --------------------------------------------------------

	@GetMapping("/inventories/{id}/assignments")
	List<AssignmentResponse> assignments(@PathVariable UUID id) {
		var assignments = inventoryService.listAssignments(id);
		var suggestions = inventoryService.suggestions(assignments);
		var published = inventoryService.publishedFacts(inventoryService.get(id));
		return assignments.stream()
			.map(a -> AssignmentResponse.from(a, suggestions.get(a.getId()),
					published.isEmpty() ? null : published.get(a.getActivity().getId())))
			.toList();
	}

	/** The activity view searched, filtered and paged, with the counts by status (spec 04.5). */
	@GetMapping("/inventories/{id}/assignments/page")
	AssignmentPageResponse assignmentsPage(@PathVariable UUID id, @RequestParam(required = false) String q,
			@RequestParam(required = false) UUID facilityId, @RequestParam(required = false) String status,
			@RequestParam(required = false) Scope scope, @RequestParam(required = false) ActivityCategory category,
			@RequestParam(required = false) UUID streamId, @RequestParam(required = false) LeaseType leaseType,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
		var result = inventoryService.searchAssignments(id, new InventoryService.AssignmentQuery(q, facilityId, status,
				scope, category, streamId, leaseType, page, size));
		return AssignmentPageResponse.from(result, inventoryService.suggestions(result.items()),
				inventoryService.publishedFacts(inventoryService.get(id)));
	}

	@PostMapping("/inventories/{id}/assignments/sync")
	InventoryService.SyncResult sync(@PathVariable UUID id) {
		return inventoryService.syncAssignments(id);
	}

	@PutMapping("/assignments/{id}/classify")
	AssignmentResponse classify(@PathVariable UUID id, @Valid @RequestBody ClassifyRequest body) {
		return AssignmentResponse.from(inventoryService.classify(id, body.emissionFactorId(), body.scope(),
				body.category(), body.leaseType(), body.scopeJustification(), Boolean.TRUE.equals(body.proxy()),
				body.proxyJustification(), body.densityId(), Boolean.TRUE.equals(body.ignoreFacilityLease())));
	}

	@PutMapping("/assignments/{id}/exclude")
	AssignmentResponse exclude(@PathVariable UUID id, @Valid @RequestBody ExcludeRequest body) {
		return AssignmentResponse.from(inventoryService.exclude(id, body.reason(), body.justification(),
				body.estimatedKgCo2e(), Boolean.TRUE.equals(body.notEstimated()),
				Boolean.TRUE.equals(body.emitsNothing()), body.gas()));
	}

	@PutMapping("/assignments/{id}/include")
	AssignmentResponse include(@PathVariable UUID id) {
		return AssignmentResponse.from(inventoryService.include(id));
	}

	// --- validation ---------------------------------------------------------

	@GetMapping("/inventories/{id}/validation")
	ValidationReportResponse validation(@PathVariable UUID id) {
		return ValidationReportResponse.from(inventoryService.validate(id), inventoryService.freezeBlockers(id));
	}
}
