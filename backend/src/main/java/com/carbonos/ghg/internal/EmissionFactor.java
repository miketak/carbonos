package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

/**
 * An emission factor: a row of the shared library (read-only) or an
 * organization's own factor with its provenance (spec 02.1). A factor suggests
 * a default scope and category (spec 04.1) and carries per-gas components
 * (spec 07.1): kg of CO2, CH4, N2O, SF6 and NF3 per unit, the mass and
 * composition of HFC and PFC blends per unit (spec 07.2), whether its methane
 * is fossil or biogenic, and biogenic CO2 reported outside the scopes.
 */
@Entity
@Table(name = "ghg_emission_factors")
public class EmissionFactor {

	@Id
	private UUID id;

	@Column(nullable = false, length = 120)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(name = "default_scope", nullable = false, length = 10)
	private Scope defaultScope;

	@Enumerated(EnumType.STRING)
	@Column(name = "default_category", nullable = false, length = 40)
	private ActivityCategory defaultCategory;

	// the same physics whoever owns the source: usable in scope 1 or scope 3
	@Column(name = "scope_agnostic", nullable = false)
	private boolean scopeAgnostic;

	@Column(nullable = false, length = 30)
	private String unit;

	// the source's CO2e, on its own GWP basis; the fallback when no gas split is recorded
	@Column(name = "kg_co2e_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal kgCo2ePerUnit;

	@Column(name = "co2_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal co2KgPerUnit;

	@Column(name = "ch4_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal ch4KgPerUnit;

	@Column(name = "n2o_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal n2oKgPerUnit;

	@Column(name = "hfcs_kg_co2e_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal hfcsKgCo2ePerUnit;

	@Column(name = "pfcs_kg_co2e_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal pfcsKgCo2ePerUnit;

	@Column(name = "sf6_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal sf6KgPerUnit;

	@Column(name = "nf3_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal nf3KgPerUnit;

	@Column(name = "biogenic_co2_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal biogenicCo2KgPerUnit;

	// the mass of the HFC and PFC blends per unit, and the assessment report whose potentials
	// the source applied to turn them into CO2e (spec 07.2, the 2013 amendment)
	@Column(name = "hfcs_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal hfcsKgPerUnit;

	@Column(name = "pfcs_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal pfcsKgPerUnit;

	@Column(name = "blend_gwp_source", length = 20)
	private String blendGwpSource;

	// the blend's mass composition by species (spec 07.2, T-04); when recorded, CO2e follows the
	// inventory's GWP set instead of the source's
	@Column(name = "blend_composition", length = 255)
	private String blendComposition;

	// whether the methane is of fossil origin (fuel combustion, venting) or biogenic (landfill,
	// biomass): AR6 gives them different potentials
	@Column(name = "ch4_fossil", nullable = false)
	private boolean ch4Fossil;

	@Column(nullable = false, length = 500)
	private String source;

	// --- spec 02.1: ownership, provenance, approval and the pack a factor came from ---

	// null for the shared library; an organization's own factor otherwise
	@Column(name = "organization_id")
	private UUID organizationId;

	@Column(name = "source_url", length = 500)
	private String sourceUrl;

	@Column(name = "publication_year")
	private Integer publicationYear;

	@Column(name = "data_year")
	private Integer dataYear;

	@Column(name = "valid_from")
	private LocalDate validFrom;

	@Column(name = "valid_to")
	private LocalDate validTo;

	@Column(length = 500)
	private String note;

	@Column(nullable = false)
	private boolean approved;

	@Column(length = 60)
	private String pack;

	@Column(name = "pack_code", length = 200)
	private String packCode;

	// spec 02.3: every pack that delivered this publication row, apart from its provenance
	@ElementCollection(fetch = FetchType.EAGER)
	@CollectionTable(name = "ghg_emission_factor_packs", joinColumns = @JoinColumn(name = "factor_id"))
	@Column(name = "pack", nullable = false, length = 60)
	@BatchSize(size = 200)
	private Set<String> packs = new LinkedHashSet<>();

	// spec 02.4: a non-Kyoto gas is reported outside the scopes, never inside one
	@Enumerated(EnumType.STRING)
	@Column(name = "reporting_basis", nullable = false, length = 30)
	private ReportingBasis reportingBasis = ReportingBasis.SCOPES;

	// the grid a location-based electricity factor serves (spec 03.4)
	@Column(name = "grid_region", length = 40)
	private String gridRegion;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	/** kg of each gas per unit (HFCs and PFCs as mass of blend), with the methane's origin. */
	public record Gases(BigDecimal co2, BigDecimal ch4, boolean ch4Fossil, BigDecimal n2o, BigDecimal hfcsKg,
			BigDecimal pfcsKg, BigDecimal sf6, BigDecimal nf3, BigDecimal biogenicCo2) {
	}

	/** Where a factor comes from and when it applies (spec 02.1). */
	public record Provenance(String source, String sourceUrl, Integer publicationYear, Integer dataYear,
			LocalDate validFrom, LocalDate validTo, String note) {
	}

	EmissionFactor(UUID organizationId, String name, Scope defaultScope, ActivityCategory defaultCategory,
			boolean scopeAgnostic, String unit, BigDecimal kgCo2ePerUnit, Gases gases, String blendComposition,
			String blendGwpSource, Provenance provenance, boolean approved, String pack, String packCode) {
		this.id = UUID.randomUUID();
		this.organizationId = organizationId;
		this.pack = pack;
		this.packCode = packCode;
		if (pack != null) {
			this.packs.add(pack);
		}
		update(name, defaultScope, defaultCategory, scopeAgnostic, unit, kgCo2ePerUnit, gases, blendComposition,
				blendGwpSource, provenance, approved);
	}

	void update(String name, Scope defaultScope, ActivityCategory defaultCategory, boolean scopeAgnostic, String unit,
			BigDecimal kgCo2ePerUnit, Gases gases, String blendComposition, String blendGwpSource,
			Provenance provenance, boolean approved) {
		this.name = name;
		this.defaultScope = defaultScope;
		this.defaultCategory = defaultCategory;
		this.scopeAgnostic = scopeAgnostic;
		this.unit = unit;
		this.kgCo2ePerUnit = kgCo2ePerUnit;
		this.co2KgPerUnit = gases.co2();
		this.ch4KgPerUnit = gases.ch4();
		this.ch4Fossil = gases.ch4Fossil();
		this.n2oKgPerUnit = gases.n2o();
		this.hfcsKgPerUnit = gases.hfcsKg();
		this.pfcsKgPerUnit = gases.pfcsKg();
		this.sf6KgPerUnit = gases.sf6();
		this.nf3KgPerUnit = gases.nf3();
		this.biogenicCo2KgPerUnit = gases.biogenicCo2();
		// a blend's CO2e on the source basis; recomputed from the composition under a GWP set when one is recorded
		this.hfcsKgCo2ePerUnit = gases.hfcsKg().signum() == 0 ? BigDecimal.ZERO
				: kgCo2ePerUnit.subtract(co2KgPerUnit).max(BigDecimal.ZERO);
		this.pfcsKgCo2ePerUnit = gases.pfcsKg().signum() == 0 ? BigDecimal.ZERO
				: kgCo2ePerUnit.subtract(co2KgPerUnit).max(BigDecimal.ZERO);
		this.blendComposition = blendComposition;
		this.blendGwpSource = blendGwpSource;
		this.source = provenance.source();
		this.sourceUrl = provenance.sourceUrl();
		this.publicationYear = provenance.publicationYear();
		this.dataYear = provenance.dataYear();
		this.validFrom = provenance.validFrom();
		this.validTo = provenance.validTo();
		this.note = provenance.note();
		this.approved = approved;
	}

	public UUID getOrganizationId() {
		return organizationId;
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

	public LocalDate getValidFrom() {
		return validFrom;
	}

	public LocalDate getValidTo() {
		return validTo;
	}

	public String getNote() {
		return note;
	}

	public boolean isApproved() {
		return approved;
	}

	void setApproved(boolean approved) {
		this.approved = approved;
	}

	public String getPack() {
		return pack;
	}

	public String getPackCode() {
		return packCode;
	}

	/** Every pack that delivered this publication row, in alphabetical order (spec 02.3). */
	public List<String> getPacks() {
		return packs.stream().sorted().toList();
	}

	/**
	 * Records that a pack delivered this row. The first tag also becomes
	 * {@code pack}, which older clients still read.
	 */
	void addPack(String pack) {
		if (pack == null || pack.isBlank()) {
			return;
		}
		packs.add(pack);
		if (this.pack == null) {
			this.pack = pack;
		}
	}

	public ReportingBasis getReportingBasis() {
		return reportingBasis;
	}

	void setReportingBasis(ReportingBasis reportingBasis) {
		this.reportingBasis = reportingBasis == null ? ReportingBasis.SCOPES : reportingBasis;
	}

	public String getGridRegion() {
		return gridRegion;
	}

	void setGridRegion(String gridRegion) {
		this.gridRegion = gridRegion;
	}

	/** Whether the factor publishes CO2e only, so the by-gas table cannot split it (spec 02.1). */
	public boolean isCo2eOnly() {
		return !hasGasSplit() && hfcsKgPerUnit.signum() == 0 && pfcsKgPerUnit.signum() == 0;
	}

	/** Whether the factor's validity window covers a period; an open window covers everything. */
	public boolean coversPeriod(LocalDate start, LocalDate end) {
		return (validFrom == null || !validFrom.isAfter(start)) && (validTo == null || !validTo.isBefore(end));
	}

	protected EmissionFactor() {
	}

	public UUID getId() {
		return id;
	}

	public String getName() {
		return name;
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

	public String getUnit() {
		return unit;
	}

	public BigDecimal getKgCo2ePerUnit() {
		return kgCo2ePerUnit;
	}

	public BigDecimal getCo2KgPerUnit() {
		return co2KgPerUnit;
	}

	public BigDecimal getCh4KgPerUnit() {
		return ch4KgPerUnit;
	}

	public BigDecimal getN2oKgPerUnit() {
		return n2oKgPerUnit;
	}

	public BigDecimal getHfcsKgCo2ePerUnit() {
		return hfcsKgCo2ePerUnit;
	}

	public BigDecimal getPfcsKgCo2ePerUnit() {
		return pfcsKgCo2ePerUnit;
	}

	public BigDecimal getSf6KgPerUnit() {
		return sf6KgPerUnit;
	}

	public BigDecimal getNf3KgPerUnit() {
		return nf3KgPerUnit;
	}

	public BigDecimal getBiogenicCo2KgPerUnit() {
		return biogenicCo2KgPerUnit;
	}

	public BigDecimal getHfcsKgPerUnit() {
		return hfcsKgPerUnit;
	}

	public BigDecimal getPfcsKgPerUnit() {
		return pfcsKgPerUnit;
	}

	/** The IPCC assessment report the source applied to the blend, or null for a factor with no blend. */
	public String getBlendGwpSource() {
		return blendGwpSource;
	}

	/** The blend's stored composition, or null when none is recorded. */
	public String getBlendComposition() {
		return blendComposition;
	}

	/** "50% HFC-32, 50% HFC-125", or null when no composition is recorded. */
	public String describeBlend() {
		var composition = BlendComposition.parse(blendComposition);
		return composition == null ? null : composition.describe();
	}

	public boolean isCh4Fossil() {
		return ch4Fossil;
	}

	/** Whether the blend converts with the inventory's set: a composition exists and the set knows every species. */
	public boolean blendConvertsWith(GwpSet gwp) {
		var composition = BlendComposition.parse(blendComposition);
		return composition != null && composition.kgCo2ePerKg(gwp) != null;
	}

	/** kg CO2e of HFCs per unit under the set: from the composition when recorded, else the source's figure. */
	public BigDecimal hfcsKgCo2ePerUnit(GwpSet gwp) {
		return blendKgCo2e(gwp, hfcsKgPerUnit, hfcsKgCo2ePerUnit);
	}

	/** kg CO2e of PFCs per unit under the set: from the composition when recorded, else the source's figure. */
	public BigDecimal pfcsKgCo2ePerUnit(GwpSet gwp) {
		return blendKgCo2e(gwp, pfcsKgPerUnit, pfcsKgCo2ePerUnit);
	}

	private BigDecimal blendKgCo2e(GwpSet gwp, BigDecimal massPerUnit, BigDecimal sourceCo2e) {
		if (massPerUnit.signum() == 0) {
			return sourceCo2e;
		}
		var composition = BlendComposition.parse(blendComposition);
		var perKg = composition == null ? null : composition.kgCo2ePerKg(gwp);
		return perKg == null ? sourceCo2e : massPerUnit.multiply(perKg);
	}

	/**
	 * The assessment report behind the blend's CO2e on a run: the run's own set
	 * when the composition converts with it, else the source's report.
	 */
	public String blendGwpSourceFor(GwpSet gwp) {
		if (hfcsKgPerUnit.signum() == 0 && pfcsKgPerUnit.signum() == 0) {
			return null;
		}
		return blendConvertsWith(gwp) ? gwp.name() : blendGwpSource;
	}

	public String getSource() {
		return source;
	}

	/** Whether the factor records a per-gas split at all. */
	public boolean hasGasSplit() {
		return co2KgPerUnit.signum() != 0 || ch4KgPerUnit.signum() != 0 || n2oKgPerUnit.signum() != 0
				|| hfcsKgCo2ePerUnit.signum() != 0 || pfcsKgCo2ePerUnit.signum() != 0 || sf6KgPerUnit.signum() != 0
				|| nf3KgPerUnit.signum() != 0;
	}

	/**
	 * kg CO2e per unit under a reporting GWP set: the gas split weighted by the
	 * set's potentials, or the source's own CO2e when no split is recorded.
	 */
	public BigDecimal kgCo2ePerUnit(GwpSet gwp) {
		if (!hasGasSplit()) {
			return kgCo2ePerUnit;
		}
		return co2KgPerUnit.add(ch4KgPerUnit.multiply(gwp.ch4(ch4Fossil)))
			.add(n2oKgPerUnit.multiply(gwp.n2o()))
			.add(sf6KgPerUnit.multiply(gwp.sf6()))
			.add(nf3KgPerUnit.multiply(gwp.nf3()))
			.add(hfcsKgCo2ePerUnit(gwp))
			.add(pfcsKgCo2ePerUnit(gwp));
	}

	/** Whether this factor may be used in a scope, given its default and whether the physics is scope-agnostic. */
	public boolean compatibleWith(Scope scope) {
		return scopeAgnostic || defaultScope == scope;
	}
}
