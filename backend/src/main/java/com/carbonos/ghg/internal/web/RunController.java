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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.carbonos.ghg.internal.InventoryService;
import com.carbonos.ghg.internal.web.dto.InventoryResponse;
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
		URI location = ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/ghg/runs/{id}")
			.buildAndExpand(run.getId()).toUri();
		return ResponseEntity.created(location).body(RunDetailResponse.from(run));
	}

	@GetMapping("/runs/{id}")
	RunDetailResponse get(@PathVariable UUID id) {
		return RunDetailResponse.from(inventoryService.getRun(id));
	}

	@PostMapping("/runs/{id}/finalize")
	InventoryResponse finalizeRun(@PathVariable UUID id) {
		return InventoryResponse.from(inventoryService.finalizeRun(id));
	}

	@DeleteMapping("/runs/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable UUID id) {
		inventoryService.deleteRun(id);
	}
}
