import { formatDateTime } from '../../lib/dates'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField, SelectField } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { Panel, PanelBody, PanelHead } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { Stat, StatStrip } from '../../components/StatStrip'
import { StatusDot } from '../../components/StatusDot'
import type { StatusTone } from '../../components/StatusDot'
import { Table, Td } from '../../components/Table'
import { useToast } from '../../components/toast'
import { fieldErrors, refusalMessage } from '../../lib/api'
import { RoleButton } from './components/RoleButton'
import { conventionLabels, formatCo2e } from './format'
import { mayWrite, WRITE_TOOLTIP } from './roles'
import type { MyRole } from './roles'
import {
  useBaseYearQuery,
  useClearBaseYear,
  useDecideRecalculation,
  useInventoriesQuery,
  useOrganizationQuery,
  useRaiseRecalculation,
  useRunsQuery,
  useSetBaseYear,
} from './useGhg'
import type {
  BaseYear,
  Inventory,
  Recalculation,
  RecalculationStatus,
  StructuralChangeConvention,
} from './api'

const statusTones: Record<RecalculationStatus, StatusTone> = {
  FLAGGED: 'warning',
  RECALCULATED: 'success',
  DECLINED: 'neutral',
  // spec 06: a removal put back as the base year held it changed nothing against it
  SUPERSEDED: 'neutral',
}

/**
 * The organization's base year and recalculation policy (spec 06, 06.1,
 * Chapter 5): which inventory established the base year and why, the
 * significance threshold, the convention for mid-year structural changes, and
 * the candidates, detected at freeze or raised by the accountant, weighed on
 * their own and together.
 */
export function BaseYearPage() {
  const { organizationId = '' } = useParams()
  const baseYearQuery = useBaseYearQuery(organizationId)
  const inventoriesQuery = useInventoriesQuery(organizationId)
  const organizationQuery = useOrganizationQuery(organizationId)
  const clear = useClearBaseYear(organizationId)
  const toast = useToast()
  const [editing, setEditing] = useState(false)

  const baseYear = baseYearQuery.data
  const inventories = inventoriesQuery.data ?? []
  const myRole = organizationQuery.data?.myRole

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.01em]">Base year</h2>
        <p className="mt-1 text-sm text-ink-muted">
          The reference point emissions are compared against over time, and the policy that says
          when it is recalculated.
        </p>
      </div>

      <Panel>
        {baseYearQuery.isPending && (
          <PanelBody aria-label="Loading base year" className="flex flex-col gap-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </PanelBody>
        )}
        {baseYearQuery.isSuccess && (
          <>
            <PanelHead
              title="Base year and recalculation policy"
              description="Structural changes, methodology changes, and significant errors all trigger a recalculation under Chapter 5, on their own or together, so the Standard asks for a threshold and a policy. Organic growth or decline, and facilities that did not exist in the base year, never trigger one."
            >
              {baseYear && !editing && (
                <>
                  <RoleButton
                    allowed={mayWrite(myRole)}
                    tooltip={WRITE_TOOLTIP}
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(true)}
                  >
                    Edit policy
                  </RoleButton>
                  <RoleButton
                    allowed={mayWrite(myRole)}
                    tooltip={WRITE_TOOLTIP}
                    variant="ghost"
                    size="sm"
                    busy={clear.isPending}
                    onClick={() =>
                      clear.mutate(undefined, {
                        onSuccess: () => toast('Base year cleared.'),
                        onError: (error) => toast(refusalMessage(error, myRole), 'error'),
                      })
                    }
                  >
                    Clear base year
                  </RoleButton>
                </>
              )}
            </PanelHead>
            <PanelBody>
              {baseYear && !editing && <Designation baseYear={baseYear} />}
              {(!baseYear || editing) &&
                (mayWrite(myRole) ? (
                  <PolicyForm
                    organizationId={organizationId}
                    inventories={inventories}
                    baseYear={baseYear ?? null}
                    myRole={myRole}
                    onCancel={baseYear ? () => setEditing(false) : undefined}
                    onSaved={(saved) => {
                      setEditing(false)
                      toast(`Base year ${saved.year} designated.`)
                    }}
                  />
                ) : (
                  <p className="text-sm text-ink-muted">No base year has been designated yet.</p>
                ))}
            </PanelBody>
          </>
        )}
      </Panel>

      {baseYear && (
        <RecalculationHistory organizationId={organizationId} baseYear={baseYear} myRole={myRole} />
      )}
    </section>
  )
}

function Designation({ baseYear }: { baseYear: BaseYear }) {
  const runsQuery = useRunsQuery(baseYear.inventoryId)
  const baseRun = runsQuery.data?.find((run) => run.id === baseYear.baseRunId)
  return (
    <div>
      <StatStrip label="Base year designation">
        <Stat label="Base year" value={baseYear.year} />
        <Stat
          label="Established by"
          value={
            <Link
              to={`../inventories/${baseYear.inventoryId}`}
              className="text-lg font-semibold text-link hover:underline"
            >
              {baseYear.inventoryName}
            </Link>
          }
          note={
            <>
              {baseRun && (
                <span className="block">
                  Base-year run: {baseRun.label} · {formatCo2e(baseRun.totalKgCo2e)}
                </span>
              )}
              {!baseYear.baseRunId && (
                <span className="block text-warning">
                  No final run yet: designate one so structural changes can be weighed against it.
                </span>
              )}
            </>
          }
        />
        {/* one text node: the help and the QA pack quote "5% of base-year emissions" whole */}
        <Stat
          label="Significance threshold"
          value={`${baseYear.thresholdPercent}% of base-year emissions`}
        />
        <Stat
          label="Mid-year structural changes"
          value={
            <span className="text-base font-normal">
              {conventionLabels[baseYear.structuralChangeConvention]}
            </span>
          }
        />
      </StatStrip>
      <p className="mt-4">
        <span className="text-ink-muted">Why this year:</span> {baseYear.reason}
      </p>
    </div>
  )
}

function PolicyForm({
  organizationId,
  inventories,
  baseYear,
  myRole,
  onCancel,
  onSaved,
}: {
  organizationId: string
  inventories: Inventory[]
  baseYear: BaseYear | null
  myRole: MyRole | undefined
  onCancel?: () => void
  onSaved: (saved: BaseYear) => void
}) {
  const set = useSetBaseYear(organizationId)
  const [inventoryId, setInventoryId] = useState(baseYear?.inventoryId ?? inventories[0]?.id ?? '')
  const [threshold, setThreshold] = useState(String(baseYear?.thresholdPercent ?? 5))
  const [reason, setReason] = useState(baseYear?.reason ?? '')
  const [convention, setConvention] = useState<StructuralChangeConvention>(
    baseYear?.structuralChangeConvention ?? 'TRANSACTION_DATE',
  )
  const [reasonMissing, setReasonMissing] = useState(false)
  // the inventories may arrive after the first render: the select shows the first one, so send it
  const chosenInventoryId = inventoryId || inventories[0]?.id || ''

  const validation = fieldErrors(set.error)
  const generalError = set.isError && !validation ? refusalMessage(set.error, myRole) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (reason.trim() === '') {
      setReasonMissing(true)
      return
    }
    set.mutate(
      {
        inventoryId: chosenInventoryId,
        thresholdPercent: Number(threshold),
        reason,
        structuralChangeConvention: convention,
      },
      { onSuccess: (saved) => onSaved(saved as BaseYear) },
    )
  }

  if (inventories.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        Create an inventory for the base year first, under{' '}
        <Link to="../inventories" className="font-semibold text-link">
          Inventories
        </Link>
        .
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <SelectField
        label="Base-year inventory"
        value={chosenInventoryId}
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
      <InputField
        label="Why this year"
        value={reason}
        onChange={(event) => {
          setReasonMissing(false)
          setReason(event.target.value)
        }}
        error={reasonMissing ? 'Say why this year is the base year.' : validation?.reason}
        hint="The Standard asks for a year with verifiable data and the reason for choosing it."
        placeholder="First year with metered data for every site"
        maxLength={500}
        required
      />
      <SelectField
        label="Mid-year structural changes"
        value={convention}
        onChange={(event) => setConvention(event.target.value as StructuralChangeConvention)}
        hint="Chapter 5 recommends recalculating the base year and the current year for the entire year. Membership windows account from the transaction date instead; the report prints which convention was used."
      >
        {Object.entries(conventionLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </SelectField>
      <p className="text-[13px] text-ink-muted">
        Structural changes are detected when an inventory is frozen. Methodology changes and
        significant errors are raised by hand under the recalculation history. All three are
        mandatory triggers under Chapter 5.
      </p>
      {generalError && (
        <p role="alert" className="text-sm font-medium text-danger">
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
  | { kind: 'raise' }
  | null

/** Every candidate a boundary change raised, oldest first, with the decision taken on each. */
function RecalculationHistory({
  organizationId,
  baseYear,
  myRole,
}: {
  organizationId: string
  baseYear: BaseYear
  myRole: MyRole | undefined
}) {
  const [decision, setDecision] = useState<Decision>(null)
  const toast = useToast()
  // the base-year inventory's runs, so a recalculated candidate can name the run it rests on
  const runsQuery = useRunsQuery(baseYear.inventoryId)
  const runLabel = (runId: string) =>
    runsQuery.data?.find((run) => run.id === runId)?.label ?? 'a run of the base-year inventory'

  return (
    <Panel>
      <PanelHead
        title="Recalculation history"
        description="Freezing an inventory whose boundary differs from the base year measures the affected facilities against the base-year run and records a candidate here. A change is weighed on its own and together with the outstanding earlier ones."
      >
        <RoleButton
          allowed={mayWrite(myRole)}
          tooltip={WRITE_TOOLTIP}
          variant="secondary"
          size="sm"
          onClick={() => setDecision({ kind: 'raise' })}
        >
          Raise a candidate
        </RoleButton>
      </PanelHead>
      {baseYear.recalculations.length === 0 && (
        <PanelBody>
          <p className="text-sm text-ink-muted">
            No recalculation candidates yet. Freezing an inventory whose boundary differs from the
            base year records one here; a methodology change or a significant error is raised by
            hand.
          </p>
        </PanelBody>
      )}
      {baseYear.recalculations.length > 0 && (
        <Table className="[&_tbody_tr:last-child_td]:border-b-0">
          <tbody>
            {baseYear.recalculations.map((recalculation) => (
              <tr key={recalculation.id} className="align-top">
                <Td className="w-40 align-top">
                  <StatusDot tone={statusTones[recalculation.status]}>
                    {recalculation.status}
                  </StatusDot>
                </Td>
                <Td>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {formatDateTime(recalculation.createdAt)}
                      {recalculation.boundaryVersionNo !== null
                        ? ` · boundary v${recalculation.boundaryVersionNo}`
                        : ''}
                      {recalculation.affectedPercent !== null
                        ? ` · ${recalculation.affectedPercent}% of base-year emissions`
                        : ''}
                      {recalculation.cumulativePercent !== null &&
                      recalculation.cumulativePercent !== recalculation.affectedPercent
                        ? `, ${recalculation.cumulativePercent}% together with earlier changes`
                        : ''}
                      {recalculation.affectedPercent !== null
                        ? `, ${recalculation.aboveThreshold ? 'above' : 'below'} the threshold`
                        : ''}
                      {recalculation.raisedBy ? ` · raised by ${recalculation.raisedBy}` : ''}
                    </span>
                    <span className="text-[13px] text-ink-muted">{recalculation.reason}</span>
                    {recalculation.status !== 'FLAGGED' && (
                      <span className="text-[13px] text-ink-muted">
                        {recalculation.decidedBy
                          ? `Decided by ${recalculation.decidedBy}`
                          : 'Decided'}
                        {recalculation.decidedAt
                          ? `, ${formatDateTime(recalculation.decidedAt)}`
                          : ''}
                        {recalculation.decisionNote ? ` · ${recalculation.decisionNote}` : ''}
                        {recalculation.status === 'RECALCULATED' && recalculation.runId
                          ? ` · recalculated base: ${runLabel(recalculation.runId)}`
                          : ''}
                      </span>
                    )}
                  </div>
                </Td>
                <Td align="right" className="w-80">
                  {recalculation.status === 'FLAGGED' && (
                    <div className="flex flex-wrap justify-end gap-1">
                      <RoleButton
                        allowed={mayWrite(myRole)}
                        tooltip={WRITE_TOOLTIP}
                        size="sm"
                        onClick={() => setDecision({ kind: 'recalculate', recalculation })}
                      >
                        Record recalculated base
                      </RoleButton>
                      <RoleButton
                        allowed={mayWrite(myRole)}
                        tooltip={WRITE_TOOLTIP}
                        variant="ghost"
                        size="sm"
                        onClick={() => setDecision({ kind: 'decline', recalculation })}
                      >
                        Decline
                      </RoleButton>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {decision?.kind === 'decline' && (
        <DeclineModal
          organizationId={organizationId}
          recalculation={decision.recalculation}
          myRole={myRole}
          onClose={() => setDecision(null)}
          onDone={() => {
            setDecision(null)
            toast('Recalculation declined.')
          }}
        />
      )}
      {decision?.kind === 'raise' && (
        <RaiseModal
          organizationId={organizationId}
          myRole={myRole}
          onClose={() => setDecision(null)}
          onDone={() => {
            setDecision(null)
            toast('Recalculation candidate raised.')
          }}
        />
      )}
      {decision?.kind === 'recalculate' && (
        <RecalculateModal
          organizationId={organizationId}
          baseYear={baseYear}
          recalculation={decision.recalculation}
          myRole={myRole}
          onClose={() => setDecision(null)}
          onDone={() => {
            setDecision(null)
            toast('Recalculated base year recorded.')
          }}
        />
      )}
    </Panel>
  )
}

/** A methodology change or a significant error, raised by the accountant (spec 06.1). */
function RaiseModal({
  organizationId,
  myRole,
  onClose,
  onDone,
}: {
  organizationId: string
  myRole: MyRole | undefined
  onClose: () => void
  onDone: () => void
}) {
  const raise = useRaiseRecalculation(organizationId)
  const [trigger, setTrigger] = useState<'METHODOLOGY_CHANGE' | 'ERROR_CORRECTION'>(
    'METHODOLOGY_CHANGE',
  )
  const [reason, setReason] = useState('')
  const [percent, setPercent] = useState('')
  const [comparisonRunId, setComparisonRunId] = useState('')
  const validation = fieldErrors(raise.error)
  const error = raise.isError && !validation ? refusalMessage(raise.error, myRole) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    raise.mutate(
      {
        trigger,
        reason,
        affectedPercent: percent.trim() === '' ? undefined : Number(percent),
        comparisonRunId: comparisonRunId === '' ? undefined : comparisonRunId,
      },
      { onSuccess: onDone },
    )
  }

  return (
    <Modal title="Raise a recalculation candidate" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <p className="text-sm text-ink-muted">
          Chapter 5 makes a methodology change and the discovery of a significant error mandatory
          triggers. Neither can be detected from the data, so the accountant raises it with its
          weight.
        </p>
        <SelectField
          label="Trigger"
          value={trigger}
          onChange={(event) =>
            setTrigger(event.target.value as 'METHODOLOGY_CHANGE' | 'ERROR_CORRECTION')
          }
        >
          <option value="METHODOLOGY_CHANGE">Methodology change</option>
          <option value="ERROR_CORRECTION">Significant error corrected</option>
        </SelectField>
        <InputField
          label="What changed"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          error={validation?.reason}
          placeholder="Supplier-specific grid factor replaces the national average"
          maxLength={400}
          required
        />
        <InputField
          label="Affected share of base-year emissions (%)"
          type="number"
          min="0"
          step="0.01"
          value={percent}
          onChange={(event) => setPercent(event.target.value)}
          error={validation?.affectedPercent}
          hint="Type it, or name a comparison run below and the share is the difference between the two totals."
        />
        <InputField
          label="Comparison run id (optional)"
          placeholder="A run of the base-year inventory that applies the new method"
          value={comparisonRunId}
          onChange={(event) => setComparisonRunId(event.target.value)}
          error={validation?.comparisonRunId}
        />
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={raise.isPending}>
            Raise
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function DeclineModal({
  organizationId,
  recalculation,
  myRole,
  onClose,
  onDone,
}: {
  organizationId: string
  recalculation: Recalculation
  myRole: MyRole | undefined
  onClose: () => void
  onDone: () => void
}) {
  const decide = useDecideRecalculation(organizationId)
  const [note, setNote] = useState('')
  const error = decide.isError ? refusalMessage(decide.error, myRole) : undefined

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
        <p role="alert" className="mt-2 text-sm font-medium text-danger">
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
  myRole,
  onClose,
  onDone,
}: {
  organizationId: string
  baseYear: BaseYear
  recalculation: Recalculation
  myRole: MyRole | undefined
  onClose: () => void
  onDone: () => void
}) {
  const decide = useDecideRecalculation(organizationId)
  const runsQuery = useRunsQuery(baseYear.inventoryId)
  // a voided run must not be relied on, so it cannot be the recalculated base (spec 05.2)
  const runs = (runsQuery.data ?? []).filter((run) => !run.voided)
  const [runId, setRunId] = useState('')
  const [note, setNote] = useState('')
  const error = decide.isError ? refusalMessage(decide.error, myRole) : undefined
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
          <p className="text-sm text-warning">
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
        <p role="alert" className="mt-2 text-sm font-medium text-danger">
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
