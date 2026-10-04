import { PageHeader } from '../../components/PageHeader'
import { Panel, PanelHead } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { StatusDot } from '../../components/StatusDot'
import type { StatusTone } from '../../components/StatusDot'
import { Table, Td, Th } from '../../components/Table'
import { AccessRequestsSection } from './components/AccessRequestsSection'
import { useAccessRequestsQuery } from './useAccessRequests'
import type { AccessRequest } from './api'

function when(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : ''
}

const outcome: Record<string, string> = {
  APPROVED: 'Approved, waiting for the password to be set',
  COMPLETED: 'Approved, account active',
  DENIED: 'Denied',
}

const outcomeTones: Record<string, StatusTone> = {
  APPROVED: 'warning',
  COMPLETED: 'success',
  DENIED: 'neutral',
}

const crumbs = [{ label: 'Administration' }, { label: 'Access requests' }]

/**
 * The access-request queue and the record behind it (specs 01.1, 01.5).
 *
 * The decided requests were already in the response and thrown away by the
 * pending filter. Showing them makes the page a record of who was let in and
 * who was not, rather than a queue that empties into nothing.
 */
export function AdminAccessRequestsPage() {
  const requestsQuery = useAccessRequestsQuery()
  const decided = (requestsQuery.data ?? []).filter((request) => request.status !== 'PENDING')

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        crumbs={crumbs}
        title="Access requests"
        subtitle="Approving one creates the account at once in the pending state and sends a link to set a password. Nobody signs in until they have set it."
      />

      <AccessRequestsSection />

      <Panel>
        <PanelHead title="Already decided" />
        {requestsQuery.isPending && (
          <div aria-label="Loading decided requests" className="flex flex-col gap-2 p-4">
            <Skeleton className="h-8" />
          </div>
        )}
        {requestsQuery.data && decided.length === 0 && (
          <p className="p-6 text-sm text-ink-muted">Nothing has been decided yet.</p>
        )}
        {decided.length > 0 && (
          <Table className="[&_tbody_tr:last-child>td]:border-b-0">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Company</Th>
                <Th>Outcome</Th>
                <Th>Decided</Th>
              </tr>
            </thead>
            <tbody>
              {decided.map((request: AccessRequest) => (
                <tr key={request.id}>
                  <Td className="font-medium">{request.displayName}</Td>
                  <Td className="text-ink-muted">{request.email}</Td>
                  <Td className="text-ink-muted">{request.company ?? ''}</Td>
                  <Td>
                    <StatusDot tone={outcomeTones[request.status] ?? 'neutral'}>
                      {outcome[request.status] ?? request.status}
                    </StatusDot>
                  </Td>
                  <Td className="whitespace-nowrap text-ink-muted">{when(request.decidedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </div>
  )
}
