import { useId } from 'react'
import { InputField, SelectField } from '../../../components/Field'
import { categoryLabel, scopeLabels, streamKindLabels } from '../format'
import type { SourceStream, UnknownImportSource } from '../api'
import { NewSourceFields } from './NewSourceFields'
import type { NewSourceDraft } from './NewSourceFields'
import { SIMILAR_REASON_MIN } from './ReconcileSourceNotice'

/** What the analyst decided for one unknown name (spec 04.11), as typed. */
export type DecisionDraft =
  | { kind: 'use'; streamId: string }
  | { kind: 'other'; streamId: string; reason: string }
  | { kind: 'create'; draft: NewSourceDraft; reason: string }

/** "rows 4, 9, 17" or "row 4". */
export function rowsText(rows: number[]): string {
  return `${rows.length === 1 ? 'row' : 'rows'} ${rows.join(', ')}`
}

/** True when the decision is complete enough to commit. */
export function decisionComplete(decision: DecisionDraft | undefined, candidates: number): boolean {
  if (!decision) return false
  if (decision.kind === 'use') return decision.streamId !== ''
  if (decision.kind === 'other') {
    return decision.streamId !== '' && decision.reason.trim().length >= SIMILAR_REASON_MIN
  }
  return (
    decision.draft.name.trim() !== '' &&
    (candidates === 0 || decision.reason.trim().length >= SIMILAR_REASON_MIN)
  )
}

/**
 * One emission source name the file has and the facility does not (spec
 * 04.11): the rows it covers, then the choice. A near name the preview found
 * is offered with one click, as the activity form offers it; any other source
 * of the facility needs a reason, since nothing in the name suggested it; or
 * the source is created here, described as the form describes one, with the
 * reason of spec 04.10 when a candidate is near. Nothing is matched silently.
 */
export function ImportDecisionCard({
  unknown,
  streams,
  decision,
  errors,
  onChange,
}: {
  unknown: UnknownImportSource
  /** The facility's sources, for "Use another source". */
  streams: SourceStream[]
  decision: DecisionDraft | undefined
  /** The backend's field messages for this card, if the commit was refused. */
  errors?: { reason?: string; name?: string }
  onChange: (decision: DecisionDraft) => void
}) {
  const group = useId()
  const candidateIds = new Set(unknown.candidates.map((candidate) => candidate.id))
  const others = streams.filter((stream) => !candidateIds.has(stream.id))
  const title = `'${unknown.name}' at ${unknown.facility}`
  return (
    <fieldset
      aria-label={title}
      className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface p-4"
    >
      <legend className="sr-only">{title}</legend>
      <div>
        <h4 className="text-sm font-semibold">{title}</h4>
        <p className="text-[13px] text-ink-muted">
          {unknown.facility} has no emission source with this name. It covers{' '}
          {rowsText(unknown.rows)}.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        {unknown.candidates.map((candidate) => {
          const checked = decision?.kind === 'use' && decision.streamId === candidate.id
          return (
            <label key={candidate.id} className="flex items-start gap-2.5 text-[15px]">
              <input
                type="radio"
                name={group}
                className="mt-1.5 size-4 accent-primary"
                checked={checked}
                onChange={() => onChange({ kind: 'use', streamId: candidate.id })}
              />
              <span>
                Use {candidate.name}
                <span className="block text-[13px] text-ink-muted">
                  {streamKindLabels[candidate.kind]} · defaults to{' '}
                  {scopeLabels[candidate.defaultScope]}, {categoryLabel(candidate.defaultCategory)}.
                  A similar name, so no reason is needed.
                </span>
              </span>
            </label>
          )
        })}
        {others.length > 0 && (
          <label className="flex items-start gap-2.5 text-[15px]">
            <input
              type="radio"
              name={group}
              className="mt-1.5 size-4 accent-primary"
              checked={decision?.kind === 'other'}
              onChange={() => onChange({ kind: 'other', streamId: '', reason: '' })}
            />
            <span>
              Use another source of {unknown.facility}
              <span className="block text-[13px] text-ink-muted">
                Nothing in the name suggests it, so say why these rows belong to it.
              </span>
            </span>
          </label>
        )}
        {decision?.kind === 'other' && (
          <div className="ml-7 grid gap-x-6 gap-y-4 md:grid-cols-2">
            <SelectField
              label="Emission source"
              value={decision.streamId}
              onChange={(event) => onChange({ ...decision, streamId: event.target.value })}
            >
              <option value="">Choose a source</option>
              {others.map((stream) => (
                <option key={stream.id} value={stream.id}>
                  {stream.name}
                </option>
              ))}
            </SelectField>
            <InputField
              label="Why this source?"
              placeholder="The fleet draws from the boiler yard tank"
              value={decision.reason}
              maxLength={500}
              onChange={(event) => onChange({ ...decision, reason: event.target.value })}
              error={errors?.reason}
              hint={`At least ${SIMILAR_REASON_MIN} characters. It is written into the organization's history beside the mapping.`}
            />
          </div>
        )}
        <label className="flex items-start gap-2.5 text-[15px]">
          <input
            type="radio"
            name={group}
            className="mt-1.5 size-4 accent-primary"
            checked={decision?.kind === 'create'}
            onChange={() =>
              onChange({
                kind: 'create',
                draft: {
                  name: unknown.name,
                  kind: 'STATIONARY_COMBUSTION',
                  fuel: '',
                  meterOrSupplier: '',
                  contractorOperated: false,
                },
                reason: '',
              })
            }
          />
          <span>
            Create '{unknown.name}'
            <span className="block text-[13px] text-ink-muted">
              Added to {unknown.facility} when the records are added, marked as added during import.
            </span>
          </span>
        </label>
        {decision?.kind === 'create' && (
          <div className="ml-7 flex flex-col gap-4 rounded-lg border border-hairline bg-surface-sunken p-4">
            <NewSourceFields
              draft={decision.draft}
              nameError={errors?.name}
              onChange={(draft) => onChange({ ...decision, draft })}
            />
            {unknown.candidates.length > 0 && (
              <InputField
                label="Why is this a different source?"
                placeholder="Second 500 kVA unit, serial GEN-7781"
                value={decision.reason}
                maxLength={500}
                onChange={(event) => onChange({ ...decision, reason: event.target.value })}
                error={errors?.reason}
                hint={`At least ${SIMILAR_REASON_MIN} characters. It is written into the organization's history beside the source.`}
              />
            )}
          </div>
        )}
      </div>
    </fieldset>
  )
}
