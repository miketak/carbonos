package com.carbonos.ghg.internal.web;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.carbonos.ghg.internal.FactorPacks;
import com.carbonos.ghg.internal.GhgService;

/** The importable factor packs (spec 02.1). */
@RestController
@RequestMapping("/api/ghg")
class FactorPackController {

	/** A pack's header, without its factors. */
	record PackSummary(String id, String name, String source, String sourceUrl, Integer publicationYear,
			String gwpBasis, String license, String retrieved, int factorCount, String notes) {
		static PackSummary of(FactorPacks.Pack pack) {
			return new PackSummary(pack.id(), pack.name(), pack.source(), pack.sourceUrl(), pack.publicationYear(),
					pack.gwpBasis(), pack.license(), pack.retrieved(), pack.factors().size(), pack.notes());
		}
	}

	private final FactorPacks packs;
	private final GhgService ghgService;

	FactorPackController(FactorPacks packs, GhgService ghgService) {
		this.packs = packs;
		this.ghgService = ghgService;
	}

	@GetMapping("/factor-packs")
	List<PackSummary> list() {
		return packs.all().stream().map(PackSummary::of).toList();
	}

	@GetMapping("/factor-packs/{packId}")
	FactorPacks.Pack get(@PathVariable String packId) {
		return ghgService.pack(packId);
	}

	@PostMapping("/organizations/{organizationId}/factor-packs/{packId}/import")
	GhgService.ImportResult importPack(@PathVariable UUID organizationId, @PathVariable String packId) {
		return ghgService.importPack(organizationId, packId);
	}
}
