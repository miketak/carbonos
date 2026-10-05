import { useRef, useState } from 'react'
import { HelpLink } from '../../../components/HelpLink'
import type { DragEvent, ReactNode } from 'react'
import { Banner } from '../../../components/Banner'
import { Button } from '../../../components/Button'
import { Chip } from '../../../components/Chip'
import { Modal } from '../../../components/Modal'
import { Table, Td, Th } from '../../../components/Table'
import { fieldErrors, refusalMessage } from '../../../lib/api'
import { activityImportTemplateUrl } from '../api'
import type { ActivityImportResult, ReadinessIssue } from '../api'
import { activityIssueLabels, formatRecordPeriod } from '../format'
import type { MyRole } from '../roles'
import { useImportActivities } from '../useGhg'
import { ActivityStatusPill } from './badges'

const PREVIEW_ROWS = 20

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden="true"
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-xs font-semibold text-ink-muted"
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
  myRole,
  onClose,
  onImported,
}: {
  organizationId: string
  myRole?: MyRole
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
    importActivities.isError && !errors ? refusalMessage(importActivities.error, myRole) : undefined

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
      <p className="-mt-4 mb-4 text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase">
        Bulk entry
      </p>
      <p className="text-sm text-ink-muted">
        Bring several source records into the register at once. Check the preview before adding
        them.
      </p>
      <div className="mt-5 flex flex-col gap-5">
        <Step number={1} title="Use the activity template">
          <p className="text-[13px] text-ink-muted">
            Facility, emission source, activity type, quantity, unit, period, source and document
            reference; dates read as 2025-03-31 and period end defaults to the start.
          </p>
          <a
            href={activityImportTemplateUrl(organizationId)}
            className="mt-1 inline-block text-sm font-medium text-link hover:underline"
            download
          >
            Download CSV template
          </a>
          <HelpLink
            topic="csvTemplate"
            label="What each column must contain"
            className="mt-1 ml-3"
          />
        </Step>
        <Step number={2} title="Select your completed CSV">
          <label
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center text-sm transition-colors duration-150 ${
              dragging
                ? 'border-primary bg-selected'
                : 'border-hairline-strong hover:bg-surface-sunken'
            }`}
          >
            <span className="font-medium text-link">{file ? file.name : 'Choose a CSV file'}</span>
            <span className="text-[13px] text-ink-muted">
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
            <p role="alert" className="mt-1 text-[13px] font-medium text-danger">
              {errors.file}
            </p>
          )}
          {generalError && (
            <p role="alert" className="mt-1 text-sm font-medium text-danger">
              {generalError}
            </p>
          )}
          {importActivities.isPending && (
            <p className="mt-1 text-[13px] text-ink-muted" role="status">
              Checking the file…
            </p>
          )}
        </Step>
      </div>

      {preview && preview.rejected.length > 0 && (
        <div className="mt-4 max-h-48 overflow-y-auto">
          <Banner
            tone="danger"
            title={`Nothing will import: ${preview.rejected.length} row${
              preview.rejected.length === 1 ? '' : 's'
            } rejected. Fix them and choose the file again.`}
          >
            <ul className="mt-1 flex flex-col gap-1 text-[13px]">
              {preview.rejected.map((rejection) => (
                <li key={rejection.row}>
                  <span className="font-semibold">Row {rejection.row}:</span> {rejection.message}
                </li>
              ))}
            </ul>
          </Banner>
        </div>
      )}

      {preview && preview.rows.length > 0 && (
        <div className="mt-5 flex flex-col gap-5">
          <section>
            <h3 className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold">
              Control totals
              <span className="text-[13px] font-normal text-ink-muted">
                Check them against the spreadsheet's footer.
              </span>
            </h3>
            <div className="mt-2">
              <Table aria-label="Control totals">
                <thead>
                  <tr>
                    <Th>Facility</Th>
                    <Th>Emission source</Th>
                    <Th align="right">Rows</Th>
                    <Th align="right">Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {preview.totals.map((total) => (
                    <tr key={`${total.facilityName}|${total.streamName ?? ''}|${total.unit}`}>
                      <Td className="py-2">{total.facilityName}</Td>
                      <Td className="py-2">{total.streamName ?? 'No emission source'}</Td>
                      <Td align="right" className="py-2">
                        {total.rows}
                      </Td>
                      <Td align="right" className="py-2 font-medium">
                        {total.quantity.toLocaleString()} {total.unit}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </section>

          {Object.keys(issueCounts).length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {(Object.entries(issueCounts) as [ReadinessIssue, number][]).map(([issue, count]) => (
                <li key={issue}>
                  <Chip tone="warning">
                    {count} row{count === 1 ? '' : 's'}: {activityIssueLabels[issue].toLowerCase()}
                  </Chip>
                </li>
              ))}
            </ul>
          )}

          {preview.warnings.length > 0 && (
            <Banner tone="warning" title="Worth a look before adding">
              <ul className="mt-1 flex flex-col gap-0.5 text-[13px]">
                {preview.warnings.map((warning, index) => (
                  <li key={`${warning.row}-${index}`}>
                    <span className="font-semibold">Row {warning.row}:</span> {warning.message}
                  </li>
                ))}
              </ul>
            </Banner>
          )}

          <section>
            <h3 className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold">
              {preview.rows.length} record{preview.rows.length === 1 ? '' : 's'} to add
              <span className="text-[13px] font-normal text-ink-muted">
                Row numbers count the header as row 1, as the spreadsheet does.
              </span>
            </h3>
            <div className="mt-2 max-h-64 overflow-y-auto">
              <Table aria-label="Records to add">
                <thead>
                  <tr>
                    <Th>Row</Th>
                    <Th>Activity</Th>
                    <Th>Facility / period</Th>
                    <Th align="right">Quantity</Th>
                    <Th>Data status</Th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, PREVIEW_ROWS).map((row) => (
                    <tr key={row.row}>
                      <Td className="py-2 text-ink-muted">
                        {row.row}
                        {warningRows.has(row.row) && (
                          <span title="See the warnings" className="ml-1 text-warning">
                            △
                          </span>
                        )}
                      </Td>
                      <Td className="py-2">
                        <span className="block font-medium">{row.activityType}</span>
                        {row.streamName && (
                          <span className="block text-[13px] text-ink-muted">{row.streamName}</span>
                        )}
                      </Td>
                      <Td className="py-2">
                        <span className="block">{row.facilityName}</span>
                        <span className="block text-[13px] text-ink-muted">
                          {formatRecordPeriod(row.periodStart, row.periodEnd)}
                        </span>
                      </Td>
                      <Td align="right" className="py-2">
                        {row.quantity.toLocaleString()} {row.unit}
                      </Td>
                      <Td className="py-2">
                        <ActivityStatusPill activity={row} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {preview.rows.length > PREVIEW_ROWS && (
                <p className="mt-2 text-[13px] text-ink-muted">
                  and {preview.rows.length - PREVIEW_ROWS} more
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3 border-t border-hairline pt-5">
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
