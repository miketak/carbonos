package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** Every cell of Table 1 of the Corporate Standard (spec 03.1). */
class Table1Test {

	@ParameterizedTest(name = "{0} under {1}, operated={2}: {3}")
	@CsvSource({ //
			// relationship, approach, operated, expected share for a 40% economic interest
			"WHOLLY_OWNED, EQUITY_SHARE, true, 0.40", //
			"WHOLLY_OWNED, FINANCIAL_CONTROL, true, 1", //
			"WHOLLY_OWNED, OPERATIONAL_CONTROL, true, 1", //
			"WHOLLY_OWNED, OPERATIONAL_CONTROL, false, 0", //
			"JOINT_VENTURE, EQUITY_SHARE, true, 0.40", //
			"JOINT_VENTURE, FINANCIAL_CONTROL, true, 0.40", //
			"JOINT_VENTURE, OPERATIONAL_CONTROL, true, 1", //
			"JOINT_VENTURE, OPERATIONAL_CONTROL, false, 0", //
			"NON_INCORPORATED_JV, EQUITY_SHARE, true, 0.40", //
			"NON_INCORPORATED_JV, FINANCIAL_CONTROL, true, 0.40", //
			"NON_INCORPORATED_JV, OPERATIONAL_CONTROL, true, 1", //
			"ASSOCIATE, EQUITY_SHARE, false, 0.40", //
			"ASSOCIATE, FINANCIAL_CONTROL, false, 0", //
			"ASSOCIATE, OPERATIONAL_CONTROL, false, 0", //
			"FIXED_ASSET_INVESTMENT, EQUITY_SHARE, false, 0", //
			"FIXED_ASSET_INVESTMENT, FINANCIAL_CONTROL, false, 0", //
			"FIXED_ASSET_INVESTMENT, OPERATIONAL_CONTROL, false, 0" })
	void everyCellOfTable1(RelationshipType relationship, ConsolidationApproach approach, boolean operated,
			BigDecimal expected) {
		var share = Table1.share(relationship, approach, new BigDecimal("40.00"), operated);
		assertThat(share).isEqualByComparingTo(expected);
	}

	@ParameterizedTest
	@CsvSource({ //
			"OPERATING_LEASE_IN, OPERATIONAL_CONTROL, SCOPE_1, STATIONARY_COMBUSTION",
			"OPERATING_LEASE_IN, EQUITY_SHARE, SCOPE_3, UPSTREAM_LEASED_ASSETS",
			"OPERATING_LEASE_IN, FINANCIAL_CONTROL, SCOPE_3, UPSTREAM_LEASED_ASSETS",
			"FINANCE_LEASE_IN, EQUITY_SHARE, SCOPE_1, STATIONARY_COMBUSTION",
			"FINANCE_LEASE_OUT, OPERATIONAL_CONTROL, SCOPE_3, DOWNSTREAM_LEASED_ASSETS",
			"OPERATING_LEASE_OUT, OPERATIONAL_CONTROL, SCOPE_3, DOWNSTREAM_LEASED_ASSETS",
			"OPERATING_LEASE_OUT, FINANCIAL_CONTROL, SCOPE_1, STATIONARY_COMBUSTION" })
	void leasedAssetsFollowAppendixF(LeaseType lease, ConsolidationApproach approach, Scope scope,
			ActivityCategory category) {
		var derived = lease.derive(approach, Scope.SCOPE_1, ActivityCategory.STATIONARY_COMBUSTION);
		assertThat(derived.scope()).isEqualTo(scope);
		assertThat(derived.category()).isEqualTo(category);
	}
}
