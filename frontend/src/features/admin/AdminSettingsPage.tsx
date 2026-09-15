import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../components/Button'
import { InputField, SelectField, TextAreaField } from '../../components/Field'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { fieldErrors, refusalMessage } from '../../lib/api'
import {
  usePlatformSettingsHistoryQuery,
  usePlatformSettingsQuery,
  useUpdatePlatformSettings,
} from './useSettings'
import type { OrganizationCreation, PlatformSettings } from './api'

const settingNames: Record<string, string> = {
  supportAccessWindowHours: 'Support access window',
  organizationCreation: 'Who may create an organization',
}

function when(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/**
 * The deployment's own policy (spec 01.5).
 *
 * Both settings govern access to clients' pre-publication inventories, so a
 * change needs a reason and is kept. Without that record an administrator
 * could widen the support-access window, assume access, and narrow it again,
 * leaving no evidence of a self-serving change to a privileged-access
 * control.
 */
export function AdminSettingsPage() {
  const settingsQuery = usePlatformSettingsQuery()

  if (settingsQuery.isPending) {
    return (
      <div aria-label="Loading the platform settings" className="mx-auto max-w-3xl">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-4 h-56" />
      </div>
    )
  }

  if (!settingsQuery.data) {
    return (
      <GlassCard className="mx-auto max-w-3xl p-10 text-center">
        <h1 className="text-lg">The platform settings could not be loaded</h1>
        <p className="mt-1 text-sm text-ink-muted">Reload to try again.</p>
      </GlassCard>
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
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl">Platform settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Policy for the whole deployment. Both settings govern access to clients' inventories, so
          every change is kept with its reason.
        </p>
      </div>

      <GlassCard className="p-6">
        {/* noValidate as everywhere else: the server is the authority and its
            refusal is what the reader sees, rather than a silent browser block */}
        <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
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

          <TextAreaField
            label="Reason for this change"
            rows={2}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            error={errors.reason}
            hint="At least 10 characters. It is kept with the change, and a verifier may ask to read it."
          />

          {refusal && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {refusal}
            </p>
          )}

          <div className="flex items-center gap-4">
            <Button type="submit" busy={save.isPending}>
              Save settings
            </Button>
            {settings.updatedBy && (
              <span className="text-xs text-ink-muted">
                Last changed by {settings.updatedBy} on {when(settings.updatedAt)}
              </span>
            )}
          </div>
        </form>
      </GlassCard>

      <h2 className="mt-8 mb-3 text-lg">Every change</h2>
      <GlassCard className="overflow-x-auto">
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
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                <th className="px-4 py-3 font-semibold">Setting</th>
                <th className="px-4 py-3 font-semibold">From</th>
                <th className="px-4 py-3 font-semibold">To</th>
                <th className="px-4 py-3 font-semibold">Reason</th>
                <th className="px-4 py-3 font-semibold">Who</th>
                <th className="px-4 py-3 font-semibold">When</th>
              </tr>
            </thead>
            <tbody>
              {historyQuery.data.map((change) => (
                <tr
                  key={`${change.changedAt}-${change.setting}`}
                  className="border-b border-teal/5 last:border-0"
                >
                  <td className="px-4 py-3 font-medium">
                    {settingNames[change.setting] ?? change.setting}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{change.oldValue}</td>
                  <td className="px-4 py-3">{change.newValue}</td>
                  <td className="px-4 py-3 text-ink-muted">{change.reason}</td>
                  <td className="px-4 py-3 text-ink-muted">{change.actorEmail}</td>
                  <td className="px-4 py-3 text-ink-muted">{when(change.changedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>
    </div>
  )
}
