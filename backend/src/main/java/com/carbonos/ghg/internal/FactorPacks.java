package com.carbonos.ghg.internal;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import tools.jackson.databind.ObjectMapper;

/**
 * The importable factor packs shipped with the server (spec 02.1): JSON files
 * built from published tables (DESNZ, EPA Hub, Ember, IPCC, NGA) by
 * {@code scripts/gen-factor-packs.py}. Loaded once and kept in memory.
 */
@Component
public class FactorPacks {

	/** One factor of a pack, exactly as the file states it. */
	public record PackFactor(String code, String name, Scope defaultScope, ActivityCategory defaultCategory,
			boolean scopeAgnostic, String unit, BigDecimal kgCo2ePerUnit, BigDecimal co2, BigDecimal ch4,
			boolean ch4Fossil, BigDecimal n2o, BigDecimal hfcsKg, BigDecimal pfcsKg, BigDecimal sf6, BigDecimal nf3,
			String blendComposition, String blendGwpSource, BigDecimal biogenicCo2, Integer dataYear,
			String sourceDetail, boolean approved, String notes) {
	}

	public record Pack(String id, String name, String source, String sourceUrl, Integer publicationYear,
			String gwpBasis, String license, String retrieved, String notes, List<PackFactor> factors) {
	}

	private final Map<String, Pack> packs;

	FactorPacks(ObjectMapper mapper) {
		var loaded = new LinkedHashMap<String, Pack>();
		try {
			for (var resource : new PathMatchingResourcePatternResolver().getResources("classpath:factor-packs/*.json")) {
				try (var in = resource.getInputStream()) {
					var pack = mapper.readValue(in, Pack.class);
					loaded.put(pack.id(), pack);
				}
			}
		}
		catch (IOException ex) {
			throw new UncheckedIOException("Could not load the factor packs", ex);
		}
		this.packs = Map.copyOf(loaded);
	}

	public List<Pack> all() {
		return packs.values().stream().sorted(java.util.Comparator.comparing(Pack::id)).toList();
	}

	public Optional<Pack> find(String id) {
		return Optional.ofNullable(packs.get(id));
	}
}
