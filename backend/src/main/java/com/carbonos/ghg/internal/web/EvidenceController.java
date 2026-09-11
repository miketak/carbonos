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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.carbonos.ghg.internal.EvidenceService;
import com.carbonos.ghg.internal.EvidenceService.DocumentFilter;
import com.carbonos.ghg.internal.EvidenceService.Owner;
import com.carbonos.ghg.internal.web.dto.EvidenceDocumentResponse;
import com.carbonos.ghg.internal.web.dto.EvidenceLinkRequest;
import com.carbonos.ghg.internal.web.dto.EvidenceResponse;
import com.carbonos.ghg.internal.web.dto.ImportBatchResponse;
import com.carbonos.ghg.internal.web.dto.PageResponse;

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

	/** The organization's source documents, paged (spec 04.6). */
	@GetMapping("/organizations/{organizationId}/evidence/page")
	PageResponse<EvidenceDocumentResponse> documents(@PathVariable UUID organizationId,
			@RequestParam(required = false) String q, @RequestParam(required = false) UUID facilityId,
			@RequestParam(defaultValue = "ALL") DocumentFilter filter, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "24") int size) {
		var result = evidenceService.pageOfOrganization(organizationId, q, facilityId, filter, page, size);
		return new PageResponse<>(result.items().stream().map(EvidenceDocumentResponse::from).toList(),
				result.page(), result.size(), result.total());
	}

	/** The evidence index for the verifier's pack (spec 04.6). */
	@GetMapping(value = "/organizations/{organizationId}/evidence/index.csv", produces = "text/csv")
	ResponseEntity<byte[]> index(@PathVariable UUID organizationId) {
		return ResponseEntity.ok()
			.contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
			.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
				.filename("evidence-index.csv", StandardCharsets.UTF_8)
				.build()
				.toString())
			.body(evidenceService.index(organizationId).getBytes(StandardCharsets.UTF_8));
	}

	/** The files each CSV import came from (spec 04.6). */
	@GetMapping("/organizations/{organizationId}/import-batches")
	List<ImportBatchResponse> importBatches(@PathVariable UUID organizationId) {
		return evidenceService.importBatches(organizationId).stream().map(ImportBatchResponse::from).toList();
	}

	@GetMapping("/import-batches/{id}/file")
	ResponseEntity<InputStreamResource> importFile(@PathVariable UUID id) {
		var download = evidenceService.openImport(id);
		return ResponseEntity.ok()
			.contentType(MediaType.parseMediaType(download.media().contentType()))
			.contentLength(download.media().contentLength())
			.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
				.filename(download.batch().getFileName(), StandardCharsets.UTF_8)
				.build()
				.toString())
			.body(new InputStreamResource(download.media().content()));
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
