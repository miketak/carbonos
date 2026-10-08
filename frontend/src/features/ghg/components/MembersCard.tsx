import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/Button'
import { InputField, SelectField } from '../../../components/Field'
import { HelpLink } from '../../../components/HelpLink'
import { Panel, PanelHead } from '../../../components/Panel'
import { Table, Td, Th, TwoLine } from '../../../components/Table'
import { useToast } from '../../../components/toast'
import { ApiError, refusalMessage } from '../../../lib/api'
import { useSession } from '../../auth/useSession'
import { mayManageMembership } from '../roles'
import { useAddMember, useChangeMemberRole, useMembersQuery, useRemoveMember } from '../useGhg'
import type { OrgRole, Organization } from '../api'

/** Spec 01.4: the email typed has no platform account yet. */
const UNKNOWN_EMAIL = 'No account with that email.'

export const roleLabels: Record<OrgRole, string> = {
  OWNER: 'Owner',
  REVIEWER: 'Reviewer (approves and publishes)',
  PREPARER: 'Preparer (records, classifies, runs)',
  VERIFIER: 'Verifier (read-only)',
}

/**
 * The organization's members and their roles (spec 01.2). Owners add platform
 * accounts by email, set roles and remove members; every act on an inventory
 * is recorded under the member's own email.
 */
export function MembersCard({ organization }: { organization: Organization }) {
  const membersQuery = useMembersQuery(organization.id)
  const add = useAddMember(organization.id)
  const changeRole = useChangeMemberRole(organization.id)
  const remove = useRemoveMember(organization.id)
  const toast = useToast()
  const session = useSession()
  // spec 01.3: support access never grants membership changes, so an owner by membership only
  const canManage = mayManageMembership(organization.myRole)
  const isPlatformAdmin = session.data?.role === 'ADMIN'
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrgRole>('PREPARER')
  const [addError, setAddError] = useState<string | null>(null)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setAddError(null)
    add.mutate(
      { email: email.trim(), role },
      {
        onSuccess: (member) => {
          setEmail('')
          toast(
            `${member.displayName} added as ${roleLabels[member.role].split(' (')[0].toLowerCase()}.`,
          )
        },
        // spec 01.4: an unknown email keeps what was typed and says what to do about it
        onError: (error) =>
          setAddError(
            error instanceof ApiError && error.status === 404
              ? UNKNOWN_EMAIL
              : refusalMessage(error, organization.myRole),
          ),
      },
    )
  }

  return (
    <Panel>
      <PanelHead
        title="Members"
        description={`Who works on this organization and in which role. Preparers record, classify and run; reviewers also designate final runs, publish and create corrections; verifiers read only. Every act is recorded under the member's own email.${
          organization.myRole
            ? ` Your role: ${roleLabels[organization.myRole as OrgRole] ?? organization.myRole}.`
            : ''
        }`}
      >
        <HelpLink topic="roles" />
      </PanelHead>
      {membersQuery.data && membersQuery.data.length > 0 && (
        <Table className={canManage ? '[&_tbody_tr:last-child_td]:border-b-0' : ''}>
          <thead>
            <tr>
              <Th>Member</Th>
              <Th>Role</Th>
              {canManage && <Th className="w-28" />}
            </tr>
          </thead>
          <tbody>
            {membersQuery.data.map((member) => (
              <tr key={member.id}>
                <Td>
                  <TwoLine primary={member.displayName} secondary={member.email} />
                </Td>
                <Td>
                  {canManage ? (
                    <select
                      aria-label={`Role of ${member.displayName}`}
                      value={member.role}
                      onChange={(event) =>
                        changeRole.mutate(
                          { memberId: member.id, role: event.target.value as OrgRole },
                          {
                            onError: (error) =>
                              toast(refusalMessage(error, organization.myRole), 'error'),
                          },
                        )
                      }
                      className="min-h-9 min-w-40 rounded-lg border border-hairline-strong bg-surface px-2 text-sm text-ink transition-colors duration-150 focus:border-primary focus:ring-2 focus:ring-focus/40 focus:outline-none"
                    >
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    roleLabels[member.role]
                  )}
                </Td>
                {canManage && (
                  <Td align="right">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove ${member.displayName}`}
                      onClick={() =>
                        remove.mutate(member.id, {
                          onError: (error) =>
                            toast(refusalMessage(error, organization.myRole), 'error'),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </Td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {canManage && (
        <form
          onSubmit={submit}
          className="grid gap-3 border-t border-hairline p-5 md:grid-cols-[1.6fr_1.2fr_auto] md:items-end"
          noValidate
        >
          <InputField
            label="Email of an existing account"
            type="email"
            placeholder="abena@client.example"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={addError !== null}
            required
          />
          <SelectField
            label="Role"
            value={role}
            onChange={(event) => setRole(event.target.value as OrgRole)}
          >
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          <Button
            type="submit"
            variant="secondary"
            busy={add.isPending}
            disabled={email.trim() === ''}
          >
            Add member
          </Button>
          {addError && (
            <p role="alert" className="text-[13px] font-medium text-danger md:col-span-3">
              {addError === UNKNOWN_EMAIL ? (
                isPlatformAdmin ? (
                  <>
                    No account with that email. Add the user under{' '}
                    <Link to="/admin/users" className="font-semibold underline">
                      Manage users
                    </Link>{' '}
                    first.
                  </>
                ) : (
                  'No account with that email. Ask a platform administrator to add the user first.'
                )
              ) : (
                addError
              )}
            </p>
          )}
        </form>
      )}
    </Panel>
  )
}
