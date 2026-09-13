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

import com.carbonos.ghg.internal.FactorPackAdminService;
import com.carbonos.ghg.internal.FactorPackValidation;
import com.carbonos.ghg.internal.web.dto.AdminFactorPackResponse;
import com.carbonos.ghg.internal.web.dto.AdminFactorPackRowResponse;
import com.carbonos.ghg.internal.web.dto.FactorPackEditionRequest;
import com.carbonos.ghg.internal.web.dto.FactorPackFamilyRequest;
import com.carbonos.ghg.internal.web.dto.FactorPackRowRequest;

import jakarta.validation.Valid;

/**
 * The factor pack maintenance console (spec 02.5). Under
 * {@code /api/admin/**}, which the security filter reserves for the ADMIN
 * platform role, and checked again in {@code FactorPackAdminService}.
 *
 * <p>This is the authoring half: families, drafts, cloning, rows and the live
 * validation report. Publication, the evidence upload, the blast radius and the
 * notices arrive with the publication phase, and {@code POST .../publish}
 * refuses plainly until they do.
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

	@PostMapping("/editions/{editionId}/publish")
	ResponseEntity<Void> publish(@PathVariable String editionId) {
		console.publish(editionId);
		return ResponseEntity.noContent().build();
	}
}
