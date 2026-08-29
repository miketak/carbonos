import { api } from '../../lib/api'

export type ConsolidationApproach = 'EQUITY_SHARE' | 'FINANCIAL_CONTROL' | 'OPERATIONAL_CONTROL'
export type GhgScope = 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3'

export interface Organization {
  id: string
  name: string
  consolidationApproach: ConsolidationApproach
  facilityCount: number
  createdAt: string
}

export interface OrganizationInput {
  name: string
  consolidationApproach: ConsolidationApproach
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
  kgCo2ePerUnit: number
  source: string
}

export interface Activity {
  id: string
  facilityId: string
  facilityName: string
  emissionFactorId: string
  factorName: string
  scope: GhgScope
  category: string
  quantity: number
  unit: string
  activityDate: string
  note: string | null
  unweightedKgCo2e: number
}

export interface ActivityInput {
  facilityId: string
  emissionFactorId: string
  quantity: number
  activityDate: string
  note?: string
}

export interface Run {
  id: string
  label: string
  periodStart: string
  periodEnd: string
  consolidationApproach: ConsolidationApproach
  activityCount: number
  totalKgCo2e: number
  scope1KgCo2e: number
  scope2KgCo2e: number
  scope3KgCo2e: number
  createdAt: string
}

export interface RunLine {
  id: string
  activityId: string
  facilityName: string
  factorName: string
  scope: GhgScope
  category: string
  quantity: number
  unit: string
  kgCo2ePerUnit: number
  weight: number
  kgCo2e: number
}

export interface RunDetail {
  run: Run
  lines: RunLine[]
}

export interface RunInput {
  label: string
  periodStart: string
  periodEnd: string
}

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

export function listEmissionFactors(): Promise<EmissionFactor[]> {
  return api<EmissionFactor[]>('/api/ghg/emission-factors')
}

export function listActivities(organizationId: string): Promise<Activity[]> {
  return api<Activity[]>(`/api/ghg/organizations/${organizationId}/activities`)
}

export function createActivity(organizationId: string, input: ActivityInput): Promise<Activity> {
  return api<Activity>(`/api/ghg/organizations/${organizationId}/activities`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function deleteActivity(id: string): Promise<void> {
  return api<void>(`/api/ghg/activities/${id}`, { method: 'DELETE' })
}

export function listRuns(organizationId: string): Promise<Run[]> {
  return api<Run[]>(`/api/ghg/organizations/${organizationId}/runs`)
}

export function executeRun(organizationId: string, input: RunInput): Promise<RunDetail> {
  return api<RunDetail>(`/api/ghg/organizations/${organizationId}/runs`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getRun(id: string): Promise<RunDetail> {
  return api<RunDetail>(`/api/ghg/runs/${id}`)
}

export function deleteRun(id: string): Promise<void> {
  return api<void>(`/api/ghg/runs/${id}`, { method: 'DELETE' })
}
