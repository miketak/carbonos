import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  classifyAssignment,
  createActivity,
  createFacility,
  createInventory,
  createOrganization,
  deleteActivity,
  deleteFacility,
  deleteInventory,
  deleteOrganization,
  deleteRun,
  excludeAssignment,
  executeRun,
  finalizeRun,
  freezeBoundary,
  getBoundary,
  getBoundaryVersion,
  getInventory,
  getOrganization,
  getRun,
  getValidation,
  includeAssignment,
  listActivities,
  listAssignments,
  listBoundaryVersions,
  listEmissionFactors,
  listFacilities,
  listUnits,
  listInventories,
  listOrganizations,
  listRuns,
  removeBoundaryTreatment,
  reopenBoundary,
  setBoundaryTreatment,
  syncAssignments,
  updateActivity,
  updateFacility,
  updateInventory,
  updateOrganization,
} from './api'
import type {
  ActivityInput,
  BoundaryTreatmentInput,
  ExclusionReason,
  FacilityInput,
  InventoryInput,
  OrganizationInput,
} from './api'

export const organizationsKey = ['ghg', 'organizations'] as const
export const factorsKey = ['ghg', 'emission-factors'] as const
export const unitsKey = ['ghg', 'units'] as const
export const organizationKey = (id: string) => ['ghg', 'organization', id] as const
export const facilitiesKey = (orgId: string) => ['ghg', 'facilities', orgId] as const
export const activitiesKey = (orgId: string) => ['ghg', 'activities', orgId] as const
export const inventoriesKey = (orgId: string) => ['ghg', 'inventories', orgId] as const
export const inventoryKey = (id: string) => ['ghg', 'inventory', id] as const
export const boundaryKey = (inventoryId: string) => ['ghg', 'boundary', inventoryId] as const
export const boundaryVersionsKey = (inventoryId: string) =>
  ['ghg', 'boundary-versions', inventoryId] as const
export const boundaryVersionKey = (id: string) => ['ghg', 'boundary-version', id] as const
export const assignmentsKey = (inventoryId: string) => ['ghg', 'assignments', inventoryId] as const
export const validationKey = (inventoryId: string) => ['ghg', 'validation', inventoryId] as const
export const runsKey = (inventoryId: string) => ['ghg', 'runs', inventoryId] as const
export const runKey = (id: string) => ['ghg', 'run', id] as const

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

export function useFacilitiesQuery(orgId: string) {
  return useQuery({ queryKey: facilitiesKey(orgId), queryFn: () => listFacilities(orgId) })
}

export function useActivitiesQuery(orgId: string) {
  return useQuery({ queryKey: activitiesKey(orgId), queryFn: () => listActivities(orgId) })
}

export function useInventoriesQuery(orgId: string) {
  return useQuery({ queryKey: inventoriesKey(orgId), queryFn: () => listInventories(orgId) })
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
      // the inventory carries the boundary status, which the header renders
      void queryClient.invalidateQueries({ queryKey: inventoryKey(inventoryId) })
    },
  })
}

// --- boundary lifecycle (spec 03) --------------------------------------------

export function useFreezeBoundary(inventoryId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => freezeBoundary(inventoryId),
    onSuccess: (version) => {
      queryClient.setQueryData(boundaryVersionKey(version.version.id), version)
      void queryClient.invalidateQueries({ queryKey: inventoryKey(inventoryId) })
      void queryClient.invalidateQueries({ queryKey: validationKey(inventoryId) })
      void queryClient.invalidateQueries({ queryKey: boundaryVersionsKey(inventoryId) })
    },
  })
}

export function useReopenBoundary(inventoryId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => reopenBoundary(inventoryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKey(inventoryId) })
      void queryClient.invalidateQueries({ queryKey: validationKey(inventoryId) })
    },
  })
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

export function useSyncAssignments(inventoryId: string) {
  return useInventoryScopedMutation(inventoryId, () => syncAssignments(inventoryId))
}

export function useClassifyAssignment(inventoryId: string) {
  return useInventoryScopedMutation(
    inventoryId,
    ({ id, emissionFactorId }: { id: string; emissionFactorId: string }) =>
      classifyAssignment(id, emissionFactorId),
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
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (runId: string) => finalizeRun(runId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: runsKey(inventoryId) })
      void queryClient.invalidateQueries({ queryKey: inventoryKey(inventoryId) })
    },
  })
}

export function useDeleteRun(inventoryId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRun(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: runsKey(inventoryId) })
      void queryClient.invalidateQueries({ queryKey: inventoryKey(inventoryId) })
    },
  })
}
