/** Shared lookups of the base year vocabulary: the designation and its candidates (specs 06, 06.1). */
import type { ApiContext, ApiSession } from './contract.ts'
import { organization } from './organizations.ts'

export interface Candidate {
  id: string
  triggerType: string
  reason: string
  boundaryVersionNo: number | null
  affectedPercent: number | null
  cumulativePercent: number | null
  aboveThreshold: boolean
  raisedBy: string | null
  status: 'FLAGGED' | 'RECALCULATED' | 'DECLINED' | 'SUPERSEDED'
  runId: string | null
  decisionNote: string | null
  decidedBy: string | null
}

export interface BaseYearRow {
  inventoryId: string
  inventoryName: string
  year: number
  thresholdPercent: number
  reason: string
  structuralChangeConvention: string
  baseRunId: string | null
  recalculations: Candidate[]
}

/** The organization's base year, or undefined when none is designated (204). */
export async function baseYear(session: ApiSession, orgId: string): Promise<BaseYearRow | undefined> {
  const out = await session.get(`/api/ghg/organizations/${orgId}/base-year`)
  if (out.status === 204) return undefined
  if (!out.ok) throw new Error(`GET base-year answered ${out.status}`)
  return out.body as BaseYearRow
}

/** The newest candidate whose reason contains the text. */
export async function candidate(ctx: ApiContext, orgRef: string, containing: string): Promise<{ baseYear: BaseYearRow; candidate: Candidate }> {
  const org = await organization(ctx, orgRef)
  const by = await baseYear(ctx.session(), org.id)
  if (!by) throw new Error(`${orgRef} has no base year`)
  const hits = by.recalculations.filter((c) => c.reason.includes(containing))
  const hit = hits.at(-1)
  if (!hit) throw new Error(`no candidate containing "${containing}"; candidates: ${by.recalculations.map((c) => `${c.status} ${c.reason}`).join(' | ')}`)
  return { baseYear: by, candidate: hit }
}
