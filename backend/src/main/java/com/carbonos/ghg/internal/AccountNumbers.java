package com.carbonos.ghg.internal;

import java.util.Locale;

/**
 * The account number as people read it (spec 01.8): {@code ORG-} and the
 * number padded to four digits, {@code ORG-0042}; wider once it outgrows them,
 * {@code ORG-10000}. The frontend applies the same rule in
 * {@code lib/organizationLabel.ts}; the server formats where it is the only
 * renderer: the PDF, the export file name, a problem detail, an audit reason.
 */
public final class AccountNumbers {

	private AccountNumbers() {
	}

	public static String label(long accountNo) {
		return String.format(Locale.ROOT, "ORG-%04d", accountNo);
	}

	/** "Name (ORG-0042)": the name and the number together, as every list shows an organization. */
	public static String label(Organization organization) {
		return organization.getName() + " (" + label(organization.getAccountNo()) + ")";
	}
}
