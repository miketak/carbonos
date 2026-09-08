import { useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField, SelectField } from '../../components/Field'
import { GlassCard } from '../../components/GlassCard'
import { Modal } from '../../components/Modal'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { fieldErrors, problemDetail } from '../../lib/api'
import { formatCo2e } from './format'
import {
  useBaseYearQuery,
  useClearBaseYear,
  useDecideRecalculation,
  useInventoriesQuery,
  useRunsQuery,
  useSetBaseYear,
} from './useGhg'
import type { BaseYear, Inventory, Recalculation, RecalculationStatus } from './api'

const statusStyles: Record<RecalculationStatus, string> = {
  FLAGGED: 'bg-amber-100 text-amber-800',
  RECALCULATED: 'bg-accent-green/25 text-dark-teal',
  DECLINED: 'bg-slate-200 text-slate-600',
}

/**
 * The organization's base year and recalculation policy (spec 06, Chapter 5):
 * which inventory established the base year, the significance threshold and
 * the triggers honoured, and the candidates that later boundary changes
 * raised for the accountant to decide.
 */
export function BaseYearPage() {
  const { organizationId = '' } = useParams()
  const baseYearQuery = useBaseYearQuery(organizationId)
  const inventoriesQuery = useInventoriesQuery(organizationId)
  const clear = useClearBaseYear(organizationId)
  const toast = useToast()
  const [editing, setEditing] = useState(false)

  const baseYear = baseYearQuery.data
  const inventories = inventoriesQuery.data ?? []

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl">Base year</h1>
        <p className="text-sm text-ink-muted">
          The reference point emissions are compared against over time, and the policy that says
          when it is recalculated.
        </p>
      </div>

      <GlassCard className="animate-fade-up p-6">
        {baseYearQuery.isPending && (
          <div aria-label="Loading base year" className="flex flex-col gap-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        )}
        {baseYearQuery.isSuccess && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg">Base year and recalculation policy</h2>
                <p className="text-sm text-ink-muted">
                  Structural changes, methodology changes and significant errors can distort a
                  comparison, so the Standard asks for a threshold and a policy. Organic growth or
                  decline, and facilities that did not exist in the base year, never trigger a
                  recalculation.
                </p>
              </div>
              {baseYear && !editing && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-sm"
                    onClick={() => setEditing(true)}
                  >
                    Edit policy
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                    busy={clear.isPending}
                    onClick={() =>
                      clear.mutate(undefined, {
                        onSuccess: () => toast('Base year cleared.'),
                        onError: (error) =>
                          toast(problemDetail(error) ?? 'Could not clear the base year.', 'error'),
                      })
                    }
                  >
                    Clear base year
                  </Button>
                </div>
              )}
            </div>

            {baseYear && !editing && <Designation baseYear={baseYear} />}
            {(!baseYear || editing) && (
              <PolicyForm
                organizationId={organizationId}
                inventories={inventories}
                baseYear={baseYear ?? null}
                onCancel={baseYear ? () => setEditing(false) : undefined}
                onSaved={(saved) => {
                  setEditing(false)
                  toast(`Base year ${saved.year} designated.`)
                }}
              />
            )}
          </>
        )}
      </GlassCard>

      {baseYear && (
        <div className="animate-fade-up" style={{ '--stagger': 1 } as CSSProperties}>
          <RecalculationHistory organizationId={organizationId} baseYear={baseYear} />
        </div>
      )}
    </section>
  )
}

function Designation({ baseYear }: { baseYear: BaseYear }) {
  const triggers = [
    baseYear.triggers.structuralChanges ? 'structural changes' : null,
    baseYear.triggers.methodologyChanges ? 'methodology changes' : null,
    baseYear.triggers.errorCorrections ? 'significant errors' : null,
  ].filter((trigger) => trigger !== null)
  return (
    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-xs text-ink-muted uppercase">Base year</dt>
        <dd className="text-2xl font-bold text-dark-teal">{baseYear.year}</dd>
      </div>
      <div>
        <dt className="text-xs text-ink-muted uppercase">Established by</dt>
        <dd>
          <Link to={`../inventories/${baseYear.inventoryId}`} className="font-semibold text-link">
            {baseYear.inventoryName}
          </Link>
          {!baseYear.baseRunId && (
            <span className="block text-xs text-amber-700">
              No final run yet: designate one so structural changes can be weighed against it.
            </span>
          )}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-ink-muted uppercase">Significance threshold</dt>
        <dd className="font-semibold">{baseYear.thresholdPercent}% of base-year emissions</dd>
      </div>
      <div>
        <dt className="text-xs text-ink-muted uppercase">Triggers honoured</dt>
        <dd>{triggers.length > 0 ? triggers.join(', ') : 'none'}</dd>
      </div>
    </dl>
  )
}

function PolicyForm({
  organizationId,
  inventories,
  baseYear,
  onCancel,
  onSaved,
}: {
  organizationId: string
  inventories: Inventory[]
  baseYear: BaseYear | null
  onCancel?: () => void
  onSaved: (saved: BaseYear) => void
}) {
  const set = useSetBaseYear(organizationId)
  const [inventoryId, setInventoryId] = useState(baseYear?.inventoryId ?? inventories[0]?.id ?? '')
  const [threshold, setThreshold] = useState(String(baseYear?.thresholdPercent ?? 5))
  const [structural, setStructural] = useState(baseYear?.triggers.structuralChanges ?? true)
  const [methodology, setMethodology] = useState(baseYear?.triggers.methodologyChanges ?? true)
  const [errors, setErrors] = useState(baseYear?.triggers.errorCorrections ?? true)

  const validation = fieldErrors(set.error)
  const generalError = set.isError && !validation ? problemDetail(set.error) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    set.mutate(
      {
        inventoryId,
        thresholdPercent: Number(threshold),
        triggers: {
          structuralChanges: structural,
          methodologyChanges: methodology,
          errorCorrections: errors,
        },
      },
      { onSuccess: (saved) => onSaved(saved as BaseYear) },
    )
  }

  if (inventories.length === 0) {
    return (
      <p className="mt-4 text-sm text-ink-muted">
        Create an inventory for the base year first, under{' '}
        <Link to="../inventories" className="font-semibold text-link">
          Inventories
        </Link>
        .
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-4" noValidate>
      <SelectField
        label="Base-year inventory"
        value={inventoryId}
        onChange={(event) => setInventoryId(event.target.value)}
        error={validation?.inventoryId}
        hint="The inventory whose period is the base year; its final run is the base-year figure."
        required
      >
        {inventories.map((inventory) => (
          <option key={inventory.id} value={inventory.id}>
            {inventory.name} ({inventory.periodStart} → {inventory.periodEnd})
          </option>
        ))}
      </SelectField>
      <InputField
        label="Significance threshold (%)"
        type="number"
        min="0"
        max="100"
        step="0.01"
        value={threshold}
        onChange={(event) => setThreshold(event.target.value)}
        error={validation?.thresholdPercent}
        hint="A change affecting more than this share of base-year emissions requires recalculation."
        required
      />
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Triggers honoured</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={structural}
            onChange={(event) => setStructural(event.target.checked)}
            className="size-4 accent-teal"
          />
          Structural changes: acquisitions, divestments, mergers, outsourcing or insourcing
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={methodology}
            onChange={(event) => setMethodology(event.target.checked)}
            className="size-4 accent-teal"
          />
          Methodology changes
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={errors}
            onChange={(event) => setErrors(event.target.checked)}
            className="size-4 accent-teal"
          />
          Discovery of significant errors
        </label>
      </fieldset>
      {generalError && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {generalError}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" busy={set.isPending}>
          {baseYear ? 'Save policy' : 'Designate base year'}
        </Button>
      </div>
    </form>
  )
}

type Decision =
  | { kind: 'decline'; recalculation: Recalculation }
  | { kind: 'recalculate'; recalculation: Recalculation }
  | null

/** Every candidate a boundary change raised, oldest first, with the decision taken on each. */
function RecalculationHistory({
  organizationId,
  baseYear,
}: {
  organizationId: string
  baseYear: BaseYear
}) {
  const [decision, setDecision] = useState<Decision>(null)
  const toast = useToast()

  return (
    <GlassCard className="p-6">
      <h2 className="text-lg">Recalculation history</h2>
      <p className="text-sm text-ink-muted">
        Freezing an inventory whose boundary differs from the base year measures the affected
        facilities against the base-year run and records a candidate here.
      </p>
      {baseYear.recalculations.length === 0 && (
        <p className="mt-4 text-sm text-ink-muted">
          No recalculation candidates yet. Freezing an inventory whose boundary differs from the
          base year records one here.
        </p>
      )}
      <ul className="mt-4 flex flex-col gap-3">
        {baseYear.recalculations.map((recalculation) => (
          <li
            key={recalculation.id}
            className="rounded-xl border border-teal/10 bg-white/40 p-4 text-sm"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[recalculation.status]}`}
              >
                {recalculation.status}
              </span>
              <span className="text-xs text-ink-muted">
                {new Date(recalculation.createdAt).toLocaleString()}
                {recalculation.boundaryVersionNo !== null
                  ? ` · boundary v${recalculation.boundaryVersionNo}`
                  : ''}
                {recalculation.affectedPercent !== null
                  ? ` · ${recalculation.affectedPercent}% of base-year emissions, ${
                      recalculation.aboveThreshold ? 'above' : 'below'
                    } the threshold`
                  : ''}
              </span>
            </div>
            <p className="mt-2">{recalculation.reason}</p>
            {recalculation.status === 'FLAGGED' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  className="px-3 py-1.5 text-xs"
                  onClick={() => setDecision({ kind: 'recalculate', recalculation })}
                >
                  Record recalculated base
                </Button>
                <Button
                  variant="ghost"
                  className="px-3 py-1.5 text-xs"
                  onClick={() => setDecision({ kind: 'decline', recalculation })}
                >
                  Decline
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-ink-muted">
                {recalculation.decidedBy ? `Decided by ${recalculation.decidedBy}` : 'Decided'}
                {recalculation.decidedAt
                  ? `, ${new Date(recalculation.decidedAt).toLocaleString()}`
                  : ''}
                {recalculation.decisionNote ? ` · ${recalculation.decisionNote}` : ''}
              </p>
            )}
          </li>
        ))}
      </ul>

      {decision?.kind === 'decline' && (
        <DeclineModal
          organizationId={organizationId}
          recalculation={decision.recalculation}
          onClose={() => setDecision(null)}
          onDone={() => {
            setDecision(null)
            toast('Recalculation declined.')
          }}
        />
      )}
      {decision?.kind === 'recalculate' && (
        <RecalculateModal
          organizationId={organizationId}
          baseYear={baseYear}
          recalculation={decision.recalculation}
          onClose={() => setDecision(null)}
          onDone={() => {
            setDecision(null)
            toast('Recalculated base year recorded.')
          }}
        />
      )}
    </GlassCard>
  )
}

function DeclineModal({
  organizationId,
  recalculation,
  onClose,
  onDone,
}: {
  organizationId: string
  recalculation: Recalculation
  onClose: () => void
  onDone: () => void
}) {
  const decide = useDecideRecalculation(organizationId)
  const [note, setNote] = useState('')
  const error = decide.isError ? problemDetail(decide.error) : undefined

  return (
    <Modal title="Decline the recalculation?" onClose={onClose}>
      <p className="text-sm text-ink-muted">
        The base year is kept as it stands and the decision is recorded with the reason it was
        raised: {recalculation.reason}.
      </p>
      <div className="mt-4">
        <InputField
          label="Note (optional)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Below threshold; base year kept."
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          busy={decide.isPending}
          onClick={() =>
            decide.mutate(
              {
                recalculationId: recalculation.id,
                input: { decision: 'DECLINED', note: note.trim() === '' ? undefined : note },
              },
              { onSuccess: onDone },
            )
          }
        >
          Decline
        </Button>
      </div>
    </Modal>
  )
}

function RecalculateModal({
  organizationId,
  baseYear,
  recalculation,
  onClose,
  onDone,
}: {
  organizationId: string
  baseYear: BaseYear
  recalculation: Recalculation
  onClose: () => void
  onDone: () => void
}) {
  const decide = useDecideRecalculation(organizationId)
  const runsQuery = useRunsQuery(baseYear.inventoryId)
  const runs = runsQuery.data ?? []
  const [runId, setRunId] = useState('')
  const [note, setNote] = useState('')
  const error = decide.isError ? problemDetail(decide.error) : undefined
  const chosen = runId || runs[0]?.id || ''

  return (
    <Modal title="Record the recalculated base year" onClose={onClose}>
      <p className="text-sm text-ink-muted">
        A recalculated base is a run of the base-year inventory ({baseYear.inventoryName}) that now
        carries the reason: {recalculation.reason}. The earlier runs are kept, so both figures stay
        readable.
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {runsQuery.isPending && <Skeleton className="h-10" />}
        {runsQuery.isSuccess && runs.length === 0 && (
          <p className="text-sm text-amber-700">
            The base-year inventory has no runs yet. Reopen it, apply the change, freeze it and
            launch a run first.
          </p>
        )}
        {runs.length > 0 && (
          <SelectField
            label="Recalculated base run"
            value={chosen}
            onChange={(event) => setRunId(event.target.value)}
          >
            {runs.map((run) => (
              <option key={run.id} value={run.id}>
                {run.label} · {formatCo2e(run.totalKgCo2e)}
              </option>
            ))}
          </SelectField>
        )}
        <InputField
          label="Note (optional)"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          busy={decide.isPending}
          disabled={chosen === ''}
          onClick={() =>
            decide.mutate(
              {
                recalculationId: recalculation.id,
                input: {
                  decision: 'RECALCULATED',
                  runId: chosen,
                  note: note.trim() === '' ? undefined : note,
                },
              },
              { onSuccess: onDone },
            )
          }
        >
          Record
        </Button>
      </div>
    </Modal>
  )
}
