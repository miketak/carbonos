import { formatDateTime } from '../../lib/dates'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { TextAreaField } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { Panel } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { StatusDot } from '../../components/StatusDot'
import { Table, Td, Th, TwoLine } from '../../components/Table'
import { useToast } from '../../components/toast'
import { fieldErrors, refusalMessage } from '../../lib/api'
import { accountLabel, organizationLabel } from '../../lib/organizationLabel'
import {
  useAdminOrganizationsQuery,
  useAssumeSupportAccess,
  useEndSupportAccess,
} from './useOrganizations'
import { usePlatformSettingsQuery } from './useSettings'
import type { AdminOrganization } from './api'

/** "24 hours", "1 hour", or a neutral phrase while the setting is still loading. */
function windowPhrase(hours: number | undefined): string {
  return hours === undefined ? 'a fixed window' : `${hours} ${hours === 1 ? 'hour' : 'hours'}`
}

const crumbs = [{ label: 'Administration' }, { label: 'Organizations' }]

/**
 * The organizations on the platform, as support staff see them (spec 01.3):
 * owners, member count and whether the administrator holds access. No
 * inventory data. Access is assumed with a reason, lasts for the window the
 * deployment sets (spec 01.5), and is recorded in the organization's own
 * history for its owners to read.
 */
export function AdminOrganizationsPage() {
  const organizationsQuery = useAdminOrganizationsQuery()
  const settingsQuery = usePlatformSettingsQuery()
  const endAccess = useEndSupportAccess()
  const toast = useToast()
  const [assuming, setAssuming] = useState<AdminOrganization | null>(null)

  const organizations = organizationsQuery.data ?? []
  const windowHours = windowPhrase(settingsQuery.data?.supportAccessWindowHours)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        crumbs={crumbs}
        title="Organizations"
        subtitle={`Client organizations are private to their members. To look inside one for a support case, assume access with a reason: it gives you an owner's rights for ${windowHours}, and the organization's owners see who took it and why. It never carries deleting the organization, changing its membership, or adopting a factor pack edition.`}
      />

      {organizationsQuery.isPending && (
        <div aria-label="Loading organizations" className="flex flex-col gap-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      )}

      {organizationsQuery.data?.length === 0 && (
        <Panel className="p-10 text-center">
          <h2 className="text-lg">No organizations yet</h2>
        </Panel>
      )}

      {organizations.length > 0 && (
        <Panel>
          <Table className="[&_tbody_tr:last-child>td]:border-b-0">
            <thead>
              <tr>
                <Th>Organization</Th>
                <Th>Owners</Th>
                <Th align="right">Members</Th>
                <Th>Support access</Th>
                <Th align="right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((organization) => (
                <tr key={organization.id}>
                  <Td>
                    {/* spec 01.8: the account number stays with the name, here as the meta line */}
                    <TwoLine
                      primary={organization.name}
                      secondary={
                        organization.accountNo === null
                          ? undefined
                          : accountLabel(organization.accountNo)
                      }
                    />
                  </Td>
                  <Td className="text-ink-muted">{organization.ownerEmails.join(', ')}</Td>
                  <Td align="right">{organization.memberCount}</Td>
                  <Td>
                    {organization.supportAccess ? (
                      <StatusDot tone="warning" className="items-start">
                        <span className="whitespace-normal">
                          Until {formatDateTime(organization.supportAccess.expiresAt)}:{' '}
                          {organization.supportAccess.reason}
                        </span>
                      </StatusDot>
                    ) : (
                      <span className="text-ink-muted">None</span>
                    )}
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1">
                      {organization.supportAccess ? (
                        <>
                          <Link
                            to={`/app/ghg/${organization.id}`}
                            className="inline-flex min-h-9 items-center px-3 text-sm font-medium text-link hover:underline"
                          >
                            Open
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`End support access to ${organizationLabel(organization)}`}
                            onClick={() =>
                              endAccess.mutate(organization.id, {
                                onSuccess: () =>
                                  toast(
                                    `Support access to ${organizationLabel(organization)} ended.`,
                                  ),
                                onError: (error) => toast(refusalMessage(error), 'error'),
                              })
                            }
                          >
                            End access
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setAssuming(organization)}
                        >
                          Assume access
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      )}

      {assuming && (
        <AssumeAccessDialog
          organization={assuming}
          windowHours={windowHours}
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
  windowHours,
  onClose,
  onAssumed,
}: {
  organization: AdminOrganization
  windowHours: string
  onClose: () => void
  onAssumed: (message: string) => void
}) {
  const assume = useAssumeSupportAccess()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | undefined>(undefined)

  return (
    <Modal title={`Assume access to ${organizationLabel(organization)}`} onClose={onClose}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          setError(null)
          setFieldError(undefined)
          assume.mutate(
            { organizationId: organization.id, reason: reason.trim() },
            {
              onSuccess: () =>
                onAssumed(`Support access to ${organizationLabel(organization)} assumed.`),
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
          You get an owner's rights in {organizationLabel(organization)} for {windowHours}, or until
          you end the access. The owners see who took it and why, and every act you record is
          attributed to you and marked as taken under support access.
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
          <p role="alert" className="mt-3 text-sm font-medium text-danger">
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
