import { formatDateRange, useDateFormat } from '../../lib/dates'
import { Link, useParams } from 'react-router-dom'
import { Chip } from '../../components/Chip'
import { PageHeader } from '../../components/PageHeader'
import { Panel, PanelBody, PanelHead } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { Stat, StatStrip } from '../../components/StatStrip'
import { Table, Td } from '../../components/Table'
import { accountLabel } from '../../lib/organizationLabel'
import { AnimatedCo2e } from './components/AnimatedCo2e'
import { ApproachBadge } from './components/badges'
import { ButtonLink } from './components/ButtonLink'
import { ScopeBreakdown } from './components/ScopeBreakdown'
import { SupportAccessCard } from './components/SupportAccessCard'
import { TopFacilities } from './components/TopFacilities'
import { roleShortLabels } from './format'
import {
  useActivityPageQuery,
  useEmissionFactorsQuery,
  useFacilitiesQuery,
  useInventoriesQuery,
  useOrganizationQuery,
  useRunsQuery,
} from './useGhg'
import type { Inventory, Organization } from './api'

/**
 * Workspace landing page (spec 10): the organization's name and account
 * number, a stat strip, the headline inventory beside the top facilities,
 * and the setup checklist as a table until the first final run.
 */
export function OverviewPage() {
  const { organizationId = '' } = useParams()
  const organization = useOrganizationQuery(organizationId).data
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const activitiesQuery = useActivityPageQuery(organizationId, { size: 1 })
  // ECO-23: the checklist asks whether any factor exists, so one row and the page total is enough
  const factorsQuery = useEmissionFactorsQuery(organizationId, { size: 1 })
  const inventoriesQuery = useInventoriesQuery(organizationId)

  if (
    facilitiesQuery.isPending ||
    activitiesQuery.isPending ||
    factorsQuery.isPending ||
    inventoriesQuery.isPending
  ) {
    return (
      <div aria-label="Loading overview" className="flex flex-col gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  const facilities = facilitiesQuery.data ?? []
  const activityCount = activitiesQuery.data?.total ?? 0
  const factorCount = factorsQuery.data?.total ?? 0
  const counts = activitiesQuery.data?.counts
  const inventories = inventoriesQuery.data ?? []
  // the headline inventory: prefer one with a designated final run, else the newest
  const headline = inventories.find((inventory) => inventory.finalRunId) ?? inventories[0]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        back={{ to: '/app/ghg' }}
        crumbs={[{ label: 'Overview' }]}
        status={organization && roleLine(organization)}
        title={organization?.name}
        chips={organization && <Chip>{accountLabel(organization.accountNo)}</Chip>}
        subtitle={
          <>
            {organization?.address && (
              <>
                {organization.address}
                <Separator />
              </>
            )}
            {facilities.length} facilit{facilities.length === 1 ? 'y' : 'ies'}
            <Separator />
            {inventories.length} inventor{inventories.length === 1 ? 'y' : 'ies'}
          </>
        }
        actions={
          <>
            <ButtonLink to="activity" variant="secondary">
              Record activity
            </ButtonLink>
            {headline && <ButtonLink to={`inventories/${headline.id}`}>Open inventory</ButtonLink>}
          </>
        }
      />

      <StatStrip label="At a glance">
        {headline?.finalRunId && <LatestRunStat inventory={headline} />}
        <Stat
          label="Activity records"
          value={activityCount.toLocaleString()}
          note={counts ? `${counts.ready.toLocaleString()} ready` : undefined}
        />
        {counts && (
          <Stat
            label="Needs attention"
            value={counts.needsAttention.toLocaleString()}
            note={
              counts.needsAttention > 0 ? (
                <Link to="activity?tab=attention" className="text-link hover:underline">
                  Resolve {counts.needsAttention.toLocaleString()}{' '}
                  {counts.needsAttention === 1 ? 'item' : 'items'} →
                </Link>
              ) : undefined
            }
          />
        )}
      </StatStrip>

      {headline && <HeadlineInventory inventory={headline} />}

      <SetupChecklist
        facilityCount={facilities.length}
        factorCount={factorCount}
        activityCount={activityCount}
        inventories={inventories}
      />

      {organization && <SupportAccessCard organization={organization} />}
    </div>
  )
}

function Separator() {
  return (
    <span aria-hidden="true" className="mx-2 text-ink-faint">
      ·
    </span>
  )
}

/* spec 01.4: the reader's own role, said on the page; a support grant is named as one */
function roleLine(organization: Organization): string | undefined {
  if (organization.myRole === null) return undefined
  return organization.myRole === 'ADMIN'
    ? 'Support access'
    : `Your role: ${roleShortLabels[organization.myRole]}`
}

function SetupChecklist({
  facilityCount,
  factorCount,
  activityCount,
  inventories,
}: {
  facilityCount: number
  factorCount: number
  activityCount: number
  inventories: Inventory[]
}) {
  const steps = [
    {
      title: 'Add your legal entities and facilities',
      detail:
        'Which structures you consolidate, and the sites under each. Facts shared by every view.',
      done: facilityCount > 0,
      to: 'facilities',
      cta: 'Add facilities',
    },
    {
      // spec 02.10 (decided 2026-10-05, ECO-23): a baseline is chosen, not inherited, so the prompt is here
      title: 'Import the factor packs, or enter your own factors',
      detail:
        'The published editions this organization reports with. One import of each gives the DESNZ and Ghana rows; a supplier factor is entered by hand.',
      done: factorCount > 0,
      to: 'factors',
      cta: 'Open emission factors',
    },
    {
      title: 'Record activity data',
      detail: 'What happened: fuel burned, electricity bought; no accounting treatment yet.',
      done: activityCount > 0,
      to: 'activity',
      cta: 'Record activity',
    },
    {
      title: 'Create an inventory',
      detail: 'An accounting view: reporting period, consolidation approach, boundary.',
      done: inventories.length > 0,
      to: 'inventories',
      cta: 'Create inventory',
    },
    {
      title: 'Clear pre-flight and launch a run',
      detail: 'Review the facts, classify them, pass the gates, calculate.',
      done: inventories.some((inventory) => inventory.finalRunId !== null),
      to: inventories[0] ? `inventories/${inventories[0].id}` : 'inventories',
      cta: 'Open inventory',
    },
  ]
  const nextIndex = steps.findIndex((step) => !step.done)
  if (nextIndex === -1) {
    return null
  }

  return (
    <Panel>
      <PanelHead
        title="From facts to a final inventory"
        description="Activity data is what happened; an inventory is how it's accounted for; a run is that view calculated."
      />
      <Table className="[&_tr:last-child_td]:border-b-0">
        <tbody>
          {steps.map((step, index) => (
            <tr key={step.title}>
              <Td className="w-14 pl-5">
                <span
                  aria-hidden="true"
                  className={`flex size-7 items-center justify-center rounded-full text-sm font-semibold ${
                    step.done ? 'bg-primary text-primary-ink' : 'bg-surface-sunken text-ink-muted'
                  }`}
                >
                  {step.done ? '✓' : index + 1}
                </span>
              </Td>
              <Td>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{step.title}</span>
                  <span className="text-[13px] text-ink-muted">{step.detail}</span>
                </div>
              </Td>
              <Td align="right" className="w-44 pr-5">
                {index === nextIndex && (
                  <ButtonLink to={step.to} size="sm">
                    {step.cta}
                  </ButtonLink>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Panel>
  )
}

/** The latest final run's total, in the stat strip; the headline panel below carries the breakdown. */
function LatestRunStat({ inventory }: { inventory: Inventory }) {
  const runsQuery = useRunsQuery(inventory.id)
  const runs = runsQuery.data ?? []
  const run = runs.find((candidate) => candidate.id === inventory.finalRunId) ?? runs[0]
  if (!run) return null
  return (
    <Stat
      label="Latest final run"
      value={<AnimatedCo2e kg={run.totalKgCo2e} />}
      note={`${inventory.name} · ${run.label}`}
    />
  )
}

/** The organization's headline numbers: the latest run of its leading inventory. */
function HeadlineInventory({ inventory }: { inventory: Inventory }) {
  const dateFormat = useDateFormat()
  const runsQuery = useRunsQuery(inventory.id)
  const runs = runsQuery.data ?? []
  const run = runs.find((candidate) => candidate.id === inventory.finalRunId) ?? runs[0]

  if (runsQuery.isPending) {
    return <Skeleton className="h-40" />
  }
  if (!run) {
    return null
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-2">
      <Panel>
        <PanelHead
          title={
            <span className="flex flex-wrap items-center gap-2">
              {inventory.name}
              <ApproachBadge approach={inventory.consolidationApproach} />
              {run.isFinal && <Chip tone="primary">FINAL</Chip>}
            </span>
          }
          description={`${run.label} · ${formatDateRange(run.periodStart, run.periodEnd, dateFormat)}`}
        >
          <Link
            to={`inventories/${inventory.id}/runs/${run.id}`}
            className="text-sm font-medium text-link hover:underline"
          >
            View report →
          </Link>
        </PanelHead>
        <PanelBody>
          <ScopeBreakdown run={run} />
        </PanelBody>
      </Panel>

      <TopFacilities runId={run.id} />
    </div>
  )
}
