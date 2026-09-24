import { GlassCard } from '../../../components/GlassCard'
import { gateLabels } from '../format'
import type { ValidationReport } from '../api'

/**
 * Whether this inventory can be run, stated wherever the reader is standing
 * (spec 05.6). It is the inventory's answer to the register's completeness
 * banner: the gates decide, the sentence says which one is holding, and
 * "Resolve" is a link to the records that caused it.
 *
 * The full findings stay in `PreflightPanel` on the Records tab. This says
 * only what a reader needs to know before they start work.
 */
export function PreflightBanner({
  report,
  onResolve,
}: {
  report: ValidationReport
  onResolve: () => void
}) {
  // spec 06.1: the base-year gate holds the final designation, never a run
  const blocking = report.gates.filter(
    (gate) => gate.status === 'BLOCKED' && gate.gate !== 'BASE_YEAR',
  )
  const holdsFinal = report.gates.some(
    (gate) => gate.status === 'BLOCKED' && gate.gate === 'BASE_YEAR',
  )
  const warning = report.gates.filter((gate) => gate.status === 'WARNINGS')
  const blockers = report.freezeBlockers.length

  return (
    <GlassCard className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
            report.ready ? 'bg-accent-green/40 text-dark-teal' : 'bg-red-100 text-red-700'
          }`}
        >
          {report.ready ? '✓' : '!'}
        </span>
        <div>
          <p className="text-sm font-semibold">
            {report.ready ? 'Ready to launch a run' : 'Launch on hold'}
          </p>
          <p className="text-xs text-ink-muted">
            {blocking.length > 0
              ? `${blocking.map((gate) => gateLabels[gate.gate]).join(', ')} ${blocking.length === 1 ? 'is' : 'are'} blocking.`
              : holdsFinal
                ? 'Base year holds the final designation; runs stay available.'
                : warning.length > 0
                  ? `Every gate passes; ${warning.length} carries a warning.`
                  : 'Every gate passes.'}
            {blockers > 0 &&
              ` ${blockers} record${blockers === 1 ? '' : 's'} would also stop a freeze.`}
          </p>
        </div>
      </div>
      {(!report.ready || holdsFinal) && (
        <button
          type="button"
          onClick={onResolve}
          className="text-sm font-semibold text-link hover:underline"
        >
          Resolve {blockers > 0 ? `${blockers} record${blockers === 1 ? '' : 's'}` : 'the findings'}{' '}
          →
        </button>
      )}
    </GlassCard>
  )
}
