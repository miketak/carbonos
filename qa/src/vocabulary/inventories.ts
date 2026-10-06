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
  // an inventory created a moment ago (a correction) may take a breath to be listed: ask again before giving up
  for (let attempt = 0; ; attempt++) {
    const rows = (await inventories(ctx.session(), org.id)).filter((row) => row.name === name)
    const inv = rows[rows.length - 1]
    if (inv) return { org, inv }
    if (attempt >= 3) throw new Error(`no inventory named '${name}' under ${org.name}`)
    await new Promise((resolve) => setTimeout(resolve, 1_000))
  }
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
  STATIONARY_COMBUSTION: 'Stationary combustion',
  MOBILE_COMBUSTION: 'Mobile combustion',
  PROCESS_EMISSIONS: 'Process emissions',
  FUGITIVE_EMISSIONS: 'Fugitive emissions',
  PURCHASED_ELECTRICITY: 'Purchased electricity',
  PURCHASED_HEAT_STEAM: 'Purchased heat and steam',
  PURCHASED_COOLING: 'Purchased cooling',
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

export const statusLabels: Record<string, string> = { DRAFT: 'Draft', FROZEN: 'Frozen', IN_REVIEW: 'In review', FINAL: 'Final', PUBLISHED: 'Published' }

export const exclusionLabels: Record<string, string> = {
  NON_GHG: 'Non-GHG activity',
  DUPLICATE: 'Duplicate',
  NOT_APPLICABLE: 'Not applicable',
  METHODOLOGY: 'Methodology exclusion',
  OTHER: 'Other documented reason',
}

// --- the view: assignments, densities, upstream rules and instruments (procedure 5) ------------------

export interface AssignmentRow {
  id: string
  activityId: string
  recordRef: string
  facilityName: string
  activityType: string
  quantity: number
  unit: string
  included: boolean
  exclusionReason: string | null
  exclusionDetail: string | null
  exclusionJustification: string | null
  estimateState: string | null
  gas: string | null
  classified: boolean
  scope: string | null
  category: string | null
  emissionFactorId: string | null
  factorName: string | null
  scopeJustification: string | null
  proxy: boolean
  proxyJustification: string | null
  densityMaterial: string | null
  suggestedFactorId: string | null
  suggestedFactorName: string | null
}

export const assignments = (session: ApiSession, inventoryId: string) => get<AssignmentRow[]>(session, `/api/ghg/inventories/${inventoryId}/assignments`)

/** The view's row for a record (ACT-0001) or an activity type. */
export async function assignment(session: ApiSession, inventoryId: string, ref: string): Promise<AssignmentRow> {
  const rows = await assignments(session, inventoryId)
  const found = rows.find((r) => r.recordRef === ref) ?? rows.find((r) => r.activityType === ref)
  if (!found) throw new Error(`no record '${ref}' in the view`)
  return found
}

export interface DensityRow {
  id: string
  typical: boolean
  material: string
  kgPerLitre: number
}

export const densities = (session: ApiSession, orgId: string) => get<DensityRow[]>(session, `/api/ghg/organizations/${orgId}/densities`)

/** A density as the drawer lists it: "Diesel (typical value)" is the shared one, "Diesel (Adansi CoA)" the organization's. */
export async function density(session: ApiSession, orgId: string, name: string): Promise<DensityRow> {
  const all = await densities(session, orgId)
  const typical = /^(.*) \(typical value\)$/.exec(name)
  const found = typical ? all.find((d) => d.typical && d.material === typical[1]) : all.find((d) => !d.typical && d.material === name)
  if (!found) throw new Error(`no density '${name}'`)
  return found
}

export interface UpstreamRuleRow {
  id: string
  primaryFactorName: string
  upstreamFactorName: string
  kind: string
  matchingLines: number
}

export const upstreamRules = (session: ApiSession, inventoryId: string) => get<UpstreamRuleRow[]>(session, `/api/ghg/inventories/${inventoryId}/upstream-rules`)

export interface InstrumentRow {
  id: string
  facilityId: string
  facilityName: string
  instrumentType: string
  kgCo2ePerKwh: number
  source: string
  meetsQualityCriteria: boolean
  criteria: Array<{ code: string; title: string; answer: string }>
  unansweredCount: number
  notMetCount: number
  certificateId: string | null
  registry: string | null
  vintage: number | null
  coveredKwh: number
  periodStart: string | null
  periodEnd: string | null
}

export const instruments = (session: ApiSession, inventoryId: string) => get<InstrumentRow[]>(session, `/api/ghg/inventories/${inventoryId}/market-factors`)

export interface VersionRow {
  id: string
  versionNo: number
  frozenBy: string
  reopenedBy: string | null
  reopenReason: string | null
}

export const boundaryVersions = (session: ApiSession, inventoryId: string) => get<VersionRow[]>(session, `/api/ghg/inventories/${inventoryId}/boundary/versions`)

export const scopeLabels: Record<string, string> = { SCOPE_1: 'Scope 1', SCOPE_2: 'Scope 2', SCOPE_3: 'Scope 3' }

export const instrumentLabels: Record<string, string> = {
  SUPPLIER_SPECIFIC: 'Supplier-specific factor',
  CONTRACT: 'Power purchase contract',
  CERTIFICATE: 'Energy attribute certificate',
  RESIDUAL_MIX: 'Residual mix',
}

export const recordExclusionLabels: Record<string, string> = {
  ...exclusionLabels,
  OUTSIDE_PERIOD: 'Outside reporting period',
  OUTSIDE_BOUNDARY: 'Outside boundary',
  OUTSIDE_SCOPES_NON_KYOTO: 'Outside the scopes: Montreal Protocol gas',
}
