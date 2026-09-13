package com.carbonos.ghg.internal.web;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import java.util.Set;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.carbonos.ghg.internal.Dimension;
import com.carbonos.ghg.internal.EmissionFactor;
import com.carbonos.ghg.internal.FactorTier;
import com.carbonos.ghg.internal.GhgService;
import com.carbonos.ghg.internal.UnitConverter;
import com.carbonos.ghg.internal.web.dto.EmissionFactorFacetsResponse;
import com.carbonos.ghg.internal.web.dto.EmissionFactorPageResponse;
import com.carbonos.ghg.internal.web.dto.EmissionFactorRequest;
import com.carbonos.ghg.internal.web.dto.EmissionFactorResponse;

import jakarta.validation.Valid;

/** The shared factor library and each organization's own factors with their provenance (spec 02.1). */
@RestController
@RequestMapping("/api/ghg")
class EmissionFactorController {

	private final GhgService ghgService;
	private final UnitConverter units;

	EmissionFactorController(GhgService ghgService, UnitConverter units) {
		this.ghgService = ghgService;
		this.units = units;
	}

	@GetMapping("/emission-factors")
	List<EmissionFactorResponse> library() {
		return ghgService.listEmissionFactors().stream().map(this::toResponse).toList();
	}

	/**
	 * One page of the shared library and the organization's own factors (spec
	 * 02.1), filtered, ordered and paged by the database (FU-03).
	 *
	 * <p>{@code includeUnapproved=false} hides rows a preparer must not pick
	 * unseen (spec 02.3) and {@code q} searches name, publication, the
	 * publisher's taxonomy and the pack tags. {@code tier} chooses the shared
	 * library or the organization's own rows; {@code sourceCategory},
	 * {@code sourceActivity} and {@code sourceDetail} filter on the
	 * publisher's taxonomy (spec 02.5); {@code unit} and {@code dimension}
	 * narrow to the factors a record in a given unit can be classified with
	 * (spec 02.2); {@code ids} asks for named rows only, which is how a page
	 * of records resolves the factors it already references. The rows come
	 * back with the organization's own first, then the shared library.
	 */
	@GetMapping("/organizations/{organizationId}/emission-factors")
	EmissionFactorPageResponse list(@PathVariable UUID organizationId,
			@RequestParam(defaultValue = "true") boolean includeUnapproved,
			@RequestParam(required = false) String q,
			@RequestParam(defaultValue = "ALL") FactorTier tier,
			@RequestParam(required = false) String sourceCategory,
			@RequestParam(required = false) String sourceActivity,
			@RequestParam(required = false) String sourceDetail,
			@RequestParam(required = false) String unit,
			@RequestParam(required = false) List<Dimension> dimension,
			@RequestParam(required = false) List<UUID> ids,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "50") int size) {
		var query = new GhgService.FactorQuery(q, includeUnapproved, tier, sourceCategory, sourceActivity, sourceDetail,
				unit, dimension == null ? Set.of() : Set.copyOf(dimension), ids, page, size);
		var result = ghgService.searchEmissionFactors(organizationId, query);
		return new EmissionFactorPageResponse(result.items().stream().map(this::toResponse).toList(), result.page(),
				result.size(), result.total(), result.unapproved());
	}

	/** The values the picker's filters offer over the factors this organization can see (FU-03). */
	@GetMapping("/organizations/{organizationId}/emission-factors/facets")
	EmissionFactorFacetsResponse facets(@PathVariable UUID organizationId,
			@RequestParam(required = false) String sourceCategory) {
		var facets = ghgService.factorFacets(organizationId, sourceCategory);
		return new EmissionFactorFacetsResponse(facets.categories(), facets.activities(), facets.units());
	}

	@PostMapping("/organizations/{organizationId}/emission-factors")
	ResponseEntity<EmissionFactorResponse> create(@PathVariable UUID organizationId,
			@Valid @RequestBody EmissionFactorRequest body) {
		var factor = ghgService.createEmissionFactor(organizationId, facts(body));
		URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
			.path("/api/ghg/emission-factors/{id}")
			.buildAndExpand(factor.getId())
			.toUri();
		return ResponseEntity.created(location).body(toResponse(factor));
	}

	@PutMapping("/emission-factors/{id}")
	EmissionFactorResponse update(@PathVariable UUID id, @Valid @RequestBody EmissionFactorRequest body) {
		return toResponse(ghgService.updateEmissionFactor(id, facts(body)));
	}

	@PostMapping("/emission-factors/{id}/approve")
	EmissionFactorResponse approve(@PathVariable UUID id) {
		return toResponse(ghgService.setFactorApproval(id, true));
	}

	@PostMapping("/emission-factors/{id}/unapprove")
	EmissionFactorResponse unapprove(@PathVariable UUID id) {
		return toResponse(ghgService.setFactorApproval(id, false));
	}

	@DeleteMapping("/emission-factors/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	void delete(@PathVariable UUID id) {
		ghgService.deleteEmissionFactor(id);
	}

	private EmissionFactorResponse toResponse(EmissionFactor factor) {
		return EmissionFactorResponse.from(factor, units.dimensionOf(factor.getUnit()).orElse(null));
	}

	private static GhgService.FactorFacts facts(EmissionFactorRequest body) {
		var gases = new EmissionFactor.Gases(nz(body.co2KgPerUnit()), nz(body.ch4KgPerUnit()),
				body.ch4Fossil() == null || body.ch4Fossil(), nz(body.n2oKgPerUnit()), nz(body.hfcsKgPerUnit()),
				nz(body.pfcsKgPerUnit()), nz(body.sf6KgPerUnit()), nz(body.nf3KgPerUnit()),
				nz(body.biogenicCo2KgPerUnit()));
		var provenance = new EmissionFactor.Provenance(body.source().trim(), body.sourceUrl(), body.publicationYear(),
				body.dataYear(), body.validFrom(), body.validTo(), body.note());
		return new GhgService.FactorFacts(body.name(), body.defaultScope(), body.defaultCategory(),
				Boolean.TRUE.equals(body.scopeAgnostic()), body.unit(), body.kgCo2ePerUnit(), gases,
				body.blendComposition(), body.blendGwpSource(), provenance, body.approved() == null || body.approved(),
				body.reportingBasis());
	}

	private static BigDecimal nz(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
	}
}
