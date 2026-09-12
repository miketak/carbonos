import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField, SelectField } from '../../components/Field'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { problemDetail } from '../../lib/api'
import { evidenceDownloadUrl, evidenceIndexUrl, importBatchFileUrl } from './api'
import type { DocumentFilter, EvidenceDocument, EvidenceQuery } from './api'
import { Breadcrumb } from './components/Breadcrumb'
import { formatSize } from './components/EvidencePanel'
import { ViewSwitch } from './components/ViewSwitch'
import { formatDateTime, formatRecordPeriod } from './format'
import {
  useDeleteEvidence,
  useEvidencePageQuery,
  useFacilitiesQuery,
  useImportBatchesQuery,
} from './useGhg'

const PAGE_SIZE = 24

const filters: { value: DocumentFilter; label: string }[] = [
  { value: 'ALL', label: 'All documents' },
  { value: 'LINK_ONLY', label: 'Links only' },
  { value: 'ORPHANED', label: 'Record removed' },
]

function DocumentIcon({ kind }: { kind: EvidenceDocument['kind'] | 'IMPORT' }) {
  const path =
    kind === 'LINK'
      ? 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'
      : kind === 'IMPORT'
        ? 'M3 5h18M3 12h18M3 19h18M8 5v14M16 5v14'
        : 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8'
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d={path} />
    </svg>
  )
}

/**
 * The documents behind the organization's records (spec 04.6): every file
 * and link, newest first, each pointing at its record; the files each import
 * came from; and the evidence index a verifier takes as the pack's table of
 * contents.
 */
export function SourceDocumentsPage() {
  const { organizationId = '' } = useParams()
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

  return (
    <section>
      <Breadcrumb
        items={[
          { label: 'Data collection' },
          { label: 'Activity data', to: `/app/ghg/${organizationId}/activity` },
          { label: 'Source documents' },
        ]}
      />
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl">Source documents</h1>
          <p className="text-sm text-ink-muted">
            The supporting documents behind your activity records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewSwitch organizationId={organizationId} />
          <a
            href={evidenceIndexUrl(organizationId)}
            className="text-sm font-semibold text-link hover:underline"
            download
          >
            Download evidence index (CSV)
          </a>
        </div>
      </div>

      {batches.length > 0 && (
        <GlassCard className="mb-3 p-4">
          <h2 className="text-sm font-semibold">Imported files</h2>
          <p className="text-xs text-ink-muted">
            Each CSV import is kept as uploaded, with its digest, so a record traces to its row.
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {batches.map((batch) => (
              <li key={batch.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className="text-ink-muted">
                  <DocumentIcon kind="IMPORT" />
                </span>
                <a
                  href={importBatchFileUrl(batch.id)}
                  className="font-semibold text-link hover:underline"
                  download
                >
                  {batch.fileName}
                </a>
                <span className="text-xs text-ink-muted">
                  {batch.rowCount} row{batch.rowCount === 1 ? '' : 's'}
                  {batch.firstRecordRef
                    ? ` (${batch.firstRecordRef}${batch.lastRecordRef !== batch.firstRecordRef ? ` to ${batch.lastRecordRef}` : ''})`
                    : ''}{' '}
                  · {formatSize(batch.sizeBytes)} · {batch.importedBy},{' '}
                  {formatDateTime(batch.importedAt)} · sha256{' '}
                  <span className="font-mono" title={batch.sha256}>
                    {batch.sha256.slice(0, 12)}…
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}

      <div className="mb-3 grid gap-2 md:grid-cols-[2fr_1fr_1fr] md:items-end">
        <InputField
          label="Search"
          placeholder="Document, activity, facility or reference"
          value={q}
          onChange={(event) => set({ q: event.target.value })}
        />
        <SelectField
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
        </SelectField>
        <SelectField
          label="Show"
          value={filter}
          onChange={(event) => set({ filter: event.target.value })}
        >
          {filters.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </SelectField>
      </div>

      {documentsQuery.isPending && (
        <div aria-label="Loading documents" className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}
      {documents?.length === 0 && (
        <GlassCard className="p-8 text-center">
          <h2 className="font-semibold">{filtered ? 'No documents match' : 'No documents yet'}</h2>
          <p className="mt-1 text-sm text-ink-muted">
            {filtered
              ? 'Clear the search or the filters.'
              : 'Attach an invoice, a meter photo or a register to a record and it appears here.'}
          </p>
        </GlassCard>
      )}
      {documents && documents.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((item) => (
            <DocumentCard key={item.id} organizationId={organizationId} item={item} />
          ))}
        </ul>
      )}
      {total > 0 && (
        <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
          <span>
            {total.toLocaleString()} document{total === 1 ? '' : 's'}
            {pageCount > 1 ? `, page ${page + 1} of ${pageCount}` : ''}
          </span>
          {pageCount > 1 && (
            <span className="flex gap-2">
              <Button
                variant="ghost"
                className="px-2 py-1 text-xs"
                disabled={page === 0}
                onClick={() => set({ page: String(page - 1) })}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                className="px-2 py-1 text-xs"
                disabled={page + 1 >= pageCount}
                onClick={() => set({ page: String(page + 1) })}
              >
                Next
              </Button>
            </span>
          )}
        </div>
      )}
    </section>
  )
}

function DocumentCard({
  organizationId,
  item,
}: {
  organizationId: string
  item: EvidenceDocument
}) {
  const remove = useDeleteEvidence({ activityId: item.activityId }, organizationId)
  const toast = useToast()
  return (
    <li>
      <GlassCard className="flex h-full flex-col gap-2 p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-ink-muted">
            <DocumentIcon kind={item.kind} />
          </span>
          <div className="min-w-0 flex-1">
            {item.kind === 'FILE' ? (
              <a
                href={evidenceDownloadUrl(item.id)}
                className="block truncate font-semibold text-link hover:underline"
                download
              >
                {item.name}
              </a>
            ) : (
              <a
                href={item.url ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="block truncate font-semibold text-link hover:underline"
              >
                {item.name}
              </a>
            )}
            <p className="text-xs text-ink-muted">
              {item.kind === 'FILE' ? `file · ${formatSize(item.sizeBytes)}` : 'link'} ·{' '}
              {item.facilityName} · {formatRecordPeriod(item.periodStart, item.periodEnd)}
            </p>
          </div>
        </div>
        <p className="text-sm">
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
        </p>
        <div className="mt-auto flex items-center justify-between text-xs text-ink-muted">
          <span>
            {item.uploadedBy}, {formatDateTime(item.uploadedAt)}
          </span>
          {item.calculated ? (
            <span title="A run has calculated this record; its evidence stays on file so the run remains traceable.">
              on a calculated run
            </span>
          ) : (
            <button
              type="button"
              aria-label={`Remove ${item.name}`}
              className="text-red-600 hover:underline"
              onClick={() =>
                remove.mutate(item.id, {
                  onError: (error) =>
                    toast(problemDetail(error) ?? 'Could not remove the document.', 'error'),
                })
              }
            >
              remove
            </button>
          )}
        </div>
      </GlassCard>
    </li>
  )
}
