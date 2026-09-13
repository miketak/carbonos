package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * The importable factor packs, read from the catalogue (specs 02.1 and 02.5). A
 * pack was a JSON file compiled into the server; it is now a published edition
 * of a family in {@code ghg_factor_pack_editions}, with its rows beside it, so a
 * maintainer can correct a row without a release and a citation names one
 * vintage forever.
 *
 * <p>{@code Pack} and {@code PackFactor} keep the shape the tenant-facing read
 * path and the import already speak. They carry no status, applies-from,
 * curator or approver: the authoring console of spec 02.5 answers with its own
 * records.
 */
@Component
public class FactorPacks {

	/**
	 * One factor of a pack, exactly as the edition states it. A pack is a
	 * selection, so a row carries the provenance of the publication it comes
	 * from ({@code sourcePublication}, {@code sourceUrl},
	 * {@code publicationYear}), not the pack's (spec 02.3); a row written
	 * before that change leaves them null and the pack's provenance stands in.
	 *
	 * <p>The publisher's taxonomy is three fields, not one concatenation (spec
	 * 02.5): the category, the activity and the detail are what tell two rows
	 * sharing a display name apart. The citation quotes all three as one path,
	 * which is what the concatenation held.
	 */
	public record PackFactor(String code, String name, Scope defaultScope, ActivityCategory defaultCategory,
			boolean scopeAgnostic, String unit, BigDecimal kgCo2ePerUnit, BigDecimal co2, BigDecimal ch4,
			boolean ch4Fossil, BigDecimal n2o, BigDecimal hfcsKg, BigDecimal pfcsKg, BigDecimal sf6, BigDecimal nf3,
			String blendComposition, String blendGwpSource, BigDecimal biogenicCo2, Integer dataYear,
			String sourceCategory, String sourceActivity, String sourceDetail, boolean approved, String notes,
			String sourcePublication, String sourceUrl, Integer publicationYear, ReportingBasis reportingBasis) {

		/** The publisher's category, activity and detail as one path, or null when the row records none. */
		public String sourcePath() {
			var path = Stream.of(sourceCategory, sourceActivity, sourceDetail)
				.filter(part -> part != null && !part.isBlank())
				.collect(Collectors.joining(" / "));
			return path.isBlank() ? null : path;
		}

		/** The publication the row comes from, or the pack's when the row predates spec 02.3. */
		public String citation(Pack pack) {
			var publication = sourcePublication == null || sourcePublication.isBlank() ? pack.source()
					: sourcePublication;
			var path = sourcePath();
			return path == null ? publication : publication + ": " + path;
		}

		public String citationUrl(Pack pack) {
			return sourceUrl == null || sourceUrl.isBlank() ? pack.sourceUrl() : sourceUrl;
		}

		public Integer citationYear(Pack pack) {
			return publicationYear == null ? pack.publicationYear() : publicationYear;
		}

		/** SCOPES unless the row says otherwise (spec 02.4). */
		public ReportingBasis basis() {
			return reportingBasis == null ? ReportingBasis.SCOPES : reportingBasis;
		}
	}

	public record Pack(String id, String name, String source, String sourceUrl, Integer publicationYear,
			String gwpBasis, String license, String retrieved, String notes, List<PackFactor> factors) {
	}

	/**
	 * A pack's header with its row total counted in the database (spec 02.5), so
	 * listing the packs never assembles the 2,836 rows they hold between them.
	 */
	public record PackHeader(String id, String name, String source, String sourceUrl, Integer publicationYear,
			String gwpBasis, String license, String retrieved, String notes, int factorCount) {
	}

	private final FactorPackEditionRepository editions;

	private final FactorPackRowRepository rows;

	// Assembled packs and the header list, kept per instance and dropped after a publish, supersede or
	// withdraw commits. One backend instance per environment, as Railway runs today (spec 02.5).
	private final Map<String, Pack> assembled = new ConcurrentHashMap<>();

	private volatile List<PackHeader> headers;

	FactorPacks(FactorPackEditionRepository editions, FactorPackRowRepository rows) {
		this.editions = editions;
		this.rows = rows;
	}

	/** The published editions' headers, by identifier. */
	public List<PackHeader> headers() {
		var cached = headers;
		if (cached != null) {
			return cached;
		}
		var counts = editions.countRowsByEdition()
			.stream()
			.collect(Collectors.toMap(row -> (String) row[0], row -> ((Number) row[1]).intValue()));
		var built = editions.findAllByStatusOrderByEditionIdAsc(FactorPackStatus.PUBLISHED)
			.stream()
			.map(edition -> new PackHeader(edition.getEditionId(), edition.getName(), edition.getSource(),
					edition.getSourceUrl(), edition.getPublicationYear(), edition.getGwpBasis(), edition.getLicense(),
					edition.getRetrieved(), edition.getNotes(), counts.getOrDefault(edition.getEditionId(), 0)))
			.toList();
		headers = built;
		return built;
	}

	/** Every published edition with its rows, by identifier. */
	public List<Pack> all() {
		return headers().stream()
			.map(header -> find(header.id()))
			.flatMap(Optional::stream)
			.sorted(Comparator.comparing(Pack::id))
			.toList();
	}

	/**
	 * One edition with its rows. A draft is never visible to an organization; a
	 * superseded or withdrawn edition stays readable by identifier, so a past
	 * import can still be explained (spec 02.5).
	 */
	public Optional<Pack> find(String editionId) {
		if (editionId == null) {
			return Optional.empty();
		}
		var cached = assembled.get(editionId);
		if (cached != null) {
			return Optional.of(cached);
		}
		return editions.findByEditionIdAndStatusNot(editionId, FactorPackStatus.DRAFT).map(edition -> {
			var factors = new ArrayList<PackFactor>();
			for (var row : rows.findAllByEditionIdOrderByOrdinalAsc(edition.getEditionId())) {
				factors.add(row.toPackFactor());
			}
			var pack = new Pack(edition.getEditionId(), edition.getName(), edition.getSource(), edition.getSourceUrl(),
					edition.getPublicationYear(), edition.getGwpBasis(), edition.getLicense(), edition.getRetrieved(),
					edition.getNotes(), List.copyOf(factors));
			assembled.put(pack.id(), pack);
			return pack;
		});
	}

	/** Drops the cache. The console calls it after a publish, supersede or withdraw. */
	public void invalidate() {
		assembled.clear();
		headers = null;
	}

	/**
	 * Drops the cache once the current transaction commits, so a reader never
	 * assembles a pack from rows a rolled-back publication wrote.
	 */
	public void invalidateAfterCommit() {
		if (!TransactionSynchronizationManager.isSynchronizationActive()) {
			invalidate();
			return;
		}
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				invalidate();
			}
		});
	}
}
