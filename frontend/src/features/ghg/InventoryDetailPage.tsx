import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import { controlClasses, InputField, TextAreaField } from '../../components/Field'
import { HelpLink } from '../../components/HelpLink'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { Panel, PanelBody, PanelHead } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { Table, Td, Th, TwoLine } from '../../components/Table'
import { Tabs } from '../../components/Tabs'
import { useToast } from '../../components/toast'
import { refusalMessage } from '../../lib/api'
import { AssignmentsSection } from './components/AssignmentsSection'
import { ApproachBadge, InventoryStatusBadge } from './components/badges'
import { BoundarySection } from './components/BoundarySection'
import { LifecyclePanel, useLifecycleActions } from './components/LifecycleBar'
import { MarketFactorsCard } from './components/MarketFactorsCard'
import { OperationalBoundaryCard } from './components/OperationalBoundaryCard'
import { PreflightChip } from './components/PreflightChip'
import { ReportMetadataCard } from './components/ReportMetadataCard'
import { UpstreamRulesCard } from './components/UpstreamRulesCard'
import { RoleButton } from './components/RoleButton'
import { actionLabels, approachLabels, exclusionLabels, formatCo2e } from './format'
import { useInventoryFilters } from './inventoryFilters'
import type { InventoryTab } from './inventoryFilters'
import { APPROVE_TOOLTIP, mayApprove, mayWrite, WRITE_TOOLTIP } from './roles'
import {
  useBoundaryQuery,
  useInheritanceQuery,
  useVoidRun,
  useAuditEventsQuery,
  useExecuteRun,
  useFinalizeRun,
  useInventoryQuery,
  useOrganizationQuery,
  useAssignmentPageQuery,
  useCoverageQuery,
  useRunsQuery,
  useValidationQuery,
} from './useGhg'
import type { AuditEvent, DroppedExclusion, Inventory, Organization, Run } from './api'

/** "Wassa Gold Associates: Methodology exclusion dropped, 30% equity share under this approach" (spec 05.4). */
export function describeDroppedExclusion(
  dropped: DroppedExclusion,
  approach: Inventory['consolidationApproach'],
): string {
  const who = dropped.facilityName ?? dropped.entityName ?? 'an operation'
  const share =
    approach === 'EQUITY_SHARE'
      ? `${dropped.sharePercent}% equity share under this approach`
      : `${dropped.sharePercent}% share under this approach`
  return `${who}: ${exclusionLabels[dropped.reason]} dropped, ${share}`
}

/**
 * One inventory's workbench (spec 05.6). The register is the work surface and
 * everything else is a tab, because classifying records is an all-day job and
 * the boundary, the method and the report header are set once and left.
 *
 * The tab lives in the URL with the register's filters, so a link opens the
 * view a reviewer was working in and the back button steps through it.
 */
export function InventoryDetailPage() {
  const { organizationId = '', inventoryId = '' } = useParams()
  const inventoryQuery = useInventoryQuery(inventoryId)
  const boundaryQuery = useBoundaryQuery(inventoryId)
  const inheritanceQuery = useInheritanceQuery(inventoryId)
  const organizationQuery = useOrganizationQuery(organizationId)
  const navigate = useNavigate()
  const { filters, set, query } = useInventoryFilters()
  // The workbench renders once the inventory has loaded, but nothing its tabs
  // ask for depends on that answer: they need only the identifier in the
  // address. Asking now runs them alongside the inventory instead of one hop
  // behind it, which is a whole round trip off the first paint of the register
  // and the pre-flight (spec 05.6). React Query hands the same answers to the
  // tab that asks again.
  useValidationQuery(inventoryId)
  useRunsQuery(inventoryId)
  useAssignmentPageQuery(inventoryId, query)
  useCoverageQuery(inventoryId)

  if (inventoryQuery.isPending) {
    return (
      <div aria-label="Loading inventory" className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48" />
      </div>
    )
  }
  if (inventoryQuery.isError) {
    return (
      <Panel className="p-8 text-center">
        <h1 className="text-lg">Inventory not found</h1>
        <p className="mt-1 text-sm text-ink-muted">
          It may have been deleted.{' '}
          <Link to=".." relative="path" className="font-semibold text-link">
            Back to inventories
          </Link>
        </p>
      </Panel>
    )
  }

  const inventory = inventoryQuery.data
  const editable = inventory.status === 'DRAFT'
  // the role is a display concern (spec 01.4): unknown while loading means the server decides
  const myRole = organizationQuery.data?.myRole ?? null
  const inheritance = inheritanceQuery.data
  const inBoundaryCount =
    boundaryQuery.data?.reduce(
      (count, entity) => count + entity.facilities.filter((facility) => facility.inBoundary).length,
      0,
    ) ?? 0
  return (
    <InventoryWorkbench
      organizationId={organizationId}
      inventoryId={inventoryId}
      inventory={inventory}
      editable={editable}
      myRole={myRole}
      inBoundaryCount={inBoundaryCount}
      tab={filters.tab}
      onTab={(tab) => set({ tab })}
      onResolve={() => set({ tab: 'records', status: 'UNCLASSIFIED' })}
      onEdit={() => navigate('edit')}
      provenance={
        (inventory.supersededById || inheritance || inventory.status === 'PUBLISHED') && (
          <details className="text-sm">
            <summary className="cursor-pointer text-ink-muted hover:text-ink">
              Where this inventory came from
            </summary>
            <div className="mt-1">
              {inventory.supersededById && (
                <p className="mt-1 text-sm">
                  <Link
                    to={`../${inventory.supersededById}`}
                    relative="path"
                    className="font-semibold text-link"
                  >
                    Superseded by a correction
                  </Link>
                </p>
              )}
              {inheritance && (
                <p className="mt-1 text-sm text-ink-muted">
                  {inventory.correctionReason ? 'Correction of ' : 'View copied from '}
                  <Link
                    to={`../${inheritance.sourceInventoryId}`}
                    relative="path"
                    className="font-semibold text-link"
                  >
                    {inheritance.sourceName ?? 'another inventory'}
                  </Link>
                  : {inheritance.inherited} decision
                  {inheritance.inherited === 1 ? '' : 's'} inherited
                  {inheritance.undecided > 0
                    ? `, ${inheritance.undecided} record${inheritance.undecided === 1 ? '' : 's'} of this period the source never decided on`
                    : ''}
                  .{inventory.correctionReason ? ` Reason: ${inventory.correctionReason}` : ''}
                  {inheritance.boundaryRebuilt &&
                    ` Boundary rebuilt from Table 1 under ${approachLabels[inventory.consolidationApproach].toLowerCase()}` +
                      (inheritance.leaseRederived > 0
                        ? `; ${inheritance.leaseRederived} leased assignment${inheritance.leaseRederived === 1 ? '' : 's'} moved scope under Appendix F.`
                        : '.')}
                </p>
              )}
              {inheritance && inheritance.droppedExclusions.length > 0 && editable && (
                <div className="mt-1 text-sm text-warning">
                  <p>
                    {inheritance.droppedExclusions.length} boundary exclusion
                    {inheritance.droppedExclusions.length === 1 ? '' : 's'} of the source{' '}
                    {inheritance.droppedExclusions.length === 1 ? 'was' : 'were'} dropped: the
                    operation holds a share under this approach and joins the boundary. Record a
                    reason again if it should stay out.
                  </p>
                  <ul aria-label="Dropped exclusions" className="list-disc pl-5 text-xs">
                    {inheritance.droppedExclusions.map((dropped) => (
                      <li key={`${dropped.entityId ?? ''}:${dropped.facilityId ?? ''}`}>
                        {describeDroppedExclusion(dropped, inventory.consolidationApproach)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {inventory.status === 'PUBLISHED' && (
                <p className="mt-1 text-sm text-warning">
                  Published: the activity view shows each record as the published run snapshotted
                  it, and marks records whose facts changed since.
                </p>
              )}
            </div>
          </details>
        )
      }
    />
  )
}

/**
 * The title row with the pre-flight chip and the lifecycle acts, the
 * lifecycle panel, the tabs and the body of the active tab (spec 10). Only
 * the active tab's sections mount, so opening an inventory no longer fires
 * every query the page has between it.
 */
function InventoryWorkbench({
  organizationId,
  inventoryId,
  inventory,
  editable,
  myRole,
  inBoundaryCount,
  tab,
  onTab,
  onResolve,
  onEdit,
  provenance,
}: {
  organizationId: string
  inventoryId: string
  inventory: Inventory
  editable: boolean
  myRole: Organization['myRole']
  inBoundaryCount: number
  tab: InventoryTab
  onTab: (tab: InventoryTab) => void
  onResolve: () => void
  onEdit: () => void
  provenance: ReactNode
}) {
  const validationQuery = useValidationQuery(inventoryId)
  const runsQuery = useRunsQuery(inventoryId)
  const boundaryQuery = useBoundaryQuery(inventoryId)
  const lifecycle = useLifecycleActions(inventory, inBoundaryCount, myRole)
  const report = validationQuery.data

  const inBoundary =
    boundaryQuery.data?.reduce(
      (count, entity) => count + entity.facilities.filter((facility) => facility.inBoundary).length,
      0,
    ) ?? undefined

  return (
    <div className="flex flex-col gap-7">
      <PageHeader
        back={{ to: `/app/ghg/${organizationId}/inventories` }}
        crumbs={[
          { label: 'Inventories', to: `/app/ghg/${organizationId}/inventories` },
          { label: inventory.name },
        ]}
        help={<HelpLink topic="lifecycle" />}
        status={
          <>
            {/* spec 05.5: the boundary version is named apart from the report version */}
            {inventory.status !== 'DRAFT' && inventory.currentBoundaryVersionNo !== null && (
              <>
                <span>Boundary version {inventory.currentBoundaryVersionNo}</span>
                <span aria-hidden="true"> · </span>
              </>
            )}
            <span>GWP {inventory.gwpSet}</span>
          </>
        }
        title={inventory.name}
        chips={
          <>
            <ApproachBadge approach={inventory.consolidationApproach} />
            <InventoryStatusBadge inventory={inventory} />
          </>
        }
        subtitle={
          <>
            {inventory.periodStart} → {inventory.periodEnd}
            {inventory.purpose ? ` · ${inventory.purpose}` : ''}
          </>
        }
        actions={
          <>
            {editable && (
              <RoleButton
                allowed={mayWrite(myRole)}
                tooltip={WRITE_TOOLTIP}
                variant="ghost"
                onClick={onEdit}
                title="Name, period, purpose, straddle treatment, approach and GWP set"
              >
                Edit inventory
              </RoleButton>
            )}
            {report && (
              <PreflightChip report={report} status={inventory.status} onResolve={onResolve} />
            )}
            {lifecycle.actions}
          </>
        }
      />
      {provenance}

      {/* the lifecycle is a panel under the title, not one more card in the stack: its acts sit in
          the title row so they are reachable from every tab */}
      <LifecyclePanel inventory={inventory} versionsCut={lifecycle.versionsCut} />
      {lifecycle.dialogs}

      <Tabs<InventoryTab>
        label="The inventory"
        value={tab}
        onChange={onTab}
        tabs={[
          { value: 'records', label: 'Records' },
          { value: 'boundary', label: 'Boundary', count: inBoundary },
          { value: 'method', label: 'Method' },
          { value: 'runs', label: 'Runs', count: runsQuery.data?.length },
          { value: 'report', label: 'Report' },
        ]}
      />

      {tab === 'records' && (
        <AssignmentsSection
          organizationId={organizationId}
          inventoryId={inventoryId}
          editable={editable}
          myRole={myRole}
          period={{ start: inventory.periodStart, end: inventory.periodEnd }}
        />
      )}

      {tab === 'boundary' && (
        <div className="flex flex-col gap-6">
          <BoundarySection inventory={inventory} myRole={myRole} />
          <OperationalBoundaryCard key={inventory.status} inventory={inventory} myRole={myRole} />
        </div>
      )}

      {tab === 'method' && (
        <div className="flex flex-col gap-6">
          <UpstreamRulesCard
            organizationId={organizationId}
            inventory={inventory}
            myRole={myRole}
          />
          <MarketFactorsCard
            organizationId={organizationId}
            inventory={inventory}
            myRole={myRole}
          />
        </div>
      )}

      {tab === 'runs' && <LaunchSection inventory={inventory} myRole={myRole} />}

      {tab === 'report' && (
        <ReportMetadataCard
          key={`header-${inventory.status}`}
          inventory={inventory}
          intensityMetrics={inventory.intensityMetrics}
          myRole={myRole}
        />
      )}
    </div>
  )
}

// --- launch + runs -----------------------------------------------------------

function LaunchSection({
  inventory,
  myRole,
}: {
  inventory: Inventory
  myRole: Organization['myRole']
}) {
  const inventoryId = inventory.id
  const validationQuery = useValidationQuery(inventoryId)
  const runsQuery = useRunsQuery(inventoryId)
  const execute = useExecuteRun(inventoryId)
  const finalize = useFinalizeRun(inventoryId)
  const voidRun = useVoidRun(inventoryId)
  const eventsQuery = useAuditEventsQuery(inventoryId)
  const toast = useToast()
  const navigate = useNavigate()
  const nextRunNo = Math.max(0, ...(runsQuery.data?.map((run) => run.runNo) ?? [])) + 1
  // null until the accountant types: the proposal follows the highest number issued so far
  const [customLabel, setCustomLabel] = useState<string | null>(null)
  const label = customLabel ?? `Run ${String(nextRunNo).padStart(3, '0')}`
  const [voiding, setVoiding] = useState<Run | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [voidError, setVoidError] = useState<string | null>(null)
  // spec 05.5: the final designation is confirmed, names the run and its total, and takes a review note
  const [finalizing, setFinalizing] = useState<Run | null>(null)
  const [finalNote, setFinalNote] = useState('')
  const [finalizeError, setFinalizeError] = useState<string | null>(null)

  const report = validationQuery.data
  const canDesignate = inventory.status === 'FROZEN' || inventory.status === 'FINAL'
  const canVoid = inventory.status !== 'PUBLISHED'
  // spec 05.1: the runs of a published inventory are its record; the button says so in the
  // backend's own words instead of sitting disabled without a reason
  const published = inventory.status === 'PUBLISHED'
  const runs = runsQuery.data ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* the gates are read from the chip in the title row; here the launch button only states
          whether it may go */}
      <Panel>
        <PanelBody className="flex flex-wrap items-center gap-3">
          <label htmlFor="run-label" className="sr-only">
            Run label
          </label>
          <input
            id="run-label"
            value={label}
            onChange={(event) => setCustomLabel(event.target.value)}
            className={`${controlClasses} max-w-60 font-medium`}
          />
          <RoleButton
            allowed={mayWrite(myRole)}
            tooltip={WRITE_TOOLTIP}
            disabled={!report?.ready || published}
            busy={execute.isPending}
            title={
              published
                ? 'A published inventory cannot be recalculated. Create a correction that supersedes it.'
                : report?.ready
                  ? undefined
                  : 'Resolve the blocking findings first'
            }
            onClick={() =>
              execute.mutate(label, {
                onSuccess: (detail) => {
                  toast('Calculation complete.')
                  void navigate(`runs/${detail.run.id}`)
                },
                onError: (error) => toast(refusalMessage(error, myRole), 'error'),
              })
            }
          >
            Launch calculation run
          </RoleButton>
          <span className="text-[13px] text-ink-muted">
            Recalculation creates a new run; earlier runs are kept.
          </span>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHead
          title="Calculation runs"
          description="Immutable snapshots of this view, lines and exclusions alike. A run is never deleted: it can be voided with a reason, and its number is never reused."
        />
        {runsQuery.isPending && (
          <div aria-label="Loading runs" className="p-5">
            <Skeleton className="h-16" />
          </div>
        )}
        {runsQuery.data?.length === 0 && <p className="p-5 text-sm text-ink-muted">No runs yet.</p>}
        {runs.length > 0 && (
          <Table>
            <thead>
              <tr>
                <Th className="pl-5">Run</Th>
                <Th>Calculated</Th>
                <Th align="right">Scope 1</Th>
                <Th align="right">Scope 2</Th>
                <Th align="right">Scope 3</Th>
                <Th align="right">Total</Th>
                <Th className="pr-5">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const isFinal = run.id === inventory.finalRunId
                const muted = run.voided ? 'text-ink-muted' : ''
                return (
                  <tr key={run.id}>
                    <Td className="pl-5">
                      <TwoLine
                        primary={
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-normal text-ink-muted">
                              #{String(run.runNo).padStart(3, '0')}
                            </span>
                            <Link
                              to={`runs/${run.id}`}
                              className={`hover:text-link ${run.voided ? 'line-through' : ''}`}
                            >
                              {run.label}
                            </Link>
                            {run.voided && <Chip tone="warning">VOIDED</Chip>}
                            {isFinal && <Chip tone="primary">FINAL</Chip>}
                          </span>
                        }
                        secondary={
                          run.voided ? (
                            <>
                              Voided by {run.voidedBy ?? 'unknown'}
                              {run.voidedAt ? ` on ${new Date(run.voidedAt).toLocaleString()}` : ''}
                              : {run.voidReason}
                            </>
                          ) : isFinal && inventory.finalDesignatedBy ? (
                            <>
                              Final designated by {inventory.finalDesignatedBy}
                              {inventory.finalDesignatedAt
                                ? ` on ${new Date(inventory.finalDesignatedAt).toLocaleDateString()}`
                                : ''}
                            </>
                          ) : undefined
                        }
                      />
                    </Td>
                    <Td>
                      <TwoLine
                        primary={
                          <span className="font-normal">
                            {new Date(run.createdAt).toLocaleString()}
                          </span>
                        }
                        secondary={`${run.activityCount} line${run.activityCount === 1 ? '' : 's'} · boundary v${run.boundaryVersionNo ?? '?'}`}
                      />
                    </Td>
                    <Td align="right" className={muted}>
                      {formatCo2e(run.scope1KgCo2e)}
                    </Td>
                    <Td align="right" className={muted}>
                      {formatCo2e(run.scope2KgCo2e)}
                    </Td>
                    <Td align="right" className={muted}>
                      {formatCo2e(run.scope3KgCo2e)}
                    </Td>
                    <Td align="right" className={`font-semibold ${muted}`}>
                      {formatCo2e(run.totalKgCo2e)}
                    </Td>
                    <Td align="right" className="pr-5">
                      <span className="inline-flex gap-1">
                        {!isFinal && canDesignate && !run.voided && (
                          <RoleButton
                            allowed={mayApprove(myRole)}
                            tooltip={APPROVE_TOOLTIP}
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFinalNote('')
                              setFinalizeError(null)
                              setFinalizing(run)
                            }}
                          >
                            Mark as final
                          </RoleButton>
                        )}
                        {canVoid && !run.voided && !isFinal && (
                          <RoleButton
                            allowed={mayWrite(myRole)}
                            tooltip={WRITE_TOOLTIP}
                            variant="ghost"
                            size="sm"
                            className="text-danger"
                            onClick={() => {
                              setVoidReason('')
                              setVoidError(null)
                              setVoiding(run)
                            }}
                          >
                            Void…
                          </RoleButton>
                        )}
                      </span>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
        <HistoryList events={eventsQuery.data ?? []} />
      </Panel>

      {finalizing && (
        <Modal title={`Mark ${finalizing.label} as final?`} onClose={() => setFinalizing(null)}>
          <p className="text-sm text-ink-muted">
            Run #{String(finalizing.runNo).padStart(3, '0')} ({formatCo2e(finalizing.totalKgCo2e)})
            becomes this inventory's final run: the report and the base year attach to it, and the
            inventory can be published. The designation, your name and your note are recorded in the
            history and printed in the report header.
          </p>
          <div className="mt-4">
            <TextAreaField
              label="Review note (optional)"
              placeholder="What the review checked, for example: reconciled against the fuel ledger"
              value={finalNote}
              onChange={(event) => setFinalNote(event.target.value)}
              maxLength={500}
              rows={3}
              hint={`${finalNote.length}/500 characters`}
            />
          </div>
          {finalizeError && (
            <p role="alert" className="mt-3 text-sm font-medium text-danger">
              {finalizeError}
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setFinalizing(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              busy={finalize.isPending}
              onClick={() =>
                finalize.mutate(
                  {
                    runId: finalizing.id,
                    note: finalNote.trim() === '' ? undefined : finalNote.trim(),
                  },
                  {
                    onSuccess: () => {
                      toast(`${finalizing.label} designated final.`)
                      setFinalizing(null)
                    },
                    onError: (error) => setFinalizeError(refusalMessage(error, myRole)),
                  },
                )
              }
            >
              Mark as final
            </Button>
          </div>
        </Modal>
      )}

      {voiding && (
        <Modal title={`Void ${voiding.label}?`} onClose={() => setVoiding(null)}>
          <p className="text-sm text-ink-muted">
            The run keeps its number, lines and totals on the record, marked VOIDED with your reason
            and your name. Run numbers are never reused. This cannot be undone.
          </p>
          <div className="mt-4">
            <InputField
              label="Reason"
              placeholder="Why this run must not be relied on"
              value={voidReason}
              onChange={(event) => setVoidReason(event.target.value)}
              minLength={5}
              maxLength={500}
              required
            />
          </div>
          {voidError && (
            <p role="alert" className="mt-3 text-sm font-medium text-danger">
              {voidError}
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setVoiding(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={voidReason.trim().length < 5}
              busy={voidRun.isPending}
              onClick={() =>
                voidRun.mutate(
                  { id: voiding.id, reason: voidReason.trim() },
                  {
                    onSuccess: () => {
                      toast(`${voiding.label} voided.`)
                      setVoiding(null)
                    },
                    onError: (error) => setVoidError(refusalMessage(error, myRole)),
                  },
                )
              }
            >
              Void run
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

/** The recorded acts on the inventory (spec 05.2), newest first. */
function HistoryList({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) return null
  return (
    <PanelBody className="border-t border-hairline">
      <h3 className="text-sm font-semibold">History</h3>
      <ul className="mt-2 flex flex-col gap-2 text-sm">
        {events.map((event) => (
          <li key={event.id}>
            <span className="font-medium">{actionLabels[event.action]}</span>
            {event.runNo !== null && (
              <span className="text-ink-muted"> · run #{String(event.runNo).padStart(3, '0')}</span>
            )}
            <span className="block text-[13px] text-ink-muted">
              {event.actor}, {new Date(event.at).toLocaleString()}: {event.reason}
            </span>
          </li>
        ))}
      </ul>
    </PanelBody>
  )
}
