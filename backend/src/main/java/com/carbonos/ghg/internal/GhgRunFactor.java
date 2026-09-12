package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * One emission factor exactly as a run applied it (spec 07.4): the frozen
 * factor set behind the report's factor table and the export, so a later
 * change to the library never rewrites what a past run used.
 */
@Entity
@Table(name = "ghg_run_factors")
public class GhgRunFactor {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "run_id", nullable = false)
	private GhgRun run;

	@Column(name = "factor_id", nullable = false)
	private UUID factorId;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(nullable = false, length = 30)
	private String unit;

	@Enumerated(EnumType.STRING)
	@Column(name = "gwp_set", nullable = false, length = 5)
	private GwpSet gwpSet;

	@Column(name = "kg_co2e_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal kgCo2ePerUnit;

	@Column(name = "co2_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal co2KgPerUnit;

	@Column(name = "ch4_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal ch4KgPerUnit;

	@Column(name = "ch4_fossil", nullable = false)
	private boolean ch4Fossil;

	@Column(name = "n2o_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal n2oKgPerUnit;

	@Column(name = "hfcs_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal hfcsKgPerUnit;

	@Column(name = "pfcs_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal pfcsKgPerUnit;

	@Column(name = "sf6_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal sf6KgPerUnit;

	@Column(name = "nf3_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal nf3KgPerUnit;

	@Column(name = "biogenic_co2_kg_per_unit", nullable = false, precision = 12, scale = 6)
	private BigDecimal biogenicCo2KgPerUnit;

	@Column(name = "blend_composition", length = 255)
	private String blendComposition;

	@Column(name = "blend_gwp_source", length = 20)
	private String blendGwpSource;

	@Column(nullable = false, length = 500)
	private String source;

	// spec 02.3: the publication behind the factor, snapshotted so the table reads the same later
	@Column(name = "publication_year")
	private Integer publicationYear;

	@Column(name = "data_year")
	private Integer dataYear;

	/** The pack tags as they stood at launch, comma separated; null on a run before V38. */
	@Column(length = 200)
	private String packs;

	// spec 02.4: whether the factor's emissions belong in a scope at all
	@Enumerated(EnumType.STRING)
	@Column(name = "reporting_basis", nullable = false, length = 30)
	private ReportingBasis reportingBasis = ReportingBasis.SCOPES;

	protected GhgRunFactor() {
	}

	GhgRunFactor(GhgRun run, EmissionFactor factor, GwpSet gwp) {
		this.id = UUID.randomUUID();
		this.run = run;
		this.factorId = factor.getId();
		this.name = factor.getName();
		this.unit = factor.getUnit();
		this.gwpSet = gwp;
		this.kgCo2ePerUnit = factor.kgCo2ePerUnit(gwp);
		this.co2KgPerUnit = factor.getCo2KgPerUnit();
		this.ch4KgPerUnit = factor.getCh4KgPerUnit();
		this.ch4Fossil = factor.isCh4Fossil();
		this.n2oKgPerUnit = factor.getN2oKgPerUnit();
		this.hfcsKgPerUnit = factor.getHfcsKgPerUnit();
		this.pfcsKgPerUnit = factor.getPfcsKgPerUnit();
		this.sf6KgPerUnit = factor.getSf6KgPerUnit();
		this.nf3KgPerUnit = factor.getNf3KgPerUnit();
		this.biogenicCo2KgPerUnit = factor.getBiogenicCo2KgPerUnit();
		this.blendComposition = factor.describeBlend();
		this.blendGwpSource = factor.blendGwpSourceFor(gwp);
		this.source = factor.getSource();
		this.publicationYear = factor.getPublicationYear();
		this.dataYear = factor.getDataYear();
		var tags = String.join(", ", factor.getPacks());
		this.packs = tags.isEmpty() ? null : tags.length() > 200 ? tags.substring(0, 197) + "..." : tags;
		this.reportingBasis = factor.getReportingBasis();
	}

	public UUID getId() {
		return id;
	}

	public UUID getFactorId() {
		return factorId;
	}

	public String getName() {
		return name;
	}

	public String getUnit() {
		return unit;
	}

	public GwpSet getGwpSet() {
		return gwpSet;
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

	public boolean isCh4Fossil() {
		return ch4Fossil;
	}

	public BigDecimal getN2oKgPerUnit() {
		return n2oKgPerUnit;
	}

	public BigDecimal getHfcsKgPerUnit() {
		return hfcsKgPerUnit;
	}

	public BigDecimal getPfcsKgPerUnit() {
		return pfcsKgPerUnit;
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

	public String getBlendComposition() {
		return blendComposition;
	}

	public String getBlendGwpSource() {
		return blendGwpSource;
	}

	public String getSource() {
		return source;
	}

	public Integer getPublicationYear() {
		return publicationYear;
	}

	public Integer getDataYear() {
		return dataYear;
	}

	/** The pack tags the factor carried at launch, in order; empty when the run predates spec 02.3. */
	public java.util.List<String> getPacks() {
		return packs == null || packs.isBlank() ? java.util.List.of()
				: java.util.Arrays.stream(packs.split(",")).map(String::trim).filter(tag -> !tag.isEmpty()).toList();
	}

	public ReportingBasis getReportingBasis() {
		return reportingBasis;
	}
}
