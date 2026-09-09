package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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
 * A market-based scope 2 factor for one facility in one inventory (the Scope
 * 2 Guidance, spec 07.1): the contractual instrument behind the electricity
 * the facility bought, in kg CO2e per kWh, the quantity it covers and the
 * period it covers (spec 07.3). The balance takes the residual mix or the
 * grid average.
 */
@Entity
@Table(name = "ghg_market_factors")
public class MarketFactor {

	@Id
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "inventory_id", nullable = false)
	private Inventory inventory;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "facility_id", nullable = false)
	private Facility facility;

	@Enumerated(EnumType.STRING)
	@Column(name = "instrument_type", nullable = false, length = 30)
	private MarketInstrument instrumentType;

	@Column(name = "kg_co2e_per_kwh", nullable = false, precision = 12, scale = 6)
	private BigDecimal kgCo2ePerKwh;

	@Column(nullable = false, length = 120)
	private String source;

	// whether the instrument meets the eight Scope 2 Quality Criteria (spec 07.2); when not, the
	// market-based figure falls back and the report says why
	@Column(name = "meets_quality_criteria", nullable = false)
	private boolean meetsQualityCriteria;

	@Column(name = "quality_notes", length = 500)
	private String qualityNotes;

	// spec 07.6: the certificate behind the instrument and the eight criteria answered one at a time
	@Column(name = "certificate_id", length = 120)
	private String certificateId;

	@Column(length = 120)
	private String registry;

	private Integer vintage;

	@Column(name = "retirement_date")
	private LocalDate retirementDate;

	@Column(name = "criteria_answers", nullable = false, length = 8)
	private String criteriaAnswers;

	// the kWh the instrument covers; null on rows older than spec 07.3, which cover every kWh
	@Column(name = "covered_kwh", precision = 18, scale = 3)
	private BigDecimal coveredKwh;

	// the period the instrument covers; null bounds default to the inventory's period
	@Column(name = "period_start")
	private LocalDate periodStart;

	@Column(name = "period_end")
	private LocalDate periodEnd;

	@CreationTimestamp
	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@UpdateTimestamp
	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected MarketFactor() {
	}

	/** The coverage of an instrument: the kWh it covers (null covers every kWh) and its period (null bounds follow the inventory). */
	public record Coverage(BigDecimal coveredKwh, LocalDate periodStart, LocalDate periodEnd) {
	}

	/** The certificate details and the eight answers (spec 07.6); a null answer is unanswered. */
	public record Quality(java.util.List<Boolean> criteria, String certificateId, String registry, Integer vintage,
			LocalDate retirementDate) {
		/** Every criterion met, as a legacy "meets the criteria" flag said. */
		public static Quality allMet() {
			return new Quality(java.util.Collections.nCopies(Scope2Criterion.values().length, Boolean.TRUE), null,
					null, null, null);
		}

		public static Quality unanswered() {
			return new Quality(java.util.Collections.nCopies(Scope2Criterion.values().length, (Boolean) null), null,
					null, null, null);
		}
	}

	MarketFactor(Inventory inventory, Facility facility, MarketInstrument instrumentType, BigDecimal kgCo2ePerKwh,
			String source, boolean meetsQualityCriteria, String qualityNotes, Coverage coverage) {
		this(inventory, facility, instrumentType, kgCo2ePerKwh, source, qualityNotes, coverage,
				meetsQualityCriteria ? Quality.allMet() : Quality.unanswered());
	}

	MarketFactor(Inventory inventory, Facility facility, MarketInstrument instrumentType, BigDecimal kgCo2ePerKwh,
			String source, String qualityNotes, Coverage coverage, Quality quality) {
		this.id = UUID.randomUUID();
		this.inventory = inventory;
		this.facility = facility;
		this.instrumentType = instrumentType;
		this.kgCo2ePerKwh = kgCo2ePerKwh;
		this.source = source;
		this.qualityNotes = qualityNotes;
		this.coveredKwh = coverage.coveredKwh();
		this.periodStart = coverage.periodStart();
		this.periodEnd = coverage.periodEnd();
		applyQuality(quality);
	}

	private void applyQuality(Quality quality) {
		this.criteriaAnswers = Scope2Criterion.encode(quality.criteria());
		this.meetsQualityCriteria = criteriaAnswers.chars().allMatch(c -> c == 'Y');
		this.certificateId = quality.certificateId();
		this.registry = quality.registry();
		this.vintage = quality.vintage();
		this.retirementDate = quality.retirementDate();
	}

	public java.util.List<Scope2Criterion.Answer> criteriaAnswers() {
		return Scope2Criterion.decode(criteriaAnswers);
	}

	public long unansweredCount() {
		return criteriaAnswers().stream().filter(a -> a == Scope2Criterion.Answer.UNANSWERED).count();
	}

	public long notMetCount() {
		return criteriaAnswers().stream().filter(a -> a == Scope2Criterion.Answer.NOT_MET).count();
	}

	public String getCertificateId() {
		return certificateId;
	}

	public String getRegistry() {
		return registry;
	}

	public Integer getVintage() {
		return vintage;
	}

	public LocalDate getRetirementDate() {
		return retirementDate;
	}

	public Quality quality() {
		return new Quality(criteriaAnswers().stream()
			.map(a -> a == Scope2Criterion.Answer.UNANSWERED ? null : Boolean.valueOf(a == Scope2Criterion.Answer.MET))
			.toList(), certificateId, registry, vintage, retirementDate);
	}

	public UUID getId() {
		return id;
	}

	public Inventory getInventory() {
		return inventory;
	}

	public Facility getFacility() {
		return facility;
	}

	public MarketInstrument getInstrumentType() {
		return instrumentType;
	}

	public BigDecimal getKgCo2ePerKwh() {
		return kgCo2ePerKwh;
	}

	public String getSource() {
		return source;
	}

	public boolean isMeetsQualityCriteria() {
		return meetsQualityCriteria;
	}

	public String getQualityNotes() {
		return qualityNotes;
	}

	public BigDecimal getCoveredKwh() {
		return coveredKwh;
	}

	public LocalDate getPeriodStart() {
		return periodStart;
	}

	public LocalDate getPeriodEnd() {
		return periodEnd;
	}

	public Coverage coverage() {
		return new Coverage(coveredKwh, periodStart, periodEnd);
	}

	/** The first day the instrument covers: its own, or the inventory's. */
	public LocalDate effectiveStart(Inventory inventory) {
		return periodStart != null ? periodStart : inventory.getPeriodStart();
	}

	/** The last day the instrument covers: its own, or the inventory's. */
	public LocalDate effectiveEnd(Inventory inventory) {
		return periodEnd != null ? periodEnd : inventory.getPeriodEnd();
	}

	/** Whether a record's period overlaps the instrument's (spec 04.2). */
	public boolean overlaps(LocalDate start, LocalDate end, Inventory inventory) {
		return !end.isBefore(effectiveStart(inventory)) && !start.isAfter(effectiveEnd(inventory));
	}

	/** Whether a line dated on this day falls inside the instrument's period. */
	public boolean covers(LocalDate date, Inventory inventory) {
		return !date.isBefore(effectiveStart(inventory)) && !date.isAfter(effectiveEnd(inventory));
	}

	void update(MarketInstrument instrumentType, BigDecimal kgCo2ePerKwh, String source, String qualityNotes,
			Coverage coverage, Quality quality) {
		this.instrumentType = instrumentType;
		this.kgCo2ePerKwh = kgCo2ePerKwh;
		this.source = source;
		this.qualityNotes = qualityNotes;
		this.coveredKwh = coverage.coveredKwh();
		this.periodStart = coverage.periodStart();
		this.periodEnd = coverage.periodEnd();
		applyQuality(quality);
	}
}
