/**
 * Shared lookups of the inventory vocabulary: an inventory by its name under
 * an organization, its boundary as the workbench shows it, and its pre-flight
 * gates (specs 03.2, 05, 05.5, 07.2).
 */
import type { ApiContext, ApiSession } from './contract.ts'
import { organization, type OrgRow } from './organizations.ts'

export interface InventoryRow {
  id: string
  organizationId: string
  name: string
  periodStart: string
  periodEnd: string
  periodLabel: string
  consolidationApproach: string
  gwpSet: string
  straddleTreatment: string
  status: string
  scope3Categories: string[]
  scope3NotQuantified: Array<{ category: string; reason: string }>
  currentBoundaryVersionNo: number | null
}

export interface BoundaryEntity {
  entityId: string
  entityName: string
  reportingCompany: boolean
  inBoundary: boolean
  economicInterestPercent: number | null
  effectiveFrom: string | null
  effectiveTo: string | null
  shareUnderApproach: number
  exclusion: { reason: string; detail: string | null } | null
  facilities: Array<{ facilityId: string; facilityName: string; inBoundary: boolean; exclusion: { reason: string; detail: string | null } | null }>
}

export interface Finding {
  severity: 'ERROR' | 'WARNING' | 'INFO'
  message: string
}

export interface ValidationReport {
  ready: boolean
  gates: Array<{ gate: string; status: string; findings: Finding[] }>
  freezeBlockers: Array<{ activityId: string; recordRef: string; activityType: string; facilityName: string; problem: string }>
}

async function get<T>(session: ApiSession, path: string): Promise<T> {
  const out = await session.get(path)
  if (!out.ok) throw new Error(`GET ${path} answered ${out.status}`)
  return out.body as T
}

export const inventories = (session: ApiSession, orgId: string) => get<InventoryRow[]>(session, `/api/ghg/organizations/${orgId}/inventories`)

/** The inventory named under the organization; when two share the name, the newest. */
export async function inventory(ctx: ApiContext, orgRef: string, name: string): Promise<{ org: OrgRow; inv: InventoryRow }> {
  const org = await organization(ctx, orgRef)
  const rows = (await inventories(ctx.session(), org.id)).filter((row) => row.name === name)
  const inv = rows[rows.length - 1]
  if (!inv) throw new Error(`no inventory named '${name}' under ${org.name}`)
  return { org, inv }
}

export const boundary = (session: ApiSession, inventoryId: string) => get<BoundaryEntity[]>(session, `/api/ghg/inventories/${inventoryId}/boundary`)

export async function boundaryEntity(session: ApiSession, inventoryId: string, name: string): Promise<BoundaryEntity> {
  const row = (await boundary(session, inventoryId)).find((e) => e.entityName === name)
  if (!row) throw new Error(`no entity named '${name}' in the boundary view`)
  return row
}

export const validation = (session: ApiSession, inventoryId: string) => get<ValidationReport>(session, `/api/ghg/inventories/${inventoryId}/validation`)

export const gateLabels: Record<string, string> = {
  BOUNDARY: 'Reporting boundary',
  COMPLETENESS: 'Activity data completeness',
  CLASSIFICATION: 'Classification',
  EMISSION_FACTOR: 'Emission factors',
  BASE_YEAR: 'Base year',
}

/** The scope 3 categories as the declaration lists them (the report labels). */
export const categoryLabels: Record<string, string> = {
  PURCHASED_GOODS_SERVICES: '1. Purchased goods and services',
  CAPITAL_GOODS: '2. Capital goods',
  FUEL_ENERGY_RELATED: '3. Fuel- and energy-related activities',
  UPSTREAM_TRANSPORT: '4. Upstream transportation and distribution',
  WASTE_GENERATED: '5. Waste generated in operations',
  BUSINESS_TRAVEL: '6. Business travel',
  EMPLOYEE_COMMUTING: '7. Employee commuting',
  UPSTREAM_LEASED_ASSETS: '8. Upstream leased assets',
  DOWNSTREAM_TRANSPORT: '9. Downstream transportation and distribution',
  PROCESSING_SOLD_PRODUCTS: '10. Processing of sold products',
  USE_SOLD_PRODUCTS: '11. Use of sold products',
  END_OF_LIFE_SOLD_PRODUCTS: '12. End-of-life treatment of sold products',
  DOWNSTREAM_LEASED_ASSETS: '13. Downstream leased assets',
  FRANCHISES: '14. Franchises',
  INVESTMENTS: '15. Investments',
}

export const statusLabels: Record<string, string> = { DRAFT: 'Draft', FROZEN: 'Frozen', FINAL: 'Final', PUBLISHED: 'Published' }

export const exclusionLabels: Record<string, string> = {
  NON_GHG: 'Non-GHG activity',
  DUPLICATE: 'Duplicate',
  NOT_APPLICABLE: 'Not applicable',
  METHODOLOGY: 'Methodology exclusion',
  OTHER: 'Other documented reason',
}
