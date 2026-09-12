import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { InputField } from '../../../components/Field'
import { GlassCard } from '../../../components/GlassCard'
import { Modal } from '../../../components/Modal'
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
  useWithdrawFinal,
} from '../useGhg'
import { RoleButton } from './RoleButton'
import type { FreezeBlocker, GateResult, Inventory } from '../api'

const stateCopy: Record<Inventory['status'], string> = {
  DRAFT:
    'Draft. The boundary and the activity view are editable; runs are blocked until the inventory is frozen, which records a boundary version a verifier can trace every run back to.',
  FROZEN:
    'Frozen. The boundary and the activity view are read-only and runs are allowed. Reopen the inventory as a draft to change either.',
  FINAL:
    'Final. A run is designated the final result. Withdraw the designation to reopen the inventory, or publish it to issue the report.',
  PUBLISHED:
    'Published. The report was issued; nothing on this inventory can change. A correction is a new inventory that supersedes this one.',
}

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
 * The inventory's lifecycle (spec 05.1): one state covering both the boundary
 * and the activity view, with the transitions the state allows. Freezing
 * waits for a clean classification and reopening needs a reason (spec 05.5).
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
  const inventoryId = inventory.id
  const freeze = useFreezeInventory(inventoryId)
  const reopen = useReopenInventory(inventoryId)
  const withdraw = useWithdrawFinal(inventoryId)
  const publish = usePublishInventory(inventoryId)
  const supersede = useSupersedeInventory(inventoryId)
  const validationQuery = useValidationQuery(inventoryId)
  const versionsQuery = useBoundaryVersionsQuery(inventoryId)
  const toast = useToast()
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<
    'freeze' | 'reopen' | 'publish' | 'supersede' | 'withdraw' | null
  >(null)
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

  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl">Inventory lifecycle</h2>
            {/* spec 05.5: two numberings, two names; this is the boundary version, the report version prints on the report */}
            {inventory.status !== 'DRAFT' && inventory.currentBoundaryVersionNo !== null && (
              <span className="rounded-full border border-teal/20 px-2.5 py-0.5 font-mono text-xs font-bold tracking-wider text-ink-muted">
                Boundary version {inventory.currentBoundaryVersionNo}
              </span>
            )}
            {inventory.status === 'DRAFT' && versionsCut > 0 && (
              <span className="rounded-full border border-teal/20 px-2.5 py-0.5 font-mono text-xs font-bold tracking-wider text-ink-muted">
                {versionsCut} boundary version{versionsCut === 1 ? '' : 's'} cut
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-muted">{stateCopy[inventory.status]}</p>
          {inventory.finalDesignatedBy && (
            <p className="mt-1 text-xs text-ink-muted">
              Final designated by {inventory.finalDesignatedBy}
              {inventory.finalDesignatedAt
                ? ` on ${new Date(inventory.finalDesignatedAt).toLocaleDateString()}`
                : ''}
              {inventory.finalNote ? `: ${inventory.finalNote}` : ''}
            </p>
          )}
          {inventory.status === 'PUBLISHED' && inventory.publishedAt && (
            <p className="mt-1 text-xs text-ink-muted">
              Published {new Date(inventory.publishedAt).toLocaleString()}.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {inventory.status === 'DRAFT' && (
            <RoleButton
              allowed={mayWrite(myRole)}
              tooltip={WRITE_TOOLTIP}
              className="px-4 py-1.5 text-sm"
              disabled={inBoundaryCount === 0}
              title={inBoundaryCount === 0 ? 'Add at least one facility first' : undefined}
              onClick={() => openDialog('freeze')}
            >
              Freeze inventory
            </RoleButton>
          )}
          {inventory.status === 'FROZEN' && (
            <>
              <RoleButton
                allowed={mayWrite(myRole)}
                tooltip={WRITE_TOOLTIP}
                variant="ghost"
                className="px-4 py-1.5 text-sm"
                onClick={() => {
                  setReopenReason('')
                  openDialog('reopen')
                }}
              >
                Reopen as draft
              </RoleButton>
              <Button className="px-4 py-1.5 text-sm" disabled title="Designate a final run first">
                Publish
              </Button>
            </>
          )}
          {inventory.status === 'FINAL' && (
            <>
              <RoleButton
                allowed={mayApprove(myRole)}
                tooltip={APPROVE_TOOLTIP}
                variant="ghost"
                className="px-4 py-1.5 text-sm"
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
                className="px-4 py-1.5 text-sm"
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
              className="px-4 py-1.5 text-sm"
              onClick={() => openDialog('supersede')}
            >
              Create correction
            </RoleButton>
          )}
        </div>
      </div>

      {dialog === 'freeze' && (
        <Modal title="Freeze the inventory?" onClose={() => setDialog(null)}>
          {/* spec 05.5: the gate summary first, then the sentence that says what the freeze does */}
          {report && (
            <ul aria-label="Gate summary" className="mb-3 flex flex-col gap-0.5 text-sm">
              {report.gates.map((gate) => (
                <li key={gate.gate} className="flex justify-between gap-3">
                  <span>{gateLabels[gate.gate]}</span>
                  <span
                    className={
                      gate.status === 'BLOCKED'
                        ? 'text-red-600'
                        : gate.status === 'WARNINGS'
                          ? 'text-amber-600'
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
            <div role="alert" className="mt-3 text-sm text-red-600">
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
          {mutationError && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-600">
              {mutationError}
            </p>
          )}
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
          {mutationError && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-600">
              {mutationError}
            </p>
          )}
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
          {mutationError && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-600">
              {mutationError}
            </p>
          )}
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
          {mutationError && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-600">
              {mutationError}
            </p>
          )}
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
          {mutationError && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-600">
              {mutationError}
            </p>
          )}
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
    </GlassCard>
  )
}
