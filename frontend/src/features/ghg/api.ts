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
/** The five financial accounting categories of Table 1 of the Corporate Standard (spec 03.1, 03.3). */
export type RelationshipType =
  'SUBSIDIARY' | 'JOINT_VENTURE' | 'ASSOCIATE' | 'FIXED_ASSET_INVESTMENT' | 'FRANCHISE'
/** Appendix F lease types (spec 04.1). */
export type LeaseType =
  'FINANCE_LEASE_IN' | 'OPERATING_LEASE_IN' | 'FINANCE_LEASE_OUT' | 'OPERATING_LEASE_OUT'
export type GwpSet = 'AR5' | 'AR6'
/** What an inventory does with a record straddling its period or a membership window (spec 04.2). */
export type StraddleTreatment = 'PRO_RATE' | 'BLOCK'
export type MarketInstrument = 'SUPPLIER_SPECIFIC' | 'CONTRACT' | 'CERTIFICATE' | 'RESIDUAL_MIX'
/** What a run's market-based scope 2 figure rests on (spec 07.3). */
export type Scope2MarketBasis = 'INSTRUMENTS' | 'RESIDUAL_MIX' | 'GRID_AVERAGE'
export type RecalculationStatus = 'FLAGGED' | 'RECALCULATED' | 'DECLINED'
export type RecalculationTrigger = 'STRUCTURAL_CHANGE' | 'METHODOLOGY_CHANGE' | 'ERROR_CORRECTION'
/** How a mid-year structural change is accounted (spec 06.1): from its date, or for the whole year. */
export type StructuralChangeConvention = 'TRANSACTION_DATE' | 'WHOLE_YEAR'
/** The Standard's scope 1 kinds, the scope 2 kinds and the fifteen scope 3 categories (spec 04.1). */
export type ActivityCategory =
  | 'STATIONARY_COMBUSTION'
  | 'MOBILE_COMBUSTION'
  | 'PROCESS_EMISSIONS'
  | 'FUGITIVE_EMISSIONS'
  | 'PURCHASED_ELECTRICITY'
  | 'PURCHASED_HEAT_STEAM'
  | 'PURCHASED_COOLING'
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

/** The assurance a report carries (spec 07.4). */
export type AssuranceLevel = 'UNVERIFIED' | 'LIMITED' | 'REASONABLE'

export interface Organization {
  id: string
  name: string
  /** The reporting entity's address and contact for the report header (spec 07.4). */
  address: string | null
  contact: string | null
  facilityCount: number
  createdAt: string
}

export interface OrganizationInput {
  name: string
  address?: string
  contact?: string
}

/** A legal entity the organization consolidates, with its Table 1 facts (spec 03.1). */
export interface Entity {
  id: string
  name: string
  relationshipType: RelationshipType
  economicInterestPercent: number
  legalOwnershipPercent: number | null
  operatedByCompany: boolean
  /** Financial control, a fact for franchises only (spec 03.3); implied by the subsidiary row. */
  controlledByCompany: boolean
  /** The entity the company holds this one through; null when held directly (spec 03.3). */
  parentEntityId: string | null
  /** The economic interest through the chain of parents. */
  effectiveEconomicInterestPercent: number
  /** The parents' names from the nearest parent up to the reporting company. */
  chain: string[]
  /** The organization itself, the subsidiary facilities default to. */
  reportingCompany: boolean
  /** The share Table 1 gives the entity under each approach, chain included. */
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
  /** Franchises only; refused for any other row. */
  controlledByCompany?: boolean
  parentEntityId?: string
}

/** A site: name, location and the legal entity it belongs to (spec 03.1). */
export interface Facility {
  id: string
  name: string
  location: string
  /** ISO 3166-1 alpha-2, for the report's country breakdown (spec 07.4). */
  country: string | null
  entityId: string
  entityName: string
  relationshipType: RelationshipType
  createdAt: string
}

export interface FacilityInput {
  name: string
  location: string
  country?: string
  /** Absent, the facility belongs to the reporting company. */
  entityId?: string
}

/** kg of each gas per unit; for the HFC and PFC blends also the kg CO2e their source applied. */
export interface Gases {
  co2: number
  ch4: number
  n2o: number
  hfcs: number
  pfcs: number
  sf6: number
  nf3: number
  hfcsKg: number
  pfcsKg: number
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
  /** The IPCC assessment report the source applied to the blend; null for a factor with no blend. */
  blendGwpSource: string | null
  /** "50% HFC-32, 50% HFC-125": a blend with a composition converts with the inventory's GWP set (spec 07.2). */
  blendComposition: string | null
  /** Fossil-origin methane (fuel combustion) or biogenic (landfill, biomass); AR6 rates them differently. */
  ch4Fossil: boolean
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
  /** The period the quantity was consumed or emitted over; a reading is a one-day period (spec 04.2). */
  periodStart: string
  periodEnd: string
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
  periodStart: string
  periodEnd: string
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
  straddleTreatment: StraddleTreatment
  /** "2025", or "FY2025/26" when the period crosses a year end (spec 04.2). */
  periodLabel: string
  /** The report header (spec 07.4): the approver override, who published, and the assurance. */
  approvedBy: string | null
  publishedBy: string | null
  assuranceLevel: AssuranceLevel
  assuranceProvider: string | null
  assuranceStatement: string | null
  /** The operational boundary declaration (spec 07.1). */
  scope3Categories: ActivityCategory[]
  scope3ExclusionsRationale: string | null
  /** Scope 2 Guidance (spec 07.2): whether a residual mix is available, and its factor when it is. */
  residualMixAvailable: boolean | null
  residualMixKgCo2ePerKwh: number | null
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
  straddleTreatment?: StraddleTreatment
}

export interface IntensityMetricInput {
  name: string
  value: number
  unit: string
}

export interface ReportMetadataInput {
  approvedBy?: string
  assuranceLevel: AssuranceLevel
  assuranceProvider?: string
  assuranceStatement?: string
  intensityMetrics: IntensityMetricInput[]
}

export interface OperationalBoundaryInput {
  scope3Categories: ActivityCategory[]
  exclusionsRationale?: string
}

/** Why an operation is left out of the boundary (spec 07.2). */
export interface BoundaryExclusion {
  reason: ExclusionReason
  detail: string | null
}

export interface BoundaryExclusionInput {
  reason: ExclusionReason
  detail?: string
}

/** An operation a boundary left out, live or as a version froze it. */
export interface BoundaryExclusionEntry {
  entityId: string
  entityName: string
  facilityId: string | null
  facilityName: string | null
  reason: ExclusionReason
  detail: string | null
}

export interface BoundaryFacilityMember {
  facilityId: string
  facilityName: string
  location: string
  inBoundary: boolean
  exclusion: BoundaryExclusion | null
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
  controlledByCompany: boolean | null
  /** Through the chain of parents; from the facts when the entity is outside the boundary. */
  effectiveEconomicInterestPercent: number
  chain: string[]
  accountingShare: number | null
  table1Row: string | null
  effectiveFrom: string | null
  effectiveTo: string | null
  /** Recorded when the whole entity is deliberately left out (spec 07.2). */
  exclusion: BoundaryExclusion | null
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
  controlledByCompany?: boolean
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
  controlledByCompany: boolean
  effectiveEconomicInterestPercent: number
  chain: string[]
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
  /** The operations the version recorded as left out, with their reasons (spec 07.2). */
  exclusions: BoundaryExclusionEntry[]
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
  periodStart: string
  periodEnd: string
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

/** Totals per gas: kg of each gas, and for the HFC and PFC blends also the kg CO2e their source applied. */
export interface ByGas {
  co2Kg: number
  ch4Kg: number
  /** The fossil-origin part of ch4Kg (spec 07.2). */
  ch4FossilKg: number
  n2oKg: number
  hfcsKg: number
  pfcsKg: number
  hfcsKgCo2e: number
  pfcsKgCo2e: number
  sf6Kg: number
  nf3Kg: number
}

export interface Run {
  id: string
  inventoryId: string
  /** Assigned by the server, never reused, voided runs included (spec 05.2). */
  runNo: number
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
  /** Scope 2 under the market-based method, reported on every run (spec 07.3). */
  scope2MarketBasedKgCo2e: number
  scope2MarketBasis: Scope2MarketBasis
  byGas: ByGas
  biogenicCo2Kg: number
  isFinal: boolean
  /** A voided run stays on the record with its number, figures and reason (spec 05.2). */
  voided: boolean
  voidedAt: string | null
  voidedBy: string | null
  voidReason: string | null
  /** The boundary version the shares came from; null for runs older than spec 03. */
  boundaryVersionId: string | null
  boundaryVersionNo: number | null
  /** Who launched the run: the report's "prepared by" (spec 07.4). */
  createdBy: string | null
  createdAt: string
}

export interface RunLine {
  id: string
  activityId: string
  facilityId: string | null
  facilityName: string
  /** The facility's legal entity and country as they stood at run time (spec 07.4). */
  entityId: string | null
  entityName: string | null
  country: string | null
  /** The record's own description, its evidence reference and the factor id (spec 07.5). */
  activityType: string | null
  evidenceRef: string | null
  factorId: string | null
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
  /** The record's period and the pro-rating the run applied (spec 04.2). */
  periodStart: string
  periodEnd: string
  periodDays: number
  coveredDays: number
  periodShare: number
  periodNote: string | null
  kgCo2e: number
  byGas: ByGas
  biogenicCo2Kg: number
  /** The assessment report behind the line's blend potentials, when the factor carries a blend. */
  blendGwpSource: string | null
  marketBasedKgCo2e: number | null
  marketFactorKgCo2ePerKwh: number | null
  marketInstrument: MarketInstrument | null
  /** How the market-based figure was built: the split between instrument and balance (spec 07.3). */
  marketNote: string | null
  /** The kWh the facility's instrument covered on this line, and the balance priced at the residual mix or grid average. */
  marketCoveredKwh: number | null
  marketBalanceKwh: number | null
  marketBalanceKgCo2ePerKwh: number | null
  marketBalanceBasis: Scope2MarketBasis | null
}

/** An assignment a run left out, with the activity's facts and the documented reason (spec 05.1). */
export interface RunExclusion {
  id: string
  activityId: string
  facilityName: string
  activityType: string
  quantity: number
  unit: string
  periodStart: string
  periodEnd: string
  exclusionReason: ExclusionReason
  exclusionDetail: string | null
}

/** One recorded act on an inventory (spec 05.2). */
export interface AuditEvent {
  id: string
  action: 'RUN_VOIDED' | 'FINAL_WITHDRAWN'
  runId: string | null
  runNo: number | null
  actor: string
  reason: string
  at: string
}

/** Which months of the inventory period have data, per facility and activity type (spec 04.2). */
export interface CoverageRow {
  facilityId: string
  facilityName: string
  activityType: string
  months: string[]
  coveredMonths: string[]
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
  /** Whether the instrument meets the eight Scope 2 Quality Criteria (spec 07.2). */
  meetsQualityCriteria: boolean
  qualityNotes: string | null
  /** The kWh the instrument covers (null on rows older than spec 07.3, which cover every kWh) and its period. */
  coveredKwh: number | null
  periodStart: string | null
  periodEnd: string | null
}

export interface MarketFactorInput {
  instrumentType: MarketInstrument
  kgCo2ePerKwh: number
  source: string
  meetsQualityCriteria: boolean
  qualityNotes?: string
  coveredKwh: number
  periodStart?: string
  periodEnd?: string
}

export interface ResidualMixInput {
  available: boolean
  kgCo2ePerKwh?: number
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
  /** This change together with the outstanding earlier ones (spec 06.1). */
  cumulativePercent: number | null
  aboveThreshold: boolean
  /** Who raised a methodology or error flag by hand; null for a detected structural change. */
  raisedBy: string | null
  status: RecalculationStatus
  runId: string | null
  decisionNote: string | null
  decidedBy: string | null
  decidedAt: string | null
  createdAt: string
}

/** The organization's base year and recalculation policy (spec 06, 06.1). */
export interface BaseYear {
  id: string
  inventoryId: string
  inventoryName: string
  year: number
  thresholdPercent: number
  /** Why this year: the Standard asks for a year with verifiable data and the reason for choosing it. */
  reason: string
  structuralChangeConvention: StructuralChangeConvention
  baseRunId: string | null
  recalculations: Recalculation[]
  createdAt: string
}

export interface BaseYearInput {
  inventoryId: string
  thresholdPercent: number
  reason: string
  structuralChangeConvention: StructuralChangeConvention
}

/** A methodology-change or error-correction candidate the accountant raises (spec 06.1). */
export interface RaiseRecalculationInput {
  trigger: 'METHODOLOGY_CHANGE' | 'ERROR_CORRECTION'
  reason: string
  affectedPercent: number
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

/** One inventory in the emissions profile over time (spec 06.1). */
export interface ProfileEntry {
  inventoryId: string
  name: string
  year: number
  periodLabel: string
  periodStart: string
  periodEnd: string
  status: InventoryStatus
  finalRunId: string | null
  totalKgCo2e: number | null
  recalculatedRunId: string | null
  recalculatedTotalKgCo2e: number | null
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
    scope2MarketBasedKgCo2e: number
    scope3KgCo2e: number
    totalKgCo2e: number
    /** The same figures in metric tonnes, as Chapter 9 asks (spec 07.2). */
    scope1TCo2e: number
    scope2LocationBasedTCo2e: number
    scope2MarketBasedTCo2e: number
    scope3TCo2e: number
    totalTCo2e: number
    /** The Scope 2 Guidance disclosures (spec 07.2, 07.3). */
    totalMethod: 'LOCATION_BASED'
    scope2MarketBasis: Scope2MarketBasis
    baseYearScope2Method: 'LOCATION_BASED' | 'DUAL' | null
    baseYearMarketBasedIsProxy: boolean | null
    residualMixAvailable: boolean | null
    residualMixKgCo2ePerKwh: number | null
    residualMixDisclosure: string
    marketInstruments: MarketFactor[]
  }
  /** Mass of each gas and its CO2e under the run's GWP set, in kilograms and in tonnes. */
  byGas: { gas: string; kg: number; kgCo2e: number; tonnes: number; tCo2e: number }[]
  biogenicCo2Kg: number
  biogenicCo2T: number
  baseYear: {
    year: number
    periodLabel: string
    inventoryName: string
    inventoryId: string
    thresholdPercent: number
    reason: string
    structuralChangeConvention: StructuralChangeConvention
    /** Whether the run's GWP set matches the base year's (the amendment recommends it). */
    gwpSetMatches: boolean
    originalBase: RunFigure | null
    recalculations: { decision: Recalculation; recalculatedBase: RunFigure | null }[]
    /** Every inventory between the base year and the reporting period (spec 06.1). */
    profile: ProfileEntry[]
  } | null
  methodology: {
    gwpSet: GwpSet
    consolidationApproach: ConsolidationApproach
    factorSources: string[]
    /** The run's set first, then any report a blend's source applied. */
    assessmentReports: string[]
    multipleAssessmentReports: boolean
    statement: string
  }
  /** Operations left out of the boundary, as the version froze them (spec 07.2). */
  boundaryExclusions: BoundaryExclusionEntry[]
  exclusions: RunExclusion[]
  lines: RunLine[]
  run: Run
  /** The header block (spec 07.4). */
  header: ReportHeader
  byScope3Category: {
    category: ActivityCategory
    kgCo2e: number
    tCo2e: number
    lineCount: number
  }[]
  byFacility: Breakdown[]
  byEntity: Breakdown[]
  byCountry: Breakdown[]
  /** Every factor exactly as the run applied it (spec 07.4). */
  factors: FactorRow[]
  intensity: { name: string; value: number; unit: string; tCo2ePerUnit: number }[]
}

export interface ReportHeader {
  organizationName: string
  address: string | null
  contact: string | null
  periodLabel: string
  periodStart: string
  periodEnd: string
  preparedBy: string | null
  preparedAt: string
  approvedBy: string | null
  publishedBy: string | null
  publishedAt: string | null
  version: number
  supersedes: string[]
  supersededBy: string | null
  assuranceLevel: AssuranceLevel
  assuranceProvider: string | null
  assuranceStatement: string | null
}

export interface Breakdown {
  id: string | null
  name: string
  scope1KgCo2e: number
  scope2KgCo2e: number
  scope2MarketBasedKgCo2e: number
  scope3KgCo2e: number
  totalKgCo2e: number
  totalTCo2e: number
}

export interface FactorRow {
  factorId: string
  name: string
  unit: string
  gwpSet: GwpSet
  kgCo2ePerUnit: number
  co2: number
  ch4: number
  ch4Fossil: boolean
  n2o: number
  hfcsKg: number
  pfcsKg: number
  sf6: number
  nf3: number
  biogenicCo2: number
  blendComposition: string | null
  blendGwpSource: string | null
  source: string
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

/** The report header the accountant types before publication (spec 07.4). */
export function setReportMetadata(id: string, input: ReportMetadataInput): Promise<Inventory> {
  return api<Inventory>(`/api/ghg/inventories/${id}/report-metadata`, {
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

// --- boundary exclusions (spec 07.2) ---------------------------------------------

export function listBoundaryExclusions(inventoryId: string): Promise<BoundaryExclusionEntry[]> {
  return api<BoundaryExclusionEntry[]>(`/api/ghg/inventories/${inventoryId}/boundary/exclusions`)
}

export function excludeEntity(
  inventoryId: string,
  entityId: string,
  input: BoundaryExclusionInput,
): Promise<BoundaryEntity> {
  return api<BoundaryEntity>(
    `/api/ghg/inventories/${inventoryId}/boundary/entities/${entityId}/exclude`,
    { method: 'PUT', body: JSON.stringify(input) },
  )
}

export function clearEntityExclusion(inventoryId: string, entityId: string): Promise<void> {
  return api<void>(`/api/ghg/inventories/${inventoryId}/boundary/entities/${entityId}/exclude`, {
    method: 'DELETE',
  })
}

export function excludeFacility(
  inventoryId: string,
  facilityId: string,
  input: BoundaryExclusionInput,
): Promise<BoundaryEntity> {
  return api<BoundaryEntity>(`/api/ghg/inventories/${inventoryId}/boundary/${facilityId}/exclude`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function clearFacilityExclusion(inventoryId: string, facilityId: string): Promise<void> {
  return api<void>(`/api/ghg/inventories/${inventoryId}/boundary/${facilityId}/exclude`, {
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

/** Withdrawing a final designation is recorded with its reason (spec 05.2). */
export function withdrawFinal(inventoryId: string, reason: string): Promise<Inventory> {
  return api<Inventory>(`/api/ghg/inventories/${inventoryId}/withdraw-final`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export function listAuditEvents(inventoryId: string): Promise<AuditEvent[]> {
  return api<AuditEvent[]>(`/api/ghg/inventories/${inventoryId}/events`)
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

/** Whether a residual mix is available for the instruments' markets, and its factor (spec 07.2). */
export function setResidualMix(inventoryId: string, input: ResidualMixInput): Promise<Inventory> {
  return api<Inventory>(`/api/ghg/inventories/${inventoryId}/residual-mix`, {
    method: 'PUT',
    body: JSON.stringify(input),
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

export function listCoverage(inventoryId: string): Promise<CoverageRow[]> {
  return api<CoverageRow[]>(`/api/ghg/inventories/${inventoryId}/coverage`)
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

/** Voids a run with a reason; it stays on the record with its number (spec 05.2). */
export function voidRun(id: string, reason: string): Promise<Run> {
  return api<Run>(`/api/ghg/runs/${id}/void`, { method: 'POST', body: JSON.stringify({ reason }) })
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

/** Raises a methodology-change or error-correction candidate (spec 06.1). */
export function raiseRecalculation(
  organizationId: string,
  input: RaiseRecalculationInput,
): Promise<BaseYear> {
  return api<BaseYear>(`/api/ghg/organizations/${organizationId}/base-year/recalculations`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
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
