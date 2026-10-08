import { useDateFormat } from '../../lib/dates'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { HelpLink } from '../../components/HelpLink'
import { PageHeader } from '../../components/PageHeader'
import { Panel } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { StatusDot } from '../../components/StatusDot'
import type { StatusTone } from '../../components/StatusDot'
import { Table, Td, Th, TwoLine } from '../../components/Table'
import { AdoptionDiffDrawer } from './components/AdoptionDiffDrawer'
import { formatCo2e, formatDateTime } from './format'
import { useFactorPackNoticesQuery, useOrganizationQuery } from './useGhg'
import type { FactorPackNotice, FactorPackNoticeStatus } from './api'

const statusTones: Record<FactorPackNoticeStatus, StatusTone> = {
  OPEN: 'warning',
  ACCEPTED: 'success',
  DECLINED: 'neutral',
  WITHDRAWN: 'neutral',
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
  const dateFormat = useDateFormat()
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
      <PageHeader
        back={{ to: `/app/ghg/${organizationId}` }}
        help={<HelpLink topic="editionNotice" />}
        title="Updates"
        subtitle="New editions of the emission factor packs you hold. Publishing one changes none of your numbers: moving to a new factor vintage is your decision, and it is recorded here."
      />

      {noticesQuery.isPending && (
        <div aria-label="Loading updates" className="flex flex-col gap-2">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
      )}

      {noticesQuery.isSuccess && notices.length === 0 && (
        <Panel className="p-10 text-center">
          <h2 className="text-lg font-semibold">No updates waiting</h2>
          <p className="mt-1 text-sm text-ink-muted">
            When a new edition of a pack you hold is published, it appears here with the per-row
            diff and the movement it would make.
          </p>
        </Panel>
      )}

      {notices.length > 0 && (
        <Table>
          <caption className="sr-only">Factor pack updates</caption>
          <thead>
            <tr>
              <Th scope="col">Edition</Th>
              <Th scope="col">Raised</Th>
              <Th scope="col" align="right">
                Rows affected
              </Th>
              <Th scope="col" align="right">
                Moving over 5%
              </Th>
              <Th scope="col" align="right">
                Estimated movement
              </Th>
              <Th scope="col">Status</Th>
              <Th scope="col" className="w-28">
                <span className="sr-only">Open</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {notices.map((notice) => (
              <tr key={notice.id}>
                <Td>
                  <TwoLine
                    primary={notice.editionName}
                    secondary={`${notice.editionId}${
                      notice.predecessorEditionId
                        ? ` · in place of ${notice.predecessorEditionId}`
                        : ''
                    }`}
                  />
                </Td>
                <Td className="whitespace-nowrap">{formatDateTime(notice.raisedAt, dateFormat)}</Td>
                <Td align="right">{notice.rowsAffected}</Td>
                <Td align="right">{notice.rowsOverThreshold}</Td>
                <Td
                  align="right"
                  className={notice.estimatedKgCo2eDelta == null ? 'text-ink-muted' : ''}
                >
                  {movement(notice.estimatedKgCo2eDelta)}
                </Td>
                <Td>
                  <div className="flex flex-col gap-0.5">
                    <StatusDot tone={statusTones[notice.status]}>
                      {statusLabels[notice.status]}
                    </StatusDot>
                    {notice.status === 'WITHDRAWN' && notice.withdrawalReason && (
                      <span className="text-[13px] text-ink-muted">{notice.withdrawalReason}</span>
                    )}
                    {notice.decidedBy && (
                      <span className="text-[13px] text-ink-muted">by {notice.decidedBy}</span>
                    )}
                  </div>
                </Td>
                <Td align="right">
                  <Button
                    variant={notice.status === 'OPEN' ? 'secondary' : 'ghost'}
                    size="sm"
                    aria-label={`${notice.status === 'OPEN' ? 'Review' : 'View'} ${notice.editionName}`}
                    onClick={() => setOpenNotice(notice)}
                  >
                    {notice.status === 'OPEN' ? 'Review' : 'View'}
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

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
