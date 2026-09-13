package com.carbonos.ghg.internal.web;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.carbonos.ghg.internal.FactorPackAdminService;
import com.carbonos.ghg.internal.FactorPackBlastRadius;
import com.carbonos.ghg.internal.FactorPackValidation;
import com.carbonos.ghg.internal.web.dto.AdminFactorPackResponse;
import com.carbonos.ghg.internal.web.dto.AdminFactorPackRowResponse;
import com.carbonos.ghg.internal.web.dto.FactorPackChangeResponse;
import com.carbonos.ghg.internal.web.dto.FactorPackEditionRequest;
import com.carbonos.ghg.internal.web.dto.FactorPackEventResponse;
import com.carbonos.ghg.internal.web.dto.FactorPackEvidenceResponse;
import com.carbonos.ghg.internal.web.dto.FactorPackFamilyRequest;
import com.carbonos.ghg.internal.web.dto.FactorPackPublishRequest;
import com.carbonos.ghg.internal.web.dto.FactorPackRowRequest;
import com.carbonos.ghg.internal.web.dto.FactorPackWithdrawRequest;

import jakarta.validation.Valid;

/**
 * The factor pack maintenance console (spec 02.5). Under
 * {@code /api/admin/**}, which the security filter reserves for the ADMIN
 * platform role, and checked again in {@code FactorPackAdminService}.
 *
 * <p>It carries both halves of the console: families, drafts, cloning, rows and
 * the live validation report, then the evidence upload, the blast radius, the
 * publication gate, the frozen change log and the withdrawal.
 */
@RestController
@RequestMapping("/api/admin/factor-packs")
class FactorPackAdminController {

	private final FactorPackAdminService console;

	FactorPackAdminController(FactorPackAdminService console) {
		this.console = console;
	}

	@GetMapping
	List<AdminFactorPackResponse> list() {
		return console.listFamilies().stream().map(AdminFactorPackResponse::from).toList();
	}

	@PostMapping
	ResponseEntity<AdminFactorPackResponse> createFamily(@Valid @RequestBody FactorPackFamilyRequest request) {
		var family = console.createFamily(new FactorPackAdminService.FamilyFacts(request.packKey(), request.name(),
				request.kind(), request.summary()));
		var view = new FactorPackAdminService.FamilyView(family, List.of());
		return ResponseEntity.created(URI.create("/api/admin/factor-packs/" + family.getPackKey()))
			.body(AdminFactorPackResponse.from(view));
	}

	@PostMapping("/{packKey}/editions")
	ResponseEntity<AdminFactorPackResponse.Edition> createEdition(@PathVariable String packKey,
			@Valid @RequestBody FactorPackEditionRequest request) {
		var view = console.createEdition(packKey,
				new FactorPackAdminService.DraftFacts(request.editionId(), request.facts(), request.cloneFrom()));
		return ResponseEntity
			.created(URI.create("/api/admin/factor-packs/editions/" + view.edition().getEditionId()))
			.body(AdminFactorPackResponse.Edition.from(view));
	}

	@GetMapping("/editions/{editionId}")
	AdminFactorPackResponse.Edition edition(@PathVariable String editionId) {
		return AdminFactorPackResponse.Edition.from(console.edition(editionId));
	}

	@PutMapping("/editions/{editionId}")
	AdminFactorPackResponse.Edition updateEdition(@PathVariable String editionId,
			@Valid @RequestBody FactorPackEditionRequest request) {
		return AdminFactorPackResponse.Edition.from(console.updateEdition(editionId, request.facts()));
	}

	@DeleteMapping("/editions/{editionId}")
	ResponseEntity<Void> deleteEdition(@PathVariable String editionId) {
		console.deleteEdition(editionId);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/editions/{editionId}/rows")
	AdminFactorPackRowResponse.Page rows(@PathVariable String editionId,
			@RequestParam(required = false) String sourceCategory,
			@RequestParam(required = false) String sourceActivity, @RequestParam(required = false) String unit,
			@RequestParam(required = false) String search, @RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "50") int size) {
		return AdminFactorPackRowResponse.Page
			.from(console.rows(editionId, sourceCategory, sourceActivity, unit, search, page, size));
	}

	@PostMapping("/editions/{editionId}/rows")
	ResponseEntity<AdminFactorPackRowResponse> addRow(@PathVariable String editionId,
			@Valid @RequestBody FactorPackRowRequest request) {
		var row = console.addRow(editionId, request.facts());
		return ResponseEntity.created(URI.create("/api/admin/factor-packs/editions/" + editionId + "/rows/"
				+ row.getId())).body(AdminFactorPackRowResponse.from(row));
	}

	@PutMapping("/editions/{editionId}/rows/{rowId}")
	AdminFactorPackRowResponse updateRow(@PathVariable String editionId, @PathVariable UUID rowId,
			@Valid @RequestBody FactorPackRowRequest request) {
		return AdminFactorPackRowResponse.from(console.updateRow(rowId, request.facts()));
	}

	@DeleteMapping("/editions/{editionId}/rows/{rowId}")
	ResponseEntity<Void> deleteRow(@PathVariable String editionId, @PathVariable UUID rowId) {
		console.deleteRow(rowId);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/editions/{editionId}/validation")
	List<FactorPackValidation.Finding> validation(@PathVariable String editionId) {
		return console.validate(editionId);
	}

	// --- publication --------------------------------------------------------

	/** The source document the edition is published against, stored with its SHA-256. */
	@PostMapping("/editions/{editionId}/evidence")
	FactorPackEvidenceResponse attachEvidence(@PathVariable String editionId,
			@RequestParam("file") MultipartFile file) {
		return FactorPackEvidenceResponse.from(console.attachEvidence(editionId, file));
	}

	/** The stored source document, so an approver can read what they are signing. */
	@GetMapping("/editions/{editionId}/evidence")
	ResponseEntity<org.springframework.core.io.Resource> evidence(@PathVariable String editionId) {
		var stored = console.openEvidence(editionId);
		return ResponseEntity.ok()
			.contentType(org.springframework.http.MediaType.parseMediaType(stored.contentType()))
			.contentLength(stored.contentLength())
			.body(new org.springframework.core.io.InputStreamResource(stored.content()));
	}

	/** What publishing (or withdrawing) this edition would do to every holder. */
	@GetMapping("/editions/{editionId}/blast-radius")
	FactorPackBlastRadius.Report blastRadius(@PathVariable String editionId) {
		return console.blastRadius(editionId);
	}

	/** The change log the edition froze at publication, computed against the predecessor. */
	@GetMapping("/editions/{editionId}/changes")
	List<FactorPackChangeResponse> changes(@PathVariable String editionId) {
		return console.changes(editionId).stream().map(FactorPackChangeResponse::from).toList();
	}

	/** The publication trail: the evidence, the publication, the supersession, the withdrawal. */
	@GetMapping("/editions/{editionId}/events")
	List<FactorPackEventResponse> events(@PathVariable String editionId) {
		return console.trail(editionId).stream().map(FactorPackEventResponse::from).toList();
	}

	@PostMapping("/editions/{editionId}/publish")
	AdminFactorPackResponse.Edition publish(@PathVariable String editionId,
			@Valid @RequestBody FactorPackPublishRequest request) {
		return AdminFactorPackResponse.Edition.from(console.publish(editionId, request.toRequest()));
	}

	@PostMapping("/editions/{editionId}/withdraw")
	AdminFactorPackResponse.Edition withdraw(@PathVariable String editionId,
			@Valid @RequestBody FactorPackWithdrawRequest request) {
		return AdminFactorPackResponse.Edition.from(console.withdraw(editionId, request.reason()));
	}
}
