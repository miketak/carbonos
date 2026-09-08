package com.carbonos.ghg.internal;

import java.math.BigDecimal;

/**
 * IPCC 100-year global warming potentials (spec 07.1). Factors record kg of
 * each single-species gas per unit; the reporting set turns them into CO2e.
 * HFC and PFC blends are already CO2e in the factor, with the source's GWP.
 */
public enum GwpSet {
	AR5(new BigDecimal("28"), new BigDecimal("265"), new BigDecimal("23500"), new BigDecimal("16100")),
	AR6(new BigDecimal("27.9"), new BigDecimal("273"), new BigDecimal("25200"), new BigDecimal("17400"));

	private final BigDecimal ch4;
	private final BigDecimal n2o;
	private final BigDecimal sf6;
	private final BigDecimal nf3;

	GwpSet(BigDecimal ch4, BigDecimal n2o, BigDecimal sf6, BigDecimal nf3) {
		this.ch4 = ch4;
		this.n2o = n2o;
		this.sf6 = sf6;
		this.nf3 = nf3;
	}

	public BigDecimal ch4() {
		return ch4;
	}

	public BigDecimal n2o() {
		return n2o;
	}

	public BigDecimal sf6() {
		return sf6;
	}

	public BigDecimal nf3() {
		return nf3;
	}
}
