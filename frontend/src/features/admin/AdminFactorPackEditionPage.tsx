import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Banner } from '../../components/Banner'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import type { ChipTone } from '../../components/Chip'
import { InputField, SelectField, TextAreaField } from '../../components/Field'
import { FilterRow, FilterSelect, SearchField } from '../../components/FilterRow'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { Panel, PanelBody, PanelHead } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { Table, TableFooter, Td, Th } from '../../components/Table'
import { Tabs } from '../../components/Tabs'
import { useToast } from '../../components/toast'
import { fieldErrors, refusalMessage } from '../../lib/api'
import { BlastRadiusDrawer } from './components/BlastRadiusDrawer'
import { PackRowFormModal } from './components/PackRowFormModal'
import { PublishEditionDialog } from './components/PublishEditionDialog'
import {
  useDeleteFactorPackEdition,
  useDeleteFactorPackRow,
  useFactorPackChangesQuery,
  useFactorPackEditionQuery,
  useFactorPackRowsQuery,
  useFactorPackValidationQuery,
  useUpdateFactorPackEdition,
  useWithdrawFactorPackEdition,
} from './useFactorPacks'
import type { FactorPackChange, FactorPackEdition, FactorPackRow, FactorPackStatus } from './api'

type Tab = 'rows' | 'metadata' | 'validation' | 'changes'

type Dialog =
  | { kind: 'row'; row: FactorPackRow | null }
  | { kind: 'deleteRow'; row: FactorPackRow }
  | { kind: 'deleteEdition' }
  | { kind: 'publish' }
  | { kind: 'withdraw' }
  | null

const tones: Record<FactorPackStatus, ChipTone> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  SUPERSEDED: 'neutral',
  WITHDRAWN: 'warning',
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
  caveat: 'A caveated row publishes unapproved',
}

const PAGE_SIZE = 50

/** The eyebrow of a metadata fact (spec 10). */
const eyebrow = 'text-[11px] font-semibold tracking-[0.12em] text-ink-muted uppercase'

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
  const changesQuery = useFactorPackChangesQuery(editionId)
  const deleteRow = useDeleteFactorPackRow()
  const deleteEdition = useDeleteFactorPackEdition()
  const withdraw = useWithdrawFactorPackEdition()
  const [blastRadiusOpen, setBlastRadiusOpen] = useState(false)
  const [withdrawalReason, setWithdrawalReason] = useState('')
  const [withdrawalError, setWithdrawalError] = useState<string | null>(null)

  const edition = editionQuery.data
  const rows = rowsQuery.data
  const findings = validationQuery.data ?? []
  const changes = changesQuery.data ?? []

  if (editionQuery.isPending) {
    return <Skeleton className="h-32" aria-label="Loading the edition" />
  }

  if (!edition) {
    return (
      <Panel className="p-10 text-center">
        <h1 className="text-lg">That edition was not found</h1>
        <Link to="/admin/factor-packs" className="mt-2 inline-block text-sm text-link">
          Back to the factor packs
        </Link>
      </Panel>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ to: '/admin/factor-packs' }}
        crumbs={[
          { label: 'Administration' },
          { label: 'Factor packs', to: '/admin/factor-packs' },
          { label: edition.editionId },
        ]}
        title={edition.editionId}
        chips={<Chip tone={tones[edition.status]}>{edition.status}</Chip>}
        subtitle={
          <>
            {edition.name} · {edition.rowCount.toLocaleString()} rows ·{' '}
            {edition.holderCount === 0
              ? 'held by no organization'
              : `held by ${edition.holderCount} organization${edition.holderCount === 1 ? '' : 's'}`}
          </>
        }
        actions={
          <>
            {edition.mutable && (
              <>
                <Button onClick={() => setDialog({ kind: 'row', row: null })}>Add row</Button>
                <Button variant="secondary" onClick={() => setDialog({ kind: 'publish' })}>
                  Publish
                </Button>
                <Button variant="ghost" onClick={() => setDialog({ kind: 'deleteEdition' })}>
                  Delete draft
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={() => setBlastRadiusOpen(true)}>
              Blast radius
            </Button>
            {edition.status === 'PUBLISHED' && (
              <Button variant="ghost" onClick={() => setDialog({ kind: 'withdraw' })}>
                Withdraw
              </Button>
            )}
          </>
        }
      />

      {!edition.mutable && (
        <Banner tone="info">
          This edition is published, so its rows, metadata and values never change again: reports
          already rest on them. Clone it into a new draft to correct a row.
        </Banner>
      )}

      <Tabs
        label="The edition"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'rows', label: 'Rows', count: edition.rowCount },
          { value: 'metadata', label: 'Metadata' },
          { value: 'validation', label: 'Validation', count: findings.length },
          { value: 'changes', label: 'Changes', count: changes.length },
        ]}
      />

      {tab === 'rows' && (
        <div className="flex flex-col gap-4">
          <FilterRow
            filters={1}
            search={
              <SearchField
                label="Search"
                placeholder="A code, a name or a detail"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(0)
                }}
              />
            }
          >
            <FilterSelect
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
            </FilterSelect>
          </FilterRow>

          {rowsQuery.isPending && <Skeleton className="h-40" aria-label="Loading the rows" />}

          {rows && rows.total === 0 && (
            <Panel className="p-10 text-center">
              <h2 className="text-lg">No rows</h2>
              <p className="mt-1 text-sm text-ink-muted">
                {search || category
                  ? 'No row of this edition matches the filter.'
                  : 'This edition is empty. Add a row, or clone a predecessor into a new draft.'}
              </p>
            </Panel>
          )}

          {rows && rows.total > 0 && (
            <Panel>
              <Table className="[&_tbody_tr:last-child>td]:border-b-0">
                <thead>
                  <tr>
                    <Th>Code</Th>
                    <Th>Name</Th>
                    <Th>Unit</Th>
                    <Th align="right">kg CO2e</Th>
                    <Th>Approved</Th>
                    <Th align="right">
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.items.map((row) => (
                    <tr key={row.id}>
                      <Td className="text-[13px] break-all">{row.code}</Td>
                      <Td>{row.name}</Td>
                      <Td className="text-ink-muted">{row.unit}</Td>
                      <Td align="right">{row.kgCo2ePerUnit}</Td>
                      <Td className="text-ink-muted">{row.approved ? 'Yes' : 'No'}</Td>
                      <Td align="right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            aria-label={`Edit ${row.code}`}
                            onClick={() => setDialog({ kind: 'row', row })}
                          >
                            Edit
                          </Button>
                          {edition.mutable && (
                            <Button
                              size="sm"
                              variant="ghost"
                              aria-label={`Delete ${row.code}`}
                              onClick={() => setDialog({ kind: 'deleteRow', row })}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Panel>
          )}

          {rows && rows.total > PAGE_SIZE && (
            <TableFooter
              pager={
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={page === 0}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={(page + 1) * PAGE_SIZE >= rows.total}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </Button>
                </>
              }
            >
              {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, rows.total)} of{' '}
              {rows.total.toLocaleString()}
            </TableFooter>
          )}
        </div>
      )}

      {tab === 'metadata' && <MetadataTab edition={edition} />}

      {tab === 'validation' && (
        <ValidationTab findings={findings} loading={validationQuery.isPending} />
      )}

      {tab === 'changes' && (
        <ChangesTab
          changes={changes}
          loading={changesQuery.isPending}
          predecessorId={edition.supersedesId}
          mutable={edition.mutable}
        />
      )}

      {blastRadiusOpen && (
        <BlastRadiusDrawer
          editionId={edition.editionId}
          onClose={() => setBlastRadiusOpen(false)}
        />
      )}

      {dialog?.kind === 'publish' && (
        <PublishEditionDialog
          edition={edition}
          findings={findings}
          onClose={() => setDialog(null)}
          onPublished={(message) => {
            setDialog(null)
            toast(message)
          }}
          onOpenBlastRadius={() => {
            setDialog(null)
            setBlastRadiusOpen(true)
          }}
        />
      )}

      {dialog?.kind === 'withdraw' && (
        <Modal title={`Withdraw ${edition.editionId}`} onClose={() => setDialog(null)}>
          <p className="text-sm text-ink-muted">
            The edition leaves the import list and every open notice for it closes. The rows
            organizations already hold stay exactly as they are: a withdrawal is the
            publisher&apos;s act, not the client&apos;s recalculation. Read the blast radius first.
          </p>
          <div className="mt-4">
            <TextAreaField
              label="Why it is withdrawn"
              value={withdrawalReason}
              error={withdrawalError ?? undefined}
              hint="At least 10 characters. It is the record a verifier reads beside the figures that rest on it."
              onChange={(event) => setWithdrawalReason(event.target.value)}
            />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              busy={withdraw.isPending}
              onClick={() => {
                setWithdrawalError(null)
                withdraw.mutate(
                  { editionId: edition.editionId, reason: withdrawalReason.trim() },
                  {
                    onSuccess: () => {
                      setDialog(null)
                      setWithdrawalReason('')
                      toast(`${edition.editionId} was withdrawn.`)
                    },
                    onError: (error) => {
                      const fields = fieldErrors(error)
                      if (fields?.reason) setWithdrawalError(fields.reason)
                      else toast(refusalMessage(error), 'error')
                    },
                  },
                )
              }}
            >
              Withdraw edition
            </Button>
          </div>
        </Modal>
      )}

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
    <Panel>
      <PanelBody>
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
            <div className="sm:col-span-2">
              <TextAreaField
                label="Notes"
                value={notes}
                error={errors.notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </fieldset>

          <dl className="mt-6 grid gap-4 border-t border-hairline pt-5 text-sm sm:grid-cols-2">
            <div>
              <dt className={eyebrow}>Curator</dt>
              <dd className="mt-1">{edition.curator ?? 'Not recorded'}</dd>
            </div>
            <div>
              <dt className={eyebrow}>Approver</dt>
              <dd className="mt-1">{edition.approver ?? 'Not recorded'}</dd>
            </div>
            <div>
              <dt className={eyebrow}>Provenance review</dt>
              <dd className="mt-1">{edition.provenanceReview}</dd>
            </div>
            <div>
              <dt className={eyebrow}>Evidence checksum</dt>
              <dd className="mt-1 text-[13px] break-all">
                {edition.evidenceChecksum ?? 'None yet'}
              </dd>
            </div>
          </dl>
          {edition.provenanceNote && (
            <Banner tone="warning" className="mt-4">
              {edition.provenanceNote}
            </Banner>
          )}

          {refusal && (
            <p role="alert" className="mt-3 text-sm font-medium text-danger">
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
      </PanelBody>
    </Panel>
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
      <Panel className="p-10 text-center">
        <h2 className="text-lg">Every rule passes</h2>
        <p className="mt-1 text-sm text-ink-muted">
          No row of this edition breaks a publication rule. Each rule is a hard failure, never a
          warning, because a published edition is a citation.
        </p>
      </Panel>
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
        <Panel key={rule}>
          <PanelHead
            title={ruleNames[rule] ?? rule}
            description={`${group.length} ${group.length === 1 ? 'row' : 'rows'}`}
          />
          <PanelBody>
            <ul className="flex flex-col gap-2 text-sm">
              {group.slice(0, 20).map((finding) => (
                <li key={`${finding.rule}-${finding.code}`}>
                  <span className="text-[13px] font-medium break-all">{finding.code}</span>
                  <span className="block text-ink-muted">{finding.message}</span>
                </li>
              ))}
            </ul>
            {group.length > 20 && (
              <p className="mt-2 text-[13px] text-ink-muted">
                and {group.length - 20} more rows breaking this rule
              </p>
            )}
          </PanelBody>
        </Panel>
      ))}
    </div>
  )
}

/**
 * The change log the edition froze at publication, computed against the
 * predecessor: one line per code, so a reader can see the one row that moved.
 * A draft has none, because the comparison is made once, at publication.
 */
function ChangesTab({
  changes,
  loading,
  predecessorId,
  mutable,
}: {
  changes: FactorPackChange[]
  loading: boolean
  predecessorId: string | null
  mutable: boolean
}) {
  if (loading) return <Skeleton className="h-32" aria-label="Loading the change log" />

  if (changes.length === 0) {
    return (
      <Panel className="p-10 text-center">
        <h2 className="text-lg">No change log</h2>
        <p className="mt-1 text-sm text-ink-muted">
          {mutable
            ? 'The change log is computed and frozen at publication, against the predecessor edition. Read the blast radius to see what publishing would move.'
            : 'This edition was the first of its family, so there was nothing to compare it against.'}
        </p>
      </Panel>
    )
  }

  const counts = {
    ADDED: changes.filter((change) => change.kind === 'ADDED').length,
    CHANGED: changes.filter((change) => change.kind === 'CHANGED').length,
    DISCONTINUED: changes.filter((change) => change.kind === 'DISCONTINUED').length,
    UNCHANGED: changes.filter((change) => change.kind === 'UNCHANGED').length,
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-muted">
        Frozen at publication against{' '}
        <span className="font-medium text-ink">{predecessorId ?? 'no predecessor'}</span>:{' '}
        {counts.ADDED} added, {counts.CHANGED} changed, {counts.DISCONTINUED} discontinued,{' '}
        {counts.UNCHANGED} unchanged.
      </p>
      <Panel>
        <Table className="[&_tbody_tr:last-child>td]:border-b-0">
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>Kind</Th>
              <Th align="right">Was</Th>
              <Th align="right">Is</Th>
              <Th align="right">Change</Th>
              <Th>Fields</Th>
            </tr>
          </thead>
          <tbody>
            {changes
              .filter((change) => change.kind !== 'UNCHANGED')
              .slice(0, 200)
              .map((change) => (
                <tr key={change.code}>
                  <Td className="text-[13px] break-all">{change.code}</Td>
                  <Td className="text-ink-muted">{change.kind}</Td>
                  <Td align="right" className="text-ink-muted">
                    {change.oldKgCo2e ?? '-'}
                  </Td>
                  <Td align="right">{change.newKgCo2e ?? '-'}</Td>
                  <Td align="right">
                    {change.percentChange === null ? '-' : `${change.percentChange.toFixed(2)}%`}
                  </Td>
                  <Td className="text-ink-muted">{change.fields ?? '-'}</Td>
                </tr>
              ))}
          </tbody>
        </Table>
      </Panel>
      {counts.UNCHANGED > 0 && (
        <p className="text-[13px] text-ink-muted">
          {counts.UNCHANGED} {counts.UNCHANGED === 1 ? 'row is' : 'rows are'} unchanged and are not
          listed.
        </p>
      )}
    </div>
  )
}
