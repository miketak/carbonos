import { api } from '../../lib/api'
import type { Role, SessionUser, Status } from '../auth/api'

export type User = SessionUser

export interface CreateUserInput {
  email: string
  displayName: string
  role: Role
  temporaryPassword: string
}

export interface UpdateUserInput {
  displayName: string
  role: Role
  status: Status
}

export function listUsers(): Promise<User[]> {
  return api<User[]>('/api/admin/users')
}

export function createUser(input: CreateUserInput): Promise<User> {
  return api<User>('/api/admin/users', { method: 'POST', body: JSON.stringify(input) })
}

export function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  return api<User>(`/api/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(input) })
}

export function deleteUser(id: string): Promise<void> {
  return api<void>(`/api/admin/users/${id}`, { method: 'DELETE' })
}

export type AccessRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'COMPLETED'

export interface AccessRequest {
  id: string
  email: string
  displayName: string
  company: string | null
  status: AccessRequestStatus
  createdAt: string
  decidedAt: string | null
}

export function listAccessRequests(): Promise<AccessRequest[]> {
  return api<AccessRequest[]>('/api/admin/access-requests')
}

export function approveAccessRequest(id: string): Promise<AccessRequest> {
  return api<AccessRequest>(`/api/admin/access-requests/${id}/approve`, { method: 'POST' })
}

export function denyAccessRequest(id: string): Promise<AccessRequest> {
  return api<AccessRequest>(`/api/admin/access-requests/${id}/deny`, { method: 'POST' })
}

// --- organizations and support access (spec 01.3) ---------------------------

export interface SupportAccessGrant {
  adminEmail: string
  grantedAt: string
  expiresAt: string
  reason: string
}

/** How support staff find an organization they are not a member of. No inventory data. */
export interface AdminOrganization {
  id: string
  name: string
  /** The account number that tells two organizations of one name apart (spec 01.8). */
  accountNo: number
  ownerEmails: string[]
  memberCount: number
  /** The caller's own grant, when they hold one. */
  supportAccess: SupportAccessGrant | null
}

export function listAdminOrganizations(): Promise<AdminOrganization[]> {
  return api<AdminOrganization[]>('/api/admin/organizations')
}

export function assumeSupportAccess(
  organizationId: string,
  reason: string,
): Promise<SupportAccessGrant> {
  return api<SupportAccessGrant>(`/api/ghg/organizations/${organizationId}/support-access`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export function endSupportAccess(organizationId: string): Promise<void> {
  return api<void>(`/api/ghg/organizations/${organizationId}/support-access`, { method: 'DELETE' })
}

// --- factor pack editions: the maintenance console (spec 02.5) ---------------

export type FactorPackKind = 'SOURCE' | 'SECTOR'

export type FactorPackStatus = 'DRAFT' | 'PUBLISHED' | 'SUPERSEDED' | 'WITHDRAWN'

export type Scope = 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3'

export type ReportingBasis = 'SCOPES' | 'OUTSIDE_SCOPES_NON_KYOTO'

/** One dated release of a family: the unit of vintage, so a citation names one thing forever. */
export interface FactorPackEdition {
  editionId: string
  packKey: string
  name: string
  status: FactorPackStatus
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
  evidenceSize: number | null
  curator: string | null
  /** Compared with the signed-in administrator: the curator never publishes (spec 02.5). */
  curatorEmail: string | null
  approver: string | null
  provenanceReview: string
  provenanceNote: string | null
  /** The predecessor the change log was computed against, or null for a family's first edition. */
  supersedesId: string | null
  erratum: boolean
  erratumNote: string | null
  /** Recorded on a superseded edition when the erratum after it named the error. */
  errorNote: string | null
  withdrawnAt: string | null
  withdrawnBy: string | null
  withdrawalReason: string | null
  /** Only a draft is mutable; a published edition's rows and metadata never change. */
  mutable: boolean
  rowCount: number
  holderCount: number
}

/** The source document an edition is published against, with the checksum over the bytes stored. */
export interface FactorPackEvidence {
  key: string
  name: string
  size: number
  checksum: string
}

export type FactorPackChangeKind = 'ADDED' | 'CHANGED' | 'DISCONTINUED' | 'UNCHANGED'

/** One line of the change log an edition froze at publication, against its predecessor. */
export interface FactorPackChange {
  code: string
  kind: FactorPackChangeKind
  oldKgCo2e: number | null
  newKgCo2e: number | null
  percentChange: number | null
  fields: string | null
}

export interface FactorPackEvent {
  action: 'EVIDENCE_ATTACHED' | 'PUBLISHED' | 'SUPERSEDED' | 'WITHDRAWN'
  actor: string | null
  detail: string | null
  occurredAt: string
}

/** One lineage as the edition would move it, and how many organizations hold it. */
export interface BlastRadiusRow {
  code: string
  name: string
  unit: string | null
  kind: FactorPackChangeKind
  oldKgCo2e: number | null
  newKgCo2e: number | null
  absoluteChange: number | null
  percentChange: number | null
  overThreshold: boolean
  approved: boolean
  holders: number
}

export interface BlastRadiusInventory {
  inventoryId: string
  name: string
  periodStart: string
  periodEnd: string
  status: 'DRAFT' | 'FROZEN' | 'FINAL' | 'PUBLISHED'
}

/** What one organization would see if every holder adopted the edition. */
export interface BlastRadiusOrganization {
  organizationId: string
  organizationName: string
  organizationAccountNo: number | null
  lineagesHeld: number
  rowsMoving: number
  rowsOverThreshold: number
  estimatedKgCo2eDelta: number | null
  lastRunLabel: string | null
  openDrafts: BlastRadiusInventory[]
  lockedPeriods: BlastRadiusInventory[]
  conflicts: string[]
  blocked: string[]
  unapproved: string[]
  discontinued: string[]
  diffHash: string | null
}

/** What publishing, or withdrawing, this edition would do (spec 02.5). */
export interface BlastRadius {
  editionId: string
  packKey: string
  act: 'PUBLISH' | 'WITHDRAW'
  predecessorEditionId: string | null
  rowsAdded: number
  rowsChanged: number
  rowsDiscontinued: number
  rowsUnchanged: number
  rowsOverThreshold: number
  rows: BlastRadiusRow[]
  discontinuedLineages: string[]
  unapprovedRows: string[]
  organizations: BlastRadiusOrganization[]
  holderCount: number
  openNoticeCount: number
}

export interface PublishInput {
  sourceDocument: string
  /** ISO date; the server refuses a publish without one (spec 02.5). */
  appliesFrom: string
  erratum: boolean
  erratumNote: string | null
}

/** A family: the lineage of one publication, with every edition of it. */
export interface FactorPackFamily {
  packKey: string
  name: string
  kind: FactorPackKind
  summary: string | null
  editions: FactorPackEdition[]
}

/** One row of an edition, exactly as the publication states it; null is "not stated". */
export interface FactorPackRow {
  id: string
  editionId: string
  ordinal: number
  code: string
  name: string
  defaultScope: Scope
  defaultCategory: string
  scopeAgnostic: boolean
  unit: string
  kgCo2ePerUnit: number
  co2KgPerUnit: number | null
  ch4KgPerUnit: number | null
  ch4Fossil: boolean
  n2oKgPerUnit: number | null
  hfcsKgPerUnit: number | null
  pfcsKgPerUnit: number | null
  sf6KgPerUnit: number | null
  nf3KgPerUnit: number | null
  biogenicCo2KgPerUnit: number | null
  blendComposition: string | null
  blendGwpSource: string | null
  dataYear: number | null
  sourcePublication: string | null
  sourceUrl: string | null
  publicationYear: number | null
  sourceCategory: string | null
  sourceActivity: string | null
  sourceDetail: string | null
  co2eOnly: boolean
  approved: boolean
  notes: string | null
  reportingBasis: ReportingBasis
}

export interface FactorPackRowPage {
  items: FactorPackRow[]
  page: number
  size: number
  total: number
  categories: string[]
  activities: string[]
  units: string[]
}

/** One broken publication rule on one row, as the live report prints it. */
export interface FactorPackFinding {
  rule: string
  code: string
  message: string
}

export interface FactorPackRowFilter {
  sourceCategory?: string
  sourceActivity?: string
  unit?: string
  search?: string
  page?: number
  size?: number
}

export interface CreateFamilyInput {
  packKey: string
  name: string
  kind: FactorPackKind
  summary: string
}

export interface EditionInput {
  editionId?: string
  cloneFrom?: string | null
  name: string
  source: string
  sourceUrl: string
  publicationYear: number | null
  gwpBasis: string
  license: string
  retrieved: string
  notes: string
  appliesFrom: string | null
}

export type RowInput = Omit<FactorPackRow, 'id' | 'editionId' | 'ordinal'>

export function listFactorPacks(): Promise<FactorPackFamily[]> {
  return api<FactorPackFamily[]>('/api/admin/factor-packs')
}

export function createFactorPackFamily(input: CreateFamilyInput): Promise<FactorPackFamily> {
  return api<FactorPackFamily>('/api/admin/factor-packs', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function createFactorPackEdition(
  packKey: string,
  input: EditionInput,
): Promise<FactorPackEdition> {
  return api<FactorPackEdition>(`/api/admin/factor-packs/${packKey}/editions`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getFactorPackEdition(editionId: string): Promise<FactorPackEdition> {
  return api<FactorPackEdition>(`/api/admin/factor-packs/editions/${editionId}`)
}

export function updateFactorPackEdition(
  editionId: string,
  input: EditionInput,
): Promise<FactorPackEdition> {
  return api<FactorPackEdition>(`/api/admin/factor-packs/editions/${editionId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteFactorPackEdition(editionId: string): Promise<void> {
  return api<void>(`/api/admin/factor-packs/editions/${editionId}`, { method: 'DELETE' })
}

export function listFactorPackRows(
  editionId: string,
  filter: FactorPackRowFilter = {},
): Promise<FactorPackRowPage> {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== '') query.set(key, String(value))
  }
  const suffix = query.toString() ? `?${query}` : ''
  return api<FactorPackRowPage>(`/api/admin/factor-packs/editions/${editionId}/rows${suffix}`)
}

export function createFactorPackRow(editionId: string, input: RowInput): Promise<FactorPackRow> {
  return api<FactorPackRow>(`/api/admin/factor-packs/editions/${editionId}/rows`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateFactorPackRow(
  editionId: string,
  rowId: string,
  input: RowInput,
): Promise<FactorPackRow> {
  return api<FactorPackRow>(`/api/admin/factor-packs/editions/${editionId}/rows/${rowId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteFactorPackRow(editionId: string, rowId: string): Promise<void> {
  return api<void>(`/api/admin/factor-packs/editions/${editionId}/rows/${rowId}`, {
    method: 'DELETE',
  })
}

export function getFactorPackValidation(editionId: string): Promise<FactorPackFinding[]> {
  return api<FactorPackFinding[]>(`/api/admin/factor-packs/editions/${editionId}/validation`)
}

/** Stores the source document the edition is published against; the server computes the SHA-256. */
export function uploadFactorPackEvidence(
  editionId: string,
  file: File,
): Promise<FactorPackEvidence> {
  const body = new FormData()
  body.append('file', file)
  return api<FactorPackEvidence>(`/api/admin/factor-packs/editions/${editionId}/evidence`, {
    method: 'POST',
    body,
  })
}

export function getFactorPackBlastRadius(editionId: string): Promise<BlastRadius> {
  return api<BlastRadius>(`/api/admin/factor-packs/editions/${editionId}/blast-radius`)
}

export function listFactorPackChanges(editionId: string): Promise<FactorPackChange[]> {
  return api<FactorPackChange[]>(`/api/admin/factor-packs/editions/${editionId}/changes`)
}

export function listFactorPackEvents(editionId: string): Promise<FactorPackEvent[]> {
  return api<FactorPackEvent[]>(`/api/admin/factor-packs/editions/${editionId}/events`)
}

export function publishFactorPackEdition(
  editionId: string,
  input: PublishInput,
): Promise<FactorPackEdition> {
  return api<FactorPackEdition>(`/api/admin/factor-packs/editions/${editionId}/publish`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function withdrawFactorPackEdition(
  editionId: string,
  reason: string,
): Promise<FactorPackEdition> {
  return api<FactorPackEdition>(`/api/admin/factor-packs/editions/${editionId}/withdraw`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

/* The administration panel's landing figures and the deployment's policy (spec 01.5). */

/** The accounts half, from the `user` module. */
export interface AccountsSummary {
  usersTotal: number
  usersActive: number
  usersPending: number
  administrators: number
  accessRequestsPending: number
}

/** A draft edition waiting for an approver who is not its curator (spec 02.5). */
export interface SummaryDraftEdition {
  editionId: string
  packKey: string
  name: string
  curatorEmail: string | null
  rowCount: number
  /** False when the caller curated it, so the queue never offers work publication would refuse. */
  mayApprove: boolean
}

/** One support grant, live or closed in the last 30 days: the privileged-access register. */
export interface SummaryGrant {
  organizationId: string
  organizationName: string
  /** Null when the organization has since been removed. */
  organizationAccountNo: number | null
  adminEmail: string
  reason: string
  grantedAt: string
  expiresAt: string
  endedAt: string | null
  /** Whether the caller is the administrator holding it. */
  mine: boolean
}

export interface SummaryActivity {
  at: string
  action: string
  actor: string
  subject: string
}

/**
 * The platform half, from the `ghg` module. It carries no tenant inventory
 * data: `openNotices` is a bare total across the platform, never a list
 * naming which organization has an undecided methodology change (spec 01.5).
 */
export interface PlatformSummary {
  organizations: number
  packFamilies: number
  publishedEditions: number
  draftEditionCount: number
  withdrawnEditions: number
  openNotices: number
  draftEditions: SummaryDraftEdition[]
  grants: SummaryGrant[]
  recentActivity: SummaryActivity[]
}

export type OrganizationCreation = 'EVERYONE' | 'ADMINISTRATORS'

export interface PlatformSettings {
  supportAccessWindowHours: number
  organizationCreation: OrganizationCreation
  updatedAt: string
  updatedBy: string | null
}

export interface PlatformSettingsInput {
  supportAccessWindowHours: number
  organizationCreation: OrganizationCreation
  reason: string
}

export interface PlatformSettingChange {
  setting: string
  oldValue: string
  newValue: string
  reason: string
  actorEmail: string
  changedAt: string
}

export function getAccountsSummary(): Promise<AccountsSummary> {
  return api<AccountsSummary>('/api/admin/summary/accounts')
}

export function getPlatformSummary(): Promise<PlatformSummary> {
  return api<PlatformSummary>('/api/admin/summary/platform')
}

export function getPlatformSettings(): Promise<PlatformSettings> {
  return api<PlatformSettings>('/api/admin/settings')
}

export function updatePlatformSettings(input: PlatformSettingsInput): Promise<PlatformSettings> {
  return api<PlatformSettings>('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function listPlatformSettingChanges(): Promise<PlatformSettingChange[]> {
  return api<PlatformSettingChange[]>('/api/admin/settings/history')
}
