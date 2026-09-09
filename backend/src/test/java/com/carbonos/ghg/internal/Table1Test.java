package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/** Every cell of Table 1 of the Corporate Standard (spec 03.1, 03.3), and the chain of parents. */
class Table1Test {

	@ParameterizedTest(name = "{0} under {1}, operated={2}, controlled={3}: {4}")
	@CsvSource({ //
			// relationship, approach, operated, controlled, expected share for a 40% economic interest
			"SUBSIDIARY, EQUITY_SHARE, true, true, 0.40", //
			"SUBSIDIARY, FINANCIAL_CONTROL, true, true, 1", //
			"SUBSIDIARY, OPERATIONAL_CONTROL, true, true, 1", //
			"SUBSIDIARY, OPERATIONAL_CONTROL, false, true, 0", //
			"JOINT_VENTURE, EQUITY_SHARE, true, false, 0.40", //
			"JOINT_VENTURE, FINANCIAL_CONTROL, true, false, 0.40", //
			"JOINT_VENTURE, OPERATIONAL_CONTROL, true, false, 1", //
			"JOINT_VENTURE, OPERATIONAL_CONTROL, false, false, 0", //
			"ASSOCIATE, EQUITY_SHARE, false, false, 0.40", //
			"ASSOCIATE, FINANCIAL_CONTROL, false, false, 0", //
			"ASSOCIATE, OPERATIONAL_CONTROL, false, false, 0", //
			"FIXED_ASSET_INVESTMENT, EQUITY_SHARE, false, false, 0", //
			"FIXED_ASSET_INVESTMENT, FINANCIAL_CONTROL, false, false, 0", //
			"FIXED_ASSET_INVESTMENT, OPERATIONAL_CONTROL, false, false, 0", //
			// a franchise is consolidated only where the franchiser holds equity rights or control
			"FRANCHISE, EQUITY_SHARE, false, false, 0.40", //
			"FRANCHISE, FINANCIAL_CONTROL, false, false, 0", //
			"FRANCHISE, FINANCIAL_CONTROL, false, true, 1", //
			"FRANCHISE, OPERATIONAL_CONTROL, false, false, 0", //
			"FRANCHISE, OPERATIONAL_CONTROL, true, false, 1" })
	void everyCellOfTable1(RelationshipType relationship, ConsolidationApproach approach, boolean operated,
			boolean controlled, BigDecimal expected) {
		var share = Table1.share(relationship, approach, new BigDecimal("40.00"), operated, controlled);
		assertThat(share).isEqualByComparingTo(expected);
	}

	@Test
	void aFranchiseWithNoEquityRightsStandsOutsideEveryBoundary() {
		for (var approach : ConsolidationApproach.values()) {
			assertThat(Table1.share(RelationshipType.FRANCHISE, approach, BigDecimal.ZERO, false, false)).isZero();
		}
		assertThat(Table1.describe(RelationshipType.FRANCHISE, ConsolidationApproach.EQUITY_SHARE, BigDecimal.ZERO,
				false, false)).isEqualTo("franchise; equity share: 0% (no equity rights)");
	}

	/** The Standard's Holland Industries example: BGB is a 50% venture held by Holland America, an 83% subsidiary. */
	@Test
	void theConsolidationPolicyAppliesAtEveryLevelOfTheGroup() {
		var organization = new Organization("Holland Industries", UUID.randomUUID());
		var hollandAmerica = new LegalEntity(organization, "Holland America", RelationshipType.SUBSIDIARY,
				new BigDecimal("83.00"), new BigDecimal("83.00"), true, true, null, false);
		var bgb = new LegalEntity(organization, "BGB", RelationshipType.JOINT_VENTURE, new BigDecimal("50.00"),
				null, false, false, hollandAmerica, false);

		assertThat(bgb.effectiveEconomicInterestPercent()).isEqualByComparingTo("41.50");
		assertThat(bgb.chain()).containsExactly("Holland America");
		assertThat(bgb.share(ConsolidationApproach.EQUITY_SHARE)).isEqualByComparingTo("0.4150");
		assertThat(bgb.share(ConsolidationApproach.FINANCIAL_CONTROL)).isEqualByComparingTo("0.5000");
		assertThat(bgb.share(ConsolidationApproach.OPERATIONAL_CONTROL)).isZero();
		assertThat(hollandAmerica.share(ConsolidationApproach.EQUITY_SHARE)).isEqualByComparingTo("0.8300");
		assertThat(hollandAmerica.share(ConsolidationApproach.FINANCIAL_CONTROL)).isEqualByComparingTo("1.0000");
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
