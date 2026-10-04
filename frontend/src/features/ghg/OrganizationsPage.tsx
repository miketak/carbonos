import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import { Panel } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { Table, Td, Th, TwoLine } from '../../components/Table'
import { useToast } from '../../components/toast'
import { AppHeader } from '../../components/AppHeader'
import { accountLabel } from '../../lib/organizationLabel'
import { ButtonLink } from './components/ButtonLink'
import { OrganizationFormModal } from './components/OrganizationFormModal'
import { roleShortLabels } from './format'
import { useOrganizationCapabilitiesQuery, useOrganizationsQuery } from './useGhg'

/**
 * Only creation lives here now. Editing an organization and deleting it moved
 * to its own settings page (spec 01.7): this list opens organizations, it no
 * longer administers them.
 */
type Dialog = { kind: 'create' } | null

/**
 * Entry point of the GHG workflow: the reporting organizations. Spec 10 made
 * the table and the New organization button the whole page: no heading, no lede.
 */
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

      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        {/* spec 01.5: a deployment may reserve creation to administrators, and a
            control nobody here may use is not offered at all (spec 01.4) */}
        {mayCreate && (
          <div className="flex justify-end">
            <Button onClick={() => setDialog({ kind: 'create' })}>New organization</Button>
          </div>
        )}

        {organizationsQuery.isPending && (
          <div aria-label="Loading organizations" className="flex flex-col gap-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        )}

        {organizations?.length === 0 && (
          <Panel className="p-10 text-center">
            <h2 className="text-lg font-semibold">No organizations yet</h2>
            {/* spec 01.6: this is a landing screen now, and telling a reader to
                create something the deployment reserves to administrators is
                the invisible refusal spec 01.4 exists to stop */}
            <p className="mt-2 text-sm text-ink-muted">
              {mayCreate
                ? 'Create your first reporting organization to start the GHG Protocol workflow.'
                : 'You are not a member of any organization yet. Ask an owner to add you, or a platform administrator.'}
            </p>
          </Panel>
        )}

        {organizations && organizations.length > 0 && (
          <Table>
            <thead>
              <tr>
                <Th>Organization</Th>
                <Th align="right">Boundary</Th>
                <Th>Your role</Th>
                <Th className="w-52">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((organization) => (
                <tr key={organization.id}>
                  <Td>
                    {/* spec 01.8: the account number travels with the name */}
                    <Link to={`/app/ghg/${organization.id}`} className="block hover:underline">
                      <TwoLine
                        primary={organization.name}
                        secondary={accountLabel(organization.accountNo)}
                      />
                    </Link>
                  </Td>
                  <Td align="right">
                    <span className="text-ink-muted">
                      {organization.facilityCount} facilit
                      {organization.facilityCount === 1 ? 'y' : 'ies'} in the boundary
                    </span>
                  </Td>
                  <Td>
                    {organization.myRole === 'ADMIN' ? (
                      <Chip tone="warning">Support access</Chip>
                    ) : organization.myRole === null ? (
                      ''
                    ) : (
                      roleShortLabels[organization.myRole]
                    )}
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1">
                      <ButtonLink to={`/app/ghg/${organization.id}`} variant="ghost" size="sm">
                        Open
                      </ButtonLink>
                      {organization.myRole === 'OWNER' && (
                        <ButtonLink
                          to={`/app/ghg/${organization.id}/settings`}
                          variant="ghost"
                          size="sm"
                        >
                          Settings
                        </ButtonLink>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
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
