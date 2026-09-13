package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One factor of one edition (spec 02.5), exactly as the publication states it.
 * A gas column is null where the publication states nothing, which is not the
 * same as a stated zero, and the values are held at the publication's own scale;
 * the rounding to {@code numeric(12,6)} happens on import, where it happens
 * today.
 *
 * <p>The publisher's taxonomy is three columns rather than one concatenation:
 * 1,157 of the 1,868 DESNZ rows share a display name, and "Gaseous fuels:
 * Butane" appears three times differing only by unit, so the parts are what tell
 * two rows apart.
 */
@Entity
@Table(name = "ghg_factor_pack_rows")
public class FactorPackRow {

	@Id
	private UUID id;

	@Column(name = "edition_id", nullable = false, length = 60)
	private String editionId;

	// the position the publication lists the row at, so a pack reads in its own order
	@Column(nullable = false)
	private int ordinal;

	@Column(nullable = false, length = 200)
	private String code;

	@Column(nullable = false, length = 120)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(name = "default_scope", nullable = false, length = 10)
	private Scope defaultScope;

	@Enumerated(EnumType.STRING)
	@Column(name = "default_category", nullable = false, length = 40)
	private ActivityCategory defaultCategory;

	@Column(name = "scope_agnostic", nullable = false)
	private boolean scopeAgnostic;

	@Column(nullable = false, length = 30)
	private String unit;

	@Column(name = "kg_co2e_per_unit", nullable = false)
	private BigDecimal kgCo2ePerUnit;

	@Column(name = "co2_kg_per_unit")
	private BigDecimal co2KgPerUnit;

	@Column(name = "ch4_kg_per_unit")
	private BigDecimal ch4KgPerUnit;

	@Column(name = "ch4_fossil", nullable = false)
	private boolean ch4Fossil;

	@Column(name = "n2o_kg_per_unit")
	private BigDecimal n2oKgPerUnit;

	@Column(name = "hfcs_kg_per_unit")
	private BigDecimal hfcsKgPerUnit;

	@Column(name = "pfcs_kg_per_unit")
	private BigDecimal pfcsKgPerUnit;

	@Column(name = "sf6_kg_per_unit")
	private BigDecimal sf6KgPerUnit;

	@Column(name = "nf3_kg_per_unit")
	private BigDecimal nf3KgPerUnit;

	@Column(name = "biogenic_co2_kg_per_unit")
	private BigDecimal biogenicCo2KgPerUnit;

	@Column(name = "blend_composition", length = 255)
	private String blendComposition;

	@Column(name = "blend_gwp_source", length = 20)
	private String blendGwpSource;

	@Column(name = "data_year")
	private Integer dataYear;

	@Column(name = "source_publication", length = 500)
	private String sourcePublication;

	@Column(name = "source_url", length = 500)
	private String sourceUrl;

	@Column(name = "publication_year")
	private Integer publicationYear;

	@Column(name = "source_category", length = 120)
	private String sourceCategory;

	@Column(name = "source_activity", length = 200)
	private String sourceActivity;

	@Column(name = "source_detail", length = 500)
	private String sourceDetail;

	// the row publishes a CO2e total with no gas split, so the by-gas table cannot split it
	@Column(name = "co2e_only", nullable = false)
	private boolean co2eOnly;

	@Column(nullable = false)
	private boolean approved;

	@Column(length = 500)
	private String notes;

	@Enumerated(EnumType.STRING)
	@Column(name = "reporting_basis", nullable = false, length = 30)
	private ReportingBasis reportingBasis;

	/**
	 * What a curator states about one row (spec 02.5). The values stay at the
	 * publication's own scale: the rounding to {@code numeric(12,6)} happens on
	 * import, where it happens today. A null gas is one the publication states
	 * nothing about, which is not the same as a stated zero.
	 */
	public record Facts(String code, String name, Scope defaultScope, ActivityCategory defaultCategory,
			boolean scopeAgnostic, String unit, BigDecimal kgCo2ePerUnit, BigDecimal co2, BigDecimal ch4,
			boolean ch4Fossil, BigDecimal n2o, BigDecimal hfcsKg, BigDecimal pfcsKg, BigDecimal sf6, BigDecimal nf3,
			BigDecimal biogenicCo2, String blendComposition, String blendGwpSource, Integer dataYear,
			String sourcePublication, String sourceUrl, Integer publicationYear, String sourceCategory,
			String sourceActivity, String sourceDetail, boolean co2eOnly, boolean approved, String notes,
			ReportingBasis reportingBasis) {
	}

	protected FactorPackRow() {
	}

	FactorPackRow(String editionId, int ordinal, Facts facts) {
		this.id = UUID.randomUUID();
		this.editionId = editionId;
		this.ordinal = ordinal;
		update(facts);
	}

	/** Copies a predecessor's row into a new draft, keeping the order the publication lists it in. */
	FactorPackRow(String editionId, FactorPackRow source) {
		this(editionId, source.ordinal, source.facts());
	}

	void update(Facts facts) {
		this.code = facts.code();
		this.name = facts.name();
		this.defaultScope = facts.defaultScope();
		this.defaultCategory = facts.defaultCategory();
		this.scopeAgnostic = facts.scopeAgnostic();
		this.unit = facts.unit();
		this.kgCo2ePerUnit = facts.kgCo2ePerUnit();
		this.co2KgPerUnit = facts.co2();
		this.ch4KgPerUnit = facts.ch4();
		this.ch4Fossil = facts.ch4Fossil();
		this.n2oKgPerUnit = facts.n2o();
		this.hfcsKgPerUnit = facts.hfcsKg();
		this.pfcsKgPerUnit = facts.pfcsKg();
		this.sf6KgPerUnit = facts.sf6();
		this.nf3KgPerUnit = facts.nf3();
		this.biogenicCo2KgPerUnit = facts.biogenicCo2();
		this.blendComposition = facts.blendComposition();
		this.blendGwpSource = facts.blendGwpSource();
		this.dataYear = facts.dataYear();
		this.sourcePublication = facts.sourcePublication();
		this.sourceUrl = facts.sourceUrl();
		this.publicationYear = facts.publicationYear();
		this.sourceCategory = facts.sourceCategory();
		this.sourceActivity = facts.sourceActivity();
		this.sourceDetail = facts.sourceDetail();
		this.co2eOnly = facts.co2eOnly();
		this.approved = facts.approved();
		this.notes = facts.notes();
		this.reportingBasis = facts.reportingBasis() == null ? ReportingBasis.SCOPES : facts.reportingBasis();
	}

	/** The row as a console reads it and a clone copies it. */
	public Facts facts() {
		return new Facts(code, name, defaultScope, defaultCategory, scopeAgnostic, unit, kgCo2ePerUnit, co2KgPerUnit,
				ch4KgPerUnit, ch4Fossil, n2oKgPerUnit, hfcsKgPerUnit, pfcsKgPerUnit, sf6KgPerUnit, nf3KgPerUnit,
				biogenicCo2KgPerUnit, blendComposition, blendGwpSource, dataYear, sourcePublication, sourceUrl,
				publicationYear, sourceCategory, sourceActivity, sourceDetail, co2eOnly, approved, notes,
				reportingBasis);
	}

	void moveTo(int ordinal) {
		this.ordinal = ordinal;
	}

	/** The row as the tenant-facing read path and the import see it. */
	FactorPacks.PackFactor toPackFactor() {
		return new FactorPacks.PackFactor(code, name, defaultScope, defaultCategory, scopeAgnostic, unit, kgCo2ePerUnit,
				co2KgPerUnit, ch4KgPerUnit, ch4Fossil, n2oKgPerUnit, hfcsKgPerUnit, pfcsKgPerUnit, sf6KgPerUnit,
				nf3KgPerUnit, blendComposition, blendGwpSource, biogenicCo2KgPerUnit, dataYear, sourceCategory,
				sourceActivity, sourceDetail, approved, notes, sourcePublication, sourceUrl, publicationYear,
				reportingBasis);
	}

	public UUID getId() {
		return id;
	}

	public String getEditionId() {
		return editionId;
	}

	public String getCode() {
		return code;
	}

	public String getName() {
		return name;
	}

	public String getUnit() {
		return unit;
	}

	public BigDecimal getKgCo2ePerUnit() {
		return kgCo2ePerUnit;
	}

	public String getSourceCategory() {
		return sourceCategory;
	}

	public String getSourceActivity() {
		return sourceActivity;
	}

	public String getSourceDetail() {
		return sourceDetail;
	}

	public boolean isCo2eOnly() {
		return co2eOnly;
	}

	public boolean isApproved() {
		return approved;
	}

	public int getOrdinal() {
		return ordinal;
	}

	public Scope getDefaultScope() {
		return defaultScope;
	}

	public ActivityCategory getDefaultCategory() {
		return defaultCategory;
	}

	public boolean isScopeAgnostic() {
		return scopeAgnostic;
	}

	public BigDecimal getBiogenicCo2KgPerUnit() {
		return biogenicCo2KgPerUnit;
	}

	public String getBlendComposition() {
		return blendComposition;
	}

	public String getSourcePublication() {
		return sourcePublication;
	}

	public String getSourceUrl() {
		return sourceUrl;
	}

	public Integer getPublicationYear() {
		return publicationYear;
	}

	public Integer getDataYear() {
		return dataYear;
	}

	public String getNotes() {
		return notes;
	}

	public ReportingBasis getReportingBasis() {
		return reportingBasis == null ? ReportingBasis.SCOPES : reportingBasis;
	}

	/**
	 * The citation an import writes into {@code ghg_emission_factors.source}:
	 * the publication, then the publisher's three taxonomy parts as one path.
	 */
	public String citation() {
		var path = java.util.stream.Stream.of(sourceCategory, sourceActivity, sourceDetail)
			.filter(part -> part != null && !part.isBlank())
			.collect(java.util.stream.Collectors.joining(" / "));
		var publication = sourcePublication == null ? "" : sourcePublication;
		return path.isBlank() ? publication : publication + ": " + path;
	}
}
