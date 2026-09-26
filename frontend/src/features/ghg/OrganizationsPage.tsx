import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { AppHeader } from '../../components/AppHeader'
import { OrganizationName } from '../../components/OrganizationName'
import { OrganizationFormModal } from './components/OrganizationFormModal'
import { useOrganizationCapabilitiesQuery, useOrganizationsQuery } from './useGhg'

/**
 * Only creation lives here now. Editing an organization and deleting it moved
 * to its own settings page (spec 01.7): this list opens organizations, it no
 * longer administers them.
 */
type Dialog = { kind: 'create' } | null

/** Entry point of the GHG workflow: the reporting organizations. */
export function OrganizationsPage() {
  const organizationsQuery = useOrganizationsQuery()
  const capabilitiesQuery = useOrganizationCapabilitiesQuery()
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog>(null)

  const organizations = organizationsQuery.data
  // while the capability is still loading the button shows, as spec 01.4 says:
  // the server is the authority and refuses what the screen wrongly offers
  const mayCreate = capabilitiesQuery.data?.mayCreateOrganization ?? true

  return (
    <div className="min-h-screen">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl">GHG accounting</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Set up a reporting organization, draw its boundaries, record activity, then run the
              inventory.
            </p>
          </div>
          {/* spec 01.5: a deployment may reserve creation to administrators, and a
              control nobody here may use is not offered at all (spec 01.4) */}
          {mayCreate && (
            <Button onClick={() => setDialog({ kind: 'create' })}>New organization</Button>
          )}
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
            {/* spec 01.6: this is a landing screen now, and telling a reader to
                create something the deployment reserves to administrators is
                the invisible refusal spec 01.4 exists to stop */}
            <p className="mt-2 text-sm text-ink-muted">
              {mayCreate
                ? 'Create your first reporting organization to start the GHG Protocol workflow.'
                : 'You are not a member of any organization yet. Ask an owner to add you, or a platform administrator.'}
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
                  <OrganizationName name={organization.name} accountNo={organization.accountNo} />
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
                {organization.myRole === 'OWNER' && (
                  <Link
                    to={`/app/ghg/${organization.id}/settings`}
                    className="inline-block rounded-lg px-3 py-1.5 text-sm font-medium text-link transition-colors duration-150 hover:bg-teal/10"
                  >
                    Settings
                  </Link>
                )}
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
    </div>
  )
}
