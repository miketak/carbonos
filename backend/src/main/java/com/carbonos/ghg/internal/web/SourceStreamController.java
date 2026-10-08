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
import com.carbonos.ghg.internal.SourceStream;
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
		return withCounts(ghgService.listStreams(organizationId), organizationId);
	}

	@GetMapping("/facilities/{facilityId}/streams")
	List<SourceStreamResponse> list(@PathVariable UUID facilityId) {
		var streams = ghgService.listStreamsOfFacility(facilityId);
		return streams.isEmpty() ? List.of()
				: withCounts(streams, streams.getFirst().getFacility().getOrganization().getId());
	}

	private List<SourceStreamResponse> withCounts(List<SourceStream> streams, UUID organizationId) {
		var counts = ghgService.recordCountsByStream(organizationId);
		return streams.stream().map(stream -> SourceStreamResponse.from(stream, counts.getOrDefault(stream.getId(), 0L)))
			.toList();
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
		var stream = ghgService.updateStream(id, facts(body), body.reclassifyReason());
		return SourceStreamResponse.from(stream, ghgService.recordCount(stream));
	}

	@DeleteMapping("/streams/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable UUID id) {
		ghgService.deleteStream(id);
	}

	private static GhgService.StreamFacts facts(SourceStreamRequest body) {
		return body.toFacts();
	}
}
