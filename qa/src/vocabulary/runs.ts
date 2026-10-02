/**
 * Shared lookups of the run vocabulary: an inventory's runs by number, a
 * run's lines and exclusions, its report, and the exports as text (specs 05.1,
 * 05.2, 07, 07.5).
 */
import type { ApiContext, ApiSession } from './contract.ts'
import { inventory, type InventoryRow } from './inventories.ts'
import type { OrgRow } from './organizations.ts'

export interface RunRow {
  id: string
  runNo: number
  label: string
  activityCount: number
  totalKgCo2e: number
  scope2MarketBasedKgCo2e: number | null
  byGas: { hfcsKg: number | null; co2eUnsplitKg: number | null } | null
  isFinal: boolean
  voided: boolean
  voidedBy: string | null
  voidReason: string | null
  boundaryVersionNo: number | null
}

export interface RunLine {
  recordRef: string | null
  activityType: string
  factorName: string
  proxy: boolean
  proxyJustification: string | null
  densityMaterial: string | null
  conversionNote: string | null
  scope: string
  category: string | null
  kgCo2e: number
  periodShare: number | null
  derivedFromLineId: string | null
  coveredDays: number | null
  periodDays: number | null
}

export interface RunExclusion {
  recordRef: string
  exclusionReason: string
  exclusionDetail: string | null
  estimateState: string | null
}

export interface RunDetail {
  run: RunRow
  lines: RunLine[]
  exclusions: RunExclusion[]
}

export interface Report {
  run: RunRow
  header: { approvedBy: string | null; publishedBy: string | null; version: number; supersedes: string[]; supersededBy: string | null; finalDesignatedBy: string | null; finalNote: string | null }
  intensity: Array<{ name: string; value: number; unit: string; tCo2ePerUnit: number }>
  dataQuality: { statement: string; uncertaintyStatement: string | null; weightedUncertaintyPercent: number | null }
  methodology: { statement: string | null; factorSources: string[] }
  correction: { addedLines: number; removedLines: number; changedLines: number } | null
  byGas: Array<{ gas: string; kg: number | null; kgCo2e: number }>
}

async function get<T>(session: ApiSession, path: string): Promise<T> {
  const out = await session.get(path)
  if (!out.ok) throw new Error(`GET ${path} answered ${out.status}`)
  return out.body as T
}

export const runs = (session: ApiSession, inventoryId: string) => get<RunRow[]>(session, `/api/ghg/inventories/${inventoryId}/runs`)

/** The run numbered so under the inventory ("Run 001" or 1). */
export async function run(ctx: ApiContext, orgRef: string, inventoryName: string, ref: string | number): Promise<{ org: OrgRow; inv: InventoryRow; run: RunRow }> {
  const { org, inv } = await inventory(ctx, orgRef, inventoryName)
  const runNo = typeof ref === 'number' ? ref : Number(/(\d+)\s*$/.exec(ref)?.[1] ?? NaN)
  const found = (await runs(ctx.session(), inv.id)).find((r) => r.runNo === runNo || r.label === ref)
  if (!found) throw new Error(`no run '${ref}' under ${inventoryName}`)
  return { org, inv, run: found }
}

export const runLabel = (runNo: number) => `Run ${String(runNo).padStart(3, '0')}`

export const runDetail = (session: ApiSession, runId: string) => get<RunDetail>(session, `/api/ghg/runs/${runId}`)
export const report = (session: ApiSession, runId: string) => get<Report>(session, `/api/ghg/runs/${runId}/report`)

/** An export as text: lines.csv, exclusions.csv, inputs.json (the PDF is binary and read by a person). */
export async function exportText(session: ApiSession, runId: string, file: string): Promise<string> {
  const out = await session.get(`/api/ghg/runs/${runId}/${file}`)
  if (!out.ok) throw new Error(`GET ${file} answered ${out.status}`)
  return typeof out.body === 'string' ? out.body : JSON.stringify(out.body)
}

/** A CSV as rows keyed by the header, quotes and embedded commas honoured. */
export function csvRows(text: string): Array<Record<string, string>> {
  const lines: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      lines.push(row)
      row = []
      cell = ''
    } else cell += c
  }
  if (cell !== '' || row.length) {
    row.push(cell)
    lines.push(row)
  }
  const [header, ...rest] = lines.filter((l) => l.length > 1 || (l[0] ?? '') !== '')
  if (!header) return []
  return rest.map((cells) => Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ''])))
}
