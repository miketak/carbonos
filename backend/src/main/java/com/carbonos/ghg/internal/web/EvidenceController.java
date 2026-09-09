package com.carbonos.ghg.internal.web;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.carbonos.ghg.internal.EvidenceService;
import com.carbonos.ghg.internal.EvidenceService.Owner;
import com.carbonos.ghg.internal.web.dto.EvidenceLinkRequest;
import com.carbonos.ghg.internal.web.dto.EvidenceResponse;

import jakarta.validation.Valid;

/** Evidence attached to records and to contractual instruments (spec 04.4). */
@RestController
@RequestMapping("/api/ghg")
class EvidenceController {

	private final EvidenceService evidenceService;

	EvidenceController(EvidenceService evidenceService) {
		this.evidenceService = evidenceService;
	}

	@GetMapping("/activities/{id}/evidence")
	List<EvidenceResponse> ofActivity(@PathVariable UUID id) {
		return evidenceService.list(Owner.activity(id)).stream().map(EvidenceResponse::from).toList();
	}

	@PostMapping(path = "/activities/{id}/evidence", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseStatus(HttpStatus.CREATED)
	EvidenceResponse uploadForActivity(@PathVariable UUID id, @RequestPart("file") MultipartFile file) {
		return EvidenceResponse.from(evidenceService.attachFile(Owner.activity(id), file));
	}

	@PostMapping("/activities/{id}/evidence/links")
	@ResponseStatus(HttpStatus.CREATED)
	EvidenceResponse linkForActivity(@PathVariable UUID id, @Valid @RequestBody EvidenceLinkRequest body) {
		return EvidenceResponse.from(evidenceService.attachLink(Owner.activity(id), body.name(), body.url()));
	}

	@GetMapping("/market-factors/{id}/evidence")
	List<EvidenceResponse> ofInstrument(@PathVariable UUID id) {
		return evidenceService.list(Owner.marketFactor(id)).stream().map(EvidenceResponse::from).toList();
	}

	@PostMapping(path = "/market-factors/{id}/evidence", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseStatus(HttpStatus.CREATED)
	EvidenceResponse uploadForInstrument(@PathVariable UUID id, @RequestPart("file") MultipartFile file) {
		return EvidenceResponse.from(evidenceService.attachFile(Owner.marketFactor(id), file));
	}

	@PostMapping("/market-factors/{id}/evidence/links")
	@ResponseStatus(HttpStatus.CREATED)
	EvidenceResponse linkForInstrument(@PathVariable UUID id, @Valid @RequestBody EvidenceLinkRequest body) {
		return EvidenceResponse.from(evidenceService.attachLink(Owner.marketFactor(id), body.name(), body.url()));
	}

	/** The file itself, as an attachment. */
	@GetMapping("/evidence/{id}")
	ResponseEntity<InputStreamResource> download(@PathVariable UUID id) {
		var download = evidenceService.open(id);
		return ResponseEntity.ok()
			.contentType(MediaType.parseMediaType(download.media().contentType()))
			.contentLength(download.media().contentLength())
			.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
				.filename(download.evidence().getName(), StandardCharsets.UTF_8)
				.build()
				.toString())
			.body(new InputStreamResource(download.media().content()));
	}

	@DeleteMapping("/evidence/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable UUID id) {
		evidenceService.delete(id);
	}
}
