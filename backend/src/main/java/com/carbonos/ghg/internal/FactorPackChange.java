package com.carbonos.ghg.internal;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * One line of the change log an edition froze at publication (spec 02.5),
 * computed against the predecessor edition of the same family: one row per
 * code, so a reader can see the one row that moved.
 *
 * <p>It is frozen rather than computed on demand because the predecessor's rows
 * are the record a verifier samples against, and a change log that recomputed
 * itself would describe a comparison nobody made.
 */
@Entity
@Table(name = "ghg_factor_pack_changes")
public class FactorPackChange {

	/** What happened to one code between the predecessor and this edition. */
	public enum Kind {

		/** The code is new: the predecessor did not carry it. */
		ADDED,

		/** The code is in both and something moved. */
		CHANGED,

		/** The predecessor carried the code and this edition does not. */
		DISCONTINUED,

		/** The code is in both, unchanged. */
		UNCHANGED
	}

	private static final MathContext MC = MathContext.DECIMAL64;

	@Id
	private UUID id;

	@Column(name = "edition_id", nullable = false, length = 60)
	private String editionId;

	@Column(nullable = false, length = 200)
	private String code;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 14)
	private Kind kind;

	@Column(name = "old_kg_co2e")
	private BigDecimal oldKgCo2e;

	@Column(name = "new_kg_co2e")
	private BigDecimal newKgCo2e;

	@Column(name = "percent_change", precision = 12, scale = 4)
	private BigDecimal percentChange;

	/** The fields that moved, comma separated, so a reader sees what changed beside the value. */
	@Column(length = 500)
	private String fields;

	protected FactorPackChange() {
	}

	FactorPackChange(String editionId, String code, Kind kind, BigDecimal oldKgCo2e, BigDecimal newKgCo2e,
			String fields) {
		this.id = UUID.randomUUID();
		this.editionId = editionId;
		this.code = code;
		this.kind = kind;
		this.oldKgCo2e = oldKgCo2e;
		this.newKgCo2e = newKgCo2e;
		this.percentChange = percentChange(oldKgCo2e, newKgCo2e);
		this.fields = fields == null || fields.isBlank() ? null
				: fields.length() > 500 ? fields.substring(0, 497) + "..." : fields;
	}

	/**
	 * How far the value moved, as a percentage of the old one. A row whose
	 * predecessor stated zero has no percentage: a movement from nothing is not
	 * a proportion, and the absolute values are what a reader must weigh.
	 */
	public static BigDecimal percentChange(BigDecimal oldValue, BigDecimal newValue) {
		if (oldValue == null || newValue == null || oldValue.signum() == 0) {
			return null;
		}
		return newValue.subtract(oldValue)
			.divide(oldValue.abs(), MC)
			.multiply(new BigDecimal("100"), MC)
			.setScale(4, RoundingMode.HALF_UP);
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

	public Kind getKind() {
		return kind;
	}

	public BigDecimal getOldKgCo2e() {
		return oldKgCo2e;
	}

	public BigDecimal getNewKgCo2e() {
		return newKgCo2e;
	}

	public BigDecimal getPercentChange() {
		return percentChange;
	}

	public String getFields() {
		return fields;
	}
}
