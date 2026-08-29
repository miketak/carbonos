import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createActivity,
  createFacility,
  createOrganization,
  deleteActivity,
  deleteFacility,
  deleteOrganization,
  deleteRun,
  executeRun,
  getOrganization,
  getRun,
  listActivities,
  listEmissionFactors,
  listFacilities,
  listOrganizations,
  listRuns,
  updateFacility,
  updateOrganization,
} from './api'
import type { ActivityInput, FacilityInput, OrganizationInput, RunInput } from './api'

export const organizationsKey = ['ghg', 'organizations'] as const
export const factorsKey = ['ghg', 'emission-factors'] as const
export const organizationKey = (id: string) => ['ghg', 'organization', id] as const
export const facilitiesKey = (orgId: string) => ['ghg', 'facilities', orgId] as const
export const activitiesKey = (orgId: string) => ['ghg', 'activities', orgId] as const
export const runsKey = (orgId: string) => ['ghg', 'runs', orgId] as const
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

export function useFacilitiesQuery(orgId: string) {
  return useQuery({ queryKey: facilitiesKey(orgId), queryFn: () => listFacilities(orgId) })
}

export function useActivitiesQuery(orgId: string) {
  return useQuery({ queryKey: activitiesKey(orgId), queryFn: () => listActivities(orgId) })
}

export function useRunsQuery(orgId: string) {
  return useQuery({ queryKey: runsKey(orgId), queryFn: () => listRuns(orgId) })
}

export function useRunQuery(id: string) {
  return useQuery({ queryKey: runKey(id), queryFn: () => getRun(id) })
}

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

export function useCreateActivity(orgId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ActivityInput) => createActivity(orgId, input),
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

export function useExecuteRun(orgId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RunInput) => executeRun(orgId, input),
    onSuccess: (detail) => {
      queryClient.setQueryData(runKey(detail.run.id), detail)
      void queryClient.invalidateQueries({ queryKey: runsKey(orgId) })
    },
  })
}

export function useDeleteRun(orgId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRun(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: runsKey(orgId) }),
  })
}
