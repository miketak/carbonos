import { vi } from 'vitest'
import type { EmissionFactor, EmissionFactorPage, EmissionFactorQuery } from './api'

/** A complete vi.fn() double of ./api, shared by the GHG feature tests. */
export const listOrganizations = vi.fn()
export const getOrganizationCapabilities = vi
  .fn()
  .mockResolvedValue({ mayCreateOrganization: true })
export const getPublicPlatformSettings = vi.fn().mockResolvedValue({ supportAccessWindowHours: 24 })
export const getOrganization = vi.fn()
export const createOrganization = vi.fn()
export const updateOrganization = vi.fn()
export const deleteOrganization = vi.fn()
export const listOrganizationEvents = vi.fn()
export const listMembers = vi.fn()
export const addMember = vi.fn()
export const changeMemberRole = vi.fn()
export const removeMember = vi.fn()
export const listEntities = vi.fn()
export const createEntity = vi.fn()
export const updateEntity = vi.fn()
export const deleteEntity = vi.fn()
export const listFacilities = vi.fn()
export const createFacility = vi.fn()
export const updateFacility = vi.fn()
export const deleteFacility = vi.fn()
export const listStreams = vi.fn()
export const createStream = vi.fn()
export const updateStream = vi.fn()
export const deleteStream = vi.fn()
export const listEmissionFactors = vi.fn()
export const listEmissionFactorFacets = vi.fn()
export const createEmissionFactor = vi.fn()
export const updateEmissionFactor = vi.fn()
export const setFactorApproval = vi.fn()
export const deleteEmissionFactor = vi.fn()
export const listFactorPacks = vi.fn()
export const importFactorPack = vi.fn()
export const listPackRows = vi.fn()
export const listUnits = vi.fn()
export const listOrganizationUnits = vi.fn()
export const listCustomUnits = vi.fn()
export const createCustomUnit = vi.fn()
export const updateCustomUnit = vi.fn()
export const deleteCustomUnit = vi.fn()
export const listDensities = vi.fn()
export const createDensity = vi.fn()
export const updateDensity = vi.fn()
export const deleteDensity = vi.fn()
export const listActivities = vi.fn()
export const searchActivities = vi.fn()
export const importActivities = vi.fn()
export const activityImportTemplateUrl = vi.fn(
  (orgId: string) => `/api/ghg/organizations/${orgId}/activities/import-template.csv`,
)
export const getActivity = vi.fn()
export const createActivity = vi.fn()
export const updateActivity = vi.fn()
export const deleteActivity = vi.fn()
export const listActivityRevisions = vi.fn()
export const listEvidence = vi.fn()
export const uploadEvidence = vi.fn()
export const addEvidenceLink = vi.fn()
export const deleteEvidence = vi.fn()
export const searchEvidence = vi.fn()
export const evidenceIndexUrl = vi.fn(
  (organizationId: string) => `/api/ghg/organizations/${organizationId}/evidence/index.csv`,
)
export const listImportBatches = vi.fn()
export const importBatchFileUrl = vi.fn(
  (batchId: string) => `/api/ghg/import-batches/${batchId}/file`,
)
export const evidenceDownloadUrl = vi.fn((id: string) => `/api/ghg/evidence/${id}`)
export const listInventories = vi.fn()
export const getInventory = vi.fn()
export const createInventory = vi.fn()
export const updateInventory = vi.fn()
export const deleteInventory = vi.fn()
export const setOperationalBoundary = vi.fn()
export const setReportMetadata = vi.fn()
export const getBoundary = vi.fn()
export const setBoundaryTreatment = vi.fn()
export const removeBoundaryTreatment = vi.fn()
export const setEntityTreatment = vi.fn()
export const removeEntityTreatment = vi.fn()
export const listBoundaryExclusions = vi.fn()
export const excludeEntity = vi.fn()
export const clearEntityExclusion = vi.fn()
export const excludeFacility = vi.fn()
export const clearFacilityExclusion = vi.fn()
export const listBoundaryVersions = vi.fn()
export const getBoundaryVersion = vi.fn()
export const freezeInventory = vi.fn()
export const reopenInventory = vi.fn()
export const finalizeInventory = vi.fn()
export const withdrawFinal = vi.fn()
export const publishInventory = vi.fn()
export const supersedeInventory = vi.fn()
export const getInheritance = vi.fn()
export const listMarketFactors = vi.fn()
export const setMarketFactor = vi.fn()
export const removeMarketFactor = vi.fn()
export const setResidualMix = vi.fn()
export const listUpstreamRules = vi.fn()
export const addUpstreamRule = vi.fn()
export const removeUpstreamRule = vi.fn()
export const listAssignments = vi.fn()
export const searchAssignments = vi.fn()
export const syncAssignments = vi.fn()
export const classifyAssignment = vi.fn()
export const excludeAssignment = vi.fn()
export const includeAssignment = vi.fn()
export const getValidation = vi.fn()
export const listCoverage = vi.fn()
export const listRuns = vi.fn()
export const executeRun = vi.fn()
export const getRun = vi.fn()
export const finalizeRun = vi.fn()
export const voidRun = vi.fn()
export const listAuditEvents = vi.fn()
export const getReport = vi.fn()
export const getBaseYear = vi.fn()
export const setBaseYear = vi.fn()
export const clearBaseYear = vi.fn()
export const raiseRecalculation = vi.fn()
export const listFactorPackNotices = vi.fn()
export const getFactorPackDiff = vi.fn()
export const acceptFactorPackNotice = vi.fn()
export const declineFactorPackNotice = vi.fn()
export const decideRecalculation = vi.fn()

/**
 * Stubs the factor endpoint over a fixed set of rows, applying the filters the
 * server applies (FU-03), so a test exercises the picker as a user meets it
 * rather than a list the browser narrows itself.
 */
export function mockEmissionFactors(items: EmissionFactor[]) {
  listEmissionFactors.mockReset()
  listEmissionFactors.mockImplementation(
    (_organizationId: string, query: EmissionFactorQuery = {}) =>
      Promise.resolve(factorPage(items, query)),
  )
  listEmissionFactorFacets.mockReset()
  listEmissionFactorFacets.mockResolvedValue({
    categories: distinct(items.map((factor) => factor.sourceCategory)),
    activities: distinct(items.map((factor) => factor.sourceActivity)),
    units: distinct(items.map((factor) => factor.unit)),
  })
}

/** One page of factors as the endpoint returns it, filtered and ordered the way the server does. */
export function factorPage(
  items: EmissionFactor[],
  query: EmissionFactorQuery = {},
): EmissionFactorPage {
  const needle = query.q?.trim().toLowerCase() ?? ''
  let matched = items.filter((factor) => {
    if (query.ids && !query.ids.includes(factor.id)) return false
    if (query.unit && factor.unit.toLowerCase() !== query.unit.toLowerCase()) return false
    if (
      query.dimension &&
      query.dimension.length > 0 &&
      (factor.dimension === null || !query.dimension.includes(factor.dimension))
    )
      return false
    if (query.sourceCategory && factor.sourceCategory !== query.sourceCategory) return false
    if (query.sourceActivity && factor.sourceActivity !== query.sourceActivity) return false
    if (needle !== '') {
      const haystack = [
        factor.name,
        factor.source,
        factor.sourceCategory,
        factor.sourceActivity,
        factor.sourceDetail,
        ...factor.packs,
      ]
      if (!haystack.some((part) => (part ?? '').toLowerCase().includes(needle))) return false
    }
    return true
  })
  const unapproved = matched.filter((factor) => !factor.approved).length
  if (query.includeUnapproved === false) matched = matched.filter((factor) => factor.approved)
  // the server's order: one tier since spec 02.10, by scope, name and unit
  matched = [...matched].sort(
    (a, b) => Number(a.organizationId === null) - Number(b.organizationId === null),
  )
  const size = query.size ?? 50
  const page = query.page ?? 0
  return {
    items: matched.slice(page * size, page * size + size),
    page,
    size,
    total: matched.length,
    unapproved,
  }
}

function distinct(values: (string | null)[]): string[] {
  return [
    ...new Set(values.filter((value): value is string => value !== null && value !== '')),
  ].sort()
}
