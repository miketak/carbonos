import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ActivityQuery, ActivityStatus } from './api'
import { monthBounds } from './format'

export type ActivityTab = 'all' | 'attention' | 'ready' | 'drafts'
export type ActivitySort = NonNullable<ActivityQuery['sort']>

export interface ActivityFilters {
  tab: ActivityTab
  q: string
  facility: string
  stream: string
  /** YYYY-MM, or empty for any period. */
  month: string
  sort: ActivitySort
  dir: 'asc' | 'desc'
  page: number
  /** The record open in the drawer: an id, "new", or null. */
  record: string | null
}

export const PAGE_SIZE = 50

const tabStatus: Record<ActivityTab, ActivityStatus | undefined> = {
  all: undefined,
  attention: 'NEEDS_ATTENTION',
  ready: 'READY',
  drafts: 'DRAFT',
}

const tabs: ActivityTab[] = ['all', 'attention', 'ready', 'drafts']
const sorts: ActivitySort[] = [
  'periodEnd',
  'periodStart',
  'facility',
  'activityType',
  'quantity',
  'createdAt',
  'recordNo',
]

function pick<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

/**
 * The register's tab, search, filters, sort, page and open record, kept in
 * the URL (spec 04.6): a link opens the same view, "Resolve n items" is a
 * link, and a source document points at its record with `?record=`.
 */
export function useActivityFilters() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo<ActivityFilters>(
    () => ({
      tab: pick(params.get('tab'), tabs, 'all'),
      q: params.get('q') ?? '',
      facility: params.get('facility') ?? '',
      stream: params.get('stream') ?? '',
      month: params.get('month') ?? '',
      sort: pick(params.get('sort'), sorts, 'periodEnd'),
      dir: params.get('dir') === 'asc' ? 'asc' : 'desc',
      page: Math.max(0, Number(params.get('page') ?? 0) || 0),
      record: params.get('record'),
    }),
    [params],
  )

  const set = useCallback(
    (patch: Partial<ActivityFilters>) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          const write = (key: string, value: string | number | null, blank: string) => {
            if (value === null || value === '' || String(value) === blank) next.delete(key)
            else next.set(key, String(value))
          }
          if (patch.tab !== undefined) write('tab', patch.tab, 'all')
          if (patch.q !== undefined) write('q', patch.q, '')
          if (patch.facility !== undefined) write('facility', patch.facility, '')
          if (patch.stream !== undefined) write('stream', patch.stream, '')
          if (patch.month !== undefined) write('month', patch.month, '')
          if (patch.sort !== undefined) write('sort', patch.sort, 'periodEnd')
          if (patch.dir !== undefined) write('dir', patch.dir, 'desc')
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

  const query = useMemo<ActivityQuery>(() => {
    const bounds = filters.month === '' ? undefined : monthBounds(filters.month)
    return {
      q: filters.q.trim() === '' ? undefined : filters.q.trim(),
      facilityId: filters.facility || undefined,
      streamId: filters.stream || undefined,
      from: bounds?.from,
      to: bounds?.to,
      status: tabStatus[filters.tab],
      sort: filters.sort,
      dir: filters.dir,
      page: filters.page,
      size: PAGE_SIZE,
    }
  }, [filters])

  return { filters, set, query }
}
