import { useState } from 'react'
import type { FormEvent } from 'react'
import { Drawer } from '../../../components/Drawer'
import { SelectField, TextAreaField } from '../../../components/Field'
import { Skeleton } from '../../../components/Skeleton'
import { useToast } from '../../../components/toast'
import { fieldErrors, refusalMessage } from '../../../lib/api'
import { formatCo2e, formatPeriod } from '../format'
import { APPROVE_TOOLTIP, mayApprove } from '../roles'
import type { MyRole } from '../roles'
import { RoleButton } from './RoleButton'
import {
  useAcceptFactorPackNotice,
  useDeclineFactorPackNotice,
  useFactorPackDiffQuery,
} from '../useGhg'
import type { FactorPackApartRow, FactorPackNotice, RecalculationCase } from '../api'

const caseLabels: Record<RecalculationCase, string> = {
  VINTAGE_PROGRESSION:
    'Vintage progression: the edition applies to the next reporting year forward',
  RETROSPECTIVE_ADOPTION:
    'Retrospective adoption: the edition is applied to a year already reported',
  ERRATUM_ON_REPORTED_YEAR:
    'Erratum: the edition corrects a wrong value in a year already reported',
}

function percent(value: number | null): string {
  if (value == null) return 'not measured'
  return `${value > 0 ? '+' : ''}${value}%`
}

function movement(kg: number | null): string {
  if (kg == null) return 'not estimated'
  return `${kg > 0 ? '+' : ''}${formatCo2e(kg)}`
}

/** One of the groups the decision does not apply to, listed apart with its reason. */
function ApartGroup({
  heading,
  rows,
  note,
}: {
  heading: string
  rows: FactorPackApartRow[]
  note: string
}) {
  if (rows.length === 0) return null
  return (
    <section className="rounded-lg border border-teal/15 bg-white/60 p-3">
      <h3 className="text-sm font-semibold text-dark-teal">
        {heading} ({rows.length})
      </h3>
      <p className="mt-1 text-xs text-ink-muted">{note}</p>
      <ul className="mt-2 flex flex-col gap-1 text-xs">
        {rows.map((row) => (
          <li key={row.code}>
            <span className="font-mono">{row.code}</span> — {row.name}
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * The diff behind one notice and the decision on it (spec 02.7). Every lineage
 * the edition moves is shown with the value held, the value the edition
 * carries, the change, the gases that moved, whether provenance moved, and the
 * movement estimated over the current draft period. Conflicts, blocked
 * lineages, discontinued lineages and earlier periods are listed apart,
 * because the decision does not apply to them.
 *
 * <p>Accepting or declining is one act by one named person holding Reviewer or
 * Owner, and accepting answers the recalculation question chapter 5 asks.
 */
export function AdoptionDiffDrawer({
  organizationId,
  notice,
  myRole,
  onClose,
}: {
  organizationId: string
  notice: FactorPackNotice
  myRole: MyRole | undefined
  onClose: () => void
}) {
  const diffQuery = useFactorPackDiffQuery(notice.id)
  const accept = useAcceptFactorPackNotice(organizationId)
  const decline = useDeclineFactorPackNotice(organizationId)
  const toast = useToast()
  const [answer, setAnswer] = useState<RecalculationCase | ''>('')
  const [note, setNote] = useState('')
  const [refusal, setRefusal] = useState<string | null>(null)

  const diff = diffQuery.data
  const allowed = mayApprove(myRole)
  const open = notice.status === 'OPEN'
  const errors = fieldErrors(accept.error)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setRefusal(null)
    if (answer === '') return
    accept.mutate(
      { noticeId: notice.id, recalculationCase: answer, note: note.trim() || undefined },
      {
        onSuccess: (result) => {
          toast(
            `Adopted ${notice.editionId}: ${result.versioned} version${
              result.versioned === 1 ? '' : 's'
            } cut, ${result.created} lineage${result.created === 1 ? '' : 's'} added.`,
          )
          onClose()
        },
        onError: (error) => setRefusal(refusalMessage(error, myRole)),
      },
    )
  }

  const onDecline = () => {
    setRefusal(null)
    decline.mutate(
      { noticeId: notice.id, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast(`Declined ${notice.editionId}. Nothing changed.`)
          onClose()
        },
        onError: (error) => setRefusal(refusalMessage(error, myRole)),
      },
    )
  }

  return (
    <Drawer
      eyebrow="FACTOR PACK UPDATE"
      title={notice.editionName}
      subtitle={
        <>
          <span className="font-mono text-xs">{notice.editionId}</span>
          {notice.predecessorEditionId && (
            <span className="text-xs">in place of {notice.predecessorEditionId}</span>
          )}
          {notice.appliesFrom && <span className="text-xs">applies from {notice.appliesFrom}</span>}
        </>
      }
      onClose={onClose}
      footer={
        open ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <RoleButton
              allowed={allowed}
              tooltip={APPROVE_TOOLTIP}
              variant="ghost"
              type="button"
              busy={decline.isPending}
              onClick={onDecline}
            >
              Decline
            </RoleButton>
            <RoleButton
              allowed={allowed}
              tooltip={APPROVE_TOOLTIP}
              type="submit"
              form="adoption-decision"
              busy={accept.isPending}
              disabled={answer === ''}
            >
              Accept
            </RoleButton>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">
            {notice.status === 'WITHDRAWN'
              ? 'The publisher withdrew this edition, so there is nothing to decide.'
              : `${notice.status === 'ACCEPTED' ? 'Accepted' : 'Declined'} by ${
                  notice.decidedBy ?? 'a member'
                }${notice.decidedAt ? ` on ${notice.decidedAt.slice(0, 10)}` : ''}.`}
          </p>
        )
      }
    >
      {diffQuery.isPending && (
        <div aria-label="Loading the diff" className="flex flex-col gap-2">
          <Skeleton className="h-8" />
          <Skeleton className="h-24" />
        </div>
      )}

      {diff && (
        <div className="flex flex-col gap-4">
          {diff.gwpBasisChanged && (
            <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              This edition moves the Global Warming Potential basis from {diff.currentGwpBasis} to{' '}
              {diff.newGwpBasis}. Chapter 1 requires one basis across the inventory and across
              years, so it cannot be answered as a vintage progression.
            </p>
          )}

          {diff.lockedPeriod && (
            <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              {diff.appliesFrom} falls inside {diff.lockedPeriod.name} (
              {formatPeriod(diff.lockedPeriod.periodStart, diff.lockedPeriod.periodEnd)}), which is{' '}
              {diff.lockedPeriod.status.toLowerCase()}. A reported period keeps the factors it
              reported with, so this edition cannot be accepted until that inventory is reopened.
              Declining stays available.
            </p>
          )}

          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-ink-muted">Rows moving</dt>
              <dd className="font-semibold">{notice.rowsAffected}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Over five percent</dt>
              <dd className="font-semibold">{notice.rowsOverThreshold}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Estimated movement</dt>
              <dd className="font-semibold">{movement(diff.estimatedKgCo2eDelta)}</dd>
            </div>
          </dl>
          <p className="text-xs text-ink-muted">
            {diff.estimatedOver
              ? `The movement is an estimate over ${diff.estimatedOver}, using the activity data already recorded. That data can change before the next run.`
              : 'There is no open period to estimate the movement over yet.'}
            {diff.hasBaseYear && diff.affectedPercent != null
              ? ` It is ${diff.affectedPercent}% of base-year emissions, measured against your ${diff.thresholdPercent}% significance threshold.`
              : ' The organization has no base year, so no recalculation candidate can be raised.'}
          </p>

          <section>
            <h3 className="text-sm font-semibold text-dark-teal">
              What moves ({diff.rows.length})
            </h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-xs">
                <thead className="text-ink-muted">
                  <tr>
                    <th scope="col" className="py-1 pr-2 font-medium">
                      Factor
                    </th>
                    <th scope="col" className="py-1 pr-2 font-medium">
                      Now
                    </th>
                    <th scope="col" className="py-1 pr-2 font-medium">
                      New
                    </th>
                    <th scope="col" className="py-1 pr-2 font-medium">
                      Change
                    </th>
                    <th scope="col" className="py-1 pr-2 font-medium">
                      Estimated movement
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {diff.rows.map((row) => (
                    <tr key={row.code} className="border-t border-teal/10 align-top">
                      <th scope="row" className="py-1.5 pr-2 text-left font-normal">
                        <span className="font-semibold">{row.name}</span>
                        <span className="block font-mono text-[11px] text-ink-muted">
                          {row.code} · per {row.unit}
                        </span>
                        {row.gasesChanged.length > 0 && (
                          <span className="block text-[11px] text-ink-muted">
                            Gases changed: {row.gasesChanged.join(', ')}
                          </span>
                        )}
                        {row.provenanceChanged && (
                          <span className="block text-[11px] text-ink-muted">
                            Provenance changed
                            {row.gwpBasisChanged ? ', including the GWP basis' : ''}
                          </span>
                        )}
                      </th>
                      <td className="py-1.5 pr-2 tabular-nums">{row.currentKgCo2ePerUnit}</td>
                      <td className="py-1.5 pr-2 tabular-nums">{row.newKgCo2ePerUnit}</td>
                      <td className="py-1.5 pr-2 tabular-nums">
                        {row.absoluteChange ?? '—'}
                        <span className="block text-[11px] text-ink-muted">
                          {percent(row.percentChange)}
                        </span>
                      </td>
                      <td className="py-1.5 pr-2 tabular-nums">
                        {movement(row.estimatedKgCo2eDelta)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <ApartGroup
            heading="Conflicts"
            rows={diff.conflicts}
            note="Edited here, so the import never touches them, whatever the decision."
          />
          <ApartGroup
            heading="Blocked"
            rows={diff.blocked}
            note="Used by a period that is frozen, final or published, which keeps the factors it reported with."
          />
          <ApartGroup
            heading="Discontinued"
            rows={diff.discontinued}
            note="Lineages you hold that this edition drops. Accepting does not retire them; a retirement is a separate decision."
          />

          {diff.earlierPeriods.length > 0 && (
            <section className="rounded-lg border border-teal/15 bg-white/60 p-3">
              <h3 className="text-sm font-semibold text-dark-teal">
                Earlier periods ({diff.earlierPeriods.length})
              </h3>
              <p className="mt-1 text-xs text-ink-muted">
                These end before {diff.appliesFrom}, so they will raise coverage warnings once the
                edition is accepted. The warning is correct and is what a vintage means.
              </p>
              <ul className="mt-2 flex flex-col gap-1 text-xs">
                {diff.earlierPeriods.map((period) => (
                  <li key={period.inventoryId}>
                    {period.name} ({formatPeriod(period.periodStart, period.periodEnd)})
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-[11px] text-ink-muted">
            Diff hash <span className="font-mono">{diff.diffHash.slice(0, 16)}…</span>
          </p>

          {open && (
            <form id="adoption-decision" onSubmit={submit} className="flex flex-col gap-3">
              <SelectField
                label="How does chapter 5 treat this adoption?"
                value={answer}
                onChange={(event) => setAnswer(event.target.value as RecalculationCase | '')}
                error={errors?.recalculationCase}
                hint="Required on acceptance, and kept whatever the answer, so a verifier can see the question was asked."
              >
                <option value="">Choose an answer</option>
                {(Object.keys(caseLabels) as RecalculationCase[]).map((value) => (
                  <option key={value} value={value}>
                    {caseLabels[value]}
                  </option>
                ))}
              </SelectField>
              <TextAreaField
                label="Note (optional)"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                error={errors?.note}
                hint="Required when a vintage progression is at or above your significance threshold, because that is the case a verifier questions."
              />
              <p role="note" className="rounded-lg bg-teal/10 p-3 text-sm text-dark-teal">
                {diff.recalculationWarning}
              </p>
              {refusal && (
                <p role="alert" className="text-sm text-red-700">
                  {refusal}
                </p>
              )}
            </form>
          )}

          {!open && notice.recalculationCase && (
            <p className="text-sm">
              Answered as: <strong>{caseLabels[notice.recalculationCase].split(':')[0]}</strong>
              {notice.affectedPercent != null &&
                ` (${notice.affectedPercent}% of base-year emissions against a ${notice.significanceThresholdPercent}% threshold)`}
              {notice.decisionNote ? `. ${notice.decisionNote}` : '.'}
            </p>
          )}
        </div>
      )}
    </Drawer>
  )
}
