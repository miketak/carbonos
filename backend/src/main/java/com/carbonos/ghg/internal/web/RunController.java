package com.carbonos.ghg.internal.web;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.carbonos.ghg.internal.InventoryService;
import com.carbonos.ghg.internal.web.dto.FinalNoteRequest;
import com.carbonos.ghg.internal.web.dto.InventoryResponse;
import com.carbonos.ghg.internal.web.dto.ReasonRequest;
import com.carbonos.ghg.internal.web.dto.RunDetailResponse;
import com.carbonos.ghg.internal.web.dto.RunRequest;
import com.carbonos.ghg.internal.web.dto.RunResponse;

import jakarta.validation.Valid;

/** Calculation runs: immutable snapshots of an inventory view (spec 05). */
@RestController
@RequestMapping("/api/ghg")
class RunController {

	private final InventoryService inventoryService;

	RunController(InventoryService inventoryService) {
		this.inventoryService = inventoryService;
	}

	@GetMapping("/inventories/{inventoryId}/runs")
	List<RunResponse> list(@PathVariable UUID inventoryId) {
		return inventoryService.listRuns(inventoryId).stream().map(RunResponse::from).toList();
	}

	@PostMapping("/inventories/{inventoryId}/runs")
	ResponseEntity<RunDetailResponse> execute(@PathVariable UUID inventoryId, @Valid @RequestBody RunRequest body) {
		var run = inventoryService.executeRun(inventoryId, body.label());
		URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
			.path("/api/ghg/runs/{id}")
			.buildAndExpand(run.getId())
			.toUri();
		return ResponseEntity.created(location).body(RunDetailResponse.from(run));
	}

	@GetMapping("/runs/{id}")
	RunDetailResponse get(@PathVariable UUID id) {
		return RunDetailResponse.from(inventoryService.getRun(id));
	}

	/** Designates this run as its inventory's final run (spec 05.1); the inventory moves to FINAL. */
	@PostMapping("/runs/{id}/finalize")
	InventoryResponse finalizeRun(@PathVariable UUID id, @Valid @RequestBody(required = false) FinalNoteRequest body) {
		var run = inventoryService.getRun(id);
		return InventoryResponse.from(inventoryService.designateFinal(run.getInventory().getId(), id,
				body == null ? null : body.note()));
	}

	/** Voids the run with a reason (spec 05.2); it stays on the record with its number. */
	@PostMapping("/runs/{id}/void")
	RunResponse voidRun(@PathVariable UUID id, @Valid @RequestBody ReasonRequest body) {
		return RunResponse.from(inventoryService.voidRun(id, body.reason()));
	}
}
