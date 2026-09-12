import { useState } from 'react'
import type { FormEvent } from 'react'
import { InputField, SelectField } from '../../../components/Field'
import { GlassCard } from '../../../components/GlassCard'
import { useToast } from '../../../components/toast'
import { refusalMessage } from '../../../lib/api'
import { mayWrite, WRITE_TOOLTIP } from '../roles'
import type { MyRole } from '../roles'
import { useSetReportMetadata } from '../useGhg'
import { RoleButton } from './RoleButton'
import type { AssuranceLevel, Inventory, IntensityMetricInput } from '../api'

/** The words the PDF prints too: `ReportLabels.java` in the backend's ghg export package carries the same labels (spec 07.8). */
export const assuranceLabels: Record<AssuranceLevel, string> = {
  UNVERIFIED: 'Not verified',
  LIMITED: 'Limited assurance',
  REASONABLE: 'Reasonable assurance',
}

/**
 * The report header the accountant types before publication (spec 07.4):
 * who approves the report, its assurance, and the intensity denominators the
 * report divides the total by. Who prepared the run and who published the
 * inventory are recorded automatically.
 */
export function ReportMetadataCard({
  inventory,
  intensityMetrics,
  myRole,
}: {
  inventory: Inventory
  intensityMetrics: IntensityMetricInput[]
  myRole?: MyRole | null
}) {
  const editable = inventory.status !== 'PUBLISHED'
  const writable = editable && mayWrite(myRole)
  const save = useSetReportMetadata(inventory.id)
  const toast = useToast()
  const [approvedBy, setApprovedBy] = useState(inventory.approvedBy ?? '')
  const [assuranceLevel, setAssuranceLevel] = useState<AssuranceLevel>(inventory.assuranceLevel)
  const [assuranceProvider, setAssuranceProvider] = useState(inventory.assuranceProvider ?? '')
  const [assuranceStatement, setAssuranceStatement] = useState(inventory.assuranceStatement ?? '')
  const [uncertaintyStatement, setUncertaintyStatement] = useState(
    inventory.uncertaintyStatement ?? '',
  )
  const [metrics, setMetrics] = useState<IntensityMetricInput[]>(intensityMetrics)
  const [metricName, setMetricName] = useState('')
  const [metricValue, setMetricValue] = useState('')
  const [metricUnit, setMetricUnit] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate(
      {
        approvedBy: approvedBy.trim() === '' ? undefined : approvedBy,
        assuranceLevel,
        assuranceProvider: assuranceProvider.trim() === '' ? undefined : assuranceProvider,
        assuranceStatement: assuranceStatement.trim() === '' ? undefined : assuranceStatement,
        uncertaintyStatement: uncertaintyStatement.trim() === '' ? undefined : uncertaintyStatement,
        intensityMetrics: metrics,
      },
      {
        onSuccess: () => toast('Report header saved.'),
        onError: (error) => toast(refusalMessage(error, myRole), 'error'),
      },
    )
  }

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl">Report header</h2>
      <p className="text-sm text-ink-muted">
        Printed at the top of the report: who prepared it (whoever launches the run), who approved
        it, when it was published, the version in the correction chain, and its assurance.
        {inventory.publishedBy && ` Published by ${inventory.publishedBy}.`}
      </p>
      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-2">
        <InputField
          label="Approved by (optional)"
          placeholder="Name and role; defaults to whoever publishes"
          value={approvedBy}
          disabled={!writable}
          onChange={(event) => setApprovedBy(event.target.value)}
        />
        <SelectField
          label="Assurance"
          value={assuranceLevel}
          disabled={!writable}
          onChange={(event) => setAssuranceLevel(event.target.value as AssuranceLevel)}
        >
          {Object.entries(assuranceLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <InputField
          label="Assurance provider (optional)"
          value={assuranceProvider}
          disabled={!writable}
          onChange={(event) => setAssuranceProvider(event.target.value)}
        />
        <InputField
          label="Assurance statement reference (optional)"
          value={assuranceStatement}
          disabled={!writable}
          onChange={(event) => setAssuranceStatement(event.target.value)}
        />
        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className="text-sm font-medium">Uncertainty statement (optional)</span>
          <textarea
            aria-label="Uncertainty statement"
            value={uncertaintyStatement}
            disabled={!writable}
            maxLength={1000}
            rows={3}
            placeholder="Fuel data are metered; the cyanide estimate rests on supplier averages."
            onChange={(event) => setUncertaintyStatement(event.target.value)}
            className="w-full rounded-lg border border-teal/20 bg-white/70 px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:outline-none disabled:opacity-60"
          />
          <span className="text-xs text-ink-muted">
            Printed with the report's data-quality table (ISO 14064-1 asks for a description of
            uncertainty).
          </span>
        </label>
        <div className="md:col-span-2">
          <p className="text-sm font-medium">Intensity denominators</p>
          <p className="text-xs text-ink-muted">
            The report divides the total by each: tonnes CO₂e per ounce of gold, per tonne milled.
          </p>
          {metrics.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {metrics.map((metric, index) => (
                <li key={`${metric.name}-${index}`} className="flex items-center gap-2">
                  <span>
                    {metric.name}: {metric.value.toLocaleString()} {metric.unit}
                  </span>
                  {writable && (
                    <button
                      type="button"
                      aria-label={`Remove ${metric.name}`}
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => setMetrics(metrics.filter((_, i) => i !== index))}
                    >
                      remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {writable && (
            <div className="mt-2 grid gap-2 md:grid-cols-4 md:items-end">
              <InputField
                label="Denominator"
                placeholder="Gold produced"
                value={metricName}
                onChange={(event) => setMetricName(event.target.value)}
              />
              <InputField
                label="Value"
                type="number"
                min="0.001"
                step="0.001"
                value={metricValue}
                onChange={(event) => setMetricValue(event.target.value)}
              />
              <InputField
                label="Unit"
                placeholder="oz"
                value={metricUnit}
                onChange={(event) => setMetricUnit(event.target.value)}
              />
              <RoleButton
                allowed={mayWrite(myRole)}
                tooltip={WRITE_TOOLTIP}
                type="button"
                variant="ghost"
                className="px-3 py-1.5 text-sm"
                disabled={
                  metricName.trim() === '' || Number(metricValue) <= 0 || metricUnit.trim() === ''
                }
                onClick={() => {
                  setMetrics([
                    ...metrics,
                    {
                      name: metricName.trim(),
                      value: Number(metricValue),
                      unit: metricUnit.trim(),
                    },
                  ])
                  setMetricName('')
                  setMetricValue('')
                  setMetricUnit('')
                }}
              >
                Add denominator
              </RoleButton>
            </div>
          )}
        </div>
        {editable && (
          <div className="flex justify-end md:col-span-2">
            <RoleButton
              allowed={mayWrite(myRole)}
              tooltip={WRITE_TOOLTIP}
              type="submit"
              className="px-4 py-1.5 text-sm"
              busy={save.isPending}
            >
              Save report header
            </RoleButton>
          </div>
        )}
      </form>
    </GlassCard>
  )
}
