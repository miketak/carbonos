/**
 * Shared lookups of the factor pack vocabulary: the maintenance console's
 * families, editions and rows (spec 02.5), the organization's adoption notices
 * and their diff (spec 02.7), and the support access grants (specs 01.3, 01.5).
 */
import type { ApiContext, ApiSession } from './contract.ts'
import { organization, type OrgRow } from './organizations.ts'

export interface EditionRow {
  editionId: string
  packKey: string
  name: string
  status: 'DRAFT' | 'PUBLISHED' | 'SUPERSEDED' | 'WITHDRAWN'
  source: string
  sourceUrl: string | null
  publicationYear: number | null
  gwpBasis: string | null
  license: string | null
  retrieved: string | null
  notes: string | null
  appliesFrom: string | null
  publishedAt: string | null
  sourceDocument: string | null
  evidenceChecksum: string | null
  evidenceName: string | null
  curator: string | null
  curatorEmail: string | null
  approver: string | null
  supersedesId: string | null
  withdrawnAt: string | null
  withdrawalReason: string | null
  mutable: boolean
  rowCount: number
  holderCount: number
}

export interface FamilyRow {
  packKey: string
  name: string
  editions: EditionRow[]
}

export interface PackRow {
  id: string
  code: string
  name: string
  unit: string
  kgCo2ePerUnit: number
  dataYear: number | null
  approved: boolean
  [key: string]: unknown
}

export interface Finding {
  rule: string
  code: string
  message: string
}

export interface BlastRadius {
  editionId: string
  act: 'PUBLISH' | 'WITHDRAW'
  predecessorEditionId: string | null
  rowsAdded: number
  rowsChanged: number
  rowsDiscontinued: number
  rowsUnchanged: number
  rowsOverThreshold: number
  rows: Array<{ code: string; kind: string; oldKgCo2e: number | null; newKgCo2e: number | null; percentChange: number | null; overThreshold: boolean; holders: number }>
  organizations: Array<{
    organizationName: string
    lineagesHeld: number
    rowsMoving: number
    rowsOverThreshold: number
    estimatedKgCo2eDelta: number | null
    lastRunLabel: string | null
    lockedPeriods: Array<{ name: string; status: string }>
    openDrafts: Array<{ name: string }>
  }>
  holderCount: number
  openNoticeCount: number
}

export interface NoticeRow {
  id: string
  editionId: string
  editionName: string
  predecessorEditionId: string | null
  status: 'OPEN' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN'
  withdrawalReason: string | null
  appliesFrom: string | null
  rowsAffected: number
  rowsOverThreshold: number
  estimatedKgCo2eDelta: number | null
  decidedBy: string | null
  recalculationCase: string | null
  decisionNote: string | null
}

export interface Diff {
  editionId: string
  predecessorEditionId: string | null
  appliesFrom: string | null
  rows: Array<{ code: string; currentKgCo2ePerUnit: number | null; newKgCo2ePerUnit: number | null; percentChange: number | null; estimatedKgCo2eDelta: number | null }>
  earlierPeriods: Array<{ name: string; periodStart: string; periodEnd: string }>
  estimatedKgCo2eDelta: number | null
  diffHash: string
  estimatedOver: string | null
  lockedPeriod: { name: string; periodStart: string; periodEnd: string; status: string } | null
  hasBaseYear: boolean
  recalculationWarning: string | null
}

export interface AdminOrganizationRow {
  id: string
  name: string
  accountNo: number
  ownerEmails: string[]
  memberCount: number
  supportAccess: { adminEmail: string; expiresAt: string; reason: string } | null
}

async function get<T>(session: ApiSession, path: string): Promise<T> {
  const out = await session.get(path)
  if (!out.ok) throw new Error(`GET ${path} answered ${out.status}`)
  return out.body as T
}

const ed = (editionId: string) => `/api/admin/factor-packs/editions/${encodeURIComponent(editionId)}`

export const families = (admin: ApiSession) => get<FamilyRow[]>(admin, '/api/admin/factor-packs')

/** An edition by its identifier, through the console (an administrator's session). */
export const edition = (admin: ApiSession, editionId: string) => get<EditionRow>(admin, ed(editionId))

export async function familyOf(admin: ApiSession, editionId: string): Promise<FamilyRow> {
  const hit = (await families(admin)).find((f) => f.editions.some((e) => e.editionId === editionId))
  if (!hit) throw new Error(`no edition '${editionId}' in any family`)
  return hit
}

export const rows = async (admin: ApiSession, editionId: string, search?: string) =>
  (await get<{ items: PackRow[]; total: number }>(admin, `${ed(editionId)}/rows?size=200${search ? `&search=${encodeURIComponent(search)}` : ''}`)).items

export async function packRow(admin: ApiSession, editionId: string, code: string): Promise<PackRow> {
  const hit = (await rows(admin, editionId, code)).find((r) => r.code === code)
  if (!hit) throw new Error(`no row coded '${code}' in ${editionId}`)
  return hit
}

export const validation = (admin: ApiSession, editionId: string) => get<Finding[]>(admin, `${ed(editionId)}/validation`)
export const blastRadius = (admin: ApiSession, editionId: string) => get<BlastRadius>(admin, `${ed(editionId)}/blast-radius`)

export const notices = (session: ApiSession, orgId: string) => get<NoticeRow[]>(session, `/api/ghg/organizations/${orgId}/factor-pack-notices`)

/** The notice an edition raised against the organization, read as the step's actor. */
export async function notice(ctx: ApiContext, orgRef: string, editionId: string): Promise<{ org: OrgRow; notice: NoticeRow }> {
  const org = await organization(ctx, orgRef)
  const hit = (await notices(ctx.session(), org.id)).find((n) => n.editionId === editionId)
  if (!hit) throw new Error(`no notice for '${editionId}' in ${orgRef}`)
  return { org, notice: hit }
}

export const diff = (session: ApiSession, noticeId: string) => get<Diff>(session, `/api/ghg/factor-pack-notices/${noticeId}/diff`)

export const adminOrganizations = (admin: ApiSession) => get<AdminOrganizationRow[]>(admin, '/api/admin/organizations')

/** The row's facts as the console's PUT expects them, with the changes applied. */
export function rowRequest(row: PackRow, changes: Partial<PackRow>): Record<string, unknown> {
  const { id: _id, editionId: _e, ordinal: _o, ...facts } = { ...row, ...changes } as PackRow & { editionId?: string; ordinal?: number }
  return facts
}

/** The three answers chapter 5 distinguishes, as the drawer's select lists them (spec 02.7). */
export const caseLabels: Record<string, string> = {
  VINTAGE_PROGRESSION: 'Vintage progression: the edition applies to the next reporting year forward',
  RETROSPECTIVE_ADOPTION: 'Retrospective adoption: the edition is applied to a year already reported',
  ERRATUM_ON_REPORTED_YEAR: 'Erratum: the edition corrects a wrong value in a year already reported',
}

/** "as a vintage progression": how the history line and the drawer name the answer. */
export const caseWords: Record<string, string> = {
  VINTAGE_PROGRESSION: 'a vintage progression',
  RETROSPECTIVE_ADOPTION: 'a retrospective adoption',
  ERRATUM_ON_REPORTED_YEAR: 'an erratum on a reported year',
}

export const noticeStatusLabels: Record<string, string> = {
  OPEN: 'Waiting on you',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  WITHDRAWN: 'Withdrawn by the publisher',
}
