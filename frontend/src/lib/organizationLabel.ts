/**
 * The account number as people read it (spec 01.8): "ORG-" and the number
 * padded to four digits, ORG-0042; wider once it outgrows them, ORG-10000.
 * The backend applies the same rule in AccountNumbers.java where it is the
 * only renderer (the PDF, the export file name, a problem detail).
 */
export function accountLabel(accountNo: number): string {
  return `ORG-${String(accountNo).padStart(4, '0')}`
}

/** "Name (ORG-0042)": how every list, picker and toast names an organization. */
export function organizationLabel(organization: { name: string; accountNo: number }): string {
  return `${organization.name} (${accountLabel(organization.accountNo)})`
}
