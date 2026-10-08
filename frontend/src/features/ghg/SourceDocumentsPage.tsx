import { useDateFormat } from '../../lib/dates'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { FilterRow, FilterSelect, SearchField } from '../../components/FilterRow'
import { PageHeader } from '../../components/PageHeader'
import { Panel, PanelHead } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { Table, TableFooter, Td, Th, TwoLine } from '../../components/Table'
import { useToast } from '../../components/toast'
import { refusalMessage } from '../../lib/api'
import { evidenceDownloadUrl, evidenceIndexUrl, importBatchFileUrl } from './api'
import type { DocumentFilter, EvidenceDocument, EvidenceQuery } from './api'
import { formatSize } from './components/EvidencePanel'
import { ViewSwitch } from './components/ViewSwitch'
import { formatDateTime, formatRecordPeriod } from './format'
import { mayWrite, WRITE_TOOLTIP } from './roles'
import type { MyRole } from './roles'
import {
  useDeleteEvidence,
  useEvidencePageQuery,
  useFacilitiesQuery,
  useImportBatchesQuery,
  useOrganizationQuery,
} from './useGhg'

const PAGE_SIZE = 24

const filters: { value: DocumentFilter; label: string }[] = [
  { value: 'ALL', label: 'All documents' },
  { value: 'LINK_ONLY', label: 'Links only' },
  { value: 'ORPHANED', label: 'Record removed' },
]

/* the button look on a download link; the kit's Button renders a <button> */
const secondaryLinkClasses =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-hairline-strong bg-surface px-4 text-[15px] font-medium whitespace-nowrap text-ink transition-colors duration-150 hover:border-ink-muted focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none'

/**
 * The documents behind the organization's records (spec 04.6): every file
 * and link, newest first, each pointing at its record; the files each import
 * came from; and the evidence index a verifier takes as the pack's table of
 * contents. A table, not cards (spec 10).
 */
export function SourceDocumentsPage() {
  const dateFormat = useDateFormat()
  const { organizationId = '' } = useParams()
  const organizationQuery = useOrganizationQuery(organizationId)
  const myRole = organizationQuery.data?.myRole
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const facilityId = params.get('facility') ?? ''
  const filter = (filters.find((item) => item.value === params.get('filter'))?.value ??
    'ALL') as DocumentFilter
  const page = Math.max(0, Number(params.get('page') ?? 0) || 0)
  const set = (patch: Record<string, string | null>) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        for (const [key, value] of Object.entries(patch)) {
          if (value === null || value === '' || (key === 'filter' && value === 'ALL'))
            next.delete(key)
          else next.set(key, value)
        }
        if (!('page' in patch)) next.delete('page')
        return next
      },
      { replace: true },
    )
  const query: EvidenceQuery = {
    q: q.trim() === '' ? undefined : q.trim(),
    facilityId: facilityId || undefined,
    filter: filter === 'ALL' ? undefined : filter,
    page,
    size: PAGE_SIZE,
  }
  const documentsQuery = useEvidencePageQuery(organizationId, query)
  const batchesQuery = useImportBatchesQuery(organizationId)
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const documents = documentsQuery.data?.items
  const total = documentsQuery.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const filtered = query.q !== undefined || facilityId !== '' || filter !== 'ALL'
  const batches = batchesQuery.data ?? []
  const registerPath = `/app/ghg/${organizationId}/activity`

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        back={{ to: registerPath }}
        crumbs={[
          { label: 'Data collection' },
          { label: 'Activity data', to: registerPath },
          { label: 'Source documents' },
        ]}
        title="Source documents"
        subtitle="The supporting documents behind your activity records."
        actions={
          <>
            <ViewSwitch organizationId={organizationId} />
            <a href={evidenceIndexUrl(organizationId)} className={secondaryLinkClasses} download>
              Download evidence index (CSV)
            </a>
          </>
        }
      />

      {batches.length > 0 && (
        <Panel>
          <PanelHead
            title="Imported files"
            description="Each CSV import is kept as uploaded, with its digest, so a record traces to its row."
          />
          <Table className="[&_tr:last-child_td]:border-b-0">
            <tbody>
              {batches.map((batch) => (
                <tr key={batch.id}>
                  <Td className="pl-5">
                    <TwoLine
                      primary={
                        <a
                          href={importBatchFileUrl(batch.id)}
                          className="text-link hover:underline"
                          download
                        >
                          {batch.fileName}
                        </a>
                      }
                      secondary={
                        <>
                          {batch.rowCount} row{batch.rowCount === 1 ? '' : 's'}
                          {batch.firstRecordRef
                            ? ` (${batch.firstRecordRef}${batch.lastRecordRef !== batch.firstRecordRef ? ` to ${batch.lastRecordRef}` : ''})`
                            : ''}{' '}
                          · {formatSize(batch.sizeBytes)} · {batch.importedBy},{' '}
                          {formatDateTime(batch.importedAt, dateFormat)} · sha256{' '}
                          <span title={batch.sha256}>{batch.sha256.slice(0, 12)}…</span>
                        </>
                      }
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      )}

      <FilterRow
        search={
          <SearchField
            label="Search"
            placeholder="Document, activity, facility or reference"
            value={q}
            onChange={(event) => set({ q: event.target.value })}
          />
        }
      >
        <FilterSelect
          label="Facility"
          value={facilityId}
          onChange={(event) => set({ facility: event.target.value })}
        >
          <option value="">All facilities</option>
          {(facilitiesQuery.data ?? []).map((facility) => (
            <option key={facility.id} value={facility.id}>
              {facility.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          label="Show"
          value={filter}
          onChange={(event) => set({ filter: event.target.value })}
        >
          {filters.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </FilterSelect>
      </FilterRow>

      {documentsQuery.isPending && (
        <div aria-label="Loading documents" className="flex flex-col gap-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      )}
      {documents?.length === 0 && (
        <Panel className="p-10 text-center">
          <h2 className="font-semibold">{filtered ? 'No documents match' : 'No documents yet'}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {filtered
              ? 'Clear the search or the filters.'
              : 'Attach an invoice, a meter photo or a register to a record and it appears here.'}
          </p>
        </Panel>
      )}
      {documents && documents.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>Document</Th>
              <Th>Record</Th>
              <Th>Facility / period</Th>
              <Th>Attached by</Th>
              <Th className="w-40">
                <span className="sr-only">Actions</span>
              </Th>
            </tr>
          </thead>
          <tbody>
            {documents.map((item) => (
              <DocumentRow
                key={item.id}
                organizationId={organizationId}
                item={item}
                myRole={myRole}
              />
            ))}
          </tbody>
        </Table>
      )}
      {total > 0 && (
        <TableFooter
          pager={
            pageCount > 1 ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => set({ page: String(page - 1) })}
                >
                  Previous
                </Button>
                <span aria-hidden="true" className="mx-2 h-5 w-px bg-hairline" />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page + 1 >= pageCount}
                  onClick={() => set({ page: String(page + 1) })}
                >
                  Next
                </Button>
              </>
            ) : undefined
          }
        >
          {total.toLocaleString()} document{total === 1 ? '' : 's'}
          {pageCount > 1 ? `, page ${page + 1} of ${pageCount}` : ''}
        </TableFooter>
      )}
    </section>
  )
}

function DocumentRow({
  organizationId,
  item,
  myRole,
}: {
  organizationId: string
  item: EvidenceDocument
  myRole?: MyRole
}) {
  const dateFormat = useDateFormat()
  const remove = useDeleteEvidence({ activityId: item.activityId }, organizationId)
  const toast = useToast()
  return (
    <tr>
      <Td>
        <TwoLine
          primary={
            item.kind === 'FILE' ? (
              <a href={evidenceDownloadUrl(item.id)} className="text-link hover:underline" download>
                {item.name}
              </a>
            ) : (
              <a
                href={item.url ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="text-link hover:underline"
              >
                {item.name}
              </a>
            )
          }
          secondary={item.kind === 'FILE' ? `file · ${formatSize(item.sizeBytes)}` : 'link'}
        />
      </Td>
      <Td>
        {item.recordRemoved ? (
          <span className="text-ink-muted">
            <span className="line-through">
              {item.recordRef} · {item.activityType}
            </span>{' '}
            (record removed)
          </span>
        ) : (
          <Link
            to={`/app/ghg/${organizationId}/activity?record=${item.activityId}`}
            className="text-link hover:underline"
          >
            {item.recordRef} · {item.activityType} →
          </Link>
        )}
      </Td>
      <Td>
        <TwoLine
          primary={<span className="font-normal">{item.facilityName}</span>}
          secondary={formatRecordPeriod(item.periodStart, item.periodEnd, dateFormat)}
        />
      </Td>
      <Td className="text-ink-muted">
        {item.uploadedBy}, {formatDateTime(item.uploadedAt, dateFormat)}
      </Td>
      <Td align="right" className="text-[13px]">
        {item.calculated ? (
          <span
            className="text-ink-muted"
            title="A run has calculated this record; its evidence stays on file so the run remains traceable."
          >
            on a calculated run
          </span>
        ) : mayWrite(myRole) ? (
          <button
            type="button"
            aria-label={`Remove ${item.name}`}
            className="font-medium text-link hover:underline"
            onClick={() =>
              remove.mutate(item.id, {
                onError: (error) => toast(refusalMessage(error, myRole), 'error'),
              })
            }
          >
            remove
          </button>
        ) : (
          <>
            <button
              type="button"
              aria-label={`Remove ${item.name}`}
              className="font-medium text-link opacity-50"
              disabled
              title={WRITE_TOOLTIP}
              aria-describedby={`doc-role-${item.id}`}
            >
              remove
            </button>
            <span id={`doc-role-${item.id}`} className="sr-only">
              {WRITE_TOOLTIP}
            </span>
          </>
        )}
      </Td>
    </tr>
  )
}
