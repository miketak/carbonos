import { useState } from 'react'
import { SelectField } from '../../../components/Field'
import { Panel, PanelBody, PanelHead } from '../../../components/Panel'
import { useToast } from '../../../components/toast'
import { refusalMessage } from '../../../lib/api'
import { roleShortLabels } from '../format'
import { APPROVE_TOOLTIP, mayApprove } from '../roles'
import type { MyRole } from '../roles'
import { useMembersQuery, useSaveSignOff } from '../useGhg'
import { RoleButton } from './RoleButton'
import type { Inventory, OrganizationMember } from '../api'

/**
 * Who prepares this inventory and who signs it off (spec 05.8). Naming either
 * narrows who may act, within the organization roles; leaving it open lets
 * anyone whose role allows it act, and the acts record who did. A Reviewer or
 * Owner assigns, until the inventory is published.
 */
export function SignOffCard({
  inventory,
  myRole,
}: {
  inventory: Inventory
  myRole?: MyRole | null
}) {
  const membersQuery = useMembersQuery(inventory.organizationId)
  const save = useSaveSignOff(inventory.id)
  const toast = useToast()
  const [preparer, setPreparer] = useState(inventory.signOff.preparer?.userId ?? '')
  const [approver, setApprover] = useState(inventory.signOff.approver?.userId ?? '')
  const [error, setError] = useState<string | null>(null)

  const members = membersQuery.data ?? []
  const writers = members.filter((member) => member.role !== 'VERIFIER')
  const approvers = members.filter(
    (member) => member.role === 'OWNER' || member.role === 'REVIEWER',
  )
  const published = inventory.status === 'PUBLISHED'
  const unchanged =
    preparer === (inventory.signOff.preparer?.userId ?? '') &&
    approver === (inventory.signOff.approver?.userId ?? '')

  const option = (member: OrganizationMember) => (
    <option key={member.userId} value={member.userId}>
      {member.displayName || member.email} ({roleShortLabels[member.role]})
    </option>
  )

  return (
    <Panel>
      <PanelHead
        title="Sign-off"
        description="Who prepares this inventory and who signs it off. Left open, anyone whose role allows it may act. The person who submits a run never signs it off while someone else in the organization can."
      />
      <PanelBody>
        <div className="grid gap-5 md:grid-cols-2">
          <SelectField
            label="Preparer"
            value={preparer}
            disabled={published}
            onChange={(event) => {
              setError(null)
              setPreparer(event.target.value)
            }}
          >
            <option value="">Anyone who may prepare</option>
            {writers.map(option)}
          </SelectField>
          <SelectField
            label="Approver"
            value={approver}
            disabled={published}
            onChange={(event) => {
              setError(null)
              setApprover(event.target.value)
            }}
          >
            <option value="">Anyone who may approve</option>
            {approvers.map(option)}
          </SelectField>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        {!published && (
          <div className="mt-4 flex justify-end">
            <RoleButton
              allowed={mayApprove(myRole)}
              tooltip={APPROVE_TOOLTIP}
              disabled={unchanged}
              busy={save.isPending}
              onClick={() =>
                save.mutate(
                  { preparerUserId: preparer || null, approverUserId: approver || null },
                  {
                    onSuccess: () => toast('Sign-off saved.'),
                    onError: (failure) => setError(refusalMessage(failure, myRole)),
                  },
                )
              }
            >
              Save sign-off
            </RoleButton>
          </div>
        )}
      </PanelBody>
    </Panel>
  )
}
