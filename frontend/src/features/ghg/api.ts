import { api } from '../../lib/api'

export type ConsolidationApproach = 'EQUITY_SHARE' | 'FINANCIAL_CONTROL' | 'OPERATIONAL_CONTROL'
export type GhgScope = 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3'
export type DataQuality = 'MEASURED' | 'ESTIMATED' | 'CALCULATED'
export type ExclusionReason =
  | 'OUTSIDE_PERIOD'
  | 'OUTSIDE_BOUNDARY'
  | 'NON_GHG'
  | 'DUPLICATE'
  | 'NOT_APPLICABLE'
  | 'METHODOLOGY'
  | 'OTHER'
export type ValidationGate =
  'BOUNDARY' | 'COMPLETENESS' | 'CLASSIFICATION' | 'EMISSION_FACTOR' | 'BASE_YEAR'
export type Dimension = 'ENERGY' | 'VOLUME' | 'MASS' | 'DISTANCE' | 'PASSENGER_DISTANCE'
export type GateStatus = 'PASSED' | 'WARNINGS' | 'BLOCKED'
export type FindingSeverity = 'ERROR' | 'WARNING' | 'INFO'
/**
 * Lifecycle of an inventory (spec 05.1), covering the boundary and the activity
 * view together: a draft blocks runs, freezing cuts a boundary version, a final
 * run moves it to FINAL, publishing makes it a record.
 */
export type InventoryStatus = 'DRAFT' | 'FROZEN' | 'FINAL' | 'PUBLISHED'
/** The legal structures of Table 1 of the Corporate Standard (spec 03.1). */
export type RelationshipType =
  'WHOLLY_OWNED' | 'JOINT_VENTURE' | 'NON_INCORPORATED_JV' | 'ASSOCIATE' | 'FIXED_ASSET_INVESTMENT'
/** Appendix F lease types (spec 04.1). */
export type LeaseType =
  'FINANCE_LEASE_IN' | 'OPERATING_LEASE_IN' | 'FINANCE_LEASE_OUT' | 'OPERATING_LEASE_OUT'
export type GwpSet = 'AR5' | 'AR6'
export type MarketInstrument = 'SUPPLIER_SPECIFIC' | 'CONTRACT' | 'CERTIFICATE' | 'RESIDUAL_MIX'
export type RecalculationStatus = 'FLAGGED' | 'RECALCULATED' | 'DECLINED'
export type RecalculationTrigger = 'STRUCTURAL_CHANGE' | 'METHODOLOGY_CHANGE' | 'ERROR_CORRECTION'
/** The Standard's scope 1 kinds, the scope 2 kinds and the fifteen scope 3 categories (spec 04.1). */
export type ActivityCategory =
  | 'STATIONARY_COMBUSTION'
  | 'MOBILE_COMBUSTION'
  | 'PROCESS_EMISSIONS'
  | 'FUGITIVE_EMISSIONS'
  | 'PURCHASED_ELECTRICITY'
  | 'PURCHASED_HEAT_STEAM'
  | 'PURCHASED_GOODS_SERVICES'
  | 'CAPITAL_GOODS'
  | 'FUEL_ENERGY_RELATED'
  | 'UPSTREAM_TRANSPORT'
  | 'WASTE_GENERATED'
  | 'BUSINESS_TRAVEL'
  | 'EMPLOYEE_COMMUTING'
  | 'UPSTREAM_LEASED_ASSETS'
  | 'DOWNSTREAM_TRANSPORT'
  | 'PROCESSING_SOLD_PRODUCTS'
  | 'USE_SOLD_PRODUCTS'
  | 'END_OF_LIFE_SOLD_PRODUCTS'
  | 'DOWNSTREAM_LEASED_ASSETS'
  | 'FRANCHISES'
  | 'INVESTMENTS'

export interface Organization {
  id: string
  name: string
  facilityCount: number
  createdAt: string
}

export interface OrganizationInput {
  name: string
}

/** A legal entity the organization consolidates, with its Table 1 facts (spec 03.1). */
export interface Entity {
  id: string
  name: string
  relationshipType: RelationshipType
  economicInterestPercent: number
  legalOwnershipPercent: number | null
  operatedByCompany: boolean
  /** The organization itself, wholly owned: the entity facilities default to. */
  reportingCompany: boolean
  /** The share Table 1 gives the entity under each approach. */
  equityShare: number
  financialControlShare: number
  operationalControlShare: number
  createdAt: string
}

export interface EntityInput {
  name: string
  relationshipType: RelationshipType
  economicInterestPercent: number
  legalOwnershipPercent?: number
  operatedByCompany: boolean
}

/** A site: name, location and the legal entity it belongs to (spec 03.1). */
export interface Facility {
  id: string
  name: string
  location: string
  entityId: string
  entityName: string
  relationshipType: RelationshipType
  createdAt: string
}

export interface FacilityInput {
  name: string
  location: string
  /** Absent, the facility belongs to the reporting company. */
  entityId?: string
}

/** kg of each gas per unit (HFCs and PFCs are kg CO2e of the blend). */
export interface Gases {
  co2: number
  ch4: number
  n2o: number
  hfcs: number
  pfcs: number
  sf6: number
  nf3: number
}

export interface EmissionFactor {
  id: string
  name: string
  /** The scope and category the factor suggests; the accountant decides (spec 04.1). */
  defaultScope: GhgScope
  defaultCategory: ActivityCategory
  /** The same physics whoever owns the source: usable in scope 1 or scope 3. */
  scopeAgnostic: boolean
  unit: string
  /** The unit's physical dimension, or null if the unit is unrecognized. */
  dimension: Dimension | null
  kgCo2ePerUnit: number
  gases: Gases
  biogenicCo2KgPerUnit: number
  gwpSet: GwpSet
  source: string
}

/** A convertible unit for the activity-entry picker and conversion previews. */
export interface Unit {
  code: string
  label: string
  dimension: Dimension
  /** The unit's size in its dimension's canonical base unit. */
  toCanonical: number
}

/** An organizational fact: no scope, category, or factor (spec 05). */
export interface Activity {
  id: string
  facilityId: string
  facilityName: string
  activityType: string
  quantity: number
  unit: string
  activityDate: string
  dataSource: string | null
  evidenceRef: string | null
  dataQuality: DataQuality
  note: string | null
}

export interface ActivityInput {
  facilityId: string
  activityType: string
  quantity: number
  unit: string
  activityDate: string
  dataSource?: string
  evidenceRef?: string
  dataQuality: DataQuality
  note?: string
}

export interface Inventory {
  id: string
  organizationId: string
  name: string
  periodStart: string
  periodEnd: string
  purpose: string | null
  baseYear: number | null
  consolidationApproach: ConsolidationApproach
  gwpSet: GwpSet
  /** The operational boundary declaration (spec 07.1). */
  scope3Categories: ActivityCategory[]
  scope3ExclusionsRationale: string | null
  finalRunId: string | null
  status: InventoryStatus
  supersededById: string | null
  publishedAt: string | null
  currentBoundaryVersionId: string | null
  currentBoundaryVersionNo: number | null
  createdAt: string
}

export interface InventoryInput {
  name: string
  periodStart: string
  periodEnd: string
  purpose?: string
  baseYear?: number
  consolidationApproach: ConsolidationApproach
  gwpSet?: GwpSet
}

export interface OperationalBoundaryInput {
  scope3Categories: ActivityCategory[]
  exclusionsRationale?: string
}

export interface BoundaryFacilityMember {
  facilityId: string
  facilityName: string
  location: string
  inBoundary: boolean
}

/**
 * One legal entity as one inventory's boundary sees it (spec 03.1): its
 * treatment when in the boundary (the Table 1 row applied, the derived share,
 * the membership window) or nulls when outside, plus its facilities.
 */
export interface BoundaryEntity {
  entityId: string
  entityName: string
  reportingCompany: boolean
  inBoundary: boolean
  relationshipType: RelationshipType | null
  economicInterestPercent: number | null
  operatedByCompany: boolean | null
  accountingShare: number | null
  table1Row: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  facilities: BoundaryFacilityMember[]
}

/**
 * Every field is optional (spec 03): on creation an absent field is prefilled
 * from the entity's facts, so `{}` adds an entity or facility exactly as its
 * record describes it; on update an absent field keeps its current value.
 * `clearWindow` removes the membership window (spec 03.2).
 */
export interface BoundaryTreatmentInput {
  relationshipType?: RelationshipType
  economicInterestPercent?: number
  operatedByCompany?: boolean
  effectiveFrom?: string
  effectiveTo?: string
  clearWindow?: boolean
}

/** One freeze of the boundary, without its entries (spec 03). */
export interface BoundaryVersionSummary {
  id: string
  versionNo: number
  consolidationApproach: ConsolidationApproach
  entityCount: number
  facilityCount: number
  frozenByUserId: string | null
  /** The freezer's email as it was at the time; null for versions reconstructed by migration. */
  frozenBy: string | null
  frozenAt: string
}

export interface BoundaryVersionFacility {
  facilityId: string
  facilityName: string
  location: string
}

/** An entity exactly as a boundary version recorded it, names copied at freeze time. */
export interface BoundaryVersionEntry {
  entityId: string
  entityName: string
  relationshipType: RelationshipType
  economicInterestPercent: number
  operatedByCompany: boolean
  accountingShare: number
  table1Row: string
  effectiveFrom: string | null
  effectiveTo: string | null
  /** A zero-share entity stands outside the boundary under the approach (spec 05.1). */
  excluded: boolean
  exclusionReason: string | null
  facilities: BoundaryVersionFacility[]
}

export interface BoundaryVersion {
  version: BoundaryVersionSummary
  entries: BoundaryVersionEntry[]
}

/** The fact plus this inventory's accounting decision about it. */
export interface Assignment {
  id: string
  activityId: string
  facilityId: string
  facilityName: string
  activityType: string
  quantity: number
  unit: string
  activityDate: string
  dataQuality: DataQuality
  evidenceRef: string | null
  included: boolean
  exclusionReason: ExclusionReason | null
  /** Why, in words, for automatic exclusions (e.g. the membership window). */
  exclusionDetail: string | null
  classified: boolean
  scope: GhgScope | null
  category: ActivityCategory | null
  leaseType: LeaseType | null
  emissionFactorId: string | null
  factorName: string | null
}

/** A classification (spec 04.1): factor plus the scope and category chosen; a lease type derives them. */
export interface ClassifyInput {
  emissionFactorId: string
  scope?: GhgScope
  category?: ActivityCategory
  leaseType?: LeaseType
}

export interface ValidationFinding {
  severity: FindingSeverity
  message: string
}

export interface GateResult {
  gate: ValidationGate
  status: GateStatus
  findings: ValidationFinding[]
}

export interface ValidationReport {
  ready: boolean
  gates: GateResult[]
}

/** Totals per gas: kg of the gas, or kg CO2e for the HFC and PFC blends. */
export interface ByGas {
  co2Kg: number
  ch4Kg: number
  n2oKg: number
  hfcsKgCo2e: number
  pfcsKgCo2e: number
  sf6Kg: number
  nf3Kg: number
}

export interface Run {
  id: string
  inventoryId: string
  label: string
  periodStart: string
  periodEnd: string
  consolidationApproach: ConsolidationApproach
  gwpSet: GwpSet
  activityCount: number
  totalKgCo2e: number
  scope1KgCo2e: number
  scope2KgCo2e: number
  scope3KgCo2e: number
  /** Scope 2 under the market-based method; null when no facility has an instrument. */
  scope2MarketBasedKgCo2e: number | null
  byGas: ByGas
  biogenicCo2Kg: number
  isFinal: boolean
  /** The boundary version the shares came from; null for runs older than spec 03. */
  boundaryVersionId: string | null
  boundaryVersionNo: number | null
  createdAt: string
}

export interface RunLine {
  id: string
  activityId: string
  facilityId: string | null
  facilityName: string
  factorName: string
  scope: GhgScope
  category: ActivityCategory
  leaseType: LeaseType | null
  /** The original recorded quantity and unit (the fact). */
  quantity: number
  unit: string
  /** The factor's unit and the quantity converted into it (what was multiplied). */
  factorUnit: string
  convertedQuantity: number
  conversionFactor: number
  kgCo2ePerUnit: number
  weight: number
  kgCo2e: number
  byGas: ByGas
  biogenicCo2Kg: number
  marketBasedKgCo2e: number | null
  marketFactorKgCo2ePerKwh: number | null
  marketInstrument: MarketInstrument | null
}

/** An assignment a run left out, with the activity's facts and the documented reason (spec 05.1). */
export interface RunExclusion {
  id: string
  activityId: string
  facilityName: string
  activityType: string
  quantity: number
  unit: string
  activityDate: string
  exclusionReason: ExclusionReason
  exclusionDetail: string | null
}

export interface RunDetail {
  run: Run
  lines: RunLine[]
  exclusions: RunExclusion[]
}

/** A market-based scope 2 factor for one facility in one inventory (spec 07.1). */
export interface MarketFactor {
  id: string
  facilityId: string
  facilityName: string
  instrumentType: MarketInstrument
  kgCo2ePerKwh: number
  source: string
}

export interface MarketFactorInput {
  instrumentType: MarketInstrument
  kgCo2ePerKwh: number
  source: string
}

export interface RecalculationTriggers {
  structuralChanges: boolean
  methodologyChanges: boolean
  errorCorrections: boolean
}

/** One candidate recalculation of the base year and the accountant's decision on it (spec 06). */
export interface Recalculation {
  id: string
  triggerType: RecalculationTrigger
  reason: string
  triggeringInventoryId: string | null
  boundaryVersionId: string | null
  boundaryVersionNo: number | null
  affectedPercent: number | null
  aboveThreshold: boolean
  status: RecalculationStatus
  runId: string | null
  decisionNote: string | null
  decidedBy: string | null
  decidedAt: string | null
  createdAt: string
}

/** The organization's base year and recalculation policy (spec 06). */
export interface BaseYear {
  id: string
  inventoryId: string
  inventoryName: string
  year: number
  thresholdPercent: number
  triggers: RecalculationTriggers
  baseRunId: string | null
  recalculations: Recalculation[]
  createdAt: string
}

export interface BaseYearInput {
  inventoryId: string
  thresholdPercent: number
  triggers: RecalculationTriggers
}

export interface RecalculationDecisionInput {
  decision: 'RECALCULATED' | 'DECLINED'
  runId?: string
  note?: string
}

export interface RunFigure {
  runId: string
  label: string
  totalKgCo2e: number
  scope1KgCo2e: number
  scope2KgCo2e: number
  scope3KgCo2e: number
}

/** The inventory report for one run, in the order Chapter 9 lists its elements (spec 07.1). */
export interface Report {
  company: {
    organizationName: string
    consolidationApproach: ConsolidationApproach
    boundaryVersion: BoundaryVersion | null
  }
  operationalBoundary: {
    scopesCovered: GhgScope[]
    scope3Categories: ActivityCategory[]
    scope3CategoriesReported: ActivityCategory[]
    exclusionsRationale: string | null
  }
  period: {
    periodStart: string
    periodEnd: string
    inventoryName: string
    status: InventoryStatus
    publishedAt: string | null
    supersededById: string | null
  }
  emissions: {
    scope1KgCo2e: number
    scope2LocationBasedKgCo2e: number
    scope2MarketBasedKgCo2e: number | null
    scope3KgCo2e: number
    totalKgCo2e: number
    marketInstruments: MarketFactor[]
  }
  /** kg of the gas (null for the HFC and PFC blends) and kg CO2e under the run's GWP set. */
  byGas: { gas: string; kg: number | null; kgCo2e: number }[]
  biogenicCo2Kg: number
  baseYear: {
    year: number
    inventoryName: string
    inventoryId: string
    thresholdPercent: number
    triggers: RecalculationTriggers
    originalBase: RunFigure | null
    recalculations: { decision: Recalculation; recalculatedBase: RunFigure | null }[]
  } | null
  methodology: {
    gwpSet: GwpSet
    consolidationApproach: ConsolidationApproach
    factorSources: string[]
    statement: string
  }
  exclusions: RunExclusion[]
  lines: RunLine[]
  run: Run
}

// --- organizations ---------------------------------------------------------

export function listOrganizations(): Promise<Organization[]> {
  return api<Organization[]>('/api/ghg/organizations')
}

export function getOrganization(id: string): Promise<Organization> {
  return api<Organization>(`/api/ghg/organizations/${id}`)
}

export function createOrganization(input: OrganizationInput): Promise<Organization> {
  return api<Organization>('/api/ghg/organizations', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateOrganization(id: string, input: OrganizationInput): Promise<Organization> {
  return api<Organization>(`/api/ghg/organizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteOrganization(id: string): Promise<void> {
  return api<void>(`/api/ghg/organizations/${id}`, { method: 'DELETE' })
}

// --- legal entities (spec 03.1) ---------------------------------------------

export function listEntities(organizationId: string): Promise<Entity[]> {
  return api<Entity[]>(`/api/ghg/organizations/${organizationId}/entities`)
}

export function createEntity(organizationId: string, input: EntityInput): Promise<Entity> {
  return api<Entity>(`/api/ghg/organizations/${organizationId}/entities`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateEntity(id: string, input: EntityInput): Promise<Entity> {
  return api<Entity>(`/api/ghg/entities/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function deleteEntity(id: string): Promise<void> {
  return api<void>(`/api/ghg/entities/${id}`, { method: 'DELETE' })
}

// --- facilities -------------------------------------------------------------

export function listFacilities(organizationId: string): Promise<Facility[]> {
  return api<Facility[]>(`/api/ghg/organizations/${organizationId}/facilities`)
}

export function createFacility(organizationId: string, input: FacilityInput): Promise<Facility> {
  return api<Facility>(`/api/ghg/organizations/${organizationId}/facilities`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateFacility(id: string, input: FacilityInput): Promise<Facility> {
  return api<Facility>(`/api/ghg/facilities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteFacility(id: string): Promise<void> {
  return api<void>(`/api/ghg/facilities/${id}`, { method: 'DELETE' })
}

// --- emission factors --------------------------------------------------------

export function listEmissionFactors(): Promise<EmissionFactor[]> {
  return api<EmissionFactor[]>('/api/ghg/emission-factors')
}

// --- units -------------------------------------------------------------------

export function listUnits(): Promise<Unit[]> {
  return api<Unit[]>('/api/ghg/units')
}

// --- activity facts ----------------------------------------------------------

export function listActivities(organizationId: string): Promise<Activity[]> {
  return api<Activity[]>(`/api/ghg/organizations/${organizationId}/activities`)
}

export function createActivity(organizationId: string, input: ActivityInput): Promise<Activity> {
  return api<Activity>(`/api/ghg/organizations/${organizationId}/activities`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

/** In-place correction (CORRECT-01): past runs are snapshots and stay untouched. */
export function updateActivity(id: string, input: ActivityInput): Promise<Activity> {
  return api<Activity>(`/api/ghg/activities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteActivity(id: string): Promise<void> {
  return api<void>(`/api/ghg/activities/${id}`, { method: 'DELETE' })
}

// --- inventories --------------------------------------------------------------

export function listInventories(organizationId: string): Promise<Inventory[]> {
  return api<Inventory[]>(`/api/ghg/organizations/${organizationId}/inventories`)
}

export function getInventory(id: string): Promise<Inventory> {
  return api<Inventory>(`/api/ghg/inventories/${id}`)
}

export function createInventory(organizationId: string, input: InventoryInput): Promise<Inventory> {
  return api<Inventory>(`/api/ghg/organizations/${organizationId}/inventories`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateInventory(id: string, input: InventoryInput): Promise<Inventory> {
  return api<Inventory>(`/api/ghg/inventories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteInventory(id: string): Promise<void> {
  return api<void>(`/api/ghg/inventories/${id}`, { method: 'DELETE' })
}

export function setOperationalBoundary(
  id: string,
  input: OperationalBoundaryInput,
): Promise<Inventory> {
  return api<Inventory>(`/api/ghg/inventories/${id}/operational-boundary`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

// --- boundary (spec 03.1, 03.2) ----------------------------------------------------

export function getBoundary(inventoryId: string): Promise<BoundaryEntity[]> {
  return api<BoundaryEntity[]>(`/api/ghg/inventories/${inventoryId}/boundary`)
}

/** Ticks one facility in; its entity's treatment prefills from the entity's facts. */
export function setBoundaryTreatment(
  inventoryId: string,
  facilityId: string,
  input: BoundaryTreatmentInput,
): Promise<BoundaryEntity> {
  return api<BoundaryEntity>(`/api/ghg/inventories/${inventoryId}/boundary/${facilityId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function removeBoundaryTreatment(inventoryId: string, facilityId: string): Promise<void> {
  return api<void>(`/api/ghg/inventories/${inventoryId}/boundary/${facilityId}`, {
    method: 'DELETE',
  })
}

/** Adds an entity with every facility of it, or updates its treatment (overrides, window). */
export function setEntityTreatment(
  inventoryId: string,
  entityId: string,
  input: BoundaryTreatmentInput,
): Promise<BoundaryEntity> {
  return api<BoundaryEntity>(`/api/ghg/inventories/${inventoryId}/boundary/entities/${entityId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function removeEntityTreatment(inventoryId: string, entityId: string): Promise<void> {
  return api<void>(`/api/ghg/inventories/${inventoryId}/boundary/entities/${entityId}`, {
    method: 'DELETE',
  })
}

export function listBoundaryVersions(inventoryId: string): Promise<BoundaryVersionSummary[]> {
  return api<BoundaryVersionSummary[]>(`/api/ghg/inventories/${inventoryId}/boundary/versions`)
}

export function getBoundaryVersion(id: string): Promise<BoundaryVersion> {
  return api<BoundaryVersion>(`/api/ghg/boundary-versions/${id}`)
}

// --- inventory lifecycle (spec 05.1) ----------------------------------------------

export function freezeInventory(inventoryId: string): Promise<BoundaryVersion> {
  return api<BoundaryVersion>(`/api/ghg/inventories/${inventoryId}/freeze`, { method: 'POST' })
}

export function reopenInventory(inventoryId: string): Promise<Inventory> {
  return api<Inventory>(`/api/ghg/inventories/${inventoryId}/reopen`, { method: 'POST' })
}

export function finalizeInventory(inventoryId: string, runId: string): Promise<Inventory> {
  return api<Inventory>(`/api/ghg/inventories/${inventoryId}/finalize`, {
    method: 'POST',
    body: JSON.stringify({ runId }),
  })
}

export function withdrawFinal(inventoryId: string): Promise<Inventory> {
  return api<Inventory>(`/api/ghg/inventories/${inventoryId}/withdraw-final`, { method: 'POST' })
}

export function publishInventory(inventoryId: string): Promise<Inventory> {
  return api<Inventory>(`/api/ghg/inventories/${inventoryId}/publish`, { method: 'POST' })
}

export function supersedeInventory(inventoryId: string, name?: string): Promise<Inventory> {
  return api<Inventory>(`/api/ghg/inventories/${inventoryId}/supersede`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

// --- market-based scope 2 (spec 07.1) ------------------------------------------------

export function listMarketFactors(inventoryId: string): Promise<MarketFactor[]> {
  return api<MarketFactor[]>(`/api/ghg/inventories/${inventoryId}/market-factors`)
}

export function setMarketFactor(
  inventoryId: string,
  facilityId: string,
  input: MarketFactorInput,
): Promise<MarketFactor> {
  return api<MarketFactor>(`/api/ghg/inventories/${inventoryId}/market-factors/${facilityId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function removeMarketFactor(inventoryId: string, facilityId: string): Promise<void> {
  return api<void>(`/api/ghg/inventories/${inventoryId}/market-factors/${facilityId}`, {
    method: 'DELETE',
  })
}

// --- assignments ----------------------------------------------------------------

export function listAssignments(inventoryId: string): Promise<Assignment[]> {
  return api<Assignment[]>(`/api/ghg/inventories/${inventoryId}/assignments`)
}

export function syncAssignments(
  inventoryId: string,
): Promise<{ created: number; updated: number }> {
  return api<{ created: number; updated: number }>(
    `/api/ghg/inventories/${inventoryId}/assignments/sync`,
    { method: 'POST' },
  )
}

export function classifyAssignment(id: string, input: ClassifyInput): Promise<Assignment> {
  return api<Assignment>(`/api/ghg/assignments/${id}/classify`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function excludeAssignment(id: string, reason: ExclusionReason): Promise<Assignment> {
  return api<Assignment>(`/api/ghg/assignments/${id}/exclude`, {
    method: 'PUT',
    body: JSON.stringify({ reason }),
  })
}

export function includeAssignment(id: string): Promise<Assignment> {
  return api<Assignment>(`/api/ghg/assignments/${id}/include`, { method: 'PUT' })
}

// --- validation ------------------------------------------------------------------

export function getValidation(inventoryId: string): Promise<ValidationReport> {
  return api<ValidationReport>(`/api/ghg/inventories/${inventoryId}/validation`)
}

// --- runs ------------------------------------------------------------------------

export function listRuns(inventoryId: string): Promise<Run[]> {
  return api<Run[]>(`/api/ghg/inventories/${inventoryId}/runs`)
}

export function executeRun(inventoryId: string, label: string): Promise<RunDetail> {
  return api<RunDetail>(`/api/ghg/inventories/${inventoryId}/runs`, {
    method: 'POST',
    body: JSON.stringify({ label }),
  })
}

export function getRun(id: string): Promise<RunDetail> {
  return api<RunDetail>(`/api/ghg/runs/${id}`)
}

/** Designates the run as its inventory's final run; the inventory moves to FINAL (spec 05.1). */
export function finalizeRun(id: string): Promise<Inventory> {
  return api<Inventory>(`/api/ghg/runs/${id}/finalize`, { method: 'POST' })
}

export function deleteRun(id: string): Promise<void> {
  return api<void>(`/api/ghg/runs/${id}`, { method: 'DELETE' })
}

export function getReport(runId: string): Promise<Report> {
  return api<Report>(`/api/ghg/runs/${runId}/report`)
}

// --- base year (spec 06) -------------------------------------------------------------

/** Null when the organization has not designated a base year (the API answers 204). */
export function getBaseYear(organizationId: string): Promise<BaseYear | null> {
  return api<BaseYear | null>(`/api/ghg/organizations/${organizationId}/base-year`).then(
    (value) => value ?? null,
  )
}

export function setBaseYear(organizationId: string, input: BaseYearInput): Promise<BaseYear> {
  return api<BaseYear>(`/api/ghg/organizations/${organizationId}/base-year`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function clearBaseYear(organizationId: string): Promise<void> {
  return api<void>(`/api/ghg/organizations/${organizationId}/base-year`, { method: 'DELETE' })
}

export function decideRecalculation(
  organizationId: string,
  recalculationId: string,
  input: RecalculationDecisionInput,
): Promise<BaseYear> {
  return api<BaseYear>(
    `/api/ghg/organizations/${organizationId}/base-year/recalculations/${recalculationId}/decide`,
    { method: 'POST', body: JSON.stringify(input) },
  )
}
