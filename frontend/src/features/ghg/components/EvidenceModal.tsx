import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import type { EvidenceOwner } from '../api'
import { EvidencePanel } from './EvidencePanel'

/** The evidence panel in a modal, for instruments and anywhere without a drawer (spec 04.4). */
export function EvidenceModal({
  owner,
  organizationId,
  title,
  editable,
  onClose,
}: {
  owner: EvidenceOwner
  organizationId: string
  title: string
  editable: boolean
  onClose: () => void
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <EvidencePanel owner={owner} organizationId={organizationId} editable={editable} />
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  )
}
