package com.carbonos.ghg.internal.web;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.carbonos.ghg.internal.ActivityImportService;
import com.carbonos.ghg.internal.ActivityStatus;
import com.carbonos.ghg.internal.GhgService;
import com.carbonos.ghg.internal.web.dto.ActivityImportResponse;
import com.carbonos.ghg.internal.web.dto.ActivityPageResponse;
import com.carbonos.ghg.internal.web.dto.ActivityResponse;
import com.carbonos.ghg.internal.web.dto.ActivityRevisionResponse;
import com.carbonos.ghg.internal.web.dto.CreateActivityRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/ghg")
class ActivityController {

	private final GhgService ghgService;
	private final ActivityImportService imports;

	ActivityController(GhgService ghgService, ActivityImportService imports) {
		this.ghgService = ghgService;
		this.imports = imports;
	}

	@GetMapping("/organizations/{organizationId}/activities")
	List<ActivityResponse> list(@PathVariable UUID organizationId) {
		return ghgService.listActivities(organizationId).stream().map(ActivityResponse::from).toList();
	}

	/** The register searched, filtered, sorted and paged (spec 04.5), with the counts by readiness (spec 04.6). */
	@GetMapping("/organizations/{organizationId}/activities/page")
	ActivityPageResponse page(@PathVariable UUID organizationId, @RequestParam(required = false) String q,
			@RequestParam(required = false) UUID facilityId, @RequestParam(required = false) UUID streamId,
			@RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to,
			@RequestParam(required = false) ActivityStatus status,
			@RequestParam(defaultValue = "periodEnd") String sort, @RequestParam(defaultValue = "desc") String dir,
			@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
		return ActivityPageResponse.from(ghgService.searchActivities(organizationId, new GhgService.ActivityQuery(q,
				facilityId, streamId, from, to, status, sort, !"asc".equalsIgnoreCase(dir), page, size)));
	}

	@GetMapping("/activities/{id}")
	ActivityResponse get(@PathVariable UUID id) {
		return ActivityResponse.from(ghgService.summary(id));
	}

	/** Bulk entry from a CSV file: all rows or none (spec 04.5); a dry run previews without saving (spec 04.6). */
	@PostMapping(path = "/organizations/{organizationId}/activities/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	ActivityImportResponse importFile(@PathVariable UUID organizationId, @RequestPart("file") MultipartFile file,
			@RequestParam(defaultValue = "false") boolean dryRun) {
		return ActivityImportResponse
			.from(dryRun ? imports.preview(organizationId, file) : imports.importFile(organizationId, file));
	}

	@GetMapping(value = "/organizations/{organizationId}/activities/import-template.csv", produces = "text/csv")
	ResponseEntity<byte[]> template(@PathVariable UUID organizationId) {
		ghgService.getOrganization(organizationId);
		return ResponseEntity.ok()
			.contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
			.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
				.filename("activity-import-template.csv", StandardCharsets.UTF_8)
				.build()
				.toString())
			.body(ActivityImportService.template().getBytes(StandardCharsets.UTF_8));
	}

	@PostMapping("/organizations/{organizationId}/activities")
	ResponseEntity<ActivityResponse> create(@PathVariable UUID organizationId,
			@Valid @RequestBody CreateActivityRequest body) {
		var activity = ghgService.createActivity(organizationId, body.toFacts());
		URI location = ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/ghg/activities/{id}")
			.buildAndExpand(activity.getId()).toUri();
		return ResponseEntity.created(location).body(ActivityResponse.from(ghgService.summary(activity.getId())));
	}

	/**
	 * A correction: the new facts and the reason (spec 04.4); the revision history
	 * keeps the old values. A draft is edited without a reason and entered as a
	 * fact with an ENTERED revision (spec 04.6).
	 */
	@PutMapping("/activities/{id}")
	ActivityResponse update(@PathVariable UUID id, @Valid @RequestBody CreateActivityRequest body) {
		var activity = ghgService.updateActivity(id, body.toFacts(), body.reason());
		return ActivityResponse.from(ghgService.summary(activity.getId()));
	}

	@GetMapping("/activities/{id}/revisions")
	List<ActivityRevisionResponse> revisions(@PathVariable UUID id) {
		return ghgService.revisions(id).stream().map(ActivityRevisionResponse::from).toList();
	}

	/** Removes the record with a reason; it stays as a tombstone (spec 04.4). */
	@DeleteMapping("/activities/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable UUID id, @RequestParam(required = false) String reason) {
		ghgService.deleteActivity(id, reason);
	}
}
