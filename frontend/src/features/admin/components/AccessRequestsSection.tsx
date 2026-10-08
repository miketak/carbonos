import { formatDate, useDateFormat } from '../../../lib/dates'
import { Button } from '../../../components/Button'
import { Panel, PanelHead } from '../../../components/Panel'
import { Skeleton } from '../../../components/Skeleton'
import { Table, Td, Th, TwoLine } from '../../../components/Table'
import { useToast } from '../../../components/toast'
import { problemDetail } from '../../../lib/api'
import {
  useAccessRequestsQuery,
  useApproveAccessRequest,
  useDenyAccessRequest,
} from '../useAccessRequests'
import type { AccessRequest } from '../api'

/**
 * The queue of spec 01.1: pending access requests with approve and deny. The
 * page it sits on carries the heading and the sidebar carries the count
 * (spec 01.5), so it renders neither.
 */
/** How the landing page's buttons read in the queue (spec 01.1). */
const INTENT_LABEL: Record<string, string> = {
  PILOT: 'Asked about the pilot',
  LICENCE: 'Asked for a licence',
  TALK: 'Wants to talk to ECORIV',
}

/** The company, what the visitor asked for and their own words, on one meta line. */
function requestMeta(request: AccessRequest): string | undefined {
  const parts = [
    request.company,
    request.intent && request.intent !== 'ACCESS' ? INTENT_LABEL[request.intent] : null,
    request.message ? `“${request.message}”` : null,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : undefined
}

export function AccessRequestsSection() {
  const dateFormat = useDateFormat()
  const requestsQuery = useAccessRequestsQuery()
  const approve = useApproveAccessRequest()
  const deny = useDenyAccessRequest()
  const toast = useToast()

  const pending = requestsQuery.data?.filter((request) => request.status === 'PENDING') ?? []

  const decide = (request: AccessRequest, action: 'approve' | 'deny') => {
    const mutation = action === 'approve' ? approve : deny
    mutation.mutate(request.id, {
      onSuccess: () =>
        toast(
          action === 'approve'
            ? `${request.displayName} approved; setup email sent.`
            : `${request.displayName} denied.`,
        ),
      onError: (error) =>
        toast(problemDetail(error) ?? `Could not ${action} ${request.displayName}.`, 'error'),
    })
  }

  return (
    <Panel>
      <PanelHead title="Waiting for a decision" />
      {requestsQuery.isPending && (
        <div aria-label="Loading access requests" className="flex flex-col gap-2 p-4">
          <Skeleton className="h-8" />
        </div>
      )}
      {requestsQuery.data && pending.length === 0 && (
        <p className="p-6 text-sm text-ink-muted">No pending requests.</p>
      )}
      {pending.length > 0 && (
        <Table className="[&_tbody_tr:last-child>td]:border-b-0">
          <thead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Requested</Th>
              <Th align="right">
                <span className="sr-only">Decision</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {pending.map((request) => (
              <tr key={request.id}>
                <Td>
                  <TwoLine primary={request.displayName} secondary={requestMeta(request)} />
                </Td>
                <Td className="text-ink-muted">{request.email}</Td>
                <Td className="whitespace-nowrap text-ink-muted">
                  {formatDate(request.createdAt, dateFormat)}
                </Td>
                <Td align="right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="sm"
                      onClick={() => decide(request, 'approve')}
                      disabled={approve.isPending || deny.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => decide(request, 'deny')}
                      disabled={approve.isPending || deny.isPending}
                    >
                      Deny
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Panel>
  )
}
