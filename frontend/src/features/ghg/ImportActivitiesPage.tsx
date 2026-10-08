import { useDateFormat } from '../../lib/dates'
import { useRef, useState } from 'react'
import type { DragEvent, ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Banner } from '../../components/Banner'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import { HelpLink } from '../../components/HelpLink'
import { PageHeader } from '../../components/PageHeader'
import { StatusDot } from '../../components/StatusDot'
import { Table, Td, Th } from '../../components/Table'
import { useToast } from '../../components/toast'
import { fieldErrors, refusalMessage } from '../../lib/api'
import { activityImportTemplateUrl } from './api'
import type {
  ActivityImportResult,
  ImportDecisionInput,
  ReadinessIssue,
  UnknownImportSource,
} from './api'
import { ActivityStatusPill } from './components/badges'
import { decisionComplete, ImportDecisionCard } from './components/ImportDecisionCard'
import type { DecisionDraft } from './components/ImportDecisionCard'
import { activityIssueLabels, formatRecordPeriod } from './format'
import { similarSources } from './similarSources'
import {
  useFacilitiesQuery,
  useImportActivities,
  useOrganizationQuery,
  useStreamsQuery,
} from './useGhg'
import { MonthField } from '../../components/MonthField'
import { SelectField } from '../../components/Field'

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

const decisionKey = (source: Pick<UnknownImportSource, 'facilityId' | 'name'>) =>
  `${source.facilityId}|${source.name.trim().toLowerCase()}`

/** The file's data rows, counted by its line breaks, for the stage line; a workbook is not counted. */
async function countRows(file: File): Promise<number | null> {
  if (!file.name.toLowerCase().endsWith('.csv')) return null
  const text = await file.text()
  return Math.max(0, text.split(/\r?\n/).filter((line) => line.trim() !== '').length - 1)
}

function toDecisions(
  unknownSources: UnknownImportSource[],
  drafts: Map<string, DecisionDraft>,
): ImportDecisionInput[] {
  return unknownSources.flatMap((source): ImportDecisionInput[] => {
    const draft = drafts.get(decisionKey(source))
    if (!draft) return []
    const base = { facilityId: source.facilityId, name: source.name }
    if (draft.kind === 'use') return [{ ...base, mapTo: draft.streamId }]
    if (draft.kind === 'other')
      return [{ ...base, mapTo: draft.streamId, reason: draft.reason.trim() }]
    return [
      {
        ...base,
        create: {
          name: draft.draft.name.trim(),
          kind: draft.draft.kind,
          fuel: draft.draft.fuel.trim() === '' ? undefined : draft.draft.fuel.trim(),
          meterOrSupplier:
            draft.draft.meterOrSupplier.trim() === ''
              ? undefined
              : draft.draft.meterOrSupplier.trim(),
          contractorOperated: draft.draft.contractorOperated,
        },
        reason: draft.reason.trim() === '' ? undefined : draft.reason.trim(),
      },
    ]
  })
}

/**
 * Bulk entry from a CSV file or a workbook (specs 04.5, 04.6, 04.11), as a page
 * under the register. Choosing a file runs a dry run: every row as it would
 * import with its readiness, the control totals to check against the sheet's
 * footer, and warnings; nothing is saved until "Add records". An emission
 * source the facility does not have is decided here, in a card per name, and
 * the decisions travel with the file. A rejected row blocks the import so the
 * corrected file can be chosen again without doubling records.
 */
export function ImportActivitiesPage() {
  const dateFormat = useDateFormat()
  const { organizationId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const organizationQuery = useOrganizationQuery(organizationId)
  const myRole = organizationQuery.data?.myRole
  const streamsQuery = useStreamsQuery(organizationId)
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const importActivities = useImportActivities(organizationId)
  // spec 04.12: the monthly template, one row per emission source of a facility
  const [templateFacility, setTemplateFacility] = useState('')
  const [templateMonth, setTemplateMonth] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [rowCount, setRowCount] = useState<number | null>(null)
  const [preview, setPreview] = useState<ActivityImportResult | null>(null)
  const [decisions, setDecisions] = useState<Map<string, DecisionDraft>>(new Map())
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listPath = `/app/ghg/${organizationId}/activity`
  const errors = fieldErrors(importActivities.error)
  const candidates = similarSources(importActivities.error)
  const generalError =
    importActivities.isError && !errors
      ? candidates
        ? `${refusalMessage(importActivities.error, myRole)} Choose "Use" for it, or give a reason.`
        : refusalMessage(importActivities.error, myRole)
      : undefined

  const run = (chosen: File, dryRun: boolean) => {
    setProgress(0)
    importActivities.mutate(
      {
        file: chosen,
        dryRun,
        decisions:
          preview && !dryRun
            ? { sha256: preview.sha256, items: toDecisions(preview.unknownSources, decisions) }
            : undefined,
        onProgress: setProgress,
      },
      {
        onSuccess: (outcome) => {
          if (dryRun || outcome.rejected.length > 0) {
            setPreview(outcome)
            return
          }
          const records = `${outcome.imported} record${outcome.imported === 1 ? '' : 's'} imported.`
          const sources =
            outcome.sourcesCreated > 0
              ? ` ${outcome.sourcesCreated} emission source${outcome.sourcesCreated === 1 ? '' : 's'} added during import.`
              : ''
          toast(records + sources)
          navigate(listPath)
        },
      },
    )
  }

  const choose = (chosen: File | null) => {
    setFile(chosen)
    setPreview(null)
    setDecisions(new Map())
    setRowCount(null)
    if (!chosen) return
    void countRows(chosen).then(setRowCount)
    run(chosen, true)
  }

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    setDragging(false)
    choose(event.dataTransfer.files?.[0] ?? null)
  }

  const undecided = (preview?.unknownSources ?? []).filter(
    (source) => !decisionComplete(decisions.get(decisionKey(source)), source.candidates.length),
  )
  const canAdd =
    file !== null &&
    preview !== null &&
    preview.dryRun &&
    preview.rows.length > 0 &&
    preview.rejected.length === 0 &&
    undecided.length === 0 &&
    !importActivities.isPending

  const stage = importActivities.isPending
    ? progress < 100
      ? `Uploading… ${progress}%`
      : preview && !preview.dryRun
        ? `Adding ${preview.rows.length} records…`
        : importActivities.variables?.dryRun
          ? rowCount === null
            ? 'Checking the workbook…'
            : `Checking ${rowCount} row${rowCount === 1 ? '' : 's'}…`
          : `Adding ${preview?.rows.length ?? rowCount ?? ''} records…`
    : null

  const issueCounts = preview
    ? preview.rows.reduce<Partial<Record<ReadinessIssue, number>>>((counts, row) => {
        for (const issue of row.issues) counts[issue] = (counts[issue] ?? 0) + 1
        return counts
      }, {})
    : {}
  const warningRows = new Set(preview?.warnings.map((warning) => warning.row))
  const streams = streamsQuery.data ?? []

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        size="md"
        back={{ to: listPath }}
        crumbs={[{ label: 'Activity data', to: listPath }, { label: 'Import' }]}
        title="Import activity data"
        subtitle="Bring several records into the register at once. Check the preview before adding them; the file is kept with the records it creates."
      />
      <form
        aria-label="Import activity data"
        onSubmit={(event) => event.preventDefault()}
        className="flex max-w-[960px] flex-col gap-6"
        noValidate
      >
        <div className="flex flex-col gap-5">
          <Step number={1} title="Use the activity template">
            <p className="text-[13px] text-ink-muted">
              Facility, emission source, activity type, quantity, unit, period, source and document
              reference; dates read as 2025-03-31 and period end defaults to the start. A workbook
              is read from its first sheet.
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
            <div className="mt-4 flex flex-col gap-3 rounded-lg border border-hairline bg-surface-sunken p-4">
              <div>
                <h4 className="text-sm font-semibold">Download a monthly template</h4>
                <p className="text-[13px] text-ink-muted">
                  One row per emission source of the facility for the month. A source that ran
                  nothing is recorded as 0 with a note and its reading, not deleted.
                </p>
              </div>
              <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
                <SelectField
                  label="Facility"
                  value={templateFacility}
                  onChange={(event) => setTemplateFacility(event.target.value)}
                >
                  <option value="">Choose a facility</option>
                  {(facilitiesQuery.data ?? []).map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </SelectField>
                <MonthField
                  label="Month"
                  value={templateMonth}
                  onChange={setTemplateMonth}
                  allLabel="Choose a month"
                />
              </div>
              {templateFacility !== '' && templateMonth !== '' ? (
                <a
                  href={activityImportTemplateUrl(organizationId, {
                    facilityId: templateFacility,
                    month: templateMonth,
                  })}
                  className="self-start text-sm font-medium text-link hover:underline"
                  download
                >
                  Download the monthly template
                </a>
              ) : (
                <p className="text-[13px] text-ink-muted">Choose the facility and the month.</p>
              )}
            </div>
          </Step>
          <Step number={2} title="Select your completed spreadsheet">
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
              <span className="font-medium text-link">
                {file ? file.name : 'Choose a CSV or XLSX file'}
              </span>
              <span className="text-[13px] text-ink-muted">
                {file
                  ? 'Choose another file to replace it.'
                  : 'Or drop it here. Up to 5 MB; the file is kept with the records it creates.'}
              </span>
              <input
                ref={inputRef}
                type="file"
                aria-label="Spreadsheet file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                disabled={importActivities.isPending}
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
            {stage && (
              <p className="mt-1 text-[13px] text-ink-muted" role="status">
                {stage}
              </p>
            )}
          </Step>
        </div>

        {preview && preview.rejected.length > 0 && (
          <div className="max-h-48 overflow-y-auto">
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

        {preview && preview.unknownSources.length > 0 && (
          <section aria-labelledby="import-decisions" className="flex flex-col gap-3">
            <h3
              id="import-decisions"
              className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold"
            >
              Decide {preview.unknownSources.length} unknown emission source
              {preview.unknownSources.length === 1 ? '' : 's'}
              <span className="text-[13px] font-normal text-ink-muted">
                Each name the file uses that its facility does not have. The records wait until
                every one is decided.
              </span>
            </h3>
            {preview.unknownSources.map((source, index) => (
              <ImportDecisionCard
                key={decisionKey(source)}
                unknown={source}
                streams={streams.filter((stream) => stream.facilityId === source.facilityId)}
                decision={decisions.get(decisionKey(source))}
                errors={{
                  reason: errors?.[`decisions[${index}].reason`] ?? errors?.confirmNewStreamReason,
                  name: errors?.[`decisions[${index}].create.name`],
                }}
                onChange={(decision) => {
                  importActivities.reset()
                  setDecisions((current) => new Map(current).set(decisionKey(source), decision))
                }}
              />
            ))}
          </section>
        )}

        {preview && preview.rows.length > 0 && (
          <div className="flex flex-col gap-5">
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
                {(Object.entries(issueCounts) as [ReadinessIssue, number][]).map(
                  ([issue, count]) => (
                    <li key={issue}>
                      <Chip tone="warning">
                        {count} row{count === 1 ? '' : 's'}:{' '}
                        {activityIssueLabels[issue].toLowerCase()}
                      </Chip>
                    </li>
                  ),
                )}
              </ul>
            )}

            {preview.warnings.length > 0 && (
              <Banner tone="warning" title="Worth a look before adding">
                <ul className="mt-1 flex flex-col gap-0.5 text-[13px]">
                  {preview.warnings.map((warning, index) => (
                    <li key={`${warning.row ?? 'file'}-${index}`}>
                      {warning.row !== null && (
                        <span className="font-semibold">Row {warning.row}: </span>
                      )}
                      {warning.message}
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
              <div className="mt-2 max-h-96 overflow-y-auto">
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
                            <span className="block text-[13px] text-ink-muted">
                              {row.streamName}
                            </span>
                          )}
                        </Td>
                        <Td className="py-2">
                          <span className="block">{row.facilityName}</span>
                          <span className="block text-[13px] text-ink-muted">
                            {formatRecordPeriod(row.periodStart, row.periodEnd, dateFormat)}
                          </span>
                        </Td>
                        <Td align="right" className="py-2">
                          {row.quantity.toLocaleString()} {row.unit}
                        </Td>
                        <Td className="py-2">
                          {row.status === 'NEEDS_DECISION' ? (
                            <StatusDot tone="warning" title="Decide its emission source above">
                              Needs a decision
                            </StatusDot>
                          ) : (
                            <ActivityStatusPill
                              activity={{ status: row.status, issues: row.issues }}
                            />
                          )}
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

        <div className="flex justify-end gap-3 border-t border-hairline pt-5">
          <Button type="button" variant="ghost" onClick={() => navigate(listPath)}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!canAdd}
            busy={importActivities.isPending && preview !== null}
            title={
              preview && undecided.length > 0
                ? `Decide ${undecided.length} emission source${undecided.length === 1 ? '' : 's'} first`
                : undefined
            }
            onClick={() => {
              if (file) run(file, false)
            }}
          >
            Add records
          </Button>
        </div>
      </form>
    </div>
  )
}
