import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { problemDetail } from '../../lib/api'
import { EntityFormModal } from './components/EntityFormModal'
import { relationshipShortLabels } from './format'
import { useDeleteEntity, useEntitiesQuery } from './useGhg'
import type { Entity } from './api'

type Dialog = { kind: 'create' } | { kind: 'edit'; entity: Entity } | null

function percent(share: number): string {
  return `${Math.round(share * 100)}%`
}

/** The organization's legal entities: the structures it consolidates, with Table 1 facts (spec 03.1). */
export function EntitiesPage() {
  const { organizationId = '' } = useParams()
  const entitiesQuery = useEntitiesQuery(organizationId)
  const deleteEntity = useDeleteEntity(organizationId)
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog>(null)

  const entities = entitiesQuery.data

  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <h1 className="text-xl">Legal entities</h1>
          <p className="text-sm text-ink-muted">
            The structures the company consolidates. Each facility belongs to one; Table 1 of the
            GHG Protocol turns the relationship into an accounting share under each approach.
          </p>
        </div>
        <Button className="px-4 py-1.5 text-sm" onClick={() => setDialog({ kind: 'create' })}>
          Add entity
        </Button>
      </div>

      <GlassCard className="animate-fade-up overflow-x-auto">
        {entitiesQuery.isPending && (
          <div aria-label="Loading legal entities" className="flex flex-col gap-2 p-4">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        )}
        {entities && entities.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                <th className="px-4 py-3 font-semibold">Entity</th>
                <th className="px-4 py-3 font-semibold">Relationship</th>
                <th className="px-4 py-3 font-semibold">Economic interest</th>
                <th className="px-4 py-3 font-semibold">Legal ownership</th>
                <th className="px-4 py-3 font-semibold">Operated</th>
                <th className="px-4 py-3 font-semibold">Equity share</th>
                <th className="px-4 py-3 font-semibold">Financial ctrl</th>
                <th className="px-4 py-3 font-semibold">Operational ctrl</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {entities.map((entity) => (
                <tr key={entity.id} className="border-b border-teal/5 last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {entity.name}
                    {entity.reportingCompany && (
                      <span className="ml-2 inline-block rounded-full bg-teal/15 px-2 py-0.5 text-xs font-semibold text-dark-teal">
                        Reporting company
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {relationshipShortLabels[entity.relationshipType]}
                    {entity.chain.length > 0 && (
                      <span className="block text-xs">held through {entity.chain.join(' > ')}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {entity.economicInterestPercent}%
                    {entity.chain.length > 0 && (
                      <span className="block text-xs text-ink-muted">
                        {entity.effectiveEconomicInterestPercent}% through the chain
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">
                    {entity.legalOwnershipPercent === null
                      ? 'same'
                      : `${entity.legalOwnershipPercent}%`}
                  </td>
                  <td className="px-4 py-3">
                    {entity.operatedByCompany ? 'Yes' : 'No'}
                    {entity.relationshipType === 'FRANCHISE' && (
                      <span className="block text-xs text-ink-muted">
                        {entity.controlledByCompany ? 'financially controlled' : 'not controlled'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold">
                    {percent(entity.equityShare)}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold">
                    {percent(entity.financialControlShare)}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold">
                    {percent(entity.operationalControlShare)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      className="px-2 py-1 text-xs"
                      onClick={() => setDialog({ kind: 'edit', entity })}
                    >
                      Edit
                    </Button>
                    {!entity.reportingCompany && (
                      <Button
                        variant="ghost"
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        onClick={() =>
                          deleteEntity.mutate(entity.id, {
                            onSuccess: () => toast(`${entity.name} removed.`),
                            onError: (error) =>
                              toast(
                                problemDetail(error) ?? `Could not remove ${entity.name}.`,
                                'error',
                              ),
                          })
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </GlassCard>

      {dialog?.kind === 'create' && (
        <EntityFormModal
          organizationId={organizationId}
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null)
            toast(message)
          }}
        />
      )}
      {dialog?.kind === 'edit' && (
        <EntityFormModal
          organizationId={organizationId}
          entity={dialog.entity}
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null)
            toast(message)
          }}
        />
      )}
    </section>
  )
}
