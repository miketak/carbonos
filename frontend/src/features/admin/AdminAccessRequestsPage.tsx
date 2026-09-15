import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
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
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl">Access requests</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Approving one creates the account at once in the pending state and sends a link to set a
          password. Nobody signs in until they have set it.
        </p>
      </div>

      <AccessRequestsSection />

      <h2 className="mt-8 mb-3 text-lg">Already decided</h2>
      <GlassCard className="overflow-x-auto">
        {requestsQuery.isPending && (
          <div aria-label="Loading decided requests" className="flex flex-col gap-2 p-4">
            <Skeleton className="h-8" />
          </div>
        )}
        {requestsQuery.data && decided.length === 0 && (
          <p className="p-6 text-sm text-ink-muted">Nothing has been decided yet.</p>
        )}
        {decided.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Outcome</th>
                <th className="px-4 py-3 font-semibold">Decided</th>
              </tr>
            </thead>
            <tbody>
              {decided.map((request: AccessRequest) => (
                <tr key={request.id} className="border-b border-teal/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{request.displayName}</td>
                  <td className="px-4 py-3 text-ink-muted">{request.email}</td>
                  <td className="px-4 py-3 text-ink-muted">{request.company ?? ''}</td>
                  <td className="px-4 py-3">{outcome[request.status] ?? request.status}</td>
                  <td className="px-4 py-3 text-ink-muted">{when(request.decidedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </div>
  )
}
