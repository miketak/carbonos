import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField, SelectField } from '../../../components/Field'
import { GlassCard } from '../../../components/GlassCard'
import { useToast } from '../../../components/toast'
import { problemDetail } from '../../../lib/api'
import { useAddMember, useChangeMemberRole, useMembersQuery, useRemoveMember } from '../useGhg'
import type { OrgRole, Organization } from '../api'

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
  const canManage = organization.myRole === 'OWNER' || organization.myRole === 'ADMIN'
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrgRole>('PREPARER')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    add.mutate(
      { email: email.trim(), role },
      {
        onSuccess: (member) => {
          setEmail('')
          toast(
            `${member.displayName} added as ${roleLabels[member.role].split(' (')[0].toLowerCase()}.`,
          )
        },
        onError: (error) => toast(problemDetail(error) ?? 'Could not add the member.', 'error'),
      },
    )
  }

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl">Members</h2>
      <p className="text-sm text-ink-muted">
        Who works on this organization and in which role. Preparers record, classify and run;
        reviewers also designate final runs, publish and create corrections; verifiers read only.
        Every act is recorded under the member's own email.
        {organization.myRole &&
          ` Your role: ${roleLabels[organization.myRole as OrgRole] ?? organization.myRole}.`}
      </p>
      {membersQuery.data && membersQuery.data.length > 0 && (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
              <th className="px-3 py-2 font-semibold">Member</th>
              <th className="px-3 py-2 font-semibold">Role</th>
              {canManage && <th className="px-3 py-2" />}
            </tr>
          </thead>
          <tbody>
            {membersQuery.data.map((member) => (
              <tr key={member.id} className="border-b border-teal/5 last:border-0">
                <td className="px-3 py-2">
                  <span className="font-medium">{member.displayName}</span>
                  <span className="block text-xs text-ink-muted">{member.email}</span>
                </td>
                <td className="px-3 py-2">
                  {canManage ? (
                    <select
                      aria-label={`Role of ${member.displayName}`}
                      value={member.role}
                      onChange={(event) =>
                        changeRole.mutate(
                          { memberId: member.id, role: event.target.value as OrgRole },
                          {
                            onError: (error) =>
                              toast(problemDetail(error) ?? 'Could not change the role.', 'error'),
                          },
                        )
                      }
                      className="rounded-lg border border-teal/40 bg-white/70 px-2 py-1 text-sm"
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
                </td>
                {canManage && (
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="ghost"
                      className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      aria-label={`Remove ${member.displayName}`}
                      onClick={() =>
                        remove.mutate(member.id, {
                          onError: (error) =>
                            toast(problemDetail(error) ?? 'Could not remove the member.', 'error'),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {canManage && (
        <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-3 md:items-end" noValidate>
          <InputField
            label="Email of an existing account"
            type="email"
            placeholder="abena@client.example"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
            className="px-4 py-1.5 text-sm"
            busy={add.isPending}
            disabled={email.trim() === ''}
          >
            Add member
          </Button>
        </form>
      )}
    </GlassCard>
  )
}
