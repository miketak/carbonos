import { useState } from 'react'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
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

function onDay(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

function at(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
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

/**
 * Whether the help works (spec 09): every article with votes against the
 * target line, the votes and their comments, and the searches that found
 * nothing. Nothing here names a reader; a vote carries no account.
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
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-2xl">Help metrics</h1>
        <p className="mt-1 text-sm text-ink-muted">
          What readers make of the help: each article against the {percent(target)} helpful target,
          the comments they left, and the searches that found nothing.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg">Pages</h2>
        <GlassCard className="overflow-x-auto">
          {pagesQuery.isPending && <Loading label="Loading the pages" />}
          {pagesQuery.isError && <Failed what="The pages" />}
          {pagesQuery.data && pages.length === 0 && <Empty>No article has a vote yet.</Empty>}
          {pages.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                  <th className="px-4 py-3 font-semibold">Article</th>
                  <th className="px-4 py-3 text-right font-semibold">Votes</th>
                  <th className="px-4 py-3 text-right font-semibold">Helpful</th>
                  <th className="px-4 py-3 font-semibold">Last vote</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => {
                  const marked = underTarget(page)
                  return (
                    <tr
                      key={page.pageSlug}
                      data-under-target={marked || undefined}
                      className={`border-b border-teal/5 last:border-0 ${marked ? 'bg-amber-50/70' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <span className="block font-medium">{titleOf(page.pageSlug)}</span>
                        <span className="block text-xs text-ink-muted">{page.pageSlug}</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{page.votes}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {percent(page.helpfulRate)}
                        {marked && (
                          <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            Under target
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{onDay(page.lastVoteAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </GlassCard>
      </section>

      <section>
        <h2 className="mb-3 text-lg">Comments</h2>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <Tabs
            label="Votes"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'all', label: 'All' },
              { value: 'unhelpful', label: 'Not helpful' },
            ]}
          />
          <select
            aria-label="Article"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="max-w-72 rounded-lg border border-teal/20 bg-white/70 px-3 py-2 text-sm text-dark-teal focus:border-bright-teal focus:ring-2 focus:ring-bright-teal/40 focus:outline-none"
          >
            <option value="">All articles</option>
            {articles.map((page) => (
              <option key={page.pageSlug} value={page.pageSlug}>
                {titleOf(page.pageSlug)}
              </option>
            ))}
          </select>
        </div>
        <GlassCard className="overflow-x-auto">
          {feedbackQuery.isPending && <Loading label="Loading the comments" />}
          {feedbackQuery.isError && <Failed what="The comments" />}
          {feedbackQuery.data && votes.length === 0 && (
            <Empty>
              {tab === 'unhelpful' || slug ? 'No vote matches.' : 'Nobody has voted yet.'}
            </Empty>
          )}
          {votes.length > 0 && (
            <>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                    <th className="px-4 py-3 font-semibold">Vote</th>
                    <th className="px-4 py-3 font-semibold">Comment</th>
                    <th className="px-4 py-3 font-semibold">Article</th>
                    <th className="px-4 py-3 font-semibold">When</th>
                  </tr>
                </thead>
                <tbody>
                  {votes.map((vote) => (
                    <tr key={vote.id} className="border-b border-teal/5 align-top last:border-0">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="block font-medium">{vote.helpful ? 'Yes' : 'No'}</span>
                        {vote.reason && (
                          <span className="block text-xs text-ink-muted">
                            {reasonSaid[vote.reason]}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {vote.comment ?? <span className="text-ink-muted">No comment</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="block">{titleOf(vote.pageSlug)}</span>
                        <span className="block text-xs text-ink-muted">{vote.pageSlug}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                        {at(vote.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between gap-3 border-t border-teal/10 px-4 py-3 text-sm text-ink-muted">
                <span>
                  Showing {votes.length} of {total}
                </span>
                {feedbackQuery.hasNextPage && (
                  <Button
                    variant="ghost"
                    busy={feedbackQuery.isFetchingNextPage}
                    onClick={() => feedbackQuery.fetchNextPage()}
                  >
                    Load more
                  </Button>
                )}
              </div>
            </>
          )}
        </GlassCard>
      </section>

      <section>
        <h2 className="mb-3 text-lg">Searches with no result</h2>
        <GlassCard className="overflow-x-auto">
          {missesQuery.isPending && <Loading label="Loading the searches" />}
          {missesQuery.isError && <Failed what="The searches" />}
          {missesQuery.data && misses.length === 0 && (
            <Empty>Every search so far has found something.</Empty>
          )}
          {misses.length > 0 && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                  <th className="px-4 py-3 font-semibold">Query</th>
                  <th className="px-4 py-3 text-right font-semibold">Count</th>
                  <th className="px-4 py-3 font-semibold">Last seen</th>
                  <th className="px-4 py-3 font-semibold">
                    <span className="sr-only">Run it</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {misses.map((miss) => (
                  <tr key={miss.query} className="border-b border-teal/5 last:border-0">
                    <td className="px-4 py-3 font-medium">{miss.query}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{miss.count}</td>
                    <td className="px-4 py-3 text-ink-muted">{onDay(miss.lastSeen)}</td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/help/search?q=${encodeURIComponent(miss.query)}`}
                        target="_blank"
                        rel="noopener"
                        className="font-semibold text-link"
                      >
                        Open search
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GlassCard>
      </section>
    </div>
  )
}
