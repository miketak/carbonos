import { Banner } from '../../../components/Banner'
import { Button } from '../../../components/Button'
import { InputField } from '../../../components/Field'
import { categoryLabel, scopeLabels, streamKindLabels } from '../format'
import { exactSourceMatch } from '../similarSources'
import type { SimilarSource } from '../similarSources'

/** The least a reason that creates a source beside a similar name may say (spec 04.10). */
export const SIMILAR_REASON_MIN = 10

/**
 * The reconcile prompt of spec 04.10: the facility already has a source under
 * this name, or one close to it. Each candidate is offered with one click, so
 * the record joins the source it belongs to; a near miss may still become a
 * separate source, with a reason that goes into the history. The exact name is
 * taken, so it offers no "anyway". Nothing is ever matched silently.
 */
export function ReconcileSourceNotice({
  detail,
  facilityName,
  typedName,
  candidates,
  reason,
  reasonError,
  busy,
  onReasonChange,
  onUse,
  onCreateAnyway,
}: {
  detail: string | undefined
  facilityName?: string
  typedName: string
  candidates: SimilarSource[]
  reason: string
  reasonError?: string
  busy: boolean
  onReasonChange: (reason: string) => void
  onUse: (candidate: SimilarSource) => void
  onCreateAnyway: () => void
}) {
  const exact = exactSourceMatch(candidates, typedName)
  return (
    <Banner
      role="alert"
      tone="warning"
      title={
        detail ??
        `${facilityName ?? 'This facility'} already has an emission source with a similar name.`
      }
    >
      <ul className="mt-2 flex flex-col gap-2">
        {candidates.map((candidate) => (
          <li key={candidate.id} className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-ink">
              <span className="font-medium">{candidate.name}</span> ·{' '}
              {streamKindLabels[candidate.kind]} · defaults to {scopeLabels[candidate.defaultScope]}
              , {categoryLabel(candidate.defaultCategory)}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => onUse(candidate)}
            >
              Use {candidate.name}
            </Button>
          </li>
        ))}
      </ul>
      <p className="mt-2">
        Using the existing source keeps its records together.
        {exact
          ? ' The name is taken: use it, or change the name.'
          : ' Create a new one only for a different source, and say why.'}
      </p>
      {!exact && (
        <div className="mt-3 flex flex-col gap-3">
          <InputField
            label="Why is this a different source?"
            placeholder="Second 500 kVA unit, serial GEN-7781"
            value={reason}
            maxLength={500}
            onChange={(event) => onReasonChange(event.target.value)}
            error={reasonError}
            hint={`At least ${SIMILAR_REASON_MIN} characters. It is written into the organization's history beside the source.`}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="self-start"
            disabled={busy || reason.trim().length < SIMILAR_REASON_MIN}
            onClick={onCreateAnyway}
          >
            Create '{typedName.trim()}' anyway
          </Button>
        </div>
      )}
    </Banner>
  )
}
