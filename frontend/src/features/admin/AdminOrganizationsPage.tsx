import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { TextAreaField } from '../../components/Field'
import { GlassCard } from '../../components/GlassCard'
import { Modal } from '../../components/Modal'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { fieldErrors, refusalMessage } from '../../lib/api'
import { useSession } from '../auth/useSession'
import { useLogout } from '../auth/useLogout'
import {
  useAdminOrganizationsQuery,
  useAssumeSupportAccess,
  useEndSupportAccess,
} from './useOrganizations'
import type { AdminOrganization } from './api'

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * The organizations on the platform, as support staff see them (spec 01.3):
 * owners, member count and whether the administrator holds access. No
 * inventory data. Access is assumed with a reason, lasts 24 hours, and is
 * recorded in the organization's own history for its owners to read.
 */
export function AdminOrganizationsPage() {
  const session = useSession()
  const signOut = useLogout()
  const organizationsQuery = useAdminOrganizationsQuery()
  const endAccess = useEndSupportAccess()
  const toast = useToast()
  const [assuming, setAssuming] = useState<AdminOrganization | null>(null)

  const organizations = organizationsQuery.data ?? []

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <div className="leading-none">
            <p className="bg-gradient-to-r from-teal to-accent-green bg-clip-text text-lg font-bold text-transparent">
              CarbonOS
            </p>
            <p className="mt-0.5 text-[10px] font-semibold tracking-[0.2em] text-ink-muted uppercase">
              by ECORIV
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/admin/users" className="text-sm font-semibold text-link">
              Manage users
            </Link>
            <span className="text-sm text-ink-muted">{session.data?.displayName}</span>
            <Button
              variant="ghost"
              className="px-3 py-1.5 text-sm"
              onClick={() => signOut.mutate()}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl">Organizations</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Client organizations are private to their members. To look inside one for a support
            case, assume access with a reason: it gives you an owner's rights for 24 hours, and the
            organization's owners see who took it and why.
          </p>
        </div>

        {organizationsQuery.isPending && (
          <div aria-label="Loading organizations" className="flex flex-col gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        )}

        {organizationsQuery.data?.length === 0 && (
          <GlassCard className="p-10 text-center">
            <h2 className="text-lg">No organizations yet</h2>
          </GlassCard>
        )}

        {organizations.length > 0 && (
          <GlassCard className="p-2">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                  <th className="px-3 py-2 font-semibold">Organization</th>
                  <th className="px-3 py-2 font-semibold">Owners</th>
                  <th className="px-3 py-2 font-semibold">Members</th>
                  <th className="px-3 py-2 font-semibold">Support access</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {organizations.map((organization) => (
                  <tr key={organization.id} className="border-b border-teal/5 last:border-0">
                    <td className="px-3 py-2 font-medium">{organization.name}</td>
                    <td className="px-3 py-2 text-ink-muted">
                      {organization.ownerEmails.join(', ')}
                    </td>
                    <td className="px-3 py-2 text-ink-muted">{organization.memberCount}</td>
                    <td className="px-3 py-2 text-ink-muted">
                      {organization.supportAccess
                        ? `Until ${formatDateTime(organization.supportAccess.expiresAt)}: ${organization.supportAccess.reason}`
                        : 'None'}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {organization.supportAccess ? (
                        <>
                          <Link
                            to={`/app/ghg/${organization.id}`}
                            className="mr-2 text-sm font-semibold text-link"
                          >
                            Open
                          </Link>
                          <Button
                            variant="ghost"
                            className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            aria-label={`End support access to ${organization.name}`}
                            onClick={() =>
                              endAccess.mutate(organization.id, {
                                onSuccess: () =>
                                  toast(`Support access to ${organization.name} ended.`),
                                onError: (error) => toast(refusalMessage(error), 'error'),
                              })
                            }
                          >
                            End access
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          className="px-2 py-1 text-xs"
                          onClick={() => setAssuming(organization)}
                        >
                          Assume access
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}
      </main>

      {assuming && (
        <AssumeAccessDialog
          organization={assuming}
          onClose={() => setAssuming(null)}
          onAssumed={(message) => {
            setAssuming(null)
            toast(message)
          }}
        />
      )}
    </div>
  )
}

function AssumeAccessDialog({
  organization,
  onClose,
  onAssumed,
}: {
  organization: AdminOrganization
  onClose: () => void
  onAssumed: (message: string) => void
}) {
  const assume = useAssumeSupportAccess()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | undefined>(undefined)

  return (
    <Modal title={`Assume access to ${organization.name}`} onClose={onClose}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          setError(null)
          setFieldError(undefined)
          assume.mutate(
            { organizationId: organization.id, reason: reason.trim() },
            {
              onSuccess: () => onAssumed(`Support access to ${organization.name} assumed.`),
              onError: (failure) => {
                const field = fieldErrors(failure)?.reason
                if (field) setFieldError(field)
                else setError(refusalMessage(failure))
              },
            },
          )
        }}
      >
        <p className="text-sm text-ink-muted">
          You get an owner's rights in {organization.name} for 24 hours, or until you end the
          access. The owners see who took it and why, and every act you record is attributed to you
          and marked as taken under support access.
        </p>
        <div className="mt-4">
          <TextAreaField
            label="Reason"
            hint="At least 10 characters; the owners read it. For example: ticket 4512, preparer cannot open the run."
            value={reason}
            error={fieldError}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={assume.isPending} disabled={reason.trim().length < 10}>
            Assume access
          </Button>
        </div>
      </form>
    </Modal>
  )
}
