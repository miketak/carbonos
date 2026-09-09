import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  classifyAssignment,
  clearBaseYear,
  clearEntityExclusion,
  clearFacilityExclusion,
  createActivity,
  createEntity,
  createFacility,
  createInventory,
  createOrganization,
  decideRecalculation,
  deleteActivity,
  deleteEntity,
  deleteFacility,
  deleteInventory,
  deleteOrganization,
  excludeAssignment,
  excludeEntity,
  excludeFacility,
  executeRun,
  finalizeRun,
  freezeInventory,
  getBaseYear,
  getBoundary,
  getBoundaryVersion,
  getInventory,
  getOrganization,
  getReport,
  getRun,
  getValidation,
  includeAssignment,
  listActivities,
  listAssignments,
  listAuditEvents,
  listBoundaryVersions,
  listEmissionFactors,
  listEntities,
  listFacilities,
  listInventories,
  listMarketFactors,
  listOrganizations,
  listRuns,
  listUnits,
  publishInventory,
  raiseRecalculation,
  removeBoundaryTreatment,
  removeEntityTreatment,
  removeMarketFactor,
  reopenInventory,
  setBaseYear,
  setBoundaryTreatment,
  setEntityTreatment,
  setMarketFactor,
  setOperationalBoundary,
  setResidualMix,
  supersedeInventory,
  syncAssignments,
  updateActivity,
  updateEntity,
  updateFacility,
  updateInventory,
  updateOrganization,
  voidRun,
  withdrawFinal,
} from './api'
import type {
  ActivityInput,
  BaseYearInput,
  BoundaryExclusionInput,
  BoundaryTreatmentInput,
  ClassifyInput,
  EntityInput,
  ExclusionReason,
  FacilityInput,
  InventoryInput,
  MarketFactorInput,
  OperationalBoundaryInput,
  OrganizationInput,
  RaiseRecalculationInput,
  RecalculationDecisionInput,
  ResidualMixInput,
} from './api'

export const organizationsKey = ['ghg', 'organizations'] as const
export const factorsKey = ['ghg', 'emission-factors'] as const
export const unitsKey = ['ghg', 'units'] as const
export const organizationKey = (id: string) => ['ghg', 'organization', id] as const
export const entitiesKey = (orgId: string) => ['ghg', 'entities', orgId] as const
export const facilitiesKey = (orgId: string) => ['ghg', 'facilities', orgId] as const
export const activitiesKey = (orgId: string) => ['ghg', 'activities', orgId] as const
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
export const auditEventsKey = (inventoryId: string) => ['ghg', 'events', inventoryId] as const
export const runKey = (id: string) => ['ghg', 'run', id] as const
export const reportKey = (runId: string) => ['ghg', 'report', runId] as const

export function useOrganizationsQuery() {
  return useQuery({ queryKey: organizationsKey, queryFn: listOrganizations })
}

export function useOrganizationQuery(id: string) {
  return useQuery({ queryKey: organizationKey(id), queryFn: () => getOrganization(id) })
}

export function useEmissionFactorsQuery() {
  // the factor library is seeded and read-only, so cache it for the session
  return useQuery({ queryKey: factorsKey, queryFn: listEmissionFactors, staleTime: Infinity })
}

export function useUnitsQuery() {
  // the unit registry is static, so cache it for the session
  return useQuery({ queryKey: unitsKey, queryFn: listUnits, staleTime: Infinity })
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
  return useEntityMutation(orgId, (id: string) => deleteEntity(id))
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
    mutationFn: (id: string) => deleteFacility(id),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: activitiesKey(orgId) }),
  })
}

export function useDeleteActivity(orgId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteActivity(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: activitiesKey(orgId) }),
  })
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
  return useLifecycleMutation(inventoryId, (name?: string) => supersedeInventory(inventoryId, name))
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
    ({ id, reason }: { id: string; reason: ExclusionReason }) => excludeAssignment(id, reason),
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
