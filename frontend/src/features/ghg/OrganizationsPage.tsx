import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { DeleteOrganizationDialog } from './components/DeleteOrganizationDialog'
import { GhgHeader } from './components/GhgHeader'
import { OrganizationFormModal } from './components/OrganizationFormModal'
import { RoleButton } from './components/RoleButton'
import { mayManageMembership, mayOwn, OWNER_TOOLTIP } from './roles'
import { useOrganizationsQuery } from './useGhg'
import type { Organization } from './api'

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; organization: Organization }
  | { kind: 'delete'; organization: Organization }
  | null

/** Entry point of the GHG workflow: the reporting organizations. */
export function OrganizationsPage() {
  const organizationsQuery = useOrganizationsQuery()
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog>(null)

  const organizations = organizationsQuery.data

  return (
    <div className="min-h-screen">
      <GhgHeader />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl">GHG accounting</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Set up a reporting organization, draw its boundaries, record activity, then run the
              inventory.
            </p>
          </div>
          <Button onClick={() => setDialog({ kind: 'create' })}>New organization</Button>
        </div>

        {organizationsQuery.isPending && (
          <div aria-label="Loading organizations" className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        )}

        {organizations?.length === 0 && (
          <GlassCard className="p-10 text-center">
            <h2 className="text-lg">No organizations yet</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Create your first reporting organization to start the GHG Protocol workflow.
            </p>
          </GlassCard>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {organizations?.map((organization, index) => (
            <GlassCard
              key={organization.id}
              className="animate-fade-up hover-lift flex flex-col p-6"
              style={{ '--stagger': index } as CSSProperties}
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  to={`/app/ghg/${organization.id}`}
                  className="text-lg font-semibold text-dark-teal hover:text-link"
                >
                  {organization.name}
                </Link>
              </div>
              <p className="mt-2 text-sm text-ink-muted">
                {organization.facilityCount} facilit
                {organization.facilityCount === 1 ? 'y' : 'ies'} in the boundary
              </p>
              {organization.myRole === 'ADMIN' && (
                <p className="mt-2">
                  <span className="rounded-full bg-teal/15 px-2 py-0.5 text-xs font-bold tracking-wide text-dark-teal">
                    Support access
                  </span>
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <Link
                  to={`/app/ghg/${organization.id}`}
                  className="inline-block rounded-lg bg-teal-deep px-4 py-1.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-dark-teal"
                >
                  Open
                </Link>
                <RoleButton
                  allowed={mayOwn(organization.myRole)}
                  tooltip={OWNER_TOOLTIP}
                  variant="ghost"
                  className="px-3 py-1.5 text-sm"
                  onClick={() => setDialog({ kind: 'edit', organization })}
                >
                  Edit
                </RoleButton>
                <RoleButton
                  allowed={mayManageMembership(organization.myRole)}
                  tooltip={OWNER_TOOLTIP}
                  variant="ghost"
                  className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                  onClick={() => setDialog({ kind: 'delete', organization })}
                >
                  Delete
                </RoleButton>
              </div>
            </GlassCard>
          ))}
        </div>
      </main>

      {dialog?.kind === 'create' && (
        <OrganizationFormModal
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null)
            toast(message)
          }}
        />
      )}
      {dialog?.kind === 'edit' && (
        <OrganizationFormModal
          organization={dialog.organization}
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null)
            toast(message)
          }}
        />
      )}
      {dialog?.kind === 'delete' && (
        <DeleteOrganizationDialog
          organization={dialog.organization}
          onClose={() => setDialog(null)}
          onDeleted={(message) => {
            setDialog(null)
            toast(message)
          }}
        />
      )}
    </div>
  )
}
