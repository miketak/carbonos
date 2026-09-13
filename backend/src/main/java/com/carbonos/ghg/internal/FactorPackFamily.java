package com.carbonos.ghg.internal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A pack family (spec 02.5): the lineage of one publication, keyed by a stable
 * {@code packKey} such as {@code defra}, holding every edition after it. The
 * family carries the name and the summary a console lists; the edition carries
 * the vintage, because the edition is what a citation names.
 */
@Entity
@Table(name = "ghg_factor_packs")
public class FactorPackFamily {

	@Id
	@Column(name = "pack_key", length = 60)
	private String packKey;

	@Column(nullable = false, length = 200)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private FactorPackKind kind;

	@Column(length = 2000)
	private String summary;

	protected FactorPackFamily() {
	}

	FactorPackFamily(String packKey, String name, FactorPackKind kind, String summary) {
		this.packKey = packKey;
		this.name = name;
		this.kind = kind;
		this.summary = summary;
	}

	void update(String name, FactorPackKind kind, String summary) {
		this.name = name;
		this.kind = kind;
		this.summary = summary;
	}

	public String getPackKey() {
		return packKey;
	}

	public String getName() {
		return name;
	}

	public FactorPackKind getKind() {
		return kind;
	}

	public String getSummary() {
		return summary;
	}
}
