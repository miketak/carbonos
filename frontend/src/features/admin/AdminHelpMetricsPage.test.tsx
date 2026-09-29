import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { AdminHelpMetricsPage } from './AdminHelpMetricsPage'
import type { HelpFeedbackItem, HelpPageStat, HelpSearchMiss } from './api'

vi.mock('./api', () => ({
  listHelpPages: vi.fn(),
  listHelpFeedback: vi.fn(),
  listHelpSearchMisses: vi.fn(),
}))

import { listHelpFeedback, listHelpPages, listHelpSearchMisses } from './api'

// slugs from the compiled manifest, so the titles are the real ones; the last one has no article
const pages: HelpPageStat[] = [
  {
    pageSlug: 'get-started/import-the-factor-packs',
    votes: 12,
    helpful: 6,
    helpfulRate: 0.5,
    lastVoteAt: '2026-09-27T10:00:00Z',
  },
  {
    pageSlug: 'gone/removed-article',
    votes: 10,
    helpful: 9,
    helpfulRate: 0.9,
    lastVoteAt: '2026-09-20T10:00:00Z',
  },
  {
    pageSlug: 'get-started/meet-gye-nyame-gold',
    votes: 3,
    helpful: 1,
    helpfulRate: 0.33,
    lastVoteAt: '2026-09-26T10:00:00Z',
  },
]

const votes: HelpFeedbackItem[] = [
  {
    id: 'f1',
    pageSlug: 'get-started/import-the-factor-packs',
    helpful: false,
    reason: 'NOT_CLEAR',
    comment: 'Which pack is the Ghana grid one?',
    createdAt: '2026-09-27T10:00:00Z',
  },
  {
    id: 'f2',
    pageSlug: 'get-started/meet-gye-nyame-gold',
    helpful: true,
    reason: null,
    comment: null,
    createdAt: '2026-09-26T10:00:00Z',
  },
]

const misses: HelpSearchMiss[] = [
  {
    query: 'recalcuation rules',
    count: 4,
    firstSeen: '2026-09-01T00:00:00Z',
    lastSeen: '2026-09-27T00:00:00Z',
  },
]

beforeEach(() => {
  vi.mocked(listHelpPages).mockReset().mockResolvedValue(pages)
  vi.mocked(listHelpFeedback).mockReset().mockResolvedValue({ items: votes, total: votes.length })
  vi.mocked(listHelpSearchMisses).mockReset().mockResolvedValue(misses)
})

function renderPage() {
  return renderWithProviders(<AdminHelpMetricsPage />, { route: '/admin/help' })
}

function rowsOf(table: HTMLElement): HTMLElement[] {
  return within(table).getAllByRole('row').slice(1)
}

test('the pages table is worst first, titled from the manifest, and marks the ones under target', async () => {
  renderPage()

  const section = screen.getByRole('heading', { name: 'Pages' }).parentElement as HTMLElement
  const table = await within(section).findByRole('table')
  const rows = rowsOf(table)

  // lowest rate first; the removed article keeps its slug as its title
  expect(rows.map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual([
    'Meet Gye Nyame Goldget-started/meet-gye-nyame-gold',
    'Import the factor packsget-started/import-the-factor-packs',
    'gone/removed-articlegone/removed-article',
  ])
  expect(rows[1]).toHaveTextContent('50%')
  expect(within(rows[1]).getByText(/under target/i)).toBeInTheDocument()
  // three votes are too few to judge an article by, whatever the rate
  expect(within(rows[0]).queryByText(/under target/i)).not.toBeInTheDocument()
  expect(within(rows[2]).queryByText(/under target/i)).not.toBeInTheDocument()
})

test('the comments list reasons as words and the Not helpful tab narrows the request', async () => {
  const user = userEvent.setup()
  renderPage()

  expect(await screen.findByText(/which pack is the ghana grid one/i)).toBeInTheDocument()
  expect(screen.getByText('Not clear')).toBeInTheDocument()
  expect(screen.getByText('No comment')).toBeInTheDocument()
  expect(listHelpFeedback).toHaveBeenLastCalledWith({ page: 0, size: 50 })

  vi.mocked(listHelpFeedback).mockResolvedValue({ items: [votes[0]], total: 1 })
  await user.click(screen.getByRole('tab', { name: 'Not helpful' }))

  expect(await screen.findByText(/showing 1 of 1/i)).toBeInTheDocument()
  expect(listHelpFeedback).toHaveBeenLastCalledWith({ helpful: false, page: 0, size: 50 })
  expect(screen.queryByText('No comment')).not.toBeInTheDocument()

  await user.selectOptions(screen.getByRole('combobox', { name: 'Article' }), [
    'get-started/import-the-factor-packs',
  ])
  expect(listHelpFeedback).toHaveBeenLastCalledWith({
    slug: 'get-started/import-the-factor-packs',
    helpful: false,
    page: 0,
    size: 50,
  })
})

test('load more asks for the next page while the total says one exists', async () => {
  const user = userEvent.setup()
  vi.mocked(listHelpFeedback).mockResolvedValue({ items: [votes[0]], total: 2 })
  renderPage()

  await user.click(await screen.findByRole('button', { name: /load more/i }))

  expect(listHelpFeedback).toHaveBeenLastCalledWith({ page: 1, size: 50 })
})

test('each missed search links to the search that would run it', async () => {
  renderPage()

  expect(await screen.findByText('recalcuation rules')).toBeInTheDocument()
  const link = screen.getByRole('link', { name: /open search/i })
  expect(link).toHaveAttribute('href', '/help/search?q=recalcuation%20rules')
  expect(link).toHaveAttribute('target', '_blank')
})
