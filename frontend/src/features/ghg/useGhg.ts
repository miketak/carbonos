import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addEvidenceLink,
  addMember,
  changeMemberRole,
  classifyAssignment,
  clearBaseYear,
  clearEntityExclusion,
  clearFacilityExclusion,
  createActivity,
  createCustomUnit,
  createDensity,
  createEmissionFactor,
  createEntity,
  createFacility,
  createInventory,
  createOrganization,
  createStream,
  decideRecalculation,
  deleteActivity,
  deleteCustomUnit,
  deleteDensity,
  deleteEmissionFactor,
  deleteEntity,
  deleteEvidence,
  deleteFacility,
  deleteInventory,
  deleteOrganization,
  deleteStream,
  excludeAssignment,
  excludeEntity,
  excludeFacility,
  executeRun,
  finalizeRun,
  freezeInventory,
  getActivity,
  getBaseYear,
  getBoundary,
  getBoundaryVersion,
  getInheritance,
  getInventory,
  getOrganization,
  getReport,
  getRun,
  getValidation,
  importActivities,
  importFactorPack,
  includeAssignment,
  listActivities,
  listActivityRevisions,
  listAssignments,
  listAuditEvents,
  listBoundaryVersions,
  listCoverage,
  listCustomUnits,
  listDensities,
  listEmissionFactors,
  listEntities,
  listEvidence,
  listFacilities,
  listFactorPacks,
  listImportBatches,
  listInventories,
  listMarketFactors,
  listMembers,
  listOrganizationUnits,
  listOrganizations,
  listRuns,
  listStreams,
  listUnits,
  publishInventory,
  raiseRecalculation,
  removeBoundaryTreatment,
  removeEntityTreatment,
  removeMarketFactor,
  removeMember,
  reopenInventory,
  searchActivities,
  searchAssignments,
  searchEvidence,
  setBaseYear,
  setBoundaryTreatment,
  setEntityTreatment,
  setFactorApproval,
  setMarketFactor,
  setOperationalBoundary,
  setReportMetadata,
  setResidualMix,
  supersedeInventory,
  syncAssignments,
  updateActivity,
  updateCustomUnit,
  updateDensity,
  updateEmissionFactor,
  updateEntity,
  updateFacility,
  updateInventory,
  updateOrganization,
  updateStream,
  uploadEvidence,
  voidRun,
  withdrawFinal,
} from './api'
import type {
  ActivityInput,
  ActivityQuery,
  AssignmentQuery,
  BaseYearInput,
  BoundaryExclusionInput,
  BoundaryTreatmentInput,
  ClassifyInput,
  CustomUnitInput,
  DensityInput,
  EmissionFactorInput,
  EntityInput,
  EvidenceOwner,
  EvidenceQuery,
  ExcludeInput,
  FacilityInput,
  InventoryInput,
  MarketFactorInput,
  OperationalBoundaryInput,
  OrgRole,
  OrganizationInput,
  RaiseRecalculationInput,
  RecalculationDecisionInput,
  ReportMetadataInput,
  ResidualMixInput,
  SourceStreamInput,
} from './api'

export const organizationsKey = ['ghg', 'organizations'] as const
export const factorsKey = (orgId: string) => ['ghg', 'emission-factors', orgId] as const
export const factorPacksKey = ['ghg', 'factor-packs'] as const
export const membersKey = (orgId: string) => ['ghg', 'members', orgId] as const
export const unitsKey = ['ghg', 'units'] as const
export const organizationUnitsKey = (orgId: string) => ['ghg', 'units', orgId] as const
export const customUnitsKey = (orgId: string) => ['ghg', 'custom-units', orgId] as const
export const densitiesKey = (orgId: string) => ['ghg', 'densities', orgId] as const
export const streamsKey = (orgId: string) => ['ghg', 'streams', orgId] as const
export const organizationKey = (id: string) => ['ghg', 'organization', id] as const
export const entitiesKey = (orgId: string) => ['ghg', 'entities', orgId] as const
export const facilitiesKey = (orgId: string) => ['ghg', 'facilities', orgId] as const
export const activitiesKey = (orgId: string) => ['ghg', 'activities', orgId] as const
export const activityPageKey = (orgId: string, query: ActivityQuery) =>
  ['ghg', 'activities', orgId, 'page', query] as const
export const assignmentPageKey = (inventoryId: string, query: AssignmentQuery) =>
  ['ghg', 'assignments', inventoryId, 'page', query] as const
export const revisionsKey = (activityId: string) => ['ghg', 'revisions', activityId] as const
export const activityKey = (activityId: string) => ['ghg', 'activity', activityId] as const
export const evidencePageKey = (orgId: string, query: EvidenceQuery) =>
  ['ghg', 'evidence-page', orgId, query] as const
export const importBatchesKey = (orgId: string) => ['ghg', 'import-batches', orgId] as const
export const evidenceKey = (owner: EvidenceOwner) =>
  ['ghg', 'evidence', 'activityId' in owner ? owner.activityId : owner.marketFactorId] as const
export const inventoriesKey = (orgId: string) => ['ghg', 'inventories', orgId] as const
export const baseYearKey = (orgId: string) => ['ghg', 'base-year', orgId] as const
export const inventoryKey = (id: string) => ['ghg', 'inventory', id] as const
export const boundaryKey = (inventoryId: string) => ['ghg', 'boundary', inventoryId] as const
export const boundaryVersionsKey = (inventoryId: string) =>
  ['ghg', 'boundary-versions', inventoryId] as const
export const boundaryVersionKey = (id: string) => ['ghg', 'boundary-version', id] as const
export const marketFactorsKey = (inventoryId: string) =>
  ['ghg', 'market-factors', inventoryId] as const
export const assignmentsKey = (inventoryId: string) => ['ghg', 'assignments', inventoryId] as const
export const validationKey = (inventoryId: string) => ['ghg', 'validation', inventoryId] as const
export const runsKey = (inventoryId: string) => ['ghg', 'runs', inventoryId] as const
export const coverageKey = (inventoryId: string) => ['ghg', 'coverage', inventoryId] as const
export const auditEventsKey = (inventoryId: string) => ['ghg', 'events', inventoryId] as const
export const inheritanceKey = (inventoryId: string) => ['ghg', 'inheritance', inventoryId] as const
export const runKey = (id: string) => ['ghg', 'run', id] as const
export const reportKey = (runId: string) => ['ghg', 'report', runId] as const

export function useOrganizationsQuery() {
  return useQuery({ queryKey: organizationsKey, queryFn: listOrganizations })
}

export function useOrganizationQuery(id: string) {
  return useQuery({ queryKey: organizationKey(id), queryFn: () => getOrganization(id) })
}

export function useStreamsQuery(orgId: string) {
  return useQuery({ queryKey: streamsKey(orgId), queryFn: () => listStreams(orgId) })
}

function useStreamMutation<TArgs, TResult>(
  orgId: string,
  mutationFn: (args: TArgs) => Promise<TResult>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: streamsKey(orgId) })
    },
  })
}

export function useCreateStream(orgId: string) {
  return useStreamMutation(
    orgId,
    ({ facilityId, input }: { facilityId: string; input: SourceStreamInput }) =>
      createStream(facilityId, input),
  )
}

export function useUpdateStream(orgId: string) {
  return useStreamMutation(orgId, ({ id, input }: { id: string; input: SourceStreamInput }) =>
    updateStream(id, input),
  )
}

export function useDeleteStream(orgId: string) {
  return useStreamMutation(orgId, (id: string) => deleteStream(id))
}

export function useEmissionFactorsQuery(orgId: string) {
  return useQuery({ queryKey: factorsKey(orgId), queryFn: () => listEmissionFactors(orgId) })
}

export function useMembersQuery(orgId: string) {
  return useQuery({ queryKey: membersKey(orgId), queryFn: () => listMembers(orgId) })
}

function useMemberMutation<TArgs, TResult>(
  orgId: string,
  mutationFn: (args: TArgs) => Promise<TResult>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: membersKey(orgId) })
    },
  })
}

export function useAddMember(orgId: string) {
  return useMemberMutation(orgId, (input: { email: string; role: OrgRole }) =>
    addMember(orgId, input),
  )
}

export function useChangeMemberRole(orgId: string) {
  return useMemberMutation(orgId, ({ memberId, role }: { memberId: string; role: OrgRole }) =>
    changeMemberRole(orgId, memberId, role),
  )
}

export function useRemoveMember(orgId: string) {
  return useMemberMutation(orgId, (memberId: string) => removeMember(orgId, memberId))
}

export function useFactorPacksQuery() {
  return useQuery({ queryKey: factorPacksKey, queryFn: listFactorPacks })
}

function useFactorMutation<TArgs, TResult>(
  orgId: string,
  mutationFn: (args: TArgs) => Promise<TResult>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: factorsKey(orgId) })
    },
  })
}

export function useCreateEmissionFactor(orgId: string) {
  return useFactorMutation(orgId, (input: EmissionFactorInput) =>
    createEmissionFactor(orgId, input),
  )
}

export function useUpdateEmissionFactor(orgId: string) {
  return useFactorMutation(orgId, ({ id, input }: { id: string; input: EmissionFactorInput }) =>
    updateEmissionFactor(id, input),
  )
}

export function useSetFactorApproval(orgId: string) {
  return useFactorMutation(orgId, ({ id, approved }: { id: string; approved: boolean }) =>
    setFactorApproval(id, approved),
  )
}

export function useDeleteEmissionFactor(orgId: string) {
  return useFactorMutation(orgId, (id: string) => deleteEmissionFactor(id))
}

export function useImportFactorPack(orgId: string) {
  return useFactorMutation(orgId, (packId: string) => importFactorPack(orgId, packId))
}

export function useUnitsQuery(orgId?: string) {
  // the shared registry is static; an organization's view adds its custom units (spec 02.2)
  return useQuery({
    queryKey: orgId ? organizationUnitsKey(orgId) : unitsKey,
    queryFn: () => (orgId ? listOrganizationUnits(orgId) : listUnits()),
    staleTime: orgId ? undefined : Infinity,
  })
}

// --- units and densities (spec 02.2) ------------------------------------------------

export function useCustomUnitsQuery(orgId: string) {
  return useQuery({ queryKey: customUnitsKey(orgId), queryFn: () => listCustomUnits(orgId) })
}

export function useDensitiesQuery(orgId: string) {
  return useQuery({ queryKey: densitiesKey(orgId), queryFn: () => listDensities(orgId) })
}

function useUnitsMutation<TArgs, TResult>(
  orgId: string,
  mutationFn: (args: TArgs) => Promise<TResult>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customUnitsKey(orgId) })
      void queryClient.invalidateQueries({ queryKey: organizationUnitsKey(orgId) })
      void queryClient.invalidateQueries({ queryKey: densitiesKey(orgId) })
    },
  })
}

export function useCreateCustomUnit(orgId: string) {
  return useUnitsMutation(orgId, (input: CustomUnitInput) => createCustomUnit(orgId, input))
}

export function useUpdateCustomUnit(orgId: string) {
  return useUnitsMutation(orgId, ({ id, input }: { id: string; input: CustomUnitInput }) =>
    updateCustomUnit(id, input),
  )
}

export function useDeleteCustomUnit(orgId: string) {
  return useUnitsMutation(orgId, (id: string) => deleteCustomUnit(id))
}

export function useCreateDensity(orgId: string) {
  return useUnitsMutation(orgId, (input: DensityInput) => createDensity(orgId, input))
}

export function useUpdateDensity(orgId: string) {
  return useUnitsMutation(orgId, ({ id, input }: { id: string; input: DensityInput }) =>
    updateDensity(id, input),
  )
}

export function useDeleteDensity(orgId: string) {
  return useUnitsMutation(orgId, (id: string) => deleteDensity(id))
}

export function useEntitiesQuery(orgId: string) {
  return useQuery({ queryKey: entitiesKey(orgId), queryFn: () => listEntities(orgId) })
}

export function useFacilitiesQuery(orgId: string) {
  return useQuery({ queryKey: facilitiesKey(orgId), queryFn: () => listFacilities(orgId) })
}

export function useActivitiesQuery(orgId: string) {
  return useQuery({ queryKey: activitiesKey(orgId), queryFn: () => listActivities(orgId) })
}

/** One page of the register; the key carries the query so each page and filter caches on its own (spec 04.5). */
export function useActivityPageQuery(orgId: string, query: ActivityQuery) {
  return useQuery({
    queryKey: activityPageKey(orgId, query),
    queryFn: () => searchActivities(orgId, query),
    placeholderData: (previous) => previous,
  })
}

/** One record on its own, for a drawer opened from a link (spec 04.6). */
export function useActivityQuery(activityId: string | null) {
  return useQuery({
    queryKey: activityKey(activityId ?? ''),
    queryFn: () => getActivity(activityId ?? ''),
    enabled: activityId !== null,
  })
}

export function useImportActivities(orgId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, dryRun }: { file: File; dryRun?: boolean }) =>
      importActivities(orgId, file, { dryRun }),
    onSuccess: (result) => {
      if (result.dryRun) return
      void queryClient.invalidateQueries({ queryKey: activitiesKey(orgId) })
      void queryClient.invalidateQueries({ queryKey: ['ghg', 'evidence-page', orgId] })
      void queryClient.invalidateQueries({ queryKey: importBatchesKey(orgId) })
    },
  })
}

/** The organization's source documents, paged (spec 04.6). */
export function useEvidencePageQuery(orgId: string, query: EvidenceQuery) {
  return useQuery({
    queryKey: evidencePageKey(orgId, query),
    queryFn: () => searchEvidence(orgId, query),
    placeholderData: (previous) => previous,
  })
}

export function useImportBatchesQuery(orgId: string) {
  return useQuery({ queryKey: importBatchesKey(orgId), queryFn: () => listImportBatches(orgId) })
}

export function useInventoriesQuery(orgId: string) {
  return useQuery({ queryKey: inventoriesKey(orgId), queryFn: () => listInventories(orgId) })
}

export function useBaseYearQuery(orgId: string) {
  return useQuery({ queryKey: baseYearKey(orgId), queryFn: () => getBaseYear(orgId) })
}

export function useInventoryQuery(id: string) {
  return useQuery({ queryKey: inventoryKey(id), queryFn: () => getInventory(id) })
}

export function useBoundaryQuery(inventoryId: string) {
  return useQuery({ queryKey: boundaryKey(inventoryId), queryFn: () => getBoundary(inventoryId) })
}

export function useBoundaryVersionsQuery(inventoryId: string) {
  return useQuery({
    queryKey: boundaryVersionsKey(inventoryId),
    queryFn: () => listBoundaryVersions(inventoryId),
  })
}

export function useBoundaryVersionQuery(id: string) {
  // a version is immutable once cut, so cache it for the session
  return useQuery({
    queryKey: boundaryVersionKey(id),
    queryFn: () => getBoundaryVersion(id),
    staleTime: Infinity,
  })
}

export function useMarketFactorsQuery(inventoryId: string) {
  return useQuery({
    queryKey: marketFactorsKey(inventoryId),
    queryFn: () => listMarketFactors(inventoryId),
  })
}

export function useAssignmentsQuery(inventoryId: string) {
  return useQuery({
    queryKey: assignmentsKey(inventoryId),
    queryFn: () => listAssignments(inventoryId),
  })
}

/** One page of the activity view with the counts by status (spec 04.5). */
export function useAssignmentPageQuery(inventoryId: string, query: AssignmentQuery) {
  return useQuery({
    queryKey: assignmentPageKey(inventoryId, query),
    queryFn: () => searchAssignments(inventoryId, query),
    placeholderData: (previous) => previous,
  })
}

export function useInheritanceQuery(inventoryId: string) {
  return useQuery({
    queryKey: inheritanceKey(inventoryId),
    queryFn: () => getInheritance(inventoryId),
  })
}

export function useValidationQuery(inventoryId: string) {
  return useQuery({
    queryKey: validationKey(inventoryId),
    queryFn: () => getValidation(inventoryId),
  })
}

export function useRunsQuery(inventoryId: string) {
  return useQuery({ queryKey: runsKey(inventoryId), queryFn: () => listRuns(inventoryId) })
}

export function useRunQuery(id: string) {
  return useQuery({ queryKey: runKey(id), queryFn: () => getRun(id) })
}

export function useReportQuery(runId: string) {
  return useQuery({ queryKey: reportKey(runId), queryFn: () => getReport(runId) })
}

// --- organizations ----------------------------------------------------------

export function useCreateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: OrganizationInput) => createOrganization(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationsKey }),
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: OrganizationInput }) =>
      updateOrganization(id, input),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: organizationsKey })
      void queryClient.invalidateQueries({ queryKey: organizationKey(id) })
      void queryClient.invalidateQueries({ queryKey: entitiesKey(id) })
    },
  })
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteOrganization(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: organizationsKey }),
  })
}

// --- legal entities (spec 03.1) -----------------------------------------------

function useEntityMutation<TArgs, TResult>(
  orgId: string,
  mutationFn: (args: TArgs) => Promise<TResult>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: entitiesKey(orgId) })
      // facilities render their entity's name and relationship
      void queryClient.invalidateQueries({ queryKey: facilitiesKey(orgId) })
    },
  })
}

export function useCreateEntity(orgId: string) {
  return useEntityMutation(orgId, (input: EntityInput) => createEntity(orgId, input))
}

export function useUpdateEntity(orgId: string) {
  return useEntityMutation(orgId, ({ id, input }: { id: string; input: EntityInput }) =>
    updateEntity(id, input),
  )
}

export function useDeleteEntity(orgId: string) {
  return useEntityMutation(orgId, ({ id, reason }: { id: string; reason: string }) =>
    deleteEntity(id, reason),
  )
}

// --- facilities --------------------------------------------------------------

export function useCreateFacility(orgId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: FacilityInput) => createFacility(orgId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: facilitiesKey(orgId) })
      void queryClient.invalidateQueries({ queryKey: organizationKey(orgId) })
    },
  })
}

export function useUpdateFacility(orgId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FacilityInput }) => updateFacility(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: facilitiesKey(orgId) })
      void queryClient.invalidateQueries({ queryKey: activitiesKey(orgId) })
    },
  })
}

export function useDeleteFacility(orgId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => deleteFacility(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: facilitiesKey(orgId) })
      void queryClient.invalidateQueries({ queryKey: activitiesKey(orgId) })
      void queryClient.invalidateQueries({ queryKey: organizationKey(orgId) })
    },
  })
}

// --- activity facts ----------------------------------------------------------

export function useCreateActivity(orgId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ActivityInput) => createActivity(orgId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: activitiesKey(orgId) }),
  })
}

export function useUpdateActivity(orgId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ActivityInput }) => updateActivity(id, input),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: activitiesKey(orgId) })
      void queryClient.invalidateQueries({ queryKey: activityKey(id) })
      void queryClient.invalidateQueries({ queryKey: revisionsKey(id) })
    },
  })
}

export function useDeleteActivity(orgId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => deleteActivity(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: activitiesKey(orgId) }),
  })
}

export function useActivityRevisionsQuery(activityId: string) {
  return useQuery({
    queryKey: revisionsKey(activityId),
    queryFn: () => listActivityRevisions(activityId),
  })
}

// --- evidence (spec 04.4) --------------------------------------------------------

export function useEvidenceQuery(owner: EvidenceOwner) {
  return useQuery({ queryKey: evidenceKey(owner), queryFn: () => listEvidence(owner) })
}

function useEvidenceMutation<TArgs, TResult>(
  owner: EvidenceOwner,
  orgId: string,
  mutationFn: (args: TArgs) => Promise<TResult>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: evidenceKey(owner) })
      void queryClient.invalidateQueries({ queryKey: activitiesKey(orgId) })
      void queryClient.invalidateQueries({ queryKey: ['ghg', 'evidence-page', orgId] })
      if ('activityId' in owner) {
        void queryClient.invalidateQueries({ queryKey: activityKey(owner.activityId) })
      }
    },
  })
}

export function useUploadEvidence(owner: EvidenceOwner, orgId: string) {
  return useEvidenceMutation(owner, orgId, (file: File) => uploadEvidence(owner, file))
}

export function useAddEvidenceLink(owner: EvidenceOwner, orgId: string) {
  return useEvidenceMutation(owner, orgId, (input: { name?: string; url: string }) =>
    addEvidenceLink(owner, input),
  )
}

export function useDeleteEvidence(owner: EvidenceOwner, orgId: string) {
  return useEvidenceMutation(owner, orgId, (id: string) => deleteEvidence(id))
}

// --- inventories --------------------------------------------------------------

export function useCreateInventory(orgId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: InventoryInput) => createInventory(orgId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inventoriesKey(orgId) }),
  })
}

export function useUpdateInventory(orgId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: InventoryInput }) =>
      updateInventory(id, input),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: inventoriesKey(orgId) })
      void queryClient.invalidateQueries({ queryKey: inventoryKey(id) })
      void queryClient.invalidateQueries({ queryKey: validationKey(id) })
      void queryClient.invalidateQueries({ queryKey: boundaryKey(id) })
    },
  })
}

export function useDeleteInventory(orgId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteInventory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inventoriesKey(orgId) }),
  })
}

export function useSetOperationalBoundary(inventoryId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: OperationalBoundaryInput) => setOperationalBoundary(inventoryId, input),
    onSuccess: (inventory) => queryClient.setQueryData(inventoryKey(inventoryId), inventory),
  })
}

// --- boundary + assignments: every change re-runs the validation gates --------

function useInventoryScopedMutation<TArgs, TResult>(
  inventoryId: string,
  mutationFn: (args: TArgs) => Promise<TResult>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: boundaryKey(inventoryId) })
      void queryClient.invalidateQueries({ queryKey: assignmentsKey(inventoryId) })
      void queryClient.invalidateQueries({ queryKey: coverageKey(inventoryId) })
      void queryClient.invalidateQueries({ queryKey: validationKey(inventoryId) })
      void queryClient.invalidateQueries({ queryKey: marketFactorsKey(inventoryId) })
      // the inventory carries the lifecycle status, which the header renders
      void queryClient.invalidateQueries({ queryKey: inventoryKey(inventoryId) })
    },
  })
}

// --- inventory lifecycle (spec 05.1) --------------------------------------------

export function useFreezeInventory(inventoryId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => freezeInventory(inventoryId),
    onSuccess: (version) => {
      queryClient.setQueryData(boundaryVersionKey(version.version.id), version)
      void queryClient.invalidateQueries({ queryKey: inventoryKey(inventoryId) })
      void queryClient.invalidateQueries({ queryKey: validationKey(inventoryId) })
      void queryClient.invalidateQueries({ queryKey: boundaryVersionsKey(inventoryId) })
      // a freeze may flag the organization's base year (spec 06)
      void queryClient.invalidateQueries({ queryKey: ['ghg', 'base-year'] })
    },
  })
}

function useLifecycleMutation<TArgs, TResult>(
  inventoryId: string,
  mutationFn: (args: TArgs) => Promise<TResult>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKey(inventoryId) })
      void queryClient.invalidateQueries({ queryKey: validationKey(inventoryId) })
      void queryClient.invalidateQueries({ queryKey: runsKey(inventoryId) })
      void queryClient.invalidateQueries({ queryKey: auditEventsKey(inventoryId) })
      void queryClient.invalidateQueries({ queryKey: ['ghg', 'inventories'] })
    },
  })
}

export function useReopenInventory(inventoryId: string) {
  return useLifecycleMutation(inventoryId, () => reopenInventory(inventoryId))
}

export function useWithdrawFinal(inventoryId: string) {
  return useLifecycleMutation(inventoryId, (reason: string) => withdrawFinal(inventoryId, reason))
}

export function useCoverageQuery(inventoryId: string) {
  return useQuery({ queryKey: coverageKey(inventoryId), queryFn: () => listCoverage(inventoryId) })
}

export function useSetReportMetadata(inventoryId: string) {
  return useLifecycleMutation(inventoryId, (input: ReportMetadataInput) =>
    setReportMetadata(inventoryId, input),
  )
}

export function useAuditEventsQuery(inventoryId: string) {
  return useQuery({
    queryKey: auditEventsKey(inventoryId),
    queryFn: () => listAuditEvents(inventoryId),
  })
}

export function usePublishInventory(inventoryId: string) {
  return useLifecycleMutation(inventoryId, () => publishInventory(inventoryId))
}

export function useSupersedeInventory(inventoryId: string) {
  return useLifecycleMutation(inventoryId, (input: { name?: string; reason: string }) =>
    supersedeInventory(inventoryId, input),
  )
}

export function useSetBoundaryTreatment(inventoryId: string) {
  return useInventoryScopedMutation(
    inventoryId,
    ({ facilityId, input }: { facilityId: string; input: BoundaryTreatmentInput }) =>
      setBoundaryTreatment(inventoryId, facilityId, input),
  )
}

export function useRemoveBoundaryTreatment(inventoryId: string) {
  return useInventoryScopedMutation(inventoryId, (facilityId: string) =>
    removeBoundaryTreatment(inventoryId, facilityId),
  )
}

export function useSetEntityTreatment(inventoryId: string) {
  return useInventoryScopedMutation(
    inventoryId,
    ({ entityId, input }: { entityId: string; input: BoundaryTreatmentInput }) =>
      setEntityTreatment(inventoryId, entityId, input),
  )
}

export function useRemoveEntityTreatment(inventoryId: string) {
  return useInventoryScopedMutation(inventoryId, (entityId: string) =>
    removeEntityTreatment(inventoryId, entityId),
  )
}

// --- boundary exclusions (spec 07.2) --------------------------------------------

export function useExcludeEntity(inventoryId: string) {
  return useInventoryScopedMutation(
    inventoryId,
    ({ entityId, input }: { entityId: string; input: BoundaryExclusionInput }) =>
      excludeEntity(inventoryId, entityId, input),
  )
}

export function useClearEntityExclusion(inventoryId: string) {
  return useInventoryScopedMutation(inventoryId, (entityId: string) =>
    clearEntityExclusion(inventoryId, entityId),
  )
}

export function useExcludeFacility(inventoryId: string) {
  return useInventoryScopedMutation(
    inventoryId,
    ({ facilityId, input }: { facilityId: string; input: BoundaryExclusionInput }) =>
      excludeFacility(inventoryId, facilityId, input),
  )
}

export function useClearFacilityExclusion(inventoryId: string) {
  return useInventoryScopedMutation(inventoryId, (facilityId: string) =>
    clearFacilityExclusion(inventoryId, facilityId),
  )
}

export function useSetMarketFactor(inventoryId: string) {
  return useInventoryScopedMutation(
    inventoryId,
    ({ facilityId, input }: { facilityId: string; input: MarketFactorInput }) =>
      setMarketFactor(inventoryId, facilityId, input),
  )
}

export function useRemoveMarketFactor(inventoryId: string) {
  return useInventoryScopedMutation(inventoryId, (facilityId: string) =>
    removeMarketFactor(inventoryId, facilityId),
  )
}

export function useSetResidualMix(inventoryId: string) {
  return useInventoryScopedMutation(inventoryId, (input: ResidualMixInput) =>
    setResidualMix(inventoryId, input),
  )
}

export function useSyncAssignments(inventoryId: string) {
  return useInventoryScopedMutation(inventoryId, () => syncAssignments(inventoryId))
}

export function useClassifyAssignment(inventoryId: string) {
  return useInventoryScopedMutation(
    inventoryId,
    ({ id, input }: { id: string; input: ClassifyInput }) => classifyAssignment(id, input),
  )
}

export function useExcludeAssignment(inventoryId: string) {
  return useInventoryScopedMutation(
    inventoryId,
    ({ id, input }: { id: string; input: ExcludeInput }) => excludeAssignment(id, input),
  )
}

export function useIncludeAssignment(inventoryId: string) {
  return useInventoryScopedMutation(inventoryId, (id: string) => includeAssignment(id))
}

// --- runs ----------------------------------------------------------------------

export function useExecuteRun(inventoryId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (label: string) => executeRun(inventoryId, label),
    onSuccess: (detail) => {
      queryClient.setQueryData(runKey(detail.run.id), detail)
      void queryClient.invalidateQueries({ queryKey: runsKey(inventoryId) })
    },
  })
}

export function useFinalizeRun(inventoryId: string) {
  return useLifecycleMutation(inventoryId, (runId: string) => finalizeRun(runId))
}

export function useVoidRun(inventoryId: string) {
  return useLifecycleMutation(inventoryId, ({ id, reason }: { id: string; reason: string }) =>
    voidRun(id, reason),
  )
}

// --- base year (spec 06) ----------------------------------------------------------

function useBaseYearMutation<TArgs>(orgId: string, mutationFn: (args: TArgs) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: baseYearKey(orgId) })
      // the BASE_YEAR gate of every inventory reads the flags
      void queryClient.invalidateQueries({ queryKey: ['ghg', 'validation'] })
    },
  })
}

export function useSetBaseYear(orgId: string) {
  return useBaseYearMutation(orgId, (input: BaseYearInput) => setBaseYear(orgId, input))
}

export function useClearBaseYear(orgId: string) {
  return useBaseYearMutation(orgId, () => clearBaseYear(orgId))
}

export function useRaiseRecalculation(orgId: string) {
  return useBaseYearMutation(orgId, (input: RaiseRecalculationInput) =>
    raiseRecalculation(orgId, input),
  )
}

export function useDecideRecalculation(orgId: string) {
  return useBaseYearMutation(
    orgId,
    ({ recalculationId, input }: { recalculationId: string; input: RecalculationDecisionInput }) =>
      decideRecalculation(orgId, recalculationId, input),
  )
}
