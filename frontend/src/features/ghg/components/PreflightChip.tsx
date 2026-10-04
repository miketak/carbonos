import { useState } from 'react'
import { Button } from '../../../components/Button'
import { Popover } from '../../../components/Popover'
import { gateLabels } from '../format'
import type { FindingSeverity, GateStatus, InventoryStatus, ValidationReport } from '../api'

type ChipTone = 'ready' | 'warn' | 'hold' | 'published'

/** What the chip says and in which tone, derived from the gates the way the banner's headline was. */
export function summarizePreflight(
  report: ValidationReport,
  status: InventoryStatus,
): {
  tone: ChipTone
  label: string
  summary: string
  /** the "Resolve ..." link's text, or null when nothing needs resolving */
  resolve: string | null
} {
  // spec 05.1: a published inventory's gates still pass, but nothing launches from it
  const published = status === 'PUBLISHED'
  // spec 06.1: the base-year gate holds the final designation, never a run
  const blocking = report.gates.filter(
    (gate) => gate.status === 'BLOCKED' && gate.gate !== 'BASE_YEAR',
  )
  const holdsFinal = report.gates.some(
    (gate) => gate.status === 'BLOCKED' && gate.gate === 'BASE_YEAR',
  )
  const warnings = report.gates.filter((gate) => gate.status === 'WARNINGS').length
  const blockers = report.freezeBlockers.length

  const detail =
    (blocking.length > 0
      ? `${blocking.map((gate) => gateLabels[gate.gate]).join(', ')} ${blocking.length === 1 ? 'is' : 'are'} blocking.`
      : holdsFinal
        ? 'Base year holds the final designation; runs stay available.'
        : warnings > 0
          ? `Every gate passes; ${warnings} ${warnings === 1 ? 'carries' : 'carry'} a warning.`
          : 'Every gate passes.') +
    (blockers > 0
      ? ` ${blockers} record${blockers === 1 ? '' : 's'} would also stop a freeze.`
      : '')

  const resolve =
    !report.ready || holdsFinal
      ? `Resolve ${blockers > 0 ? `${blockers} record${blockers === 1 ? '' : 's'}` : 'the findings'} →`
      : null

  if (published) {
    // the banner's sentence, kept whole on the chip: the help and the QA procedures read it on
    // the screen without a click, and a published inventory has no readiness to state
    return {
      tone: 'published',
      label: 'Published. The runs are a record; a correction restates the year.',
      summary: detail,
      resolve: null,
    }
  }
  if (!report.ready) {
    return {
      tone: 'hold',
      label:
        blocking.length > 0 ? `Launch on hold · ${blocking.length} blocking` : 'Launch on hold',
      summary: detail,
      resolve,
    }
  }
  if (warnings > 0 || holdsFinal) {
    return {
      tone: 'warn',
      label:
        warnings > 0
          ? `Ready to launch · ${warnings} warning${warnings === 1 ? '' : 's'}`
          : 'Ready to launch',
      summary: detail,
      resolve,
    }
  }
  return { tone: 'ready', label: 'Ready to launch', summary: detail, resolve }
}

const chipTones: Record<ChipTone, { chip: string; mark: string; glyph: string }> = {
  ready: {
    chip: 'border-hairline-strong text-ink hover:border-ink-muted',
    mark: 'bg-success-dot text-surface',
    glyph: '✓',
  },
  warn: {
    chip: 'border-hairline-strong text-ink hover:border-ink-muted',
    mark: 'bg-warning-dot text-surface',
    glyph: '!',
  },
  hold: {
    chip: 'border-danger-dot text-danger hover:border-danger',
    mark: 'bg-danger-dot text-surface',
    glyph: '!',
  },
  published: {
    chip: 'border-hairline-strong text-ink-muted hover:border-ink-muted',
    mark: 'bg-ink-faint text-surface',
    glyph: '✓',
  },
}

const verdicts: Record<GateStatus, { word: string; dot: string; text: string }> = {
  PASSED: { word: 'Pass', dot: 'bg-success-dot', text: 'text-ink-muted' },
  WARNINGS: { word: 'Warn', dot: 'bg-warning-dot', text: 'text-warning' },
  BLOCKED: { word: 'Hold', dot: 'bg-danger-dot', text: 'text-danger' },
}

const severityText: Record<FindingSeverity, string> = {
  ERROR: 'text-danger',
  WARNING: 'text-warning',
  INFO: 'text-ink-muted',
}

/**
 * Whether this inventory can be run, as a chip at the end of the title row
 * (spec 10): green when every gate passes, amber when one warns, red when one
 * blocks. The chip opens a popover with the five gates, their verdicts and
 * findings, and the way to the fix; the register stays in reach while the
 * reader works through them. It replaced the banner above the tabs and the
 * panel at the foot of the Records tab.
 */
export function PreflightChip({
  report,
  status,
  onResolve,
}: {
  report: ValidationReport
  status: InventoryStatus
  onResolve: () => void
}) {
  const [open, setOpen] = useState(false)
  const { tone, label, summary, resolve } = summarizePreflight(report, status)
  const style = chipTones[tone]

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      label="Pre-flight checks"
      trigger={
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg border bg-surface px-3.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none ${style.chip}`}
        >
          <span
            aria-hidden="true"
            className={`grid size-5 shrink-0 place-items-center rounded-full text-xs font-bold ${style.mark}`}
          >
            {style.glyph}
          </span>
          {label}
        </button>
      }
    >
      <div className="border-b border-hairline px-4.5 pt-4 pb-3">
        <h2 className="text-base font-semibold">Pre-flight checks</h2>
        <p className="mt-0.5 text-[13px] text-ink-muted">{summary}</p>
      </div>
      <ul aria-label="Gates">
        {report.gates.map((gate) => {
          const verdict = verdicts[gate.status]
          return (
            <li
              key={gate.gate}
              className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-hairline px-4.5 py-3 last:border-b-0"
            >
              <span
                aria-hidden="true"
                className={`size-2 justify-self-center rounded-full ${verdict.dot}`}
              />
              <span className="font-medium">{gateLabels[gate.gate]}</span>
              <span className={`text-xs font-semibold tracking-[0.06em] uppercase ${verdict.text}`}>
                {verdict.word}
              </span>
              {gate.findings.map((finding, index) => (
                <span
                  key={index}
                  className={`col-span-2 col-start-2 text-[13px] ${severityText[finding.severity]}`}
                >
                  {finding.message}
                </span>
              ))}
            </li>
          )
        })}
      </ul>
      <div className="flex items-center justify-between gap-3 border-t border-hairline px-4.5 py-3">
        {resolve ? (
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onResolve()
            }}
            className="text-sm font-medium text-link hover:underline"
          >
            {resolve}
          </button>
        ) : (
          <span />
        )}
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>
    </Popover>
  )
}
