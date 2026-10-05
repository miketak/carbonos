/**
 * Shared lookups of the organization vocabulary: an organization by its
 * name (two may share one, spec 01.8: `Name #2` is the second by account
 * number), and the things under it by name, through the acting member's
 * session.
 */
import { z } from 'zod'
import type { ApiContext, ApiOutcome, ApiSession } from './contract.ts'

export const orgArg = z.string().describe("an organization's name, with ' #2' for the second of two sharing it")

export interface OrgRow {
  id: string
  name: string
  accountNo: number
  myRole: string | null
}

export function splitOrgRef(ref: string): { name: string; index: number | undefined } {
  const match = /^(.*) #(\d+)$/.exec(ref)
  return match ? { name: match[1]!, index: Number(match[2]) } : { name: ref, index: undefined }
}

/** Every live organization the platform holds, from the administrators' support list (spec 01.3). */
export async function listAllOrganizations(ctx: ApiContext): Promise<OrgRow[]> {
  const out = await (await ctx.admin()).get('/api/admin/organizations')
  if (!out.ok) throw new Error(`could not list organizations: ${out.status}`)
  return (out.body as Array<{ id: string; name: string; accountNo: number }>).map((o) => ({ ...o, myRole: null }))
}

export async function findOrganization(ctx: ApiContext, ref: string): Promise<OrgRow | undefined> {
  const { name, index } = splitOrgRef(ref)
  const all = (await listAllOrganizations(ctx)).filter((o) => o.name === name).sort((a, b) => a.accountNo - b.accountNo)
  if (all.length === 0) return undefined
  if (index !== undefined) return all[index - 1]
  return all[all.length - 1]
}

export async function organization(ctx: ApiContext, ref: string): Promise<OrgRow> {
  const found = await findOrganization(ctx, ref)
  if (!found) throw new Error(`no organization named '${ref}'`)
  return found
}

export const ORG_LABEL = (o: OrgRow) => `${o.name} (ORG-${String(o.accountNo).padStart(4, '0')})`

async function list<T>(session: ApiSession, path: string): Promise<T[]> {
  const out = await session.get(path)
  if (!out.ok) throw new Error(`GET ${path} answered ${out.status}`)
  return out.body as T[]
}

export interface EntityRow {
  id: string
  name: string
  relationshipType: string
  parentEntityId: string | null
  reportingCompany: boolean
  equityShare: number
  financialControlShare: number
  operationalControlShare: number
  effectiveFrom: string | null
  effectiveTo: string | null
  economicInterestPercent: number
  legalOwnershipPercent: number
  operatedByCompany: boolean
  jurisdiction: string | null
  controlledByCompany: boolean
  financialControlOverride: boolean | null
  controlNote: string | null
}

export const entities = (session: ApiSession, orgId: string) => list<EntityRow>(session, `/api/ghg/organizations/${orgId}/entities`)

export async function entity(session: ApiSession, orgId: string, name: string): Promise<EntityRow> {
  const found = (await entities(session, orgId)).find((e) => e.name === name)
  if (!found) throw new Error(`no entity named '${name}'`)
  return found
}

export interface FacilityRow {
  id: string
  name: string
  entityId: string
  entityName: string
  gridRegion: string | null
  effectiveGridRegion: string | null
  leaseType: string | null
  leaseFrom: string | null
  leaseTo: string | null
  location: string
  country: string | null
}

export const facilities = (session: ApiSession, orgId: string) => list<FacilityRow>(session, `/api/ghg/organizations/${orgId}/facilities`)

export async function facility(session: ApiSession, orgId: string, name: string): Promise<FacilityRow> {
  const found = (await facilities(session, orgId)).find((f) => f.name === name)
  if (!found) throw new Error(`no facility named '${name}'`)
  return found
}

export interface StreamRow {
  origin: 'REGISTER' | 'INLINE' | 'IMPORT'
  id: string
  name: string
  kind: string
  fuel: string | null
  meterOrSupplier: string | null
  contractorOperated: boolean
  facilityName: string
}

export const streamsOf = (session: ApiSession, facilityId: string) => list<StreamRow>(session, `/api/ghg/facilities/${facilityId}/streams`)

export interface MemberRow {
  id: string
  userId: string
  email: string
  displayName: string
  role: string
}

export const members = (session: ApiSession, orgId: string) => list<MemberRow>(session, `/api/ghg/organizations/${orgId}/members`)

export interface EventRow {
  action: string
  actor: string
  reason: string | null
  at: string
}

export const events = (session: ApiSession, orgId: string) => list<EventRow>(session, `/api/ghg/organizations/${orgId}/events`)

export interface FactorRow {
  id: string
  name: string
  approved: boolean
  approvedBy: string | null
  selfApproved: boolean
  createdBy: string | null
  validFrom: string | null
  validTo: string | null
  packCode: string | null
  sourceEdition: string | null
  unit: string
  kgCo2ePerUnit: number
  defaultScope: string
  defaultCategory: string
  source: string
  versions: Array<{ sourceEdition: string | null; validFrom: string | null; validTo: string | null }>
}

export interface Period {
  periodStart: string
  periodEnd: string
}

/** With a period, only the versions whose validity overlaps it: what the picker offers for a record of that year (spec 02.6). */
export async function searchFactors(session: ApiSession, orgId: string, q: string, period?: Period): Promise<FactorRow[]> {
  const window = period ? `&periodStart=${period.periodStart}&periodEnd=${period.periodEnd}` : ''
  const out = await session.get(`/api/ghg/organizations/${orgId}/emission-factors?q=${encodeURIComponent(q)}&includeUnapproved=true&size=50${window}`)
  if (!out.ok) throw new Error(`factor search answered ${out.status}`)
  return (out.body as { items: FactorRow[] }).items
}

/** A factor reference as the picker prints it: the name, with the unit after it ("Gaseous fuels: LPG (/litre)") where rows share a name. */
export function factorRef(ref: string): { name: string; unit: string | undefined } {
  const match = /^(.*) \(\/([^)]+)\)$/.exec(ref)
  return match ? { name: match[1]!, unit: match[2] } : { name: ref, unit: undefined }
}

export async function factor(session: ApiSession, orgId: string, ref: string, period?: Period): Promise<FactorRow> {
  const { name, unit } = factorRef(ref)
  const found = (await searchFactors(session, orgId, name, period)).find((f) => f.name === name && (unit === undefined || f.unit === unit))
  if (!found) throw new Error(`no factor named '${name}'${unit ? ` per ${unit}` : ''}`)
  return found
}

export interface ActivityRow {
  id: string
  recordNo: number
  recordRef: string
  draft: boolean
  status: string
  issues: string[]
  facilityId: string
  facilityName: string
  streamId: string | null
  streamName: string | null
  activityType: string
  quantity: number | null
  unit: string | null
  periodStart: string | null
  periodEnd: string | null
  dataSource: string | null
  evidenceRef: string | null
  dataQuality: string
  note: string | null
  dataQualityTier: number
  uncertaintyPercent: number | null
  removed: boolean
  evidenceCount: number
  revisionCount: number
}

export const activities = (session: ApiSession, orgId: string) => list<ActivityRow>(session, `/api/ghg/organizations/${orgId}/activities`)

/** A record by its reference (ACT-0009) or by its activity type, among the live records. */
export async function activity(session: ApiSession, orgId: string, ref: string): Promise<ActivityRow> {
  const all = (await activities(session, orgId)).filter((a) => !a.removed)
  const found = all.find((a) => a.recordRef === ref) ?? all.find((a) => a.activityType === ref)
  if (!found) throw new Error(`no record '${ref}'`)
  return found
}

export function refusal(status: number, detail: string): ApiOutcome {
  return { status, ok: false, body: { detail } }
}
