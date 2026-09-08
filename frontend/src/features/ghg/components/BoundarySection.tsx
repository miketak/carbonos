import { useState } from 'react'
import { Button } from '../../../components/Button'
import { GlassCard } from '../../../components/GlassCard'
import { Skeleton } from '../../../components/Skeleton'
import { useToast } from '../../../components/toast'
import { problemDetail } from '../../../lib/api'
import { approachLabels, describeFreeze, relationshipShortLabels } from '../format'
import {
  useBoundaryQuery,
  useBoundaryVersionsQuery,
  useRemoveBoundaryTreatment,
  useRemoveEntityTreatment,
  useSetBoundaryTreatment,
  useSetEntityTreatment,
} from '../useGhg'
import { BoundaryVersionPanel } from './BoundaryVersionPanel'
import { TapCheckbox } from './TapCheckbox'
import type { BoundaryEntity, BoundaryTreatmentInput, Inventory, RelationshipType } from '../api'

const dateInputClasses =
  'rounded-lg border border-teal/20 bg-white/70 px-2 py-1 text-sm focus:ring-2 focus:ring-teal focus:outline-none disabled:opacity-60'

/**
 * The organizational boundary by legal entity (spec 03.1): each entity's Table
 * 1 treatment, prefilled from its facts, the facilities included beneath it,
 * and the membership window (spec 03.2). Editable only while the inventory is
 * a draft (spec 05.1).
 */
export function BoundarySection({ inventory }: { inventory: Inventory }) {
  const inventoryId = inventory.id
  const editable = inventory.status === 'DRAFT'
  const boundaryQuery = useBoundaryQuery(inventoryId)
  const setEntity = useSetEntityTreatment(inventoryId)
  const removeEntity = useRemoveEntityTreatment(inventoryId)
  const setFacility = useSetBoundaryTreatment(inventoryId)
  const removeFacility = useRemoveBoundaryTreatment(inventoryId)
  const toast = useToast()
  // bumped when a write is rejected, so uncontrolled inputs remount to the server value
  const [revision, setRevision] = useState(0)

  const onWriteError = (error: unknown) => {
    setRevision((value) => value + 1)
    toast(problemDetail(error) ?? 'Could not update boundary.', 'error')
  }

  const update = (entity: BoundaryEntity, input: BoundaryTreatmentInput) =>
    setEntity.mutate({ entityId: entity.entityId, input }, { onError: onWriteError })

  const toggleEntity = (entity: BoundaryEntity) => {
    if (entity.inBoundary) removeEntity.mutate(entity.entityId, { onError: onWriteError })
    // an empty treatment is prefilled server-side from the entity's facts (spec 03)
    else update(entity, {})
  }

  const toggleFacility = (facilityId: string, inBoundary: boolean) => {
    if (inBoundary) removeFacility.mutate(facilityId, { onError: onWriteError })
    else setFacility.mutate({ facilityId, input: {} }, { onError: onWriteError })
  }

  const entities = boundaryQuery.data ?? []

  return (
    <GlassCard className="p-6">
      <div>
        <h2 className="text-xl">Organizational boundary</h2>
        <p className="text-sm text-ink-muted">
          Which legal entities and facilities this view accounts for, and the Table 1 share of each
          under the consolidation approach.
        </p>
      </div>
      {boundaryQuery.isPending && (
        <div aria-label="Loading boundary" className="mt-4">
          <Skeleton className="h-16" />
        </div>
      )}
      {boundaryQuery.data && entities.length === 0 && (
        <p className="mt-4 text-sm text-ink-muted">
          The organization has no legal entities yet: add facilities under Facilities first.
        </p>
      )}
      <ul className="mt-4 flex flex-col gap-3">
        {entities.map((entity) => (
          <li key={entity.entityId} className="rounded-xl border border-teal/10 bg-white/40 p-3">
            <div className="flex items-center gap-2">
              <TapCheckbox
                label={`${entity.entityName} in boundary`}
                checked={entity.inBoundary}
                disabled={!editable}
                onChange={() => toggleEntity(entity)}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {entity.entityName}
                  {entity.reportingCompany && (
                    <span className="ml-2 text-xs font-normal text-ink-muted">
                      reporting company
                    </span>
                  )}
                </p>
                {entity.inBoundary && entity.table1Row && (
                  <p className="text-xs text-ink-muted">{entity.table1Row}</p>
                )}
              </div>
              {entity.inBoundary && (
                <span className="text-xs text-ink-muted">
                  share{' '}
                  <span className="font-mono font-semibold">
                    {Math.round((entity.accountingShare ?? 0) * 100)}%
                  </span>
                </span>
              )}
            </div>

            {entity.inBoundary && (
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 pl-12 text-sm">
                <label className="flex items-center gap-2">
                  <span className="text-ink-muted">Relationship</span>
                  <select
                    aria-label={`${entity.entityName} relationship`}
                    value={entity.relationshipType ?? 'WHOLLY_OWNED'}
                    disabled={!editable}
                    onChange={(event) =>
                      update(entity, { relationshipType: event.target.value as RelationshipType })
                    }
                    className={dateInputClasses}
                  >
                    {Object.entries(relationshipShortLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-ink-muted">Economic interest %</span>
                  <input
                    key={`${entity.entityId}:${entity.economicInterestPercent}:${revision}`}
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    aria-label={`${entity.entityName} economic interest percent`}
                    defaultValue={entity.economicInterestPercent ?? 100}
                    disabled={!editable}
                    onBlur={(event) =>
                      update(entity, { economicInterestPercent: Number(event.target.value) })
                    }
                    className={`w-20 ${dateInputClasses}`}
                  />
                </label>
                <span className="flex items-center gap-1">
                  <TapCheckbox
                    label={`${entity.entityName} operated by the company`}
                    checked={entity.operatedByCompany ?? false}
                    disabled={!editable}
                    onChange={(value) => update(entity, { operatedByCompany: value })}
                  />
                  <span className="text-ink-muted">Operated by the company</span>
                </span>
              </div>
            )}

            {entity.inBoundary && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 pl-12 text-sm">
                <label className="flex items-center gap-2">
                  <span className="text-ink-muted">Member from</span>
                  <input
                    key={`${entity.entityId}:from:${entity.effectiveFrom}:${revision}`}
                    type="date"
                    aria-label={`${entity.entityName} member from`}
                    defaultValue={entity.effectiveFrom ?? ''}
                    disabled={!editable}
                    onBlur={(event) => {
                      if (event.target.value && event.target.value !== (entity.effectiveFrom ?? ''))
                        update(entity, { effectiveFrom: event.target.value })
                    }}
                    className={dateInputClasses}
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-ink-muted">Member until</span>
                  <input
                    key={`${entity.entityId}:to:${entity.effectiveTo}:${revision}`}
                    type="date"
                    aria-label={`${entity.entityName} member until`}
                    defaultValue={entity.effectiveTo ?? ''}
                    disabled={!editable}
                    onBlur={(event) => {
                      if (event.target.value && event.target.value !== (entity.effectiveTo ?? ''))
                        update(entity, { effectiveTo: event.target.value })
                    }}
                    className={dateInputClasses}
                  />
                </label>
                {(entity.effectiveFrom || entity.effectiveTo) && editable && (
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs"
                    aria-label={`Clear ${entity.entityName} membership window`}
                    onClick={() => update(entity, { clearWindow: true })}
                  >
                    Clear
                  </Button>
                )}
              </div>
            )}

            {entity.inBoundary && entity.accountingShare === 0 && (
              <p className="mt-2 pl-12 text-xs text-amber-700">
                0% under {approachLabels[inventory.consolidationApproach].toLowerCase()}: outside
                the boundary under this approach; the version records it as excluded.
              </p>
            )}

            {entity.facilities.length > 0 && (
              <ul className="mt-2 flex flex-col gap-1 pl-8">
                {entity.facilities.map((facility) => (
                  <li key={facility.facilityId} className="flex items-center gap-2">
                    <TapCheckbox
                      label={`${facility.facilityName} in boundary`}
                      checked={facility.inBoundary}
                      disabled={!editable}
                      onChange={() => toggleFacility(facility.facilityId, facility.inBoundary)}
                    />
                    <span className="min-w-0 flex-1 text-sm">
                      {facility.facilityName}
                      <span className="ml-2 text-xs text-ink-muted">{facility.location}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {entity.facilities.length === 0 && (
              <p className="mt-2 pl-12 text-xs text-ink-muted">No facilities under this entity.</p>
            )}
          </li>
        ))}
      </ul>

      <BoundaryHistory inventoryId={inventoryId} />
    </GlassCard>
  )
}

/** Every version ever frozen, newest first; each expands to the boundary it recorded. */
function BoundaryHistory({ inventoryId }: { inventoryId: string }) {
  const versionsQuery = useBoundaryVersionsQuery(inventoryId)
  const [openId, setOpenId] = useState<string | null>(null)
  const versions = versionsQuery.data ?? []

  if (versions.length === 0) return null
  return (
    <div className="mt-6 border-t border-teal/10 pt-4">
      <h3 className="text-sm font-semibold">Version history</h3>
      <ul className="mt-2 flex flex-col gap-2">
        {versions.map((version) => (
          <li key={version.id}>
            <button
              type="button"
              aria-expanded={openId === version.id}
              onClick={() => setOpenId(openId === version.id ? null : version.id)}
              className="w-full rounded-lg px-2 py-1 text-left text-sm text-dark-teal transition-colors hover:bg-teal/10"
            >
              <span className="font-mono font-semibold">v{version.versionNo}</span> ·{' '}
              {describeFreeze(version)} · {version.facilityCount}{' '}
              {version.facilityCount === 1 ? 'facility' : 'facilities'}
            </button>
            {openId === version.id && <BoundaryVersionPanel versionId={version.id} />}
          </li>
        ))}
      </ul>
    </div>
  )
}
