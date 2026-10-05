import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField } from '../../components/Field'
import { Panel, PanelBody, PanelHead } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { Table, Td, Th } from '../../components/Table'
import { useToast } from '../../components/toast'
import { fieldErrors, problemDetail, refusalMessage } from '../../lib/api'
import { accountLabel, organizationLabel } from '../../lib/organizationLabel'
import { duplicateOrganizations } from './duplicateName'
import { DeleteOrganizationDialog } from './components/DeleteOrganizationDialog'
import { DuplicateNameNotice } from './components/DuplicateNameNotice'
import { MembersCard } from './components/MembersCard'
import { actionLabels, formatDateTime } from './format'
import { mayManageMembership } from './roles'
import { useOrganizationEventsQuery, useOrganizationQuery, useUpdateOrganization } from './useGhg'
import type { Organization } from './api'

/**
 * Where an owner administers their own organization (spec 01.7): its details,
 * its members, its history, and its deletion. The platform administrator has
 * had a panel since spec 01.5; this is the client's.
 *
 * The Organization tab of Settings, owner by membership only. Support access
 * never grants membership changes or deletion (spec 01.3), so an administrator
 * inside under a grant is sent to Baseline and targets, as every other member
 * is; the server refuses the writes all the same.
 */
export function OrganizationSettingsPage() {
  const { organizationId = '' } = useParams()
  const organizationQuery = useOrganizationQuery(organizationId)

  if (organizationQuery.isPending) {
    return (
      <div aria-label="Loading the organization settings" className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-56" />
      </div>
    )
  }

  if (!organizationQuery.data) {
    return (
      <Panel className="p-10 text-center">
        <h2 className="text-lg font-semibold">The organization could not be loaded</h2>
        <p className="mt-1 text-sm text-ink-muted">Reload to try again.</p>
      </Panel>
    )
  }

  const organization = organizationQuery.data

  // spec 01.7: the Organization tab is the owner's. Every other member (and
  // support access) is taken to the tab that is theirs too.
  if (!mayManageMembership(organization.myRole)) {
    return <Navigate to="baseline" replace />
  }

  return <Settings organization={organization} />
}

/**
 * The page proper. It takes the loaded organization as a prop so the fields
 * start from it directly, rather than being seeded by an effect that would
 * render once with the wrong values first.
 */
function Settings({ organization }: { organization: Organization }) {
  const eventsQuery = useOrganizationEventsQuery(organization.id)
  const save = useUpdateOrganization()
  const toast = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState(organization.name)
  const [address, setAddress] = useState(organization.address ?? '')
  const [contact, setContact] = useState(organization.contact ?? '')
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  // spec 01.8: the name the last refusal was about; the notice and "Save anyway"
  // stand only while the field still holds it
  const [refusedName, setRefusedName] = useState<string | null>(null)

  const errors = fieldErrors(save.error)
  const duplicates = duplicateOrganizations(save.error)
  const confirming = duplicates !== undefined && refusedName === name.trim()
  const events = eventsQuery.data ?? []

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setRefusedName(name.trim())
    save.mutate(
      {
        id: organization.id,
        input: {
          name: name.trim(),
          address: address.trim(),
          contact: contact.trim(),
          ...(confirming ? { allowDuplicateName: true } : {}),
        },
      },
      {
        onSuccess: () =>
          toast(
            `${organizationLabel({ name: name.trim(), accountNo: organization.accountNo })} saved.`,
          ),
        onError: (cause) => {
          // the duplicate-name refusal has its own notice; every other one reads as usual
          if (!duplicateOrganizations(cause)) setError(refusalMessage(cause))
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <PanelHead
          title="Details"
          description={`The name and the account number ${accountLabel(organization.accountNo)} identify the organization across the product; the address and contact print on the report header (spec 07.4). Two organizations may share a name; the account number never changes.`}
        />
        <PanelBody>
          {/* noValidate as everywhere else: the server is the authority and its
              refusal is what the reader sees, rather than a silent browser block */}
          <form onSubmit={submit} className="grid gap-x-6 gap-y-5 md:grid-cols-2" noValidate>
            <div className="md:col-span-2">
              <InputField
                label="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                error={errors?.name}
              />
            </div>
            <InputField
              label="Address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              error={errors?.address}
              hint="Optional. Printed on the report header."
            />
            <InputField
              label="Contact"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              error={errors?.contact}
              hint="Optional. Who a reader of the report should write to."
            />
            {confirming && (
              <div className="md:col-span-2">
                <DuplicateNameNotice
                  detail={problemDetail(save.error)}
                  duplicates={duplicates}
                  proceed="Save anyway"
                />
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-danger md:col-span-2">
                {error}
              </p>
            )}
            <div className="flex justify-end md:col-span-2">
              <Button type="submit" busy={save.isPending}>
                {confirming ? 'Save anyway' : 'Save details'}
              </Button>
            </div>
          </form>
        </PanelBody>
      </Panel>

      <MembersCard organization={organization} />

      <Panel>
        <PanelHead title="History" />
        {eventsQuery.isPending && (
          <PanelBody aria-label="Loading the organization history">
            <Skeleton className="h-8" />
          </PanelBody>
        )}
        {eventsQuery.data && events.length === 0 && (
          <PanelBody>
            <p className="text-sm text-ink-muted">
              Nothing has happened to the organization itself yet. Membership, support access,
              changes to legal entities, facilities and emission sources, and deletion are recorded
              here; what happens inside an inventory is in its own history.
            </p>
          </PanelBody>
        )}
        {events.length > 0 && (
          <Table className="[&_tbody_tr:last-child_td]:border-b-0">
            <thead>
              <tr>
                <Th>Action</Th>
                <Th>Who</Th>
                <Th>When</Th>
                <Th>Reason</Th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <Td className="font-medium">{actionLabels[event.action]}</Td>
                  <Td>{event.actor}</Td>
                  <Td className="whitespace-nowrap">{formatDateTime(event.at)}</Td>
                  <Td className="text-ink-muted">{event.reason}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      {/* spec 10: the one panel that has to look unlike the others carries the danger border;
          the important flag settles which border-colour utility wins, since both are the same
          property and the generated stylesheet decides the order, not the class attribute */}
      <Panel className="border-danger-dot!">
        <PanelHead title={<span className="text-danger">Danger zone</span>} />
        <PanelBody className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-3xl">
            <h3 className="font-semibold">Delete this organization</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Everything under it goes: facilities, activity data, inventories and runs. An
              organization with a published record cannot be deleted. You will be asked to type the
              name and give a reason, and the deletion is kept (spec 01.3).
            </p>
          </div>
          <Button variant="secondary" className="text-danger" onClick={() => setDeleting(true)}>
            Delete organization
          </Button>
        </PanelBody>
      </Panel>

      {deleting && (
        <DeleteOrganizationDialog
          organization={organization}
          onClose={() => setDeleting(false)}
          onDeleted={(message) => {
            setDeleting(false)
            toast(message)
            // the organization this page administers no longer exists
            void navigate('/app/ghg')
          }}
        />
      )}
    </div>
  )
}
