import { Button } from '../../../components/Button'
import { Drawer } from '../../../components/Drawer'
import { GlassCard } from '../../../components/GlassCard'
import { Skeleton } from '../../../components/Skeleton'
import { useFactorPackBlastRadiusQuery } from '../useFactorPacks'
import type { BlastRadius, BlastRadiusOrganization } from '../api'

interface BlastRadiusDrawerProps {
  editionId: string
  onClose: () => void
}

/**
 * What publishing, or withdrawing, would do (spec 02.5). It is a drawer rather
 * than a dialog because it is long: every holder, every lineage that moves,
 * and the tonnage each organization would see.
 *
 * <p>Every figure in it is an estimate and says so. The tonnage comes from the
 * organization's last completed run, and the activity data behind it can
 * change before the next one.
 *
 * <p>The report's `act` decides the copy. A draft's report is the publication
 * impact. Any edition past a draft gets the withdrawal impact, which moves no
 * row and estimates nothing: it names the holders, says their rows stay as
 * they are, and says how many open notices would close. The movement, last
 * run and locked period lines belong to a publication and are never printed
 * for a withdrawal.
 */
export function BlastRadiusDrawer({ editionId, onClose }: BlastRadiusDrawerProps) {
  const query = useFactorPackBlastRadiusQuery(editionId, true)
  const report = query.data

  return (
    <Drawer
      eyebrow={report?.act === 'WITHDRAW' ? 'Withdrawal impact' : 'Blast radius'}
      title={editionId}
      subtitle={report ? headline(report) : undefined}
      footer={
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      }
      onClose={onClose}
    >
      {query.isPending && <Skeleton className="h-40" aria-label="Reading the blast radius" />}

      {report?.act === 'WITHDRAW' && (
        <>
          <p className="text-sm text-ink-muted">
            This edition is published, so the report is the withdrawal impact. Withdrawing takes the
            edition off the import list. The rows organizations already hold stay exactly as they
            are: nothing moves, and there is nothing to estimate.
          </p>
          <p className="mt-2 text-sm">
            <strong>{report.openNoticeCount}</strong>{' '}
            {report.openNoticeCount === 1 ? 'open notice would close' : 'open notices would close'},
            so nobody is asked to decide on a withdrawn edition.
          </p>
          {report.organizations.length === 0 && (
            <GlassCard className="mt-4 p-6 text-center">
              <h3 className="text-sm font-semibold">Nobody holds one of these lineages</h3>
              <p className="mt-1 text-xs text-ink-muted">
                No organization carries a row of it and no notice for it is open, so withdrawing
                changes nothing for anybody.
              </p>
            </GlassCard>
          )}
          {report.organizations.map((organization) => (
            <WithdrawalCard key={organization.organizationId} organization={organization} />
          ))}
        </>
      )}

      {report?.act === 'PUBLISH' && (
        <>
          <p className="text-sm text-ink-muted">
            Publishing itself changes no organization&apos;s data. This is what would happen if
            every holder adopted the edition. The tonnage is an estimate from each
            organization&apos;s last completed run, whose activity data can change before the next
            one.
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Figure label="Added" value={report.rowsAdded} />
            <Figure label="Changed" value={report.rowsChanged} />
            <Figure label="Discontinued" value={report.rowsDiscontinued} />
            <Figure label="Unchanged" value={report.rowsUnchanged} />
          </dl>

          <p className="mt-3 text-sm">
            <strong>{report.rowsOverThreshold}</strong>{' '}
            {report.rowsOverThreshold === 1 ? 'row moves' : 'rows move'} by more than 5 percent
            {report.predecessorEditionId
              ? `, measured against ${report.predecessorEditionId}.`
              : '. This is the first edition of the family, so every row is an addition.'}
          </p>

          {report.rows.some((row) => row.overThreshold) && (
            <GlassCard className="mt-4 p-3">
              <h3 className="text-sm font-semibold">Rows moving more than 5 percent</h3>
              <table className="mt-2 w-full text-left text-xs">
                <thead>
                  <tr className="text-ink-muted uppercase">
                    <th className="px-2 py-1 font-semibold">Code</th>
                    <th className="px-2 py-1 font-semibold">Now</th>
                    <th className="px-2 py-1 font-semibold">Proposed</th>
                    <th className="px-2 py-1 font-semibold">Change</th>
                    <th className="px-2 py-1 font-semibold">Holders</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows
                    .filter((row) => row.overThreshold)
                    .map((row) => (
                      <tr key={row.code} className="border-t border-teal/5">
                        <td className="px-2 py-1 font-mono break-all">{row.code}</td>
                        <td className="px-2 py-1">{row.oldKgCo2e ?? '-'}</td>
                        <td className="px-2 py-1">{row.newKgCo2e ?? '-'}</td>
                        <td className="px-2 py-1">
                          {row.percentChange === null ? '-' : `${row.percentChange.toFixed(2)}%`}
                        </td>
                        <td className="px-2 py-1">{row.holders}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </GlassCard>
          )}

          {report.discontinuedLineages.length > 0 && (
            <GlassCard className="mt-4 p-3">
              <h3 className="text-sm font-semibold">
                Lineages this edition drops ({report.discontinuedLineages.length})
              </h3>
              <p className="mt-1 text-xs text-ink-muted">
                Adopting the edition does not retire them. A retirement is a separate decision.
              </p>
              <p className="mt-2 font-mono text-xs break-all">
                {report.discontinuedLineages.join(', ')}
              </p>
            </GlassCard>
          )}

          {report.unapprovedRows.length > 0 && (
            <GlassCard className="mt-4 p-3">
              <h3 className="text-sm font-semibold">
                Rows that are not approved ({report.unapprovedRows.length})
              </h3>
              <p className="mt-2 font-mono text-xs break-all">
                {report.unapprovedRows.slice(0, 20).join(', ')}
              </p>
            </GlassCard>
          )}

          {report.organizations.length === 0 && (
            <GlassCard className="mt-4 p-6 text-center">
              <h3 className="text-sm font-semibold">Nobody holds one of these lineages</h3>
              <p className="mt-1 text-xs text-ink-muted">
                Nothing would move, and no notice would be raised.
              </p>
            </GlassCard>
          )}

          {report.organizations.map((organization) => (
            <PublicationCard key={organization.organizationId} organization={organization} />
          ))}
        </>
      )}
    </Drawer>
  )
}

function headline(report: BlastRadius) {
  const holders = report.holderCount
  return `${holders === 0 ? 'No organization holds' : holders === 1 ? '1 organization holds' : `${holders} organizations hold`} one of these lineages`
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted uppercase">{label}</dt>
      <dd className="text-lg">{value.toLocaleString()}</dd>
    </div>
  )
}

/**
 * One holder as a withdrawal sees it. No movement, no estimate, no locked
 * period: a withdrawal is the publisher's act and not the client's
 * recalculation, so the only facts are what it holds and that it keeps it.
 */
function WithdrawalCard({ organization }: { organization: BlastRadiusOrganization }) {
  return (
    <GlassCard className="mt-4 p-4">
      <h3 className="text-base">{organization.organizationName}</h3>
      <p className="mt-0.5 text-xs text-ink-muted">
        {organization.lineagesHeld === 0
          ? 'Holds no row of this edition; its notice for it is open, and withdrawing closes it.'
          : `Holds ${organization.lineagesHeld} ${organization.lineagesHeld === 1 ? 'lineage' : 'lineages'} of this edition, which stay exactly as they are.`}
      </p>
    </GlassCard>
  )
}

/** One holder as a publication sees it: what would move if it adopted the edition. */
function PublicationCard({ organization }: { organization: BlastRadiusOrganization }) {
  return (
    <GlassCard className="mt-4 p-4">
      <h3 className="text-base">{organization.organizationName}</h3>
      <p className="mt-0.5 text-xs text-ink-muted">
        Holds {organization.lineagesHeld} {organization.lineagesHeld === 1 ? 'lineage' : 'lineages'}{' '}
        of this pack; {organization.rowsMoving} would move, {organization.rowsOverThreshold} by more
        than 5 percent.
      </p>
      <p className="mt-2 text-sm">
        Estimated movement:{' '}
        <strong>
          {organization.estimatedKgCo2eDelta === null
            ? 'not estimated'
            : `${organization.estimatedKgCo2eDelta.toLocaleString()} kg CO2e`}
        </strong>
        {organization.lastRunLabel
          ? `, from the last completed run (${organization.lastRunLabel}).`
          : '. The organization has completed no run, so there is nothing to estimate from.'}
      </p>

      <Group label="Open drafts that would move">
        {organization.openDrafts.length === 0
          ? 'None.'
          : organization.openDrafts.map((inventory) => inventory.name).join(', ')}
      </Group>
      <Group label="Edited locally, so never touched">
        {organization.conflicts.length === 0 ? 'None.' : organization.conflicts.join(', ')}
      </Group>
      <Group label="Inside a locked period">
        {organization.blocked.length === 0
          ? 'None.'
          : `${organization.blocked.join(', ')} (${organization.lockedPeriods
              .map((inventory) => `${inventory.name}, ${inventory.status}`)
              .join('; ')})`}
      </Group>
      <Group label="Not approved">
        {organization.unapproved.length === 0 ? 'None.' : organization.unapproved.join(', ')}
      </Group>
      <Group label="Lineages this edition drops">
        {organization.discontinued.length === 0 ? 'None.' : organization.discontinued.join(', ')}
      </Group>
    </GlassCard>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="mt-2 text-xs">
      <span className="text-ink-muted uppercase">{label}: </span>
      <span className="break-all">{children}</span>
    </p>
  )
}
