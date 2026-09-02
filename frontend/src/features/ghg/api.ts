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
export type ValidationGate = 'BOUNDARY' | 'COMPLETENESS' | 'CLASSIFICATION' | 'EMISSION_FACTOR'
export type Dimension = 'ENERGY' | 'VOLUME' | 'MASS' | 'DISTANCE' | 'PASSENGER_DISTANCE'
export type GateStatus = 'PASSED' | 'WARNINGS' | 'BLOCKED'
export type FindingSeverity = 'ERROR' | 'WARNING' | 'INFO'
/** Lifecycle of an inventory's boundary (spec 007): a draft blocks runs, freezing cuts a version. */
export type BoundaryStatus = 'DRAFT' | 'FROZEN'

export interface Organization {
  id: string
  name: string
  facilityCount: number
  createdAt: string
}

export interface OrganizationInput {
  name: string
}

export interface Facility {
  id: string
  name: string
  location: string
  equitySharePercent: number
  controlled: boolean
  createdAt: string
}

export interface FacilityInput {
  name: string
  location: string
  equitySharePercent: number
  controlled: boolean
}

export interface EmissionFactor {
  id: string
  name: string
  scope: GhgScope
  category: string
  unit: string
  /** The unit's physical dimension, or null if the unit is unrecognized. */
  dimension: Dimension | null
  kgCo2ePerUnit: number
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

/** An organizational fact — no scope, category, or factor (spec 003). */
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
  finalRunId: string | null
  boundaryStatus: BoundaryStatus
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
}

export interface BoundaryEntry {
  facilityId: string
  facilityName: string
  location: string
  inBoundary: boolean
  ownershipPercent: number | null
  financialControl: boolean | null
  operationalControl: boolean | null
  accountingShare: number | null
}

export interface BoundaryTreatmentInput {
  ownershipPercent: number
  financialControl: boolean
  operationalControl: boolean
}

/** One freeze of the boundary, without its entries (spec 007). */
export interface BoundaryVersionSummary {
  id: string
  versionNo: number
  consolidationApproach: ConsolidationApproach
  facilityCount: number
  frozenByUserId: string | null
  /** The freezer's email as it was at the time; null for versions reconstructed by migration. */
  frozenBy: string | null
  frozenAt: string
}

/** A facility exactly as a boundary version recorded it, name copied at freeze time. */
export interface BoundaryVersionEntry {
  facilityId: string
  facilityName: string
  location: string
  ownershipPercent: number
  financialControl: boolean
  operationalControl: boolean
  accountingShare: number
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
  classified: boolean
  scope: GhgScope | null
  category: string | null
  emissionFactorId: string | null
  factorName: string | null
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

export interface Run {
  id: string
  inventoryId: string
  label: string
  periodStart: string
  periodEnd: string
  consolidationApproach: ConsolidationApproach
  activityCount: number
  totalKgCo2e: number
  scope1KgCo2e: number
  scope2KgCo2e: number
  scope3KgCo2e: number
  isFinal: boolean
  /** The boundary version the shares came from; null for runs older than spec 007. */
  boundaryVersionId: string | null
  boundaryVersionNo: number | null
  createdAt: string
}

export interface RunLine {
  id: string
  activityId: string
  facilityName: string
  factorName: string
  scope: GhgScope
  category: string
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
}

export interface RunDetail {
  run: Run
  lines: RunLine[]
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

// --- boundary ------------------------------------------------------------------

export function getBoundary(inventoryId: string): Promise<BoundaryEntry[]> {
  return api<BoundaryEntry[]>(`/api/ghg/inventories/${inventoryId}/boundary`)
}

export function setBoundaryTreatment(
  inventoryId: string,
  facilityId: string,
  input: BoundaryTreatmentInput,
): Promise<BoundaryEntry> {
  return api<BoundaryEntry>(`/api/ghg/inventories/${inventoryId}/boundary/${facilityId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function removeBoundaryTreatment(inventoryId: string, facilityId: string): Promise<void> {
  return api<void>(`/api/ghg/inventories/${inventoryId}/boundary/${facilityId}`, {
    method: 'DELETE',
  })
}

// --- boundary lifecycle (spec 007) -----------------------------------------------

export function freezeBoundary(inventoryId: string): Promise<BoundaryVersion> {
  return api<BoundaryVersion>(`/api/ghg/inventories/${inventoryId}/boundary/freeze`, {
    method: 'POST',
  })
}

export function reopenBoundary(inventoryId: string): Promise<Inventory> {
  return api<Inventory>(`/api/ghg/inventories/${inventoryId}/boundary/reopen`, {
    method: 'POST',
  })
}

export function listBoundaryVersions(inventoryId: string): Promise<BoundaryVersionSummary[]> {
  return api<BoundaryVersionSummary[]>(`/api/ghg/inventories/${inventoryId}/boundary/versions`)
}

export function getBoundaryVersion(id: string): Promise<BoundaryVersion> {
  return api<BoundaryVersion>(`/api/ghg/boundary-versions/${id}`)
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

export function classifyAssignment(id: string, emissionFactorId: string): Promise<Assignment> {
  return api<Assignment>(`/api/ghg/assignments/${id}/classify`, {
    method: 'PUT',
    body: JSON.stringify({ emissionFactorId }),
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

export function finalizeRun(id: string): Promise<Inventory> {
  return api<Inventory>(`/api/ghg/runs/${id}/finalize`, { method: 'POST' })
}

export function deleteRun(id: string): Promise<void> {
  return api<void>(`/api/ghg/runs/${id}`, { method: 'DELETE' })
}
