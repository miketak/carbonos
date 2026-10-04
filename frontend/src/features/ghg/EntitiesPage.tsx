import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Chip } from '../../components/Chip'
import { PageHeader } from '../../components/PageHeader'
import { Skeleton } from '../../components/Skeleton'
import { Table, TableFooter, Td, Th, TwoLine } from '../../components/Table'
import { useToast } from '../../components/toast'
import { refusalMessage } from '../../lib/api'
import { RemoveDialog } from './components/RemoveDialog'
import { RoleButton } from './components/RoleButton'
import { relationshipShortLabels } from './format'
import { mayWrite, WRITE_TOOLTIP } from './roles'
import { useDeleteEntity, useEntitiesQuery, useOrganizationQuery } from './useGhg'
import type { Entity } from './api'

type Dialog = { kind: 'remove'; entity: Entity } | null

function percent(share: number): string {
  return `${Math.round(share * 100)}%`
}

/** The organization's legal entities: the structures it consolidates, with Table 1 facts (spec 03.1). */
export function EntitiesPage() {
  const { organizationId = '' } = useParams()
  const entitiesQuery = useEntitiesQuery(organizationId)
  const organizationQuery = useOrganizationQuery(organizationId)
  const deleteEntity = useDeleteEntity(organizationId)
  const toast = useToast()
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<Dialog>(null)

  const entities = entitiesQuery.data
  const myRole = organizationQuery.data?.myRole ?? null

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        back={{ to: `/app/ghg/${organizationId}` }}
        crumbs={[{ label: 'Legal entities' }]}
        title="Legal entities"
        subtitle="The structures the company consolidates. Each facility belongs to one; Table 1 of the GHG Protocol turns the relationship into an accounting share under each approach."
        actions={
          <RoleButton
            allowed={mayWrite(myRole)}
            tooltip={WRITE_TOOLTIP}
            onClick={() => navigate('new')}
          >
            Add entity
          </RoleButton>
        }
      />
      <p className="text-[13px] text-ink-muted">
        Equity share, financial control and operational control are calculated from each
        entity&apos;s relationship, economic interest, operation, financial control and parent; edit
        those facts to change them.
      </p>

      {entitiesQuery.isPending && (
        <div aria-label="Loading legal entities" className="flex flex-col gap-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      )}
      {entities && entities.length > 0 && (
        <div>
          <Table>
            <thead>
              <tr>
                <Th>Entity</Th>
                <Th>Relationship</Th>
                <Th align="right">Economic interest</Th>
                <Th align="right">Legal ownership</Th>
                <Th>Operated</Th>
                <Th align="right">Equity share</Th>
                <Th align="right">Financial ctrl</Th>
                <Th align="right">Operational ctrl</Th>
                <Th className="w-40">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {entities.map((entity) => (
                <tr key={entity.id}>
                  <Td>
                    <TwoLine
                      primary={entity.name}
                      secondary={
                        entity.reportingCompany ? (
                          <Chip className="h-[22px] text-xs">Reporting company</Chip>
                        ) : entity.chain.length > 0 ? (
                          `held through ${entity.chain.join(' > ')}`
                        ) : undefined
                      }
                    />
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-0.5">
                      {/* spec 03.1: the company itself holds no Table 1 relationship to itself */}
                      <span>
                        {entity.reportingCompany
                          ? 'Reporting company'
                          : relationshipShortLabels[entity.relationshipType]}
                      </span>
                      {(entity.jurisdiction || entity.effectiveFrom || entity.effectiveTo) && (
                        <span className="text-[13px] text-ink-muted">
                          {entity.jurisdiction ? `(${entity.jurisdiction})` : ''}
                          {entity.jurisdiction && (entity.effectiveFrom || entity.effectiveTo)
                            ? ' · '
                            : ''}
                          {entity.effectiveFrom ? `from ${entity.effectiveFrom}` : ''}
                          {entity.effectiveTo ? ` until ${entity.effectiveTo}` : ''}
                        </span>
                      )}
                      {entity.financialControlOverride !== null && (
                        <span className="text-[13px] font-medium text-warning">
                          {entity.financialControlOverride
                            ? 'financially controlled by decision'
                            : 'not financially controlled by decision'}
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td align="right">
                    <TwoLine
                      align="right"
                      primary={
                        <span className="font-normal">{entity.economicInterestPercent}%</span>
                      }
                      secondary={
                        entity.chain.length > 0
                          ? `${entity.effectiveEconomicInterestPercent}% through the chain`
                          : undefined
                      }
                    />
                  </Td>
                  <Td align="right" className="text-ink-muted">
                    {entity.legalOwnershipPercent === null
                      ? 'same'
                      : `${entity.legalOwnershipPercent}%`}
                  </Td>
                  <Td>
                    <div className="flex flex-col gap-0.5">
                      <span>{entity.operatedByCompany ? 'Yes' : 'No'}</span>
                      {entity.relationshipType === 'FRANCHISE' && (
                        <span className="text-[13px] text-ink-muted">
                          {entity.controlledByCompany ? 'financially controlled' : 'not controlled'}
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td align="right" className="font-medium">
                    {percent(entity.equityShare)}
                  </Td>
                  <Td align="right" className="font-medium">
                    {percent(entity.financialControlShare)}
                  </Td>
                  <Td align="right" className="font-medium">
                    {percent(entity.operationalControlShare)}
                  </Td>
                  <Td align="right">
                    <div className="flex justify-end gap-1">
                      <RoleButton
                        allowed={mayWrite(myRole)}
                        tooltip={WRITE_TOOLTIP}
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`${entity.id}/edit`)}
                      >
                        Edit
                      </RoleButton>
                      {!entity.reportingCompany && (
                        <RoleButton
                          allowed={mayWrite(myRole)}
                          tooltip={WRITE_TOOLTIP}
                          variant="ghost"
                          size="sm"
                          className="text-danger"
                          onClick={() => setDialog({ kind: 'remove', entity })}
                        >
                          Remove
                        </RoleButton>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <TableFooter>
            {entities.length} entit{entities.length === 1 ? 'y' : 'ies'}
          </TableFooter>
        </div>
      )}

      {dialog?.kind === 'remove' && (
        <RemoveDialog
          title={`Remove ${dialog.entity.name}?`}
          description="The entity stays on file as removed, with your name, the date and the reason. An entity with facilities, or one other entities are held through, cannot be removed."
          busy={deleteEntity.isPending}
          onClose={() => setDialog(null)}
          onConfirm={(reason) =>
            deleteEntity.mutate(
              { id: dialog.entity.id, reason },
              {
                onSuccess: () => {
                  setDialog(null)
                  toast(`${dialog.entity.name} removed.`)
                },
                onError: (error) => {
                  setDialog(null)
                  toast(refusalMessage(error, myRole), 'error')
                },
              },
            )
          }
        />
      )}
    </section>
  )
}
