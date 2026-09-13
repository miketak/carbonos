import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { AdoptionDiffDrawer } from './components/AdoptionDiffDrawer'
import { formatCo2e, formatDateTime } from './format'
import { useFactorPackNoticesQuery, useOrganizationQuery } from './useGhg'
import type { FactorPackNotice, FactorPackNoticeStatus } from './api'

const statusStyles: Record<FactorPackNoticeStatus, string> = {
  OPEN: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-accent-green/25 text-dark-teal',
  DECLINED: 'bg-slate-200 text-slate-600',
  WITHDRAWN: 'bg-slate-200 text-slate-600',
}

const statusLabels: Record<FactorPackNoticeStatus, string> = {
  OPEN: 'Waiting on you',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  WITHDRAWN: 'Withdrawn by the publisher',
}

function movement(kg: number | null): string {
  if (kg == null) return 'not estimated'
  return `${kg > 0 ? '+' : ''}${formatCo2e(kg)}`
}

/**
 * The organization's factor pack updates (spec 02.7). Publishing a new edition
 * of a pack the organization holds raises one notice and changes nothing:
 * every factor value, every assignment and every run total is the same the
 * moment after a publication as the moment before. Adopting an edition is an
 * accounting decision, and this page is where the organization makes it.
 */
export function FactorPackUpdatesPage() {
  const { organizationId = '' } = useParams()
  const noticesQuery = useFactorPackNoticesQuery(organizationId)
  const organizationQuery = useOrganizationQuery(organizationId)
  const [openNotice, setOpenNotice] = useState<FactorPackNotice | null>(null)

  const notices = noticesQuery.data ?? []
  const myRole = organizationQuery.data?.myRole
  const selected = openNotice
    ? (notices.find((notice) => notice.id === openNotice.id) ?? openNotice)
    : null

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl">Updates</h1>
        <p className="text-sm text-ink-muted">
          New editions of the emission factor packs you hold. Publishing one changes none of your
          numbers: moving to a new factor vintage is your decision, and it is recorded here.
        </p>
      </div>

      <GlassCard className="animate-fade-up p-6">
        {noticesQuery.isPending && (
          <div aria-label="Loading updates" className="flex flex-col gap-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        )}

        {noticesQuery.isSuccess && notices.length === 0 && (
          <div className="py-6 text-center">
            <h2 className="text-lg">No updates waiting</h2>
            <p className="mt-1 text-sm text-ink-muted">
              When a new edition of a pack you hold is published, it appears here with the per-row
              diff and the movement it would make.
            </p>
          </div>
        )}

        {notices.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <caption className="sr-only">Factor pack updates</caption>
              <thead className="text-xs text-ink-muted">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Edition
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Raised
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Rows affected
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Moving over 5%
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Estimated movement
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {notices.map((notice) => (
                  <tr key={notice.id} className="border-t border-teal/10 align-top">
                    <th scope="row" className="py-2 pr-3 text-left font-normal">
                      <span className="font-semibold">{notice.editionName}</span>
                      <span className="block font-mono text-xs text-ink-muted">
                        {notice.editionId}
                        {notice.predecessorEditionId
                          ? ` · in place of ${notice.predecessorEditionId}`
                          : ''}
                      </span>
                    </th>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {formatDateTime(notice.raisedAt)}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{notice.rowsAffected}</td>
                    <td className="py-2 pr-3 tabular-nums">{notice.rowsOverThreshold}</td>
                    <td className="py-2 pr-3 tabular-nums">
                      {movement(notice.estimatedKgCo2eDelta)}
                    </td>
                    <td className="py-2 pr-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${statusStyles[notice.status]}`}
                      >
                        {statusLabels[notice.status]}
                      </span>
                      {notice.status === 'WITHDRAWN' && notice.withdrawalReason && (
                        <span className="mt-1 block text-xs text-ink-muted">
                          {notice.withdrawalReason}
                        </span>
                      )}
                      {notice.decidedBy && (
                        <span className="mt-1 block text-xs text-ink-muted">
                          by {notice.decidedBy}
                        </span>
                      )}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        aria-label={`${notice.status === 'OPEN' ? 'Review' : 'View'} ${notice.editionName}`}
                        onClick={() => setOpenNotice(notice)}
                        className="rounded-lg px-3 py-1.5 text-sm font-semibold text-link transition-colors duration-150 hover:bg-teal/10 focus-visible:ring-2 focus-visible:ring-bright-teal focus-visible:outline-none"
                      >
                        {notice.status === 'OPEN' ? 'Review' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {selected && (
        <AdoptionDiffDrawer
          organizationId={organizationId}
          notice={selected}
          myRole={myRole}
          onClose={() => setOpenNotice(null)}
        />
      )}
    </section>
  )
}
