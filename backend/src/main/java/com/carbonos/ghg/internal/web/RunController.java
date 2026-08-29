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

import com.carbonos.ghg.internal.GhgService;
import com.carbonos.ghg.internal.web.dto.RunDetailResponse;
import com.carbonos.ghg.internal.web.dto.RunRequest;
import com.carbonos.ghg.internal.web.dto.RunResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/ghg")
class RunController {

	private final GhgService ghgService;

	RunController(GhgService ghgService) {
		this.ghgService = ghgService;
	}

	@GetMapping("/organizations/{organizationId}/runs")
	List<RunResponse> list(@PathVariable UUID organizationId) {
		return ghgService.listRuns(organizationId).stream().map(RunResponse::from).toList();
	}

	@PostMapping("/organizations/{organizationId}/runs")
	ResponseEntity<RunDetailResponse> execute(@PathVariable UUID organizationId,
			@Valid @RequestBody RunRequest body) {
		var run = ghgService.executeRun(organizationId, body.label(), body.periodStart(), body.periodEnd());
		URI location = ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/ghg/runs/{id}")
			.buildAndExpand(run.getId()).toUri();
		return ResponseEntity.created(location).body(RunDetailResponse.from(run));
	}

	@GetMapping("/runs/{id}")
	RunDetailResponse get(@PathVariable UUID id) {
		return RunDetailResponse.from(ghgService.getRun(id));
	}

	@DeleteMapping("/runs/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable UUID id) {
		ghgService.deleteRun(id);
	}
}
