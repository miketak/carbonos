import type {
  ActivityCategory,
  BoundaryVersionSummary,
  ConsolidationApproach,
  ExclusionReason,
  GhgScope,
  InventoryStatus,
  LeaseType,
  MarketInstrument,
  RelationshipType,
} from './api'

/** kg below one tonne, tonnes above: inventories are usually read in tCO2e. */
export function formatCo2e(kg: number): string {
  if (Math.abs(kg) >= 1000) {
    return `${(kg / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} t CO₂e`
  }
  return `${kg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg CO₂e`
}

/** Kilograms of a gas, in tonnes above one tonne. */
export function formatKg(kg: number): string {
  if (Math.abs(kg) >= 1000) {
    return `${(kg / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 })} t`
  }
  return `${kg.toLocaleString(undefined, { maximumFractionDigits: 3 })} kg`
}

export const scopeLabels: Record<GhgScope, string> = {
  SCOPE_1: 'Scope 1',
  SCOPE_2: 'Scope 2',
  SCOPE_3: 'Scope 3',
}

export const approachLabels: Record<ConsolidationApproach, string> = {
  EQUITY_SHARE: 'Equity share',
  FINANCIAL_CONTROL: 'Financial control',
  OPERATIONAL_CONTROL: 'Operational control',
}

export const statusLabels: Record<InventoryStatus, string> = {
  DRAFT: 'Draft',
  FROZEN: 'Frozen',
  FINAL: 'Final',
  PUBLISHED: 'Published',
}

/** Table 1's legal structures (spec 03.1). */
export const relationshipLabels: Record<RelationshipType, string> = {
  WHOLLY_OWNED: 'Wholly owned operation or subsidiary',
  JOINT_VENTURE: 'Joint venture (joint financial control)',
  NON_INCORPORATED_JV: 'Non-incorporated JV the company operates',
  ASSOCIATE: 'Associate (significant influence, no control)',
  FIXED_ASSET_INVESTMENT: 'Fixed-asset investment (no significant influence)',
}

export const relationshipShortLabels: Record<RelationshipType, string> = {
  WHOLLY_OWNED: 'Wholly owned',
  JOINT_VENTURE: 'Joint venture',
  NON_INCORPORATED_JV: 'Non-incorporated JV',
  ASSOCIATE: 'Associate',
  FIXED_ASSET_INVESTMENT: 'Fixed-asset investment',
}

/** Appendix F lease types (spec 04.1). */
export const leaseLabels: Record<LeaseType, string> = {
  FINANCE_LEASE_IN: 'Finance lease (leased in)',
  OPERATING_LEASE_IN: 'Operating lease (leased in)',
  FINANCE_LEASE_OUT: 'Finance lease (leased out)',
  OPERATING_LEASE_OUT: 'Operating lease (leased out)',
}

export const instrumentLabels: Record<MarketInstrument, string> = {
  SUPPLIER_SPECIFIC: 'Supplier-specific factor',
  CONTRACT: 'Power purchase contract',
  CERTIFICATE: 'Energy attribute certificate',
  RESIDUAL_MIX: 'Residual mix',
}

export const exclusionLabels: Record<ExclusionReason, string> = {
  OUTSIDE_PERIOD: 'Outside reporting period',
  OUTSIDE_BOUNDARY: 'Outside boundary',
  NON_GHG: 'Non-GHG activity',
  DUPLICATE: 'Duplicate',
  NOT_APPLICABLE: 'Not applicable',
  METHODOLOGY: 'Methodology exclusion',
  OTHER: 'Other documented reason',
}

/** Every category with its scope, in the Standard's order (spec 04.1). */
export const categories: { category: ActivityCategory; scope: GhgScope; label: string }[] = [
  { category: 'STATIONARY_COMBUSTION', scope: 'SCOPE_1', label: 'Stationary combustion' },
  { category: 'MOBILE_COMBUSTION', scope: 'SCOPE_1', label: 'Mobile combustion' },
  { category: 'PROCESS_EMISSIONS', scope: 'SCOPE_1', label: 'Process emissions' },
  { category: 'FUGITIVE_EMISSIONS', scope: 'SCOPE_1', label: 'Fugitive emissions' },
  { category: 'PURCHASED_ELECTRICITY', scope: 'SCOPE_2', label: 'Purchased electricity' },
  { category: 'PURCHASED_HEAT_STEAM', scope: 'SCOPE_2', label: 'Purchased heat and steam' },
  {
    category: 'PURCHASED_GOODS_SERVICES',
    scope: 'SCOPE_3',
    label: '1. Purchased goods and services',
  },
  { category: 'CAPITAL_GOODS', scope: 'SCOPE_3', label: '2. Capital goods' },
  {
    category: 'FUEL_ENERGY_RELATED',
    scope: 'SCOPE_3',
    label: '3. Fuel- and energy-related activities',
  },
  {
    category: 'UPSTREAM_TRANSPORT',
    scope: 'SCOPE_3',
    label: '4. Upstream transportation and distribution',
  },
  { category: 'WASTE_GENERATED', scope: 'SCOPE_3', label: '5. Waste generated in operations' },
  { category: 'BUSINESS_TRAVEL', scope: 'SCOPE_3', label: '6. Business travel' },
  { category: 'EMPLOYEE_COMMUTING', scope: 'SCOPE_3', label: '7. Employee commuting' },
  { category: 'UPSTREAM_LEASED_ASSETS', scope: 'SCOPE_3', label: '8. Upstream leased assets' },
  {
    category: 'DOWNSTREAM_TRANSPORT',
    scope: 'SCOPE_3',
    label: '9. Downstream transportation and distribution',
  },
  {
    category: 'PROCESSING_SOLD_PRODUCTS',
    scope: 'SCOPE_3',
    label: '10. Processing of sold products',
  },
  { category: 'USE_SOLD_PRODUCTS', scope: 'SCOPE_3', label: '11. Use of sold products' },
  {
    category: 'END_OF_LIFE_SOLD_PRODUCTS',
    scope: 'SCOPE_3',
    label: '12. End-of-life treatment of sold products',
  },
  { category: 'DOWNSTREAM_LEASED_ASSETS', scope: 'SCOPE_3', label: '13. Downstream leased assets' },
  { category: 'FRANCHISES', scope: 'SCOPE_3', label: '14. Franchises' },
  { category: 'INVESTMENTS', scope: 'SCOPE_3', label: '15. Investments' },
  { category: 'WATER_SUPPLY', scope: 'SCOPE_3', label: 'Water supply (purchased goods)' },
]

const categoryIndex = new Map(categories.map((entry) => [entry.category, entry]))

/** The category's label, or the SCREAMING_SNAKE name in sentence case for anything unknown. */
export function categoryLabel(category: string): string {
  const known = categoryIndex.get(category as ActivityCategory)
  if (known) return known.label
  const words = category.toLowerCase().replaceAll('_', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function categoriesForScope(scope: GhgScope): typeof categories {
  return categories.filter((entry) => entry.scope === scope)
}

/** "frozen 02/09/2026, 10:14 by ama@ecoriv.test", or without the "by" for versions migrated in. */
export function describeFreeze(version: BoundaryVersionSummary): string {
  const when = new Date(version.frozenAt).toLocaleString()
  return version.frozenBy ? `frozen ${when} by ${version.frozenBy}` : `frozen ${when}`
}

/** "member from 2025-07-01", "member until ...", or null when the window is unbounded. */
export function describeWindow(from: string | null, to: string | null): string | null {
  if (!from && !to) return null
  if (!to) return `member from ${from}`
  if (!from) return `member until ${to}`
  return `member from ${from} until ${to}`
}
