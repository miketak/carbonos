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
import com.carbonos.ghg.internal.web.dto.SourceStreamRequest;
import com.carbonos.ghg.internal.web.dto.SourceStreamResponse;

import jakarta.validation.Valid;

/** The register of source streams per facility (spec 04.3). */
@RestController
@RequestMapping("/api/ghg")
class SourceStreamController {

	private final GhgService ghgService;

	SourceStreamController(GhgService ghgService) {
		this.ghgService = ghgService;
	}

	@GetMapping("/organizations/{organizationId}/streams")
	List<SourceStreamResponse> listAll(@PathVariable UUID organizationId) {
		return ghgService.listStreams(organizationId).stream().map(SourceStreamResponse::from).toList();
	}

	@GetMapping("/facilities/{facilityId}/streams")
	List<SourceStreamResponse> list(@PathVariable UUID facilityId) {
		return ghgService.listStreamsOfFacility(facilityId).stream().map(SourceStreamResponse::from).toList();
	}

	@PostMapping("/facilities/{facilityId}/streams")
	ResponseEntity<SourceStreamResponse> create(@PathVariable UUID facilityId,
			@Valid @RequestBody SourceStreamRequest body) {
		var stream = ghgService.createStream(facilityId, facts(body));
		URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
			.path("/api/ghg/streams/{id}")
			.buildAndExpand(stream.getId())
			.toUri();
		return ResponseEntity.created(location).body(SourceStreamResponse.from(stream));
	}

	@PutMapping("/streams/{id}")
	SourceStreamResponse update(@PathVariable UUID id, @Valid @RequestBody SourceStreamRequest body) {
		return SourceStreamResponse.from(ghgService.updateStream(id, facts(body)));
	}

	@DeleteMapping("/streams/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable UUID id) {
		ghgService.deleteStream(id);
	}

	private static GhgService.StreamFacts facts(SourceStreamRequest body) {
		return new GhgService.StreamFacts(body.name(), body.kind(), body.fuel(), body.meterOrSupplier(),
				Boolean.TRUE.equals(body.contractorOperated()), body.note());
	}
}
