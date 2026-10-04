import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../components/Button'
import { InputField, SelectField, TextAreaField } from '../../components/Field'
import { PageHeader } from '../../components/PageHeader'
import { Panel, PanelBody, PanelHead } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { Table, Td, Th } from '../../components/Table'
import { useToast } from '../../components/toast'
import { fieldErrors, refusalMessage } from '../../lib/api'
import {
  usePlatformSettingsHistoryQuery,
  usePlatformSettingsQuery,
  useUpdatePlatformSettings,
} from './useSettings'
import type { EditionsInPublishedPeriods, OrganizationCreation, PlatformSettings } from './api'

const settingNames: Record<string, string> = {
  supportAccessWindowHours: 'Support access window',
  organizationCreation: 'Who may create an organization',
  editionsInPublishedPeriods: 'Editions inside a published period',
}

/** A saved value as the form shows it, so the history reads like the setting it records. */
const valueLabels: Record<string, Record<string, string>> = {
  organizationCreation: { EVERYONE: 'Everyone signed in', ADMINISTRATORS: 'Administrators only' },
  editionsInPublishedPeriods: {
    BLOCKED: 'Blocked (default)',
    ALLOWED: 'Allowed: published runs keep their factors',
  },
}

function valueLabel(setting: string, value: string): string {
  if (setting === 'supportAccessWindowHours') return `${value} ${value === '1' ? 'hour' : 'hours'}`
  return valueLabels[setting]?.[value] ?? value
}

function when(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

const crumbs = [{ label: 'Administration' }, { label: 'Platform settings' }]

/**
 * The deployment's own policy (specs 01.5 and 02.6).
 *
 * Two settings govern access to clients' pre-publication inventories and the
 * third decides whether a published period blocks a factor pack edition, so
 * a change needs a reason and is kept. Without that record an administrator
 * could widen the support-access window, assume access, and narrow it again,
 * leaving no evidence of a self-serving change to a privileged-access
 * control.
 */
export function AdminSettingsPage() {
  const settingsQuery = usePlatformSettingsQuery()

  if (settingsQuery.isPending) {
    return (
      <div aria-label="Loading the platform settings" className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-56" />
      </div>
    )
  }

  if (!settingsQuery.data) {
    return (
      <Panel className="p-10 text-center">
        <h1 className="text-lg">The platform settings could not be loaded</h1>
        <p className="mt-1 text-sm text-ink-muted">Reload to try again.</p>
      </Panel>
    )
  }

  return <SettingsForm settings={settingsQuery.data} />
}

/**
 * The form proper. It takes the loaded settings as a prop so the fields can
 * be initialized from them directly, rather than seeded by an effect that
 * would render once with the wrong values first.
 */
function SettingsForm({ settings }: { settings: PlatformSettings }) {
  const historyQuery = usePlatformSettingsHistoryQuery()
  const save = useUpdatePlatformSettings()
  const toast = useToast()

  const [windowHours, setWindowHours] = useState(String(settings.supportAccessWindowHours))
  const [creation, setCreation] = useState<OrganizationCreation>(settings.organizationCreation)
  const [editions, setEditions] = useState<EditionsInPublishedPeriods>(
    settings.editionsInPublishedPeriods,
  )
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [refusal, setRefusal] = useState<string | undefined>()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setErrors({})
    setRefusal(undefined)
    save.mutate(
      {
        supportAccessWindowHours: Number(windowHours),
        organizationCreation: creation,
        editionsInPublishedPeriods: editions,
        reason,
      },
      {
        onSuccess: () => {
          setReason('')
          void historyQuery.refetch()
          toast('Platform settings saved.')
        },
        onError: (error) => {
          const fields = fieldErrors(error)
          if (fields) setErrors(fields)
          else setRefusal(refusalMessage(error))
        },
      },
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        crumbs={crumbs}
        title="Platform settings"
        subtitle="Policy for the whole deployment. These settings govern clients' inventories, so every change is kept with its reason."
      />

      <Panel>
        <PanelBody>
          {/* noValidate as everywhere else: the server is the authority and its
              refusal is what the reader sees, rather than a silent browser block */}
          <form onSubmit={submit} className="grid max-w-3xl gap-5 sm:grid-cols-2" noValidate>
            <InputField
              label="Support access lasts"
              type="number"
              min={1}
              max={72}
              value={windowHours}
              onChange={(event) => setWindowHours(event.target.value)}
              error={errors.supportAccessWindowHours}
              hint="Hours, between 1 and 72. A grant keeps the window it was taken under, so changing this never moves access that is already live."
            />

            <SelectField
              label="Who may create an organization"
              value={creation}
              onChange={(event) => setCreation(event.target.value as OrganizationCreation)}
              error={errors.organizationCreation}
              hint="With administrators only, the form asks for the client account that becomes the owner, and the administrator is not made a member."
            >
              <option value="EVERYONE">Everyone signed in</option>
              <option value="ADMINISTRATORS">Administrators only</option>
            </SelectField>

            <div className="sm:col-span-2">
              <SelectField
                label="Editions inside a published period"
                value={editions}
                onChange={(event) => setEditions(event.target.value as EditionsInPublishedPeriods)}
                error={errors.editionsInPublishedPeriods}
                hint="Whether an organization may import or accept a factor pack edition that applies from a date inside a published period. Published runs keep the factors they reported with either way. Frozen and final periods always block."
              >
                <option value="BLOCKED">Blocked (default)</option>
                <option value="ALLOWED">Allowed: published runs keep their factors</option>
              </SelectField>
            </div>

            <div className="sm:col-span-2">
              <TextAreaField
                label="Reason for this change"
                rows={2}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                error={errors.reason}
                hint="At least 10 characters. It is kept with the change, and a verifier may ask to read it."
              />
            </div>

            {refusal && (
              <p role="alert" className="text-sm font-medium text-danger sm:col-span-2">
                {refusal}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 sm:col-span-2">
              <span className="text-[13px] text-ink-muted">
                {settings.updatedBy &&
                  `Last changed by ${settings.updatedBy} on ${when(settings.updatedAt)}`}
              </span>
              <Button type="submit" busy={save.isPending}>
                Save settings
              </Button>
            </div>
          </form>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHead title="Every change" />
        {historyQuery.isPending && (
          <div aria-label="Loading the settings history" className="flex flex-col gap-2 p-4">
            <Skeleton className="h-8" />
          </div>
        )}
        {historyQuery.data && historyQuery.data.length === 0 && (
          <p className="p-6 text-sm text-ink-muted">
            Nothing has been changed; the deployment is running on the defaults.
          </p>
        )}
        {historyQuery.data && historyQuery.data.length > 0 && (
          <Table aria-label="Every change" className="[&_tbody_tr:last-child>td]:border-b-0">
            <thead>
              <tr>
                <Th>Setting</Th>
                <Th>From</Th>
                <Th>To</Th>
                <Th>Reason</Th>
                <Th>Who</Th>
                <Th>When</Th>
              </tr>
            </thead>
            <tbody>
              {historyQuery.data.map((change) => (
                <tr key={`${change.changedAt}-${change.setting}`}>
                  <Td className="font-medium">{settingNames[change.setting] ?? change.setting}</Td>
                  <Td className="text-ink-muted">{valueLabel(change.setting, change.oldValue)}</Td>
                  <Td>{valueLabel(change.setting, change.newValue)}</Td>
                  <Td className="text-ink-muted">{change.reason}</Td>
                  <Td className="text-ink-muted">{change.actorEmail}</Td>
                  <Td className="whitespace-nowrap text-ink-muted">{when(change.changedAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </div>
  )
}
