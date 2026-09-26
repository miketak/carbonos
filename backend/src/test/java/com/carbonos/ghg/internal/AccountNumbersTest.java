package com.carbonos.ghg.internal;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;

import org.junit.jupiter.api.Test;

/** Spec 01.8: the account number as people read it, four digits wide and wider once it outgrows them. */
class AccountNumbersTest {

	@Test
	void padsToFourDigitsAndGrowsBeyondThem() {
		assertThat(AccountNumbers.label(1)).isEqualTo("ORG-0001");
		assertThat(AccountNumbers.label(42)).isEqualTo("ORG-0042");
		assertThat(AccountNumbers.label(9999)).isEqualTo("ORG-9999");
		assertThat(AccountNumbers.label(10000)).isEqualTo("ORG-10000");
	}

	@Test
	void namesAnOrganizationWithItsNumber() {
		var organization = new Organization("Adansi Foods Ltd", UUID.randomUUID(), 12);
		assertThat(AccountNumbers.label(organization)).isEqualTo("Adansi Foods Ltd (ORG-0012)");
	}
}
