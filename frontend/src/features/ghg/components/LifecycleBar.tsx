import { formatDate, formatDateTime, useDateFormat } from '../../../lib/dates'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { InputField } from '../../../components/Field'
import { HelpLink } from '../../../components/HelpLink'
import { Modal } from '../../../components/Modal'
import { Panel, PanelBody, PanelHead } from '../../../components/Panel'
import { useToast } from '../../../components/toast'
import { refusalMessage } from '../../../lib/api'
import { gateLabels } from '../format'
import { APPROVE_TOOLTIP, mayApprove, mayWrite, WRITE_TOOLTIP } from '../roles'
import type { MyRole } from '../roles'
import {
  useBoundaryVersionsQuery,
  useFreezeInventory,
  usePublishInventory,
  useReopenInventory,
  useSupersedeInventory,
  useValidationQuery,
  useReturnToPreparer,
  useWithdrawFinal,
} from '../useGhg'
import { RoleButton } from './RoleButton'
import type { FreezeBlocker, GateResult, Inventory } from '../api'

const stateCopy: Record<Inventory['status'], string> = {
  DRAFT:
    'Draft. The boundary and the activity view are editable; runs are blocked until the inventory is frozen, which records a boundary version a verifier can trace every run back to.',
  FROZEN:
    'Frozen. The boundary and the activity view are read-only and runs are allowed. Reopen the inventory as a draft to change either.',
  IN_REVIEW:
    'In review. A run was submitted for review. A reviewer or owner other than the preparer marks it final, or returns it with a reason.',
  FINAL:
    'Final. A run is designated the final result. Withdraw the designation to reopen the inventory, or publish it to issue the report.',
  PUBLISHED:
    'Published. The report was issued; nothing on this inventory can change. A correction is a new inventory that supersedes this one.',
}

/** The five states in the order the inventory passes through them (specs 05.1, 05.8). */
const states: { status: Inventory['status']; label: string }[] = [
  { status: 'DRAFT', label: 'Draft' },
  { status: 'FROZEN', label: 'Frozen' },
  { status: 'IN_REVIEW', label: 'In review' },
  { status: 'FINAL', label: 'Final' },
  { status: 'PUBLISHED', label: 'Published' },
]

/**
 * Why the freeze would be refused, in one sentence (spec 05.5): the common
 * case names the unclassified records; drafts and mixed problems say so.
 */
export function describeFreezeBlockers(blockers: FreezeBlocker[]): string | null {
  if (blockers.length === 0) return null
  const n = blockers.length
  const plural = n === 1 ? '' : 's'
  if (blockers.every((blocker) => blocker.problem === 'is not classified')) {
    return `${n} record${plural} ${n === 1 ? 'is' : 'are'} not classified; classify or exclude ${n === 1 ? 'it' : 'them'} first`
  }
  if (blockers.every((blocker) => blocker.problem.startsWith('is a draft'))) {
    return `${n} draft record${plural} at facilities in the boundary ${n === 1 ? 'is' : 'are'} not entered; complete or remove ${n === 1 ? 'it' : 'them'} first`
  }
  return `${n} record${plural} block${n === 1 ? 's' : ''} the freeze; classify, justify or exclude ${n === 1 ? 'it' : 'them'} first`
}

/**
 * The boundary finding the freeze itself clears (spec 05.1). The dialog that
 * asks to freeze leaves it out, or every draft would read as one error.
 */
const DRAFT_FINDING = 'The inventory is a draft. Freeze it to enable a run.'

function clearedByFreeze(gate: GateResult): GateResult {
  return { ...gate, findings: gate.findings.filter((finding) => finding.message !== DRAFT_FINDING) }
}

/** "2 errors, 1 warning" for a gate, or "passes". */
function summarizeGate(gate: GateResult): string {
  const errors = gate.findings.filter((finding) => finding.severity === 'ERROR').length
  const warnings = gate.findings.filter((finding) => finding.severity === 'WARNING').length
  const parts = []
  if (errors > 0) parts.push(`${errors} error${errors === 1 ? '' : 's'}`)
  if (warnings > 0) parts.push(`${warnings} warning${warnings === 1 ? '' : 's'}`)
  return parts.length === 0 ? 'passes' : parts.join(', ')
}

/**
 * The lifecycle's acts and the dialogs behind them (spec 05.1, 05.5). The
 * page puts the buttons in its title row beside the pre-flight chip (spec
 * 10) and renders the dialogs once; the standalone bar below uses the same
 * hook so a test of the bar alone still has every act in reach.
 */
export function useLifecycleActions(
  inventory: Inventory,
  inBoundaryCount: number,
  myRole?: MyRole | null,
): { actions: ReactNode; dialogs: ReactNode; versionsCut: number } {
  const inventoryId = inventory.id
  const freeze = useFreezeInventory(inventoryId)
  const reopen = useReopenInventory(inventoryId)
  const withdraw = useWithdrawFinal(inventoryId)
  const returnToPreparer = useReturnToPreparer(inventoryId)
  const publish = usePublishInventory(inventoryId)
  const supersede = useSupersedeInventory(inventoryId)
  const validationQuery = useValidationQuery(inventoryId)
  const versionsQuery = useBoundaryVersionsQuery(inventoryId)
  const toast = useToast()
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<
    'freeze' | 'reopen' | 'publish' | 'supersede' | 'withdraw' | 'return' | null
  >(null)
  const [returnReason, setReturnReason] = useState('')
  const [correctionName, setCorrectionName] = useState(`${inventory.name} (correction)`)
  const [withdrawReason, setWithdrawReason] = useState('')
  const [reopenReason, setReopenReason] = useState('')
  const [correctionReason, setCorrectionReason] = useState('')
  const [mutationError, setMutationError] = useState<string | null>(null)

  const report = validationQuery.data
  const blockers = report?.freezeBlockers ?? []
  const freezeRefusal = describeFreezeBlockers(blockers)
  const versionsCut = versionsQuery.data?.length ?? 0
  const nextVersionNo = versionsCut + 1

  // spec 01.4: the refusal stays under the dialog's fields; the dialog stays open with what was typed
  const openDialog = (which: NonNullable<typeof dialog>) => {
    setMutationError(null)
    setDialog(which)
  }
  const fail = (error: unknown) => setMutationError(refusalMessage(error, myRole))

  const actions = (
    <>
      {inventory.status === 'DRAFT' && (
        <RoleButton
          allowed={mayWrite(myRole)}
          tooltip={WRITE_TOOLTIP}
          disabled={inBoundaryCount === 0}
          title={inBoundaryCount === 0 ? 'Add at least one facility first' : undefined}
          onClick={() => openDialog('freeze')}
        >
          Freeze inventory
        </RoleButton>
      )}
      {(inventory.status === 'FROZEN' || inventory.status === 'IN_REVIEW') && (
        <>
          <RoleButton
            allowed={mayWrite(myRole)}
            tooltip={WRITE_TOOLTIP}
            variant="secondary"
            onClick={() => {
              setReopenReason('')
              openDialog('reopen')
            }}
          >
            Reopen as draft
          </RoleButton>
          {/* spec 05.8: the approver may send the submission back with a reason */}
          {inventory.status === 'IN_REVIEW' && (
            <RoleButton
              allowed={mayApprove(myRole)}
              tooltip={APPROVE_TOOLTIP}
              variant="secondary"
              onClick={() => {
                setReturnReason('')
                openDialog('return')
              }}
            >
              Return to preparer
            </RoleButton>
          )}
          <Button
            disabled
            title={
              inventory.status === 'IN_REVIEW'
                ? 'Mark the submitted run as final first'
                : 'Submit a run for review and have it marked final first'
            }
          >
            Publish
          </Button>
        </>
      )}
      {inventory.status === 'FINAL' && (
        <>
          <RoleButton
            allowed={mayApprove(myRole)}
            tooltip={APPROVE_TOOLTIP}
            variant="secondary"
            onClick={() => {
              setWithdrawReason('')
              openDialog('withdraw')
            }}
          >
            Withdraw final designation
          </RoleButton>
          <RoleButton
            allowed={mayApprove(myRole)}
            tooltip={APPROVE_TOOLTIP}
            onClick={() => openDialog('publish')}
          >
            Publish
          </RoleButton>
        </>
      )}
      {inventory.status === 'PUBLISHED' && !inventory.supersededById && (
        <RoleButton
          allowed={mayApprove(myRole)}
          tooltip={APPROVE_TOOLTIP}
          onClick={() => openDialog('supersede')}
        >
          Create correction
        </RoleButton>
      )}
    </>
  )

  const errorLine = mutationError && (
    <p role="alert" className="mt-3 text-sm font-medium text-danger">
      {mutationError}
    </p>
  )

  const dialogs = (
    <>
      {dialog === 'freeze' && (
        <Modal title="Freeze the inventory?" onClose={() => setDialog(null)}>
          {/* spec 05.5: the gate summary first, then the sentence that says what the freeze does */}
          {report && (
            <ul aria-label="Gate summary" className="mb-3 flex flex-col gap-0.5 text-sm">
              {report.gates.map(clearedByFreeze).map((gate) => (
                <li key={gate.gate} className="flex justify-between gap-3">
                  <span>{gateLabels[gate.gate]}</span>
                  <span
                    className={
                      gate.findings.some((finding) => finding.severity === 'ERROR')
                        ? 'text-danger'
                        : gate.findings.some((finding) => finding.severity === 'WARNING')
                          ? 'text-warning'
                          : 'text-ink-muted'
                    }
                  >
                    {summarizeGate(gate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm text-ink-muted">
            This freezes the boundary and the activity view together and cuts boundary version{' '}
            {nextVersionNo}: an immutable record of the {inBoundaryCount}{' '}
            {inBoundaryCount === 1 ? 'facility' : 'facilities'} currently in the boundary with their
            accounting shares. Calculation runs will cite this version. You can reopen the inventory
            later with a reason; the version is kept.
          </p>
          {freezeRefusal && (
            <div role="alert" className="mt-3 text-sm text-danger">
              <p className="font-medium">{freezeRefusal}.</p>
              <ul className="mt-1 list-disc pl-5 text-xs">
                {blockers.slice(0, 5).map((blocker) => (
                  <li key={blocker.activityId}>
                    {blocker.recordRef} '{blocker.activityType}' at {blocker.facilityName}{' '}
                    {blocker.problem}
                  </li>
                ))}
                {blockers.length > 5 && <li>and {blockers.length - 5} more</li>}
              </ul>
            </div>
          )}
          {errorLine}
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              busy={freeze.isPending}
              disabled={!!freezeRefusal}
              title={freezeRefusal ?? undefined}
              onClick={() =>
                freeze.mutate(undefined, {
                  onSuccess: (version) => {
                    setDialog(null)
                    toast(`Inventory frozen as boundary version ${version.version.versionNo}.`)
                  },
                  onError: fail,
                })
              }
            >
              Freeze inventory
            </Button>
          </div>
        </Modal>
      )}

      {dialog === 'reopen' && (
        <Modal title="Reopen as a draft?" onClose={() => setDialog(null)}>
          <p className="text-sm text-ink-muted">
            The boundary and the activity view become editable again. Boundary version{' '}
            {inventory.currentBoundaryVersionNo ?? versionsCut} stays on the record with your
            reason, and the next freeze cuts a new boundary version.
          </p>
          <div className="mt-4">
            <InputField
              label="Reason"
              placeholder="What the draft will change, for example: instruments added for Nkran"
              value={reopenReason}
              onChange={(event) => setReopenReason(event.target.value)}
              minLength={10}
              maxLength={500}
              required
            />
          </div>
          {errorLine}
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={reopenReason.trim().length < 10}
              busy={reopen.isPending}
              onClick={() =>
                reopen.mutate(reopenReason.trim(), {
                  onSuccess: () => {
                    setDialog(null)
                    toast('Inventory reopened as a draft.')
                  },
                  onError: fail,
                })
              }
            >
              Reopen as draft
            </Button>
          </div>
        </Modal>
      )}

      {dialog === 'return' && (
        <Modal title="Return the inventory to the preparer?" onClose={() => setDialog(null)}>
          <p className="text-sm text-ink-muted">
            The submission is cleared and the inventory returns to frozen. Your reason is recorded
            in the inventory's history; the preparer submits a run again when it is ready.
          </p>
          <div className="mt-4">
            <InputField
              label="Reason"
              placeholder="What the preparer should address, for example: the June invoice is missing"
              value={returnReason}
              onChange={(event) => setReturnReason(event.target.value)}
              minLength={5}
              maxLength={500}
              required
            />
          </div>
          {errorLine}
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={returnReason.trim().length < 5}
              busy={returnToPreparer.isPending}
              onClick={() =>
                returnToPreparer.mutate(returnReason.trim(), {
                  onSuccess: () => {
                    setDialog(null)
                    toast('Inventory returned to the preparer.')
                  },
                  onError: fail,
                })
              }
            >
              Return to preparer
            </Button>
          </div>
        </Modal>
      )}

      {dialog === 'withdraw' && (
        <Modal title="Withdraw the final designation?" onClose={() => setDialog(null)}>
          <p className="text-sm text-ink-muted">
            The run stays on the record; the inventory returns to frozen. The withdrawal and your
            reason are recorded in the inventory's history (spec 05.2).
          </p>
          <div className="mt-4">
            <InputField
              label="Reason"
              placeholder="Why the final run must be replaced"
              value={withdrawReason}
              onChange={(event) => setWithdrawReason(event.target.value)}
              minLength={5}
              maxLength={500}
              required
            />
          </div>
          {errorLine}
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={withdrawReason.trim().length < 5}
              busy={withdraw.isPending}
              onClick={() =>
                withdraw.mutate(withdrawReason.trim(), {
                  onSuccess: () => {
                    setDialog(null)
                    toast('Final designation withdrawn.')
                  },
                  onError: fail,
                })
              }
            >
              Withdraw designation
            </Button>
          </div>
        </Modal>
      )}

      {dialog === 'publish' && (
        <Modal title="Publish the inventory?" onClose={() => setDialog(null)}>
          <p className="text-sm text-ink-muted">
            Publishing issues the report; nothing on this inventory can change afterwards. A
            correction is a new inventory that supersedes it.
          </p>
          {errorLine}
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              busy={publish.isPending}
              onClick={() =>
                publish.mutate(undefined, {
                  onSuccess: () => {
                    setDialog(null)
                    toast('Inventory published.')
                  },
                  onError: fail,
                })
              }
            >
              Publish
            </Button>
          </div>
        </Modal>
      )}

      {dialog === 'supersede' && (
        <Modal title="Create a correction" onClose={() => setDialog(null)}>
          <p className="text-sm text-ink-muted">
            A correction is a new draft inventory over the same period and approach. It inherits
            this inventory's boundary, instruments, declaration and every classification and
            exclusion, so only what was wrong needs changing. Chapter 5 wants the reason stated; the
            correction's report prints it with what changed.
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <InputField
              label="Name"
              value={correctionName}
              onChange={(event) => setCorrectionName(event.target.value)}
              required
            />
            <InputField
              label="Reason for the correction"
              placeholder="LPG at the camp was recorded in kg as litres"
              value={correctionReason}
              onChange={(event) => setCorrectionReason(event.target.value)}
              minLength={10}
              maxLength={1000}
              required
            />
          </div>
          {errorLine}
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              busy={supersede.isPending}
              disabled={correctionReason.trim().length < 10}
              onClick={() =>
                supersede.mutate(
                  { name: correctionName, reason: correctionReason.trim() },
                  {
                    onSuccess: (successor) => {
                      setDialog(null)
                      toast(`${successor.name} created as a correction.`)
                      void navigate(`../${successor.id}`, { relative: 'path' })
                    },
                    onError: fail,
                  },
                )
              }
            >
              Create correction
            </Button>
          </div>
        </Modal>
      )}
    </>
  )

  return { actions, dialogs, versionsCut }
}

/**
 * The inventory's lifecycle (spec 05.1) with its own acts and dialogs: the
 * panel below, fed by `useLifecycleActions`. The workbench calls the hook
 * itself, puts the acts in its title row (spec 10) and renders the panel.
 */
export function LifecycleBar({
  inventory,
  inBoundaryCount,
  myRole,
}: {
  inventory: Inventory
  inBoundaryCount: number
  myRole?: MyRole | null
}) {
  const lifecycle = useLifecycleActions(inventory, inBoundaryCount, myRole)
  return (
    <LifecyclePanel
      inventory={inventory}
      versionsCut={lifecycle.versionsCut}
      actions={lifecycle.actions}
      dialogs={lifecycle.dialogs}
    />
  )
}

/**
 * One state covering both the boundary and the activity view, drawn as the
 * four states on a line (spec 10), with the state's copy and the designation
 * and publication lines under it. Freezing waits for a clean classification
 * and reopening needs a reason (spec 05.5).
 */
export function LifecyclePanel({
  inventory,
  versionsCut,
  actions,
  dialogs,
}: {
  inventory: Inventory
  versionsCut: number
  /** the acts, when they render in the panel's head rather than the page's title row */
  actions?: ReactNode
  dialogs?: ReactNode
}) {
  const dateFormat = useDateFormat()
  const current = states.findIndex((state) => state.status === inventory.status)

  return (
    <Panel>
      <PanelHead
        title={
          <span className="inline-flex items-center gap-2">
            Inventory lifecycle
            <HelpLink topic="lifecycle" />
          </span>
        }
      >
        {/* spec 05.5: two numberings, two names; this is the boundary version, the report version prints on the report */}
        {inventory.status !== 'DRAFT' && inventory.currentBoundaryVersionNo !== null && (
          <span className="text-[13px] font-medium tracking-wider text-ink-muted">
            Boundary version {inventory.currentBoundaryVersionNo}
          </span>
        )}
        {inventory.status === 'DRAFT' && versionsCut > 0 && (
          <span className="text-[13px] font-medium tracking-wider text-ink-muted">
            {versionsCut} boundary version{versionsCut === 1 ? '' : 's'} cut
          </span>
        )}
        {actions}
      </PanelHead>
      <PanelBody>
        <ol aria-label="Lifecycle" className="flex items-center py-1">
          {states.map((state, index) => {
            const done = index < current
            const now = index === current
            return (
              <li
                key={state.status}
                aria-current={now ? 'step' : undefined}
                className={`flex items-center text-sm whitespace-nowrap ${index > 0 ? 'flex-1' : ''} ${
                  now ? 'font-semibold text-ink' : done ? 'text-ink' : 'text-ink-muted'
                }`}
              >
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className="mx-2.5 h-px min-w-6 flex-1 bg-hairline-strong"
                  />
                )}
                <span
                  aria-hidden="true"
                  className={`mr-2 size-2.5 shrink-0 rounded-full border-2 ${
                    done
                      ? 'border-primary bg-primary'
                      : now
                        ? 'border-primary bg-surface'
                        : 'border-hairline-strong bg-surface'
                  }`}
                />
                {state.label}
              </li>
            )
          })}
        </ol>
        <p className="mt-2 text-sm text-ink-muted">{stateCopy[inventory.status]}</p>
        {/* spec 05.8: who put the run forward, when, and their note for the approver */}
        {inventory.status === 'IN_REVIEW' && inventory.signOff.submittedBy && (
          <p className="mt-2 text-sm">
            Submitted for review by{' '}
            {inventory.signOff.submittedBy.name ?? inventory.signOff.submittedBy.email}
            {inventory.signOff.submittedAt
              ? ` on ${formatDate(inventory.signOff.submittedAt, dateFormat)}`
              : ''}
            {inventory.signOff.submitNote ? `: ${inventory.signOff.submitNote}` : ''}
          </p>
        )}
        {inventory.finalDesignatedBy && (
          <p className="mt-2 text-sm">
            Final designated by {inventory.finalDesignatedBy}
            {inventory.finalDesignatedAt
              ? ` on ${formatDate(inventory.finalDesignatedAt, dateFormat)}`
              : ''}
            {inventory.finalNote ? `: ${inventory.finalNote}` : ''}
            {inventory.finalSelfApproved
              ? ' (self-approved: nobody else in the organization could check it)'
              : ''}
          </p>
        )}
        {inventory.status === 'PUBLISHED' && inventory.publishedAt && (
          <p className="mt-2 text-sm">
            Published {formatDateTime(inventory.publishedAt, dateFormat)}.
          </p>
        )}
      </PanelBody>
      {dialogs}
    </Panel>
  )
}
