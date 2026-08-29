import type { ConsolidationApproach, GhgScope } from './api'

/** kg below one tonne, tonnes above — inventories are usually read in tCO2e. */
export function formatCo2e(kg: number): string {
  if (Math.abs(kg) >= 1000) {
    return `${(kg / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} t CO₂e`
  }
  return `${kg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg CO₂e`
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

/** SCREAMING_SNAKE category → sentence case, e.g. "Purchased electricity". */
export function categoryLabel(category: string): string {
  const words = category.toLowerCase().replaceAll('_', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
