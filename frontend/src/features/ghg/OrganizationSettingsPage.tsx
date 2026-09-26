import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField } from '../../components/Field'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
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
 * Owner by membership only. Support access never grants membership changes or
 * deletion (spec 01.3), so an administrator inside under a grant is refused
 * here exactly as the server refuses the writes.
 */
export function OrganizationSettingsPage() {
  const { organizationId = '' } = useParams()
  const organizationQuery = useOrganizationQuery(organizationId)

  if (organizationQuery.isPending) {
    return (
      <div aria-label="Loading the organization settings" className="mx-auto max-w-3xl">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-4 h-56" />
      </div>
    )
  }

  if (!organizationQuery.data) {
    return (
      <GlassCard className="mx-auto max-w-3xl p-10 text-center">
        <h1 className="text-lg">The organization could not be loaded</h1>
        <p className="mt-1 text-sm text-ink-muted">Reload to try again.</p>
      </GlassCard>
    )
  }

  const organization = organizationQuery.data

  // spec 01.4: a refusal is stated, never a blank page. The sidebar hides the
  // entry, so reaching this means the address was typed or a role changed.
  if (!mayManageMembership(organization.myRole)) {
    return (
      <GlassCard className="mx-auto max-w-3xl p-10 text-center">
        <h1 className="text-lg">Settings are the owner's</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Administering {organizationLabel(organization)}, its members and its details needs the
          Owner role in the organization. Support access does not carry it.
        </p>
      </GlassCard>
    )
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
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {organizationLabel(organization)}: its details, who works on it, and what has been done to
          it. Only an owner sees this page.
        </p>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-xl">Details</h2>
        <p className="text-sm text-ink-muted">
          The name and the account number {accountLabel(organization.accountNo)} identify the
          organization across the product; the address and contact print on the report header (spec
          07.4). Two organizations may share a name; the account number never changes.
        </p>
        {/* noValidate as everywhere else: the server is the authority and its
            refusal is what the reader sees, rather than a silent browser block */}
        <form onSubmit={submit} className="mt-5 flex flex-col gap-5" noValidate>
          <InputField
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={errors?.name}
          />
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
            <DuplicateNameNotice
              detail={problemDetail(save.error)}
              duplicates={duplicates}
              proceed="Save anyway"
            />
          )}
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div>
            <Button type="submit" busy={save.isPending}>
              {confirming ? 'Save anyway' : 'Save details'}
            </Button>
          </div>
        </form>
      </GlassCard>

      <div className="mt-8">
        <MembersCard organization={organization} />
      </div>

      <h2 className="mt-8 mb-3 text-lg">History</h2>
      <GlassCard className="overflow-x-auto">
        {eventsQuery.isPending && (
          <div aria-label="Loading the organization history" className="flex flex-col gap-2 p-4">
            <Skeleton className="h-8" />
          </div>
        )}
        {eventsQuery.data && events.length === 0 && (
          <p className="p-6 text-sm text-ink-muted">
            Nothing has happened to the organization itself yet. Support access and deletion are
            recorded here; what happens inside an inventory is in its own history.
          </p>
        )}
        {events.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Who</th>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-b border-teal/5 last:border-0">
                  <td className="px-4 py-3 font-medium">{actionLabels[event.action]}</td>
                  <td className="px-4 py-3 text-ink-muted">{event.actor}</td>
                  <td className="px-4 py-3 text-ink-muted">{formatDateTime(event.at)}</td>
                  <td className="px-4 py-3 text-ink-muted">{event.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      <h2 className="mt-8 mb-3 text-lg text-red-700">Danger zone</h2>
      {/* Not a GlassCard: this one has to look unlike the cards above it, and a
          border colour passed to GlassCard loses to its own anyway, because both
          are border-colour utilities and the generated stylesheet decides, not
          the order of the class attribute. The tinted panel is the warning
          surface ImportActivitiesModal already uses. */}
      <div className="rounded-xl border border-red-200 bg-red-50/60 p-6">
        <h3 className="font-medium text-red-800">Delete this organization</h3>
        <p className="mt-1 text-sm text-red-700/80">
          Everything under it goes: facilities, activity data, inventories and runs. An organization
          with a published record cannot be deleted. You will be asked to type the name and give a
          reason, and the deletion is kept (spec 01.3).
        </p>
        <Button
          variant="ghost"
          className="mt-4 border border-red-300 bg-white/70 text-red-700 hover:bg-red-100"
          onClick={() => setDeleting(true)}
        >
          Delete organization
        </Button>
      </div>

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
