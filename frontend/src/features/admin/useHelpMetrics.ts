import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { listHelpFeedback, listHelpPages, listHelpSearchMisses } from './api'
import type { HelpFeedbackPage } from './api'

export const helpPagesKey = ['admin', 'help', 'pages'] as const

export const helpSearchMissesKey = ['admin', 'help', 'search-misses'] as const

export const feedbackPageSize = 50

export interface HelpFeedbackQueryFilter {
  slug?: string
  helpful?: boolean
}

export function useHelpPagesQuery() {
  return useQuery({ queryKey: helpPagesKey, queryFn: listHelpPages })
}

/**
 * The votes newest first, a page at a time. The server's `total` says whether
 * another page exists, so "Load more" can disappear the moment it would find
 * nothing.
 */
export function useHelpFeedbackQuery(filter: HelpFeedbackQueryFilter) {
  return useInfiniteQuery({
    queryKey: ['admin', 'help', 'feedback', filter] as const,
    queryFn: ({ pageParam }) =>
      listHelpFeedback({ ...filter, page: pageParam, size: feedbackPageSize }),
    initialPageParam: 0,
    getNextPageParam: (last: HelpFeedbackPage, all: HelpFeedbackPage[]) => {
      const loaded = all.reduce((count, page) => count + page.items.length, 0)
      return loaded < last.total ? all.length : undefined
    },
  })
}

export function useHelpSearchMissesQuery() {
  return useQuery({ queryKey: helpSearchMissesKey, queryFn: () => listHelpSearchMisses() })
}
