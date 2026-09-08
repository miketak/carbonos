import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { InputField } from '../../../components/Field'
import { GlassCard } from '../../../components/GlassCard'
import { Modal } from '../../../components/Modal'
import { useToast } from '../../../components/toast'
import { problemDetail } from '../../../lib/api'
import {
  useFreezeInventory,
  usePublishInventory,
  useReopenInventory,
  useSupersedeInventory,
  useWithdrawFinal,
} from '../useGhg'
import type { Inventory } from '../api'

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
 * The inventory's lifecycle (spec 05.1): one state covering both the boundary
 * and the activity view, with the transitions the state allows.
 */
export function LifecycleBar({
  inventory,
  inBoundaryCount,
}: {
  inventory: Inventory
  inBoundaryCount: number
}) {
  const inventoryId = inventory.id
  const freeze = useFreezeInventory(inventoryId)
  const reopen = useReopenInventory(inventoryId)
  const withdraw = useWithdrawFinal(inventoryId)
  const publish = usePublishInventory(inventoryId)
  const supersede = useSupersedeInventory(inventoryId)
  const toast = useToast()
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<'freeze' | 'publish' | 'supersede' | null>(null)
  const [correctionName, setCorrectionName] = useState(`${inventory.name} (correction)`)

  const fail = (fallback: string) => (error: unknown) => {
    setDialog(null)
    toast(problemDetail(error) ?? fallback, 'error')
  }

  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl">Inventory lifecycle</h2>
          <p className="mt-1 text-sm text-ink-muted">{stateCopy[inventory.status]}</p>
          {inventory.status === 'PUBLISHED' && inventory.publishedAt && (
            <p className="mt-1 text-xs text-ink-muted">
              Published {new Date(inventory.publishedAt).toLocaleString()}.
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {inventory.status === 'DRAFT' && (
            <Button
              className="px-4 py-1.5 text-sm"
              disabled={inBoundaryCount === 0}
              title={inBoundaryCount === 0 ? 'Add at least one facility first' : undefined}
              onClick={() => setDialog('freeze')}
            >
              Freeze inventory
            </Button>
          )}
          {inventory.status === 'FROZEN' && (
            <>
              <Button
                variant="ghost"
                className="px-4 py-1.5 text-sm"
                busy={reopen.isPending}
                onClick={() =>
                  reopen.mutate(undefined, {
                    onSuccess: () => toast('Inventory reopened as a draft.'),
                    onError: fail('Could not reopen the inventory.'),
                  })
                }
              >
                Reopen as draft
              </Button>
              <Button className="px-4 py-1.5 text-sm" disabled title="Designate a final run first">
                Publish
              </Button>
            </>
          )}
          {inventory.status === 'FINAL' && (
            <>
              <Button
                variant="ghost"
                className="px-4 py-1.5 text-sm"
                busy={withdraw.isPending}
                onClick={() =>
                  withdraw.mutate(undefined, {
                    onSuccess: () => toast('Final designation withdrawn.'),
                    onError: fail('Could not withdraw the designation.'),
                  })
                }
              >
                Withdraw final designation
              </Button>
              <Button className="px-4 py-1.5 text-sm" onClick={() => setDialog('publish')}>
                Publish
              </Button>
            </>
          )}
          {inventory.status === 'PUBLISHED' && !inventory.supersededById && (
            <Button className="px-4 py-1.5 text-sm" onClick={() => setDialog('supersede')}>
              Create correction
            </Button>
          )}
        </div>
      </div>

      {dialog === 'freeze' && (
        <Modal title="Freeze the inventory?" onClose={() => setDialog(null)}>
          <p className="text-sm text-ink-muted">
            This freezes the boundary and the activity view together and cuts boundary version{' '}
            {(inventory.currentBoundaryVersionNo ?? 0) + 1}: an immutable record of the{' '}
            {inBoundaryCount} {inBoundaryCount === 1 ? 'facility' : 'facilities'} currently in the
            boundary with their accounting shares. Calculation runs will cite this version. You can
            reopen the inventory later; the version is kept.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              busy={freeze.isPending}
              onClick={() =>
                freeze.mutate(undefined, {
                  onSuccess: (version) => {
                    setDialog(null)
                    toast(`Inventory frozen as boundary v${version.version.versionNo}.`)
                  },
                  onError: fail('Could not freeze the inventory.'),
                })
              }
            >
              Freeze inventory
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
                  onError: fail('Could not publish the inventory.'),
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
            A correction is a new draft inventory over the same period and approach, starting from
            this inventory's boundary. This inventory stays published and points to the correction.
          </p>
          <div className="mt-4">
            <InputField
              label="Name"
              value={correctionName}
              onChange={(event) => setCorrectionName(event.target.value)}
              required
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              busy={supersede.isPending}
              onClick={() =>
                supersede.mutate(correctionName, {
                  onSuccess: (successor) => {
                    setDialog(null)
                    toast(`${successor.name} created as a correction.`)
                    void navigate(`../${successor.id}`, { relative: 'path' })
                  },
                  onError: fail('Could not create the correction.'),
                })
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
