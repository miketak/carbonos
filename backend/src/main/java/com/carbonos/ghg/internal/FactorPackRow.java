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

	protected FactorPackRow() {
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
}
