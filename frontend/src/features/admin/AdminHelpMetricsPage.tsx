import { formatDate, formatDateTime } from '../../lib/dates'
import { useState } from 'react'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import { FilterSelect } from '../../components/FilterRow'
import { PageHeader } from '../../components/PageHeader'
import { Panel } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { Table, TableFooter, Td, Th, TwoLine } from '../../components/Table'
import { Tabs } from '../../components/Tabs'
import { manifest } from '../help/manifest'
import { useHelpFeedbackQuery, useHelpPagesQuery, useHelpSearchMissesQuery } from './useHelpMetrics'
import type { HelpFeedbackReason, HelpPageStat } from './api'

/** The helpful rate an article is expected to reach once enough readers have judged it (spec 09). */
const target = 0.8

/** Under this many votes a rate is noise, so the row is not marked (spec 09). */
const minimumVotes = 5

type VoteTab = 'all' | 'unhelpful'

const reasonSaid: Record<HelpFeedbackReason, string> = {
  NOT_ACCURATE: 'Not accurate',
  NOT_CLEAR: 'Not clear',
  NOT_RELEVANT: 'Not relevant',
}

/** The article's title; the slug itself when the article has since been removed from the help. */
function titleOf(slug: string): string {
  return manifest.pages[slug]?.title ?? slug
}

function percent(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

function underTarget(page: HelpPageStat): boolean {
  return page.votes >= minimumVotes && page.helpfulRate < target
}

/** Worst first: the lowest rate, and among equals the one more readers judged. */
function byRateThenVotes(a: HelpPageStat, b: HelpPageStat): number {
  return a.helpfulRate - b.helpfulRate || b.votes - a.votes
}

function Loading({ label }: { label: string }) {
  return (
    <div aria-label={label} className="flex flex-col gap-2 p-4">
      <Skeleton className="h-8" />
      <Skeleton className="h-8" />
    </div>
  )
}

function Failed({ what }: { what: string }) {
  return (
    <p className="p-10 text-center text-sm text-ink-muted">
      {what} could not be loaded. Reload to try again.
    </p>
  )
}

function Empty({ children }: { children: string }) {
  return <p className="p-10 text-center text-sm text-ink-muted">{children}</p>
}

/** A table's last row keeps no hairline under it; the panel's edge is the rule. */
const flush = '[&_tbody_tr:last-child>td]:border-b-0'

const crumbs = [{ label: 'Administration' }, { label: 'Help metrics' }]

/**
 * Whether the help works (spec 09): every article with votes against the
 * target line, the votes and their comments, and the searches that found
 * nothing. Nothing here names a reader; a vote carries no account.
 *
 * The section titles sit above their panels (spec 10's section title), so a
 * reader, and the tests, reach each table from its heading.
 */
export function AdminHelpMetricsPage() {
  const [tab, setTab] = useState<VoteTab>('all')
  const [slug, setSlug] = useState('')

  const pagesQuery = useHelpPagesQuery()
  const feedbackQuery = useHelpFeedbackQuery({
    slug: slug || undefined,
    helpful: tab === 'unhelpful' ? false : undefined,
  })
  const missesQuery = useHelpSearchMissesQuery()

  const pages = [...(pagesQuery.data ?? [])].sort(byRateThenVotes)
  // every comment rides on a vote, so the articles with votes are the ones a comment can belong to
  const articles = [...pages].sort((a, b) => titleOf(a.pageSlug).localeCompare(titleOf(b.pageSlug)))
  const votes = feedbackQuery.data?.pages.flatMap((page) => page.items) ?? []
  const total = feedbackQuery.data?.pages[0]?.total ?? 0
  const misses = missesQuery.data ?? []

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        crumbs={crumbs}
        title="Help metrics"
        subtitle={`What readers make of the help: each article against the ${percent(target)} helpful target, the comments they left, and the searches that found nothing.`}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Pages</h2>
        <Panel>
          {pagesQuery.isPending && <Loading label="Loading the pages" />}
          {pagesQuery.isError && <Failed what="The pages" />}
          {pagesQuery.data && pages.length === 0 && <Empty>No article has a vote yet.</Empty>}
          {pages.length > 0 && (
            <Table className={flush}>
              <thead>
                <tr>
                  <Th>Article</Th>
                  <Th align="right">Votes</Th>
                  <Th align="right">Helpful</Th>
                  <Th>Last vote</Th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => {
                  const marked = underTarget(page)
                  return (
                    <tr key={page.pageSlug} data-under-target={marked || undefined}>
                      <Td>
                        <TwoLine primary={titleOf(page.pageSlug)} secondary={page.pageSlug} />
                      </Td>
                      <Td align="right">{page.votes}</Td>
                      <Td align="right">
                        <span className="inline-flex items-center gap-2">
                          {percent(page.helpfulRate)}
                          {marked && <Chip tone="warning">Under target</Chip>}
                        </span>
                      </Td>
                      <Td className="whitespace-nowrap text-ink-muted">
                        {formatDate(page.lastVoteAt)}
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </Panel>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Comments</h2>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Tabs
            label="Votes"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'all', label: 'All' },
              { value: 'unhelpful', label: 'Not helpful' },
            ]}
          />
          <FilterSelect
            label="Article"
            className="w-full max-w-72"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          >
            <option value="">All articles</option>
            {articles.map((page) => (
              <option key={page.pageSlug} value={page.pageSlug}>
                {titleOf(page.pageSlug)}
              </option>
            ))}
          </FilterSelect>
        </div>
        <Panel>
          {feedbackQuery.isPending && <Loading label="Loading the comments" />}
          {feedbackQuery.isError && <Failed what="The comments" />}
          {feedbackQuery.data && votes.length === 0 && (
            <Empty>
              {tab === 'unhelpful' || slug ? 'No vote matches.' : 'Nobody has voted yet.'}
            </Empty>
          )}
          {votes.length > 0 && (
            <>
              <Table>
                <thead>
                  <tr>
                    <Th>Vote</Th>
                    <Th>Comment</Th>
                    <Th>Article</Th>
                    <Th>When</Th>
                  </tr>
                </thead>
                <tbody>
                  {votes.map((vote) => (
                    <tr key={vote.id} className="align-top">
                      <Td className="whitespace-nowrap align-top">
                        <TwoLine
                          primary={vote.helpful ? 'Yes' : 'No'}
                          secondary={vote.reason ? reasonSaid[vote.reason] : undefined}
                        />
                      </Td>
                      <Td className="align-top">
                        {vote.comment ?? <span className="text-ink-muted">No comment</span>}
                      </Td>
                      <Td className="align-top">
                        <TwoLine primary={titleOf(vote.pageSlug)} secondary={vote.pageSlug} />
                      </Td>
                      <Td className="whitespace-nowrap align-top text-ink-muted">
                        {formatDateTime(vote.createdAt)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="px-4 pb-3.5">
                <TableFooter
                  pager={
                    feedbackQuery.hasNextPage ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        busy={feedbackQuery.isFetchingNextPage}
                        onClick={() => feedbackQuery.fetchNextPage()}
                      >
                        Load more
                      </Button>
                    ) : undefined
                  }
                >
                  Showing {votes.length} of {total}
                </TableFooter>
              </div>
            </>
          )}
        </Panel>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl">Searches with no result</h2>
        <Panel>
          {missesQuery.isPending && <Loading label="Loading the searches" />}
          {missesQuery.isError && <Failed what="The searches" />}
          {missesQuery.data && misses.length === 0 && (
            <Empty>Every search so far has found something.</Empty>
          )}
          {misses.length > 0 && (
            <Table className={flush}>
              <thead>
                <tr>
                  <Th>Query</Th>
                  <Th align="right">Count</Th>
                  <Th>Last seen</Th>
                  <Th align="right">
                    <span className="sr-only">Run it</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {misses.map((miss) => (
                  <tr key={miss.query}>
                    <Td className="font-medium">{miss.query}</Td>
                    <Td align="right">{miss.count}</Td>
                    <Td className="whitespace-nowrap text-ink-muted">
                      {formatDate(miss.lastSeen)}
                    </Td>
                    <Td align="right">
                      <a
                        href={`/help/search?q=${encodeURIComponent(miss.query)}`}
                        target="_blank"
                        rel="noopener"
                        className="text-sm font-medium text-link hover:underline"
                      >
                        Open search
                      </a>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      </section>
    </div>
  )
}
