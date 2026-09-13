import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField, SelectField, TextAreaField } from '../../components/Field'
import { GlassCard } from '../../components/GlassCard'
import { Modal } from '../../components/Modal'
import { Skeleton } from '../../components/Skeleton'
import { StatusPill } from '../../components/StatusPill'
import type { PillTone } from '../../components/StatusPill'
import { Tabs } from '../../components/Tabs'
import { useToast } from '../../components/toast'
import { fieldErrors, refusalMessage } from '../../lib/api'
import { AdminHeader } from './components/AdminHeader'
import { PackRowFormModal } from './components/PackRowFormModal'
import {
  useDeleteFactorPackEdition,
  useDeleteFactorPackRow,
  useFactorPackEditionQuery,
  useFactorPackRowsQuery,
  useFactorPackValidationQuery,
  useUpdateFactorPackEdition,
} from './useFactorPacks'
import type { FactorPackEdition, FactorPackRow, FactorPackStatus } from './api'

type Tab = 'rows' | 'metadata' | 'validation'

type Dialog =
  | { kind: 'row'; row: FactorPackRow | null }
  | { kind: 'deleteRow'; row: FactorPackRow }
  | { kind: 'deleteEdition' }
  | null

const tones: Record<FactorPackStatus, PillTone> = {
  DRAFT: 'draft',
  PUBLISHED: 'ready',
  SUPERSEDED: 'neutral',
  WITHDRAWN: 'attention',
}

/** The rules the report names, in words a curator can act on. */
const ruleNames: Record<string, string> = {
  code: 'The code names the publication and the row',
  provenance: 'The provenance is complete',
  unit: 'The unit is one the registry knows',
  gasSplit: 'The gas split reconciles to the stated CO2e',
  biogenic: 'Biogenic CO2 is excluded from the stated CO2e',
  nonKyoto: 'A non-Kyoto gas reports outside the scopes',
  scopeCategory: 'The scope and the category agree',
  sourceForValue: 'No value without a source',
  approvalAttributable: 'Approval is attributable',
}

const PAGE_SIZE = 50

/**
 * The workbench for one edition (spec 02.5): its rows, its metadata and the
 * live validation report. A draft is authored here; a published edition is
 * read-only, because its rows, metadata and values never change again.
 */
export function AdminFactorPackEditionPage() {
  const { editionId = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const editionQuery = useFactorPackEditionQuery(editionId)
  const [tab, setTab] = useState<Tab>('rows')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(0)

  const rowsQuery = useFactorPackRowsQuery(editionId, {
    search: search || undefined,
    sourceCategory: category || undefined,
    page,
    size: PAGE_SIZE,
  })
  const validationQuery = useFactorPackValidationQuery(editionId)
  const deleteRow = useDeleteFactorPackRow()
  const deleteEdition = useDeleteFactorPackEdition()

  const edition = editionQuery.data
  const rows = rowsQuery.data
  const findings = validationQuery.data ?? []

  if (editionQuery.isPending) {
    return (
      <div className="min-h-screen">
        <AdminHeader current="/admin/factor-packs" />
        <main className="mx-auto max-w-5xl px-6 py-10">
          <Skeleton className="h-32" aria-label="Loading the edition" />
        </main>
      </div>
    )
  }

  if (!edition) {
    return (
      <div className="min-h-screen">
        <AdminHeader current="/admin/factor-packs" />
        <main className="mx-auto max-w-5xl px-6 py-10">
          <GlassCard className="p-10 text-center">
            <h1 className="text-lg">That edition was not found</h1>
            <Link to="/admin/factor-packs" className="mt-2 inline-block text-sm text-link">
              Back to the factor packs
            </Link>
          </GlassCard>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AdminHeader current="/admin/factor-packs" />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/admin/factor-packs" className="text-sm text-link">
          Factor packs
        </Link>
        <div className="mt-2 mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl">{edition.editionId}</h1>
              <StatusPill tone={tones[edition.status]}>{edition.status}</StatusPill>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              {edition.name} · {edition.rowCount.toLocaleString()} rows ·{' '}
              {edition.holderCount === 0
                ? 'held by no organization'
                : `held by ${edition.holderCount} organization${edition.holderCount === 1 ? '' : 's'}`}
            </p>
            {!edition.mutable && (
              <p className="mt-2 max-w-2xl text-sm text-ink-muted">
                This edition is published, so its rows, metadata and values never change again:
                reports already rest on them. Clone it into a new draft to correct a row.
              </p>
            )}
          </div>
          {edition.mutable && (
            <div className="flex gap-2">
              <Button onClick={() => setDialog({ kind: 'row', row: null })}>Add row</Button>
              <Button
                variant="ghost"
                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                onClick={() => setDialog({ kind: 'deleteEdition' })}
              >
                Delete draft
              </Button>
            </div>
          )}
        </div>

        <Tabs
          label="The edition"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'rows', label: 'Rows', count: edition.rowCount },
            { value: 'metadata', label: 'Metadata' },
            { value: 'validation', label: 'Validation', count: findings.length },
          ]}
        />

        <div className="mt-6">
          {tab === 'rows' && (
            <>
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="min-w-48 flex-1">
                  <InputField
                    label="Search"
                    placeholder="A code, a name or a detail"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value)
                      setPage(0)
                    }}
                  />
                </div>
                <div className="min-w-48 flex-1">
                  <SelectField
                    label="Publisher's category"
                    value={category}
                    onChange={(event) => {
                      setCategory(event.target.value)
                      setPage(0)
                    }}
                  >
                    <option value="">Every category</option>
                    {(rows?.categories ?? []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </SelectField>
                </div>
              </div>

              {rowsQuery.isPending && <Skeleton className="h-40" aria-label="Loading the rows" />}

              {rows && rows.total === 0 && (
                <GlassCard className="p-10 text-center">
                  <h2 className="text-lg">No rows</h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    {search || category
                      ? 'No row of this edition matches the filter.'
                      : 'This edition is empty. Add a row, or clone a predecessor into a new draft.'}
                  </p>
                </GlassCard>
              )}

              {rows && rows.total > 0 && (
                <GlassCard className="p-2">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                        <th className="px-3 py-2 font-semibold">Code</th>
                        <th className="px-3 py-2 font-semibold">Name</th>
                        <th className="px-3 py-2 font-semibold">Unit</th>
                        <th className="px-3 py-2 font-semibold">kg CO2e</th>
                        <th className="px-3 py-2 font-semibold">Approved</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.items.map((row) => (
                        <tr key={row.id} className="border-b border-teal/5 last:border-0">
                          <td className="px-3 py-2 font-mono text-xs break-all">{row.code}</td>
                          <td className="px-3 py-2">{row.name}</td>
                          <td className="px-3 py-2 text-ink-muted">{row.unit}</td>
                          <td className="px-3 py-2 text-ink-muted">{row.kgCo2ePerUnit}</td>
                          <td className="px-3 py-2 text-ink-muted">
                            {row.approved ? 'Yes' : 'No'}
                          </td>
                          <td className="px-3 py-2 text-right whitespace-nowrap">
                            <Button
                              variant="ghost"
                              className="px-2 py-1 text-xs"
                              aria-label={`Edit ${row.code}`}
                              onClick={() => setDialog({ kind: 'row', row })}
                            >
                              Edit
                            </Button>
                            {edition.mutable && (
                              <Button
                                variant="ghost"
                                className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                                aria-label={`Delete ${row.code}`}
                                onClick={() => setDialog({ kind: 'deleteRow', row })}
                              >
                                Delete
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </GlassCard>
              )}

              {rows && rows.total > PAGE_SIZE && (
                <div className="mt-4 flex items-center justify-between text-sm">
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-sm"
                    disabled={page === 0}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-ink-muted">
                    {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, rows.total)} of{' '}
                    {rows.total.toLocaleString()}
                  </span>
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5 text-sm"
                    disabled={(page + 1) * PAGE_SIZE >= rows.total}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}

          {tab === 'metadata' && <MetadataTab edition={edition} />}

          {tab === 'validation' && (
            <ValidationTab findings={findings} loading={validationQuery.isPending} />
          )}
        </div>
      </main>

      {dialog?.kind === 'row' && (
        <PackRowFormModal
          editionId={edition.editionId}
          row={dialog.row}
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null)
            toast(message)
          }}
        />
      )}

      {dialog?.kind === 'deleteRow' && (
        <Modal title={`Delete ${dialog.row.code}`} onClose={() => setDialog(null)}>
          <p className="text-sm text-ink-muted">
            The row goes from this draft. Nothing an organization holds changes: a draft is
            invisible until it is published.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              busy={deleteRow.isPending}
              onClick={() =>
                deleteRow.mutate(
                  { editionId: edition.editionId, rowId: dialog.row.id },
                  {
                    onSuccess: () => {
                      setDialog(null)
                      toast(`${dialog.row.code} was deleted.`)
                    },
                    onError: (error) => toast(refusalMessage(error), 'error'),
                  },
                )
              }
            >
              Delete row
            </Button>
          </div>
        </Modal>
      )}

      {dialog?.kind === 'deleteEdition' && (
        <Modal title={`Delete ${edition.editionId}`} onClose={() => setDialog(null)}>
          <p className="text-sm text-ink-muted">
            The draft and its {edition.rowCount.toLocaleString()} rows go for good. A draft that was
            never published is the only edition that can be deleted: clause 8.2 requires the records
            behind a reported figure to be retained.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              busy={deleteEdition.isPending}
              onClick={() =>
                deleteEdition.mutate(edition.editionId, {
                  onSuccess: () => {
                    setDialog(null)
                    toast(`${edition.editionId} was deleted.`)
                    void navigate('/admin/factor-packs')
                  },
                  onError: (error) => toast(refusalMessage(error), 'error'),
                })
              }
            >
              Delete draft
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function MetadataTab({ edition }: { edition: FactorPackEdition }) {
  const updateEdition = useUpdateFactorPackEdition()
  const toast = useToast()
  const [name, setName] = useState(edition.name)
  const [source, setSource] = useState(edition.source)
  const [sourceUrl, setSourceUrl] = useState(edition.sourceUrl ?? '')
  const [publicationYear, setPublicationYear] = useState(
    edition.publicationYear ? String(edition.publicationYear) : '',
  )
  const [gwpBasis, setGwpBasis] = useState(edition.gwpBasis ?? 'AR5')
  const [license, setLicense] = useState(edition.license ?? '')
  const [retrieved, setRetrieved] = useState(edition.retrieved ?? '')
  const [notes, setNotes] = useState(edition.notes ?? '')
  const [appliesFrom, setAppliesFrom] = useState(edition.appliesFrom ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [refusal, setRefusal] = useState<string | null>(null)

  return (
    <GlassCard className="p-6">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          setErrors({})
          setRefusal(null)
          updateEdition.mutate(
            {
              editionId: edition.editionId,
              input: {
                name: name.trim(),
                source: source.trim(),
                sourceUrl: sourceUrl.trim(),
                publicationYear: publicationYear ? Number(publicationYear) : null,
                gwpBasis: gwpBasis.trim(),
                license: license.trim(),
                retrieved: retrieved.trim(),
                notes: notes.trim(),
                appliesFrom: appliesFrom || null,
              },
            },
            {
              onSuccess: () => toast(`${edition.editionId} was saved.`),
              onError: (failure) => {
                const fields = fieldErrors(failure)
                if (fields) setErrors(fields)
                else setRefusal(refusalMessage(failure))
              },
            },
          )
        }}
      >
        <fieldset disabled={!edition.mutable} className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Name"
            value={name}
            error={errors.name}
            onChange={(event) => setName(event.target.value)}
          />
          <InputField
            label="Applies from"
            type="date"
            value={appliesFrom}
            error={errors.appliesFrom}
            onChange={(event) => setAppliesFrom(event.target.value)}
          />
          <InputField
            label="Source publication"
            value={source}
            error={errors.source}
            onChange={(event) => setSource(event.target.value)}
          />
          <InputField
            label="Source URL"
            value={sourceUrl}
            error={errors.sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
          />
          <InputField
            label="Publication year"
            type="number"
            value={publicationYear}
            error={errors.publicationYear}
            onChange={(event) => setPublicationYear(event.target.value)}
          />
          <SelectField
            label="GWP basis"
            value={gwpBasis}
            error={errors.gwpBasis}
            onChange={(event) => setGwpBasis(event.target.value)}
          >
            <option value="AR5">AR5</option>
            <option value="AR6">AR6</option>
          </SelectField>
          <InputField
            label="Licence"
            value={license}
            error={errors.license}
            onChange={(event) => setLicense(event.target.value)}
          />
          <InputField
            label="Retrieved"
            value={retrieved}
            error={errors.retrieved}
            onChange={(event) => setRetrieved(event.target.value)}
          />
        </fieldset>
        <div className="mt-4">
          <fieldset disabled={!edition.mutable}>
            <TextAreaField
              label="Notes"
              value={notes}
              error={errors.notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </fieldset>
        </div>

        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-ink-muted uppercase">Curator</dt>
            <dd>{edition.curator ?? 'Not recorded'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted uppercase">Approver</dt>
            <dd>{edition.approver ?? 'Not recorded'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted uppercase">Provenance review</dt>
            <dd>{edition.provenanceReview}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted uppercase">Evidence checksum</dt>
            <dd className="font-mono text-xs break-all">
              {edition.evidenceChecksum ?? 'None yet'}
            </dd>
          </div>
        </dl>
        {edition.provenanceNote && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            {edition.provenanceNote}
          </p>
        )}

        {refusal && (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
            {refusal}
          </p>
        )}
        {edition.mutable && (
          <div className="mt-6 flex justify-end">
            <Button type="submit" busy={updateEdition.isPending}>
              Save metadata
            </Button>
          </div>
        )}
      </form>
    </GlassCard>
  )
}

function ValidationTab({
  findings,
  loading,
}: {
  findings: { rule: string; code: string; message: string }[]
  loading: boolean
}) {
  if (loading) return <Skeleton className="h-32" aria-label="Loading the validation report" />

  if (findings.length === 0) {
    return (
      <GlassCard className="p-10 text-center">
        <h2 className="text-lg">Every rule passes</h2>
        <p className="mt-1 text-sm text-ink-muted">
          No row of this edition breaks a publication rule. Each rule is a hard failure, never a
          warning, because a published edition is a citation.
        </p>
      </GlassCard>
    )
  }

  const byRule = new Map<string, typeof findings>()
  for (const finding of findings) {
    byRule.set(finding.rule, [...(byRule.get(finding.rule) ?? []), finding])
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-muted">
        {findings.length} {findings.length === 1 ? 'row breaks' : 'rows break'} a publication rule.
        Publication is refused while any of them stands.
      </p>
      {[...byRule.entries()].map(([rule, group]) => (
        <GlassCard key={rule} className="p-5">
          <h2 className="text-base">{ruleNames[rule] ?? rule}</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            {group.length} {group.length === 1 ? 'row' : 'rows'}
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {group.slice(0, 20).map((finding) => (
              <li key={`${finding.rule}-${finding.code}`}>
                <span className="font-mono text-xs break-all">{finding.code}</span>
                <span className="block text-ink-muted">{finding.message}</span>
              </li>
            ))}
          </ul>
          {group.length > 20 && (
            <p className="mt-2 text-xs text-ink-muted">
              and {group.length - 20} more rows breaking this rule
            </p>
          )}
        </GlassCard>
      ))}
    </div>
  )
}
