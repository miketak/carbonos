import { GlassCard } from '../../../components/GlassCard'
import type { GateResult, GateStatus, ValidationReport } from '../api'

const gateLabels: Record<GateResult['gate'], string> = {
  BOUNDARY: 'Reporting boundary',
  COMPLETENESS: 'Activity data completeness',
  CLASSIFICATION: 'Classification',
  EMISSION_FACTOR: 'Emission factors',
}

const statusStyles: Record<GateStatus, { ring: string; label: string; text: string }> = {
  PASSED: { ring: 'border-teal bg-teal-deep text-white', label: 'PASS', text: 'text-link' },
  WARNINGS: {
    ring: 'border-amber-400 bg-amber-400/90 text-white',
    label: 'WARN',
    text: 'text-amber-600',
  },
  BLOCKED: { ring: 'border-red-500 bg-red-500/90 text-white', label: 'HOLD', text: 'text-red-600' },
}

const severityStyles = {
  ERROR: 'text-red-600',
  WARNING: 'text-amber-600',
  INFO: 'text-ink-muted',
} as const

/**
 * Launch readiness: the validation gates a run must clear, styled as an
 * instrument panel. Errors hold the launch; warnings fly.
 */
export function PreflightPanel({ report }: { report: ValidationReport }) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg">Pre-flight checks</h2>
        <span
          className={`rounded-full border px-3 py-0.5 font-mono text-xs font-bold tracking-widest ${
            report.ready
              ? 'border-teal/40 bg-teal/10 text-link'
              : 'border-red-300 bg-red-50 text-red-600'
          }`}
        >
          {report.ready ? 'READY TO LAUNCH' : 'LAUNCH ON HOLD'}
        </span>
      </div>

      <ul className="mt-5 flex flex-col gap-4">
        {report.gates.map((gate) => {
          const style = statusStyles[gate.status]
          return (
            <li key={gate.gate}>
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${style.ring}`}
                >
                  {gate.status === 'PASSED' ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    <span className="text-[10px] font-bold">!</span>
                  )}
                </span>
                <span className="flex-1 font-mono text-sm tracking-wide">
                  {gateLabels[gate.gate]}
                </span>
                <span className={`font-mono text-xs font-bold tracking-widest ${style.text}`}>
                  {style.label}
                </span>
              </div>
              {gate.findings.length > 0 && (
                <ul className="mt-2 ml-9 flex flex-col gap-1">
                  {gate.findings.map((finding, index) => (
                    <li
                      key={index}
                      className={`font-mono text-xs ${severityStyles[finding.severity]}`}
                    >
                      {finding.severity === 'ERROR'
                        ? '✕'
                        : finding.severity === 'WARNING'
                          ? '▲'
                          : 'ℹ'}{' '}
                      {finding.message}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </GlassCard>
  )
}
