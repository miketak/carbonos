import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Button } from '../../../components/Button'
import { InputField, SelectField, TextAreaField } from '../../../components/Field'
import { Skeleton } from '../../../components/Skeleton'
import { DetailHeader } from '../../../components/SplitView'
import { Tabs } from '../../../components/Tabs'
import { fieldErrors, problemDetail, refusalMessage } from '../../../lib/api'
import { checkNumber, collectErrors, withoutError } from '../../../lib/validate'
import type { Activity, ActivityInput, DataQuality, Facility } from '../api'
import { similarSources } from '../similarSources'
import type { SimilarSource } from '../similarSources'
import {
  activityIssueLabels,
  categoryLabel,
  formatQuantity,
  formatRecordPeriod,
  scopeLabels,
  tierLabels,
} from '../format'
import { isReadOnly, mayWrite, WRITE_TOOLTIP } from '../roles'
import type { MyRole } from '../roles'
import {
  useActivityQuery,
  useCreateActivity,
  useStreamsQuery,
  useUnitsQuery,
  useUpdateActivity,
} from '../useGhg'
import { ActivityStatusPill } from './badges'
import { EmissionSourceField } from './EmissionSourceField'
import type { NewSourceDraft } from './EmissionSourceField'
import { EvidencePanel } from './EvidencePanel'
import { ReconcileSourceNotice } from './ReconcileSourceNotice'
import { UnitField } from './UnitField'

const qualityLabels: Record<DataQuality, string> = {
  MEASURED: 'Measured',
  ESTIMATED: 'Estimated',
  CALCULATED: 'Calculated',
}

type DetailTab = 'activity' | 'evidence'
type SaveMode = 'draft' | 'save' | 'next'

const iconButtonClasses =
  'flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 hover:bg-surface-sunken hover:text-ink focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40'

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h3 className="flex items-baseline justify-between text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
        {title}
        {hint && <span className="font-normal normal-case tracking-normal">{hint}</span>}
      </h3>
      {children}
    </section>
  )
}

/** Esc closes the detail from anywhere on the page, unless a modal above it owns the key. */
function useEscape(onClose: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
      onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])
}

/**
 * One record beside the register it came from (spec 10, the split register):
 * the detail of the SplitView, under its drawer-era name. The readiness
 * checks, the fields in three groups, the evidence on its own tab, and
 * previous and next so an engineer moves through a page with Save & next. A
 * draft saves with a facility and an activity type alone; a fact needs a
 * reason to change, and Save says so inline instead of going dead.
 */
export function ActivityDrawer({
  organizationId,
  activityId,
  pageItems,
  facilities,
  defaultFacilityId,
  myRole,
  onNavigate,
  onClose,
  onSaved,
  onHistory,
  onRemove,
}: {
  organizationId: string
  /** A record id, or "new". */
  activityId: string
  pageItems: Activity[]
  facilities: Facility[]
  defaultFacilityId?: string
  myRole?: MyRole
  onNavigate: (id: string) => void
  onClose: () => void
  onSaved: (message: string) => void
  onHistory: (activity: Activity) => void
  onRemove: (activity: Activity) => void
}) {
  const isNew = activityId === 'new'
  const fromPage = pageItems.find((item) => item.id === activityId)
  const activityQuery = useActivityQuery(isNew || fromPage ? null : activityId)
  const activity = fromPage ?? activityQuery.data
  const index = pageItems.findIndex((item) => item.id === activityId)
  const previous = index > 0 ? pageItems[index - 1] : undefined
  const next = index >= 0 && index < pageItems.length - 1 ? pageItems[index + 1] : undefined
  useEscape(onClose)

  if (!isNew && !activity) {
    return (
      <section aria-label="Loading record" className="flex flex-col gap-5">
        <DetailHeader
          eyebrow="Edit activity"
          title="Loading record"
          controls={
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className={iconButtonClasses}
            >
              <CloseIcon />
            </button>
          }
        />
        {activityQuery.isError ? (
          <p className="text-sm text-ink-muted">This record could not be found.</p>
        ) : (
          <Skeleton className="h-40" />
        )}
      </section>
    )
  }

  return (
    <ActivityForm
      key={activity?.id ?? 'new'}
      organizationId={organizationId}
      activity={activity}
      facilities={facilities}
      defaultFacilityId={defaultFacilityId}
      position={index >= 0 ? { index, total: pageItems.length } : undefined}
      previousId={previous?.id}
      nextId={next?.id}
      myRole={myRole}
      onNavigate={onNavigate}
      onClose={onClose}
      onSaved={onSaved}
      onHistory={onHistory}
      onRemove={onRemove}
    />
  )
}

function ActivityForm({
  organizationId,
  activity,
  facilities,
  defaultFacilityId,
  position,
  previousId,
  nextId,
  myRole,
  onNavigate,
  onClose,
  onSaved,
  onHistory,
  onRemove,
}: {
  organizationId: string
  activity: Activity | undefined
  facilities: Facility[]
  defaultFacilityId?: string
  position?: { index: number; total: number }
  previousId?: string
  nextId?: string
  myRole?: MyRole
  onNavigate: (id: string) => void
  onClose: () => void
  onSaved: (message: string) => void
  onHistory: (activity: Activity) => void
  onRemove: (activity: Activity) => void
}) {
  const create = useCreateActivity(organizationId)
  const update = useUpdateActivity(organizationId)
  const mutation = activity ? update : create
  const unitsQuery = useUnitsQuery(organizationId)
  const streamsQuery = useStreamsQuery(organizationId)
  const [tab, setTab] = useState<DetailTab>('activity')

  const [facilityId, setFacilityId] = useState(
    activity?.facilityId ?? defaultFacilityId ?? facilities[0]?.id ?? '',
  )
  const [streamId, setStreamId] = useState(activity?.streamId ?? '')
  // spec 04.10: a source described on the form, saved with the record; the candidates the
  // last save was refused with, and the reason that creates the source beside them anyway
  const [newSource, setNewSource] = useState<NewSourceDraft | null>(null)
  const [candidates, setCandidates] = useState<SimilarSource[] | undefined>()
  const [confirmReason, setConfirmReason] = useState('')
  const lastMode = useRef<SaveMode>('save')
  const [activityType, setActivityType] = useState(activity?.activityType ?? '')
  const [quantity, setQuantity] = useState(
    activity?.quantity == null ? '' : String(activity.quantity),
  )
  const [unit, setUnit] = useState(activity?.unit ?? '')
  const [periodStart, setPeriodStart] = useState(activity?.periodStart ?? '')
  const [periodEnd, setPeriodEnd] = useState(activity?.periodEnd ?? '')
  const [dataSource, setDataSource] = useState(activity?.dataSource ?? '')
  const [evidenceRef, setEvidenceRef] = useState(activity?.evidenceRef ?? '')
  const [dataQuality, setDataQuality] = useState<DataQuality>(activity?.dataQuality ?? 'MEASURED')
  const [tier, setTier] = useState(activity ? String(activity.dataQualityTier) : '')
  const [uncertainty, setUncertainty] = useState(
    activity?.uncertaintyPercent == null ? '' : String(activity.uncertaintyPercent),
  )
  const [note, setNote] = useState(activity?.note ?? '')
  const [reason, setReason] = useState('')
  const [clientErrors, setClientErrors] = useState<Record<string, string> | undefined>()
  const removeHintId = useId()
  const reasonRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // focus lands on the first control of the content, not on the header's arrows,
  // and goes back to where it was (the row) when the detail closes
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    contentRef.current?.querySelector<HTMLElement>('input, select, textarea, button')?.focus()
    return () => previouslyFocused?.focus()
  }, [])

  const streams = useMemo(
    () => (streamsQuery.data ?? []).filter((stream) => stream.facilityId === facilityId),
    [streamsQuery.data, facilityId],
  )
  const stream = streams.find((item) => item.id === streamId)
  const facilityName = facilities.find((item) => item.id === facilityId)?.name
  const errors = clientErrors ?? fieldErrors(mutation.error)
  const reconciling = candidates !== undefined && newSource !== null
  const generalError =
    mutation.isError && !errors && similarSources(mutation.error) === undefined
      ? refusalMessage(mutation.error, myRole)
      : undefined
  const readOnly = isReadOnly(myRole)
  const isFact = activity !== undefined && !activity.draft
  const reasonMissing = isFact && reason.trim().length < 5
  const today = new Date().toISOString().slice(0, 10)
  const title = activity?.activityType || activityType || 'New activity'
  // the eyebrow names the mode the help cites, then the stream's default scope and category
  // when the record has a stream, or the stream's name while its defaults load
  const savedStream = (streamsQuery.data ?? []).find((item) => item.id === activity?.streamId)
  const streamLine = savedStream
    ? `${scopeLabels[savedStream.defaultScope]} / ${categoryLabel(savedStream.defaultCategory)}`
    : activity?.streamName

  const save = (
    mode: SaveMode,
    // "Use <name>" saves again with the existing source in place of the panel (spec 04.10)
    override: { streamId?: string; newSource?: NewSourceDraft | null } = {},
  ) => {
    lastMode.current = mode
    const draft = mode === 'draft'
    const chosenStreamId = override.streamId ?? streamId
    const source = override.newSource === undefined ? newSource : override.newSource
    const invalid = collectErrors({
      quantity: checkNumber(quantity, { label: 'Quantity', positive: true, required: !draft }),
      uncertaintyPercent: checkNumber(uncertainty, { label: 'Uncertainty', min: 0, max: 100 }),
      unit: !draft && unit.trim() === '' ? 'Choose a unit.' : undefined,
      periodStart: !draft && periodStart === '' ? 'Enter the period start.' : undefined,
      newStreamName: source && source.name.trim() === '' ? "Enter the source's name." : undefined,
      reason: reasonMissing ? 'A correction needs a reason of at least 5 characters.' : undefined,
    })
    setClientErrors(invalid)
    if (invalid) {
      // the reason sits at the foot of a long form, so bring it into view
      if (invalid.reason) reasonRef.current?.focus()
      return
    }
    const input: ActivityInput = {
      draft,
      facilityId,
      streamId: source ? undefined : chosenStreamId || undefined,
      newStream: source
        ? {
            name: source.name.trim(),
            kind: source.kind,
            fuel: source.fuel.trim() === '' ? undefined : source.fuel.trim(),
            meterOrSupplier:
              source.meterOrSupplier.trim() === '' ? undefined : source.meterOrSupplier.trim(),
            contractorOperated: source.contractorOperated,
          }
        : undefined,
      confirmNewStreamReason:
        source && confirmReason.trim() !== '' ? confirmReason.trim() : undefined,
      activityType: activityType.trim(),
      quantity: quantity.trim() === '' ? undefined : Number(quantity),
      unit: unit.trim() === '' ? undefined : unit.trim(),
      periodStart: periodStart || undefined,
      periodEnd: periodEnd || periodStart || undefined,
      dataSource: dataSource.trim() === '' ? undefined : dataSource.trim(),
      evidenceRef: evidenceRef.trim() === '' ? undefined : evidenceRef.trim(),
      dataQuality,
      note: note.trim() === '' ? undefined : note.trim(),
      dataQualityTier: tier === '' ? undefined : Number(tier),
      uncertaintyPercent: uncertainty.trim() === '' ? undefined : Number(uncertainty),
      reason: isFact ? reason.trim() : undefined,
    }
    const onError = (error: unknown) => {
      const similar = similarSources(error)
      if (similar) setCandidates(similar)
    }
    if (activity) {
      update.mutate(
        { id: activity.id, input },
        {
          onError,
          onSuccess: () => {
            onSaved(
              draft
                ? 'Draft saved.'
                : activity.draft
                  ? 'Record entered. It is now a fact.'
                  : 'Record corrected. Past runs are unaffected.',
            )
            if (mode === 'next' && nextId) onNavigate(nextId)
          },
        },
      )
    } else {
      create.mutate(input, {
        onError,
        onSuccess: (saved) => {
          onSaved(draft ? 'Draft saved.' : 'Activity recorded.')
          onNavigate(saved.id)
        },
      })
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save(nextId ? 'next' : 'save')
  }

  const issues = activity?.issues ?? []
  const blocking = issues.filter((issue) => issue !== 'EVIDENCE_REFERENCE_ONLY')
  const canSave = activityType.trim() !== '' && facilityId !== ''

  return (
    <section aria-label={title} className="flex flex-col gap-6">
      <DetailHeader
        eyebrow={
          <span className="flex flex-wrap items-center gap-2">
            <span>{activity ? 'Edit activity' : 'Add activity'}</span>
            {streamLine && (
              <>
                <span aria-hidden="true" className="text-ink-faint">
                  ·
                </span>
                <span>{streamLine}</span>
              </>
            )}
          </span>
        }
        title={title}
        meta={
          activity ? (
            <span className="flex flex-wrap items-center gap-3">
              <span>{activity.recordRef}</span>
              <ActivityStatusPill activity={activity} />
              <button
                type="button"
                className="font-medium text-link hover:underline"
                onClick={() => onHistory(activity)}
              >
                History{activity.revisionCount > 0 ? ` (${activity.revisionCount})` : ''}
              </button>
              {mayWrite(myRole) ? (
                <button
                  type="button"
                  className="font-medium text-danger hover:underline"
                  onClick={() => onRemove(activity)}
                >
                  Remove
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="font-medium text-danger opacity-50"
                    disabled
                    title={WRITE_TOOLTIP}
                    aria-describedby={removeHintId}
                  >
                    Remove
                  </button>
                  <span id={removeHintId} className="sr-only">
                    {WRITE_TOOLTIP}
                  </span>
                </>
              )}
            </span>
          ) : undefined
        }
        controls={
          <>
            <button
              type="button"
              aria-label="Previous record"
              disabled={!previousId}
              onClick={() => previousId && onNavigate(previousId)}
              className={iconButtonClasses}
            >
              <ChevronIcon direction="left" />
            </button>
            <button
              type="button"
              aria-label="Next record"
              disabled={!nextId}
              onClick={() => nextId && onNavigate(nextId)}
              className={iconButtonClasses}
            >
              <ChevronIcon direction="right" />
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className={iconButtonClasses}
            >
              <CloseIcon />
            </button>
          </>
        }
      />

      <div ref={contentRef} className="flex flex-col gap-6">
        {activity && (
          <Tabs<DetailTab>
            label="Record sections"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'activity', label: 'Activity' },
              { value: 'evidence', label: 'Evidence', count: activity.evidenceCount },
            ]}
          />
        )}

        {tab === 'evidence' && activity && (
          <EvidencePanel
            owner={{ activityId: activity.id }}
            organizationId={organizationId}
            editable={mayWrite(myRole)}
            myRole={myRole}
          />
        )}

        {tab === 'activity' &&
          (readOnly ? (
            <ActivityFacts activity={activity} />
          ) : (
            <form
              id="activity-drawer-form"
              onSubmit={submit}
              className="flex flex-col gap-7"
              noValidate
            >
              {activity ? (
                activity.status === 'READY' ? (
                  <CompletionNote
                    tone="ready"
                    title="All completeness checks passed."
                    detail={
                      <>
                        This record is ready for an accountant's review.
                        {issues.includes('EVIDENCE_REFERENCE_ONLY') &&
                          ' It cites a reference; nothing is attached yet.'}
                      </>
                    }
                  />
                ) : (
                  <CompletionNote
                    tone="attention"
                    title={
                      activity.draft ? 'A draft, not yet a fact.' : 'Not ready for review yet.'
                    }
                    detail={
                      blocking.length > 0 && (
                        <ul className="list-disc pl-4">
                          {blocking.map((issue) => (
                            <li key={issue}>{activityIssueLabels[issue]}</li>
                          ))}
                        </ul>
                      )
                    }
                  />
                )
              ) : (
                <p className="text-[13px] text-ink-muted">
                  Save a draft with just the activity and the facility, or fill in the figures and
                  save the fact. The checks run on the saved record.
                </p>
              )}

              <Section title="Activity details" hint="Required fields *">
                <InputField
                  label="Activity type *"
                  placeholder="e.g. Diesel consumption"
                  value={activityType}
                  onChange={(event) => setActivityType(event.target.value)}
                  error={errors?.activityType}
                  required
                />
                <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                  <SelectField
                    label="Facility *"
                    value={facilityId}
                    onChange={(event) => {
                      setFacilityId(event.target.value)
                      setStreamId('')
                      setNewSource(null)
                      setCandidates(undefined)
                      setConfirmReason('')
                    }}
                    error={errors?.facilityId}
                  >
                    {facilities.map((facility) => (
                      <option key={facility.id} value={facility.id}>
                        {facility.name}
                      </option>
                    ))}
                  </SelectField>
                  <EmissionSourceField
                    facilityName={facilityName}
                    streams={streams}
                    value={streamId}
                    newSource={newSource}
                    canCreate={mayWrite(myRole)}
                    error={errors?.streamId ?? errors?.newStream}
                    nameError={errors?.newStreamName ?? errors?.['newStream.name']}
                    onChange={setStreamId}
                    onNewSourceChange={(draft) => {
                      setNewSource(draft)
                      setCandidates(undefined)
                      setClientErrors((current) => withoutError(current, 'newStreamName'))
                    }}
                  />
                  {reconciling && candidates && newSource && (
                    <div className="md:col-span-2">
                      <ReconcileSourceNotice
                        detail={problemDetail(mutation.error)}
                        facilityName={facilityName}
                        typedName={newSource.name}
                        candidates={candidates}
                        reason={confirmReason}
                        reasonError={errors?.confirmNewStreamReason}
                        busy={mutation.isPending}
                        onReasonChange={setConfirmReason}
                        onUse={(candidate) => {
                          setStreamId(candidate.id)
                          setNewSource(null)
                          setCandidates(undefined)
                          setConfirmReason('')
                          mutation.reset()
                          save(lastMode.current, { streamId: candidate.id, newSource: null })
                        }}
                        onCreateAnyway={() => save(lastMode.current)}
                      />
                    </div>
                  )}
                  <InputField
                    label="Period start *"
                    type="date"
                    max={today}
                    value={periodStart}
                    onChange={(event) => {
                      setPeriodStart(event.target.value)
                      setClientErrors((current) => withoutError(current, 'periodStart'))
                    }}
                    error={errors?.periodStart}
                    hint="The period the quantity covers, not the invoice date."
                  />
                  <InputField
                    label="Period end"
                    type="date"
                    min={periodStart || undefined}
                    max={today}
                    value={periodEnd}
                    onChange={(event) => setPeriodEnd(event.target.value)}
                    error={errors?.periodEnd}
                    hint="Same as the start for a single reading."
                  />
                </div>
                <div className="grid gap-x-6 gap-y-5 md:grid-cols-[minmax(0,1fr)_200px]">
                  <InputField
                    label="Activity quantity *"
                    type="number"
                    value={quantity}
                    onChange={(event) => {
                      setQuantity(event.target.value)
                      setClientErrors((current) => withoutError(current, 'quantity'))
                    }}
                    error={errors?.quantity}
                  />
                  <UnitField
                    value={unit}
                    onChange={(value) => {
                      setUnit(value)
                      setClientErrors((current) => withoutError(current, 'unit'))
                    }}
                    error={errors?.unit}
                    units={unitsQuery.data ?? []}
                    loading={unitsQuery.isPending}
                  />
                </div>
                {stream ? (
                  <p className="rounded-lg bg-surface-sunken px-3 py-2 text-[13px] text-ink-muted">
                    <span className="font-semibold text-ink">Source default:</span>{' '}
                    {scopeLabels[stream.defaultScope]} · {categoryLabel(stream.defaultCategory)}.
                    Scope is confirmed in each inventory's review.
                  </p>
                ) : (
                  streams.length === 0 &&
                  !newSource && (
                    <p className="text-[13px] text-ink-muted">
                      This facility has no emission sources yet. Choose New emission source… above,
                      or register them under Facilities › Emission sources.
                    </p>
                  )
                )}
              </Section>

              <Section title="Source and traceability">
                <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                  <InputField
                    label="Data source"
                    placeholder="Example: utility invoice, dispensing log, meter reading"
                    value={dataSource}
                    onChange={(event) => setDataSource(event.target.value)}
                    error={errors?.dataSource}
                  />
                  <InputField
                    label="Document reference"
                    placeholder="Example: INV-2938"
                    value={evidenceRef}
                    onChange={(event) => setEvidenceRef(event.target.value)}
                    error={errors?.evidenceRef}
                    hint="Invoice, meter reading or log number as printed on the document."
                  />
                </div>
                {stream?.meterOrSupplier && (
                  <p className="text-[13px] text-ink-muted">
                    Meter or supplier on the source: {stream.meterOrSupplier}
                  </p>
                )}
              </Section>

              {activity && (
                <Section title="Supporting evidence">
                  <div
                    className={`flex min-h-[52px] items-center justify-between gap-3 rounded-lg border border-hairline px-3.5 text-sm ${
                      activity.evidenceCount === 0 ? 'border-dashed border-hairline-strong' : ''
                    }`}
                  >
                    <span className={activity.evidenceCount > 0 ? 'font-medium' : 'text-ink-muted'}>
                      {activity.evidenceCount > 0
                        ? `${activity.evidenceCount} attached`
                        : activity.evidenceRef
                          ? `Reference ${activity.evidenceRef}, nothing attached`
                          : 'Nothing attached'}
                    </span>
                    <button
                      type="button"
                      className="font-medium text-link hover:underline"
                      onClick={() => setTab('evidence')}
                    >
                      {activity.evidenceCount === 0 ? 'Attach a file or link →' : 'Open evidence →'}
                    </button>
                  </div>
                </Section>
              )}

              <Section title="Notes" hint="Optional">
                <TextAreaField
                  label="Context for the reviewer"
                  placeholder="Estimation method, allocation, or useful context."
                  value={note}
                  maxLength={255}
                  onChange={(event) => setNote(event.target.value)}
                  error={errors?.note}
                />
              </Section>

              <details className="group">
                <summary className="cursor-pointer text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
                  Data quality
                </summary>
                <div className="mt-4 flex flex-col gap-5">
                  <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                    <SelectField
                      label="Method"
                      value={dataQuality}
                      onChange={(event) => setDataQuality(event.target.value as DataQuality)}
                      error={errors?.dataQuality}
                    >
                      {Object.entries(qualityLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </SelectField>
                    <SelectField
                      label="Quality tier"
                      value={tier}
                      onChange={(event) => setTier(event.target.value)}
                      error={errors?.dataQualityTier}
                      hint="1 is metered primary data, 5 an assumption. Blank follows the method."
                    >
                      <option value="">Follow the method</option>
                      {Object.entries(tierLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {value}: {label}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                  <InputField
                    label="Uncertainty, ± %"
                    type="number"
                    min="0"
                    step="0.1"
                    value={uncertainty}
                    onChange={(event) => {
                      setUncertainty(event.target.value)
                      setClientErrors((current) => withoutError(current, 'uncertaintyPercent'))
                    }}
                    error={errors?.uncertaintyPercent}
                    hint="The report weights it by emissions into the uncertainty statement."
                  />
                </div>
              </details>

              {isFact && (
                <InputField
                  ref={reasonRef}
                  label="Reason for the correction *"
                  placeholder="Dispensing log reconciled with the supplier invoice"
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value)
                    setClientErrors((current) => withoutError(current, 'reason'))
                  }}
                  error={errors?.reason}
                  hint="Recorded with the old and new values in the record's history."
                  minLength={5}
                  maxLength={500}
                  required
                />
              )}
              {generalError && (
                <p role="alert" className="text-sm font-medium text-danger">
                  {generalError}
                </p>
              )}
            </form>
          ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-5">
        <span className="text-[13px] text-ink-muted">
          {position ? `${position.index + 1}/${position.total}` : 'New record'}
        </span>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {mayWrite(myRole) && (
            <>
              {!isFact && (
                <Button
                  type="button"
                  variant="ghost"
                  busy={mutation.isPending}
                  disabled={!canSave}
                  onClick={() => save('draft')}
                >
                  Save draft
                </Button>
              )}
              {nextId && (
                <Button
                  type="button"
                  variant="secondary"
                  busy={mutation.isPending}
                  disabled={!canSave}
                  onClick={() => save('save')}
                >
                  Save
                </Button>
              )}
              <Button
                type="submit"
                form="activity-drawer-form"
                busy={mutation.isPending}
                disabled={!canSave}
              >
                {nextId ? 'Save & next →' : 'Save'}
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}

/** The note under the checks (spec 04.6): a ring with a check or a mark, the verdict and its detail. */
function CompletionNote({
  tone,
  title,
  detail,
}: {
  tone: 'ready' | 'attention'
  title: string
  detail: ReactNode
}) {
  return (
    <div role="status" className="flex items-start gap-3.5">
      <span
        aria-hidden="true"
        className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
          tone === 'ready' ? 'border-primary text-primary' : 'border-warning-dot text-warning'
        }`}
      >
        {tone === 'ready' ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 12 5 5 9-10" />
          </svg>
        ) : (
          '!'
        )}
      </span>
      <div className="text-sm">
        <p className="font-medium">{title}</p>
        {detail && <div className="mt-0.5 text-[13px] text-ink-muted">{detail}</div>}
      </div>
    </div>
  )
}

/**
 * The verifier's view of a record (spec 01.4): the facts, read-only, with no
 * fields and no Save. Evidence and history stay on their own tab and button.
 */
function ActivityFacts({ activity }: { activity: Activity | undefined }) {
  if (!activity) {
    return <p className="text-sm text-ink-muted">You do not have permission to add a record.</p>
  }
  return (
    <div className="flex flex-col gap-7">
      <Section title="Activity details">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <Fact label="Activity type" value={activity.activityType} />
          <Fact label="Facility" value={activity.facilityName} />
          <Fact label="Emission source" value={activity.streamName ?? 'No emission source'} />
          <Fact
            label="Period"
            value={formatRecordPeriod(activity.periodStart, activity.periodEnd)}
          />
          <Fact
            label="Quantity"
            value={
              activity.quantity === null
                ? '—'
                : `${formatQuantity(activity.quantity)} ${activity.unit ?? ''}`.trim()
            }
          />
          <Fact label="Data quality" value={qualityLabels[activity.dataQuality]} />
        </dl>
      </Section>
      <Section title="Source and traceability">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <Fact label="Data source" value={activity.dataSource ?? '—'} />
          <Fact label="Document reference" value={activity.evidenceRef ?? '—'} />
        </dl>
      </Section>
      <Section title="Notes">
        <p className="text-sm">{activity.note ?? '—'}</p>
      </Section>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[13px] text-ink-muted">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={direction === 'left' ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6'} />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}
