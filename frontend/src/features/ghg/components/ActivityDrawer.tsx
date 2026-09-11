import { useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { Button } from '../../../components/Button'
import { Drawer } from '../../../components/Drawer'
import { InputField, SelectField, TextAreaField } from '../../../components/Field'
import { Skeleton } from '../../../components/Skeleton'
import { Tabs } from '../../../components/Tabs'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { checkNumber, collectErrors, withoutError } from '../../../lib/validate'
import type { Activity, ActivityInput, DataQuality, Facility } from '../api'
import { activityIssueLabels, categoryLabel, scopeLabels, tierLabels } from '../format'
import {
  useActivityQuery,
  useCreateActivity,
  useStreamsQuery,
  useUnitsQuery,
  useUpdateActivity,
} from '../useGhg'
import { ActivityStatusPill } from './badges'
import { EvidencePanel } from './EvidencePanel'
import { UnitField } from './UnitField'

const qualityLabels: Record<DataQuality, string> = {
  MEASURED: 'Measured',
  ESTIMATED: 'Estimated',
  CALCULATED: 'Calculated',
}

type DrawerTab = 'activity' | 'evidence'
type SaveMode = 'draft' | 'save' | 'next'

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex items-baseline justify-between text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
        {title}
        {hint && <span className="font-normal normal-case tracking-normal">{hint}</span>}
      </h3>
      {children}
    </section>
  )
}

/**
 * Edits one record beside the register (spec 04.6): the readiness checks, the
 * fields in three groups, the evidence on its own tab, and a navigator so an
 * engineer moves through a page with Save & next. A draft saves with a facility
 * and an activity type alone; a fact needs a reason to change.
 */
export function ActivityDrawer({
  organizationId,
  activityId,
  pageItems,
  facilities,
  defaultFacilityId,
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

  if (!isNew && !activity) {
    return (
      <Drawer eyebrow="Edit activity" title="Loading record" onClose={onClose}>
        {activityQuery.isError ? (
          <p className="text-sm text-ink-muted">This record could not be found.</p>
        ) : (
          <Skeleton className="h-40" />
        )}
      </Drawer>
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
  const [tab, setTab] = useState<DrawerTab>('activity')

  const [facilityId, setFacilityId] = useState(
    activity?.facilityId ?? defaultFacilityId ?? facilities[0]?.id ?? '',
  )
  const [streamId, setStreamId] = useState(activity?.streamId ?? '')
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

  const streams = useMemo(
    () => (streamsQuery.data ?? []).filter((stream) => stream.facilityId === facilityId),
    [streamsQuery.data, facilityId],
  )
  const stream = streams.find((item) => item.id === streamId)
  const errors = clientErrors ?? fieldErrors(mutation.error)
  const generalError = mutation.isError && !errors ? problemDetail(mutation.error) : undefined
  const isFact = activity !== undefined && !activity.draft
  const reasonMissing = isFact && reason.trim().length < 5
  const today = new Date().toISOString().slice(0, 10)

  const save = (mode: SaveMode) => {
    const draft = mode === 'draft'
    const invalid = collectErrors({
      quantity: checkNumber(quantity, { label: 'Quantity', positive: true, required: !draft }),
      uncertaintyPercent: checkNumber(uncertainty, { label: 'Uncertainty', min: 0, max: 100 }),
      unit: !draft && unit.trim() === '' ? 'Choose a unit.' : undefined,
      periodStart: !draft && periodStart === '' ? 'Enter the period start.' : undefined,
    })
    setClientErrors(invalid)
    if (invalid) return
    const input: ActivityInput = {
      draft,
      facilityId,
      streamId: streamId || undefined,
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
    if (activity) {
      update.mutate(
        { id: activity.id, input },
        {
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

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {position ? (
        <div className="flex items-center gap-1 text-xs text-ink-muted">
          <span>
            {position.index + 1}/{position.total}
          </span>
          <button
            type="button"
            aria-label="Previous record"
            disabled={!previousId}
            onClick={() => previousId && onNavigate(previousId)}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-teal/10 disabled:opacity-40"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next record"
            disabled={!nextId}
            onClick={() => nextId && onNavigate(nextId)}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-teal/10 disabled:opacity-40"
          >
            ›
          </button>
        </div>
      ) : (
        <span className="text-xs text-ink-muted">New record</span>
      )}
      <div className="flex gap-2">
        {!isFact && (
          <Button
            type="button"
            variant="ghost"
            className="px-3 py-1.5 text-sm"
            busy={mutation.isPending}
            disabled={activityType.trim() === '' || facilityId === ''}
            onClick={() => save('draft')}
          >
            Save draft
          </Button>
        )}
        {nextId && (
          <Button
            type="button"
            variant="ghost"
            className="px-3 py-1.5 text-sm"
            busy={mutation.isPending}
            disabled={reasonMissing}
            onClick={() => save('save')}
          >
            Save
          </Button>
        )}
        <Button
          type="submit"
          form="activity-drawer-form"
          className="px-4 py-1.5 text-sm"
          busy={mutation.isPending}
          disabled={reasonMissing || activityType.trim() === '' || facilityId === ''}
        >
          {nextId ? 'Save & next →' : 'Save'}
        </Button>
      </div>
    </div>
  )

  return (
    <Drawer
      eyebrow={activity ? 'Edit activity' : 'Add activity'}
      title={activity?.activityType || activityType || 'New activity'}
      subtitle={
        activity ? (
          <>
            <span className="font-mono text-xs">{activity.recordRef}</span>
            <ActivityStatusPill activity={activity} />
            <button
              type="button"
              className="text-xs text-link hover:underline"
              onClick={() => onHistory(activity)}
            >
              History{activity.revisionCount > 0 ? ` (${activity.revisionCount})` : ''}
            </button>
            <button
              type="button"
              className="text-xs text-red-600 hover:underline"
              onClick={() => onRemove(activity)}
            >
              Remove
            </button>
          </>
        ) : undefined
      }
      footer={footer}
      onClose={onClose}
    >
      {activity && (
        <div className="mb-4">
          <Tabs<DrawerTab>
            label="Record sections"
            value={tab}
            onChange={setTab}
            tabs={[
              { value: 'activity', label: 'Activity' },
              { value: 'evidence', label: 'Evidence', count: activity.evidenceCount },
            ]}
          />
        </div>
      )}

      {tab === 'evidence' && activity && (
        <EvidencePanel
          owner={{ activityId: activity.id }}
          organizationId={organizationId}
          editable
        />
      )}

      {tab === 'activity' && (
        <form
          id="activity-drawer-form"
          onSubmit={submit}
          className="flex flex-col gap-6"
          noValidate
        >
          {activity ? (
            activity.status === 'READY' ? (
              <div
                role="status"
                className="rounded-lg border border-teal/30 bg-accent-green/20 px-3 py-2 text-sm"
              >
                <p className="font-semibold">All completeness checks passed.</p>
                <p className="text-xs text-ink-muted">
                  This record is ready for an accountant's review.
                  {issues.includes('EVIDENCE_REFERENCE_ONLY') &&
                    ' It cites a reference; nothing is attached yet.'}
                </p>
              </div>
            ) : (
              <div
                role="status"
                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800"
              >
                <p className="font-semibold">
                  {activity.draft ? 'A draft, not yet a fact.' : 'Not ready for review yet.'}
                </p>
                {blocking.length > 0 && (
                  <ul className="mt-1 list-disc pl-4 text-xs">
                    {blocking.map((issue) => (
                      <li key={issue}>{activityIssueLabels[issue]}</li>
                    ))}
                  </ul>
                )}
              </div>
            )
          ) : (
            <p className="text-xs text-ink-muted">
              Save a draft with just the activity and the facility, or fill in the figures and save
              the fact. The checks run on the saved record.
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
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Facility *"
                value={facilityId}
                onChange={(event) => {
                  setFacilityId(event.target.value)
                  setStreamId('')
                }}
                error={errors?.facilityId}
              >
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Stream"
                value={streamId}
                onChange={(event) => setStreamId(event.target.value)}
                error={errors?.streamId}
              >
                <option value="">No stream</option>
                {streams.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
            <div className="grid grid-cols-2 gap-3">
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
              <p className="rounded-lg bg-teal/5 px-3 py-2 text-xs text-ink-muted">
                <span className="font-semibold text-dark-teal">Stream default:</span>{' '}
                {scopeLabels[stream.defaultScope]} · {categoryLabel(stream.defaultCategory)}. Scope
                is confirmed in each inventory's review.
              </p>
            ) : (
              streams.length === 0 && (
                <p className="text-xs text-ink-muted">
                  This facility has no source streams yet; register them under Facilities so the
                  factor picker and the coverage matrix know this source.
                </p>
              )
            )}
          </Section>

          <Section title="Source and traceability">
            <InputField
              label="Data source"
              placeholder="Utility invoice, dispensing log, meter reading"
              value={dataSource}
              onChange={(event) => setDataSource(event.target.value)}
              error={errors?.dataSource}
            />
            <InputField
              label="Document reference"
              placeholder="INV-2938"
              value={evidenceRef}
              onChange={(event) => setEvidenceRef(event.target.value)}
              error={errors?.evidenceRef}
              hint="Invoice, meter reading or log number as printed on the document."
            />
            {stream?.meterOrSupplier && (
              <p className="text-xs text-ink-muted">
                Meter or supplier on the stream: {stream.meterOrSupplier}
              </p>
            )}
          </Section>

          {activity && (
            <Section title="Supporting evidence">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">
                  {activity.evidenceCount === 0
                    ? 'Nothing attached'
                    : `${activity.evidenceCount} attached`}
                </span>
                <button
                  type="button"
                  className="text-xs font-semibold text-link hover:underline"
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
            <summary className="cursor-pointer text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
              Data quality
            </summary>
            <div className="mt-3 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
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
              label="Reason for the correction *"
              placeholder="Dispensing log reconciled with the supplier invoice"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              error={errors?.reason}
              hint="Recorded with the old and new values in the record's history."
              minLength={5}
              maxLength={500}
              required
            />
          )}
          {generalError && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {generalError}
            </p>
          )}
        </form>
      )}
    </Drawer>
  )
}
