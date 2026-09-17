import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type {
  ActivityCategory,
  AssignmentQuery,
  AssignmentStatus,
  GhgScope,
  LeaseType,
} from './api'

/** The workbench's tabs, in the order the work happens (spec 05.6). */
export type InventoryTab = 'records' | 'boundary' | 'method' | 'runs' | 'report'

export interface InventoryFilters {
  tab: InventoryTab
  q: string
  facility: string
  status: AssignmentStatus | ''
  scope: GhgScope | ''
  category: ActivityCategory | ''
  stream: string
  lease: LeaseType | ''
  page: number
  /** The record open in the drawer: an assignment id, or null. */
  record: string | null
}

export const PAGE_SIZE = 50

const tabs: InventoryTab[] = ['records', 'boundary', 'method', 'runs', 'report']
const statuses: AssignmentStatus[] = ['INCLUDED', 'EXCLUDED', 'UNCLASSIFIED']
const scopes: GhgScope[] = ['SCOPE_1', 'SCOPE_2', 'SCOPE_3']
const leases: LeaseType[] = [
  'FINANCE_LEASE_IN',
  'OPERATING_LEASE_IN',
  'FINANCE_LEASE_OUT',
  'OPERATING_LEASE_OUT',
]

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

/**
 * The workbench's tab, search, filters, page and open record, kept in the URL
 * (spec 05.6), as the activity register keeps its own (spec 04.6). A link
 * opens the same view: the preflight banner's "Resolve" is a link, a reload
 * keeps the filter a reviewer was working under, and the back button steps
 * back through the view rather than off the page.
 *
 * Category is not clamped against a list. It is a long enum that grows with
 * the Scope 3 categories, and an unknown one simply returns nothing rather
 * than showing the wrong rows.
 */
export function useInventoryFilters() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo<InventoryFilters>(
    () => ({
      tab: pick(params.get('tab'), tabs, 'records'),
      q: params.get('q') ?? '',
      facility: params.get('facility') ?? '',
      status: pick(params.get('status'), [...statuses, ''] as const, ''),
      scope: pick(params.get('scope'), [...scopes, ''] as const, ''),
      category: (params.get('category') ?? '') as ActivityCategory | '',
      stream: params.get('stream') ?? '',
      lease: pick(params.get('lease'), [...leases, ''] as const, ''),
      page: Math.max(0, Number(params.get('page') ?? 0) || 0),
      record: params.get('record'),
    }),
    [params],
  )

  const set = useCallback(
    (patch: Partial<InventoryFilters>) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          const write = (key: string, value: string | number | null, blank: string) => {
            if (value === null || value === '' || String(value) === blank) next.delete(key)
            else next.set(key, String(value))
          }
          if (patch.tab !== undefined) write('tab', patch.tab, 'records')
          if (patch.q !== undefined) write('q', patch.q, '')
          if (patch.facility !== undefined) write('facility', patch.facility, '')
          if (patch.status !== undefined) write('status', patch.status, '')
          if (patch.scope !== undefined) write('scope', patch.scope, '')
          if (patch.category !== undefined) write('category', patch.category, '')
          if (patch.stream !== undefined) write('stream', patch.stream, '')
          if (patch.lease !== undefined) write('lease', patch.lease, '')
          if (patch.page !== undefined) write('page', patch.page, '0')
          if (patch.record !== undefined) write('record', patch.record, '')
          // a change of what is listed starts again from the first page
          const listChanged = Object.keys(patch).some((key) => key !== 'page' && key !== 'record')
          if (listChanged && patch.page === undefined) next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const query = useMemo<AssignmentQuery>(
    () => ({
      q: filters.q.trim() === '' ? undefined : filters.q.trim(),
      facilityId: filters.facility || undefined,
      status: filters.status || undefined,
      scope: filters.scope || undefined,
      category: filters.category || undefined,
      streamId: filters.stream || undefined,
      leaseType: filters.lease || undefined,
      page: filters.page,
      size: PAGE_SIZE,
    }),
    [filters],
  )

  return { filters, set, query }
}
