import { Button } from '../../../components/Button'
import { GlassCard } from '../../../components/GlassCard'
import { Skeleton } from '../../../components/Skeleton'
import { useToast } from '../../../components/toast'
import { problemDetail } from '../../../lib/api'
import {
  useAccessRequestsQuery,
  useApproveAccessRequest,
  useDenyAccessRequest,
} from '../useAccessRequests'
import type { AccessRequest } from '../api'

/** The admin queue of spec 002: pending access requests with approve/deny. */
export function AccessRequestsSection() {
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
            ? `${request.displayName} approved — setup email sent.`
            : `${request.displayName} denied.`,
        ),
      onError: (error) =>
        toast(problemDetail(error) ?? `Could not ${action} ${request.displayName}.`, 'error'),
    })
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg">Access requests</h2>
        {pending.length > 0 && (
          <span className="rounded-full bg-teal-deep px-2 py-0.5 text-xs font-bold text-white">
            {pending.length}
          </span>
        )}
      </div>

      <GlassCard className="overflow-x-auto">
        {requestsQuery.isPending && (
          <div aria-label="Loading access requests" className="flex flex-col gap-2 p-4">
            <Skeleton className="h-8" />
          </div>
        )}
        {requestsQuery.data && pending.length === 0 && (
          <p className="p-6 text-sm text-ink-muted">No pending requests.</p>
        )}
        {pending.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Requested</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {pending.map((request) => (
                <tr key={request.id} className="border-b border-teal/5 last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-medium">{request.displayName}</span>
                    {request.company && (
                      <span className="block text-xs text-ink-muted">{request.company}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{request.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button
                      className="px-3 py-1 text-xs"
                      onClick={() => decide(request, 'approve')}
                      disabled={approve.isPending || deny.isPending}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      className="ml-2 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => decide(request, 'deny')}
                      disabled={approve.isPending || deny.isPending}
                    >
                      Deny
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </section>
  )
}
