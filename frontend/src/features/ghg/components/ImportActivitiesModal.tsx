import { useRef, useState } from 'react'
import type { DragEvent, ReactNode } from 'react'
import { Button } from '../../../components/Button'
import { Modal } from '../../../components/Modal'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { activityImportTemplateUrl } from '../api'
import type { ActivityImportResult, ReadinessIssue } from '../api'
import { activityIssueLabels, formatRecordPeriod } from '../format'
import { useImportActivities } from '../useGhg'
import { ActivityStatusPill } from './badges'

const PREVIEW_ROWS = 20

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal/15 text-xs font-bold text-teal-deep"
      >
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold">{title}</h3>
        {children}
      </div>
    </div>
  )
}

/**
 * Bulk entry from a CSV file (spec 04.5, 04.6). Choosing a file runs a dry
 * run: every row as it would import with its readiness, the control totals
 * to check against the sheet's footer, and warnings; nothing is saved until
 * "Add records". A rejected row blocks the import so the corrected file can
 * be chosen again without doubling records. The file is kept with the
 * records it creates.
 */
export function ImportActivitiesModal({
  organizationId,
  onClose,
  onImported,
}: {
  organizationId: string
  onClose: () => void
  onImported: (count: number) => void
}) {
  const importActivities = useImportActivities(organizationId)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ActivityImportResult | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const errors = fieldErrors(importActivities.error)
  const generalError =
    importActivities.isError && !errors ? problemDetail(importActivities.error) : undefined

  const choose = (chosen: File | null) => {
    setFile(chosen)
    setPreview(null)
    if (!chosen) return
    importActivities.mutate({ file: chosen, dryRun: true }, { onSuccess: setPreview })
  }

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    setDragging(false)
    choose(event.dataTransfer.files?.[0] ?? null)
  }

  const canAdd =
    file !== null &&
    preview !== null &&
    preview.dryRun &&
    preview.rows.length > 0 &&
    preview.rejected.length === 0 &&
    !importActivities.isPending

  const issueCounts = preview
    ? preview.rows.reduce<Partial<Record<ReadinessIssue, number>>>((counts, row) => {
        for (const issue of row.issues) counts[issue] = (counts[issue] ?? 0) + 1
        return counts
      }, {})
    : {}
  const warningRows = new Set(preview?.warnings.map((warning) => warning.row))

  return (
    <Modal title="Import activity data" onClose={onClose} size={preview ? 'lg' : 'md'}>
      <p className="-mt-4 mb-4 text-[11px] font-semibold tracking-widest text-ink-muted uppercase">
        Bulk entry
      </p>
      <p className="text-sm text-ink-muted">
        Bring several source records into the register at once. Check the preview before adding
        them.
      </p>
      <div className="mt-4 flex flex-col gap-5">
        <Step number={1} title="Use the activity template">
          <p className="text-xs text-ink-muted">
            Facility, stream, activity type, quantity, unit, period, source and document reference;
            dates read as 2025-03-31 and period end defaults to the start.
          </p>
          <a
            href={activityImportTemplateUrl(organizationId)}
            className="mt-1 inline-block text-sm font-semibold text-link hover:underline"
            download
          >
            Download CSV template
          </a>
        </Step>
        <Step number={2} title="Select your completed CSV">
          <label
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center text-sm transition-colors duration-150 ${
              dragging
                ? 'border-bright-teal bg-teal/10'
                : 'border-teal/30 bg-white/40 hover:bg-teal/5'
            }`}
          >
            <span className="font-semibold text-link">
              {file ? file.name : 'Choose a CSV file'}
            </span>
            <span className="text-xs text-ink-muted">
              {file
                ? 'Choose another file to replace it.'
                : 'Or drop it here. Up to 5 MB; the file is kept with the records it creates.'}
            </span>
            <input
              ref={inputRef}
              type="file"
              aria-label="CSV file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => {
                choose(event.target.files?.[0] ?? null)
                event.target.value = ''
              }}
            />
          </label>
          {errors?.file && (
            <p role="alert" className="mt-1 text-xs font-medium text-red-600">
              {errors.file}
            </p>
          )}
          {generalError && (
            <p role="alert" className="mt-1 text-sm font-medium text-red-600">
              {generalError}
            </p>
          )}
          {importActivities.isPending && (
            <p className="mt-1 text-xs text-ink-muted" role="status">
              Checking the file…
            </p>
          )}
        </Step>
      </div>

      {preview && preview.rejected.length > 0 && (
        <div className="mt-4 max-h-48 overflow-y-auto rounded-lg border border-red-200 bg-red-50/60 p-3">
          <p className="text-sm font-semibold text-red-700">
            Nothing will import: {preview.rejected.length} row
            {preview.rejected.length === 1 ? '' : 's'} rejected. Fix them and choose the file again.
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-xs text-red-800">
            {preview.rejected.map((rejection) => (
              <li key={rejection.row}>
                <span className="font-mono font-semibold">Row {rejection.row}:</span>{' '}
                {rejection.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {preview && preview.rows.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          <section>
            <h3 className="text-sm font-semibold">
              Control totals
              <span className="ml-2 text-xs font-normal text-ink-muted">
                Check them against the spreadsheet's footer.
              </span>
            </h3>
            <table aria-label="Control totals" className="mt-1 w-full text-left text-xs">
              <thead>
                <tr className="border-b border-teal/10 text-ink-muted uppercase">
                  <th className="py-1 pr-2 font-semibold">Facility</th>
                  <th className="py-1 pr-2 font-semibold">Stream</th>
                  <th className="py-1 pr-2 text-right font-semibold">Rows</th>
                  <th className="py-1 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {preview.totals.map((total) => (
                  <tr
                    key={`${total.facilityName}|${total.streamName ?? ''}|${total.unit}`}
                    className="border-b border-teal/5"
                  >
                    <td className="py-1 pr-2">{total.facilityName}</td>
                    <td className="py-1 pr-2">{total.streamName ?? 'No stream'}</td>
                    <td className="py-1 pr-2 text-right">{total.rows}</td>
                    <td className="py-1 text-right font-medium">
                      {total.quantity.toLocaleString()} {total.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {Object.keys(issueCounts).length > 0 && (
            <ul className="flex flex-wrap gap-2 text-xs text-ink-muted">
              {(Object.entries(issueCounts) as [ReadinessIssue, number][]).map(([issue, count]) => (
                <li key={issue} className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">
                  {count} row{count === 1 ? '' : 's'}: {activityIssueLabels[issue].toLowerCase()}
                </li>
              ))}
            </ul>
          )}

          {preview.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
              <p className="font-semibold">Worth a look before adding</p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {preview.warnings.map((warning, index) => (
                  <li key={`${warning.row}-${index}`}>
                    <span className="font-mono font-semibold">Row {warning.row}:</span>{' '}
                    {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <section>
            <h3 className="text-sm font-semibold">
              {preview.rows.length} record{preview.rows.length === 1 ? '' : 's'} to add
              <span className="ml-2 text-xs font-normal text-ink-muted">
                Row numbers count the header as row 1, as the spreadsheet does.
              </span>
            </h3>
            <div className="mt-1 max-h-64 overflow-y-auto">
              <table aria-label="Records to add" className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-teal/10 text-ink-muted uppercase">
                    <th className="py-1 pr-2 font-semibold">Row</th>
                    <th className="py-1 pr-2 font-semibold">Activity</th>
                    <th className="py-1 pr-2 font-semibold">Facility / period</th>
                    <th className="py-1 pr-2 text-right font-semibold">Quantity</th>
                    <th className="py-1 font-semibold">Data status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, PREVIEW_ROWS).map((row) => (
                    <tr key={row.row} className="border-b border-teal/5">
                      <td className="py-1 pr-2 font-mono">
                        {row.row}
                        {warningRows.has(row.row) && (
                          <span title="See the warnings" className="ml-1 text-amber-600">
                            △
                          </span>
                        )}
                      </td>
                      <td className="py-1 pr-2">
                        <span className="block font-medium">{row.activityType}</span>
                        {row.streamName && (
                          <span className="block text-ink-muted">{row.streamName}</span>
                        )}
                      </td>
                      <td className="py-1 pr-2">
                        <span className="block">{row.facilityName}</span>
                        <span className="block text-ink-muted">
                          {formatRecordPeriod(row.periodStart, row.periodEnd)}
                        </span>
                      </td>
                      <td className="py-1 pr-2 text-right whitespace-nowrap">
                        {row.quantity.toLocaleString()} {row.unit}
                      </td>
                      <td className="py-1">
                        <ActivityStatusPill activity={row} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.rows.length > PREVIEW_ROWS && (
                <p className="mt-1 text-xs text-ink-muted">
                  and {preview.rows.length - PREVIEW_ROWS} more
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!canAdd}
          busy={importActivities.isPending && preview !== null}
          onClick={() => {
            if (!file) return
            importActivities.mutate(
              { file },
              {
                onSuccess: (outcome) => {
                  if (outcome.rejected.length === 0) onImported(outcome.imported)
                  else setPreview(outcome)
                },
              },
            )
          }}
        >
          Add records
        </Button>
      </div>
    </Modal>
  )
}
