import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField, SelectField, TextAreaField } from '../../components/Field'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { Panel, PanelBody, PanelHead } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { StatusDot } from '../../components/StatusDot'
import type { StatusTone } from '../../components/StatusDot'
import { Table, Td, Th, TwoLine } from '../../components/Table'
import { useToast } from '../../components/toast'
import { fieldErrors, refusalMessage } from '../../lib/api'
import {
  useCreateFactorPackEdition,
  useCreateFactorPackFamily,
  useFactorPacksQuery,
} from './useFactorPacks'
import type { FactorPackEdition, FactorPackFamily, FactorPackKind, FactorPackStatus } from './api'

type Dialog =
  | { kind: 'family' }
  | { kind: 'edition'; family: FactorPackFamily; cloneFrom: FactorPackEdition | null }
  | null

const tones: Record<FactorPackStatus, StatusTone> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  SUPERSEDED: 'info',
  WITHDRAWN: 'warning',
}

const statusHints: Record<FactorPackStatus, string> = {
  DRAFT: 'Invisible to organizations, rows mutable.',
  PUBLISHED: 'Importable; its rows and values never change again.',
  SUPERSEDED: 'A successor was published: readable, not importable.',
  WITHDRAWN: 'Withdrawn with a reason: readable, not importable.',
}

const crumbs = [{ label: 'Administration' }, { label: 'Factor packs' }]

/**
 * The factor pack catalogue as its maintainer sees it (spec 02.5): every
 * family with every edition of it, the status each stands at, how many rows it
 * carries and how many organizations hold it. A pack is the published
 * methodology behind every number a client reports, so the list is where a
 * correction starts: clone the edition that is wrong into a new draft.
 */
export function AdminFactorPacksPage() {
  const packsQuery = useFactorPacksQuery()
  const toast = useToast()
  const [dialog, setDialog] = useState<Dialog>(null)

  const families = packsQuery.data ?? []

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        crumbs={crumbs}
        title="Factor packs"
        subtitle="A family is the lineage of one publication; an edition is one dated release of it, and the edition is what a citation names. Only a draft can be changed: once an edition is published its rows and values never move again, because reports already rest on them. To correct a published edition, clone it into a new draft."
        actions={<Button onClick={() => setDialog({ kind: 'family' })}>Add family</Button>}
      />

      {packsQuery.isPending && (
        <div aria-label="Loading factor packs" className="flex flex-col gap-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}

      {packsQuery.data?.length === 0 && (
        <Panel className="p-10 text-center">
          <h2 className="text-lg">No factor pack families yet</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Add a family for the publication you maintain, then create its first edition.
          </p>
        </Panel>
      )}

      {families.map((family) => (
        <Panel key={family.packKey}>
          <PanelHead
            title={family.name}
            description={
              <>
                <span className="block">
                  {family.packKey} ·{' '}
                  {family.kind === 'SOURCE'
                    ? 'A published table'
                    : 'A selection assembled for a sector'}
                </span>
                {family.summary && <span className="mt-1 block">{family.summary}</span>}
              </>
            }
          >
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDialog({ kind: 'edition', family, cloneFrom: null })}
            >
              New edition
            </Button>
          </PanelHead>

          {family.editions.length === 0 ? (
            <PanelBody>
              <p className="text-sm text-ink-muted">No editions yet.</p>
            </PanelBody>
          ) : (
            <Table className="[&_tbody_tr:last-child>td]:border-b-0">
              <thead>
                <tr>
                  <Th>Edition</Th>
                  <Th>Status</Th>
                  <Th>Applies from</Th>
                  <Th align="right">Rows</Th>
                  <Th>Held by</Th>
                  <Th align="right">
                    <span className="sr-only">Actions</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {family.editions.map((edition) => (
                  <tr key={edition.editionId}>
                    <Td>
                      <TwoLine
                        primary={
                          <Link
                            to={`/admin/factor-packs/${edition.editionId}`}
                            className="text-link hover:underline"
                          >
                            {edition.editionId}
                          </Link>
                        }
                        secondary={edition.name}
                      />
                    </Td>
                    <Td>
                      <StatusDot tone={tones[edition.status]} title={statusHints[edition.status]}>
                        {edition.status}
                      </StatusDot>
                    </Td>
                    <Td className="whitespace-nowrap text-ink-muted">
                      {edition.appliesFrom ?? '-'}
                    </Td>
                    <Td align="right">{edition.rowCount.toLocaleString()}</Td>
                    <Td className="text-ink-muted">
                      {edition.holderCount === 0
                        ? 'No organization'
                        : `${edition.holderCount} organization${edition.holderCount === 1 ? '' : 's'}`}
                    </Td>
                    <Td align="right">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Clone ${edition.editionId} into a new draft`}
                        onClick={() => setDialog({ kind: 'edition', family, cloneFrom: edition })}
                      >
                        Clone
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      ))}

      {dialog?.kind === 'family' && (
        <FamilyFormModal
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null)
            toast(message)
          }}
        />
      )}
      {dialog?.kind === 'edition' && (
        <EditionFormModal
          family={dialog.family}
          cloneFrom={dialog.cloneFrom}
          onClose={() => setDialog(null)}
          onSaved={(message) => {
            setDialog(null)
            toast(message)
          }}
        />
      )}
    </div>
  )
}

function FamilyFormModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const createFamily = useCreateFactorPackFamily()
  const [packKey, setPackKey] = useState('')
  const [name, setName] = useState('')
  const [kind, setKind] = useState<FactorPackKind>('SOURCE')
  const [summary, setSummary] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [refusal, setRefusal] = useState<string | null>(null)

  return (
    <Modal title="Add a pack family" onClose={onClose}>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          setErrors({})
          setRefusal(null)
          createFamily.mutate(
            { packKey: packKey.trim(), name: name.trim(), kind, summary: summary.trim() },
            {
              onSuccess: () => onSaved(`The ${name.trim()} family was created.`),
              onError: (failure) => {
                const fields = fieldErrors(failure)
                if (fields) setErrors(fields)
                else setRefusal(refusalMessage(failure))
              },
            },
          )
        }}
      >
        <p className="text-sm text-ink-muted">
          A family is the lineage of one publication. Its key is a citation key, so it never
          changes.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <InputField
            label="Key"
            hint="Lowercase letters, digits, hyphens and dots, as 'defra' does."
            value={packKey}
            error={errors.packKey}
            onChange={(event) => setPackKey(event.target.value)}
          />
          <InputField
            label="Name"
            value={name}
            error={errors.name}
            onChange={(event) => setName(event.target.value)}
          />
          <SelectField
            label="Kind"
            hint="A published table, or a selection assembled from other packs for one sector."
            value={kind}
            error={errors.kind}
            onChange={(event) => setKind(event.target.value as FactorPackKind)}
          >
            <option value="SOURCE">SOURCE: a published table</option>
            <option value="SECTOR">SECTOR: a selection for a sector</option>
          </SelectField>
          <TextAreaField
            label="Summary"
            value={summary}
            error={errors.summary}
            onChange={(event) => setSummary(event.target.value)}
          />
        </div>
        {refusal && (
          <p role="alert" className="mt-3 text-sm font-medium text-danger">
            {refusal}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={createFamily.isPending}>
            Add family
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function EditionFormModal({
  family,
  cloneFrom,
  onClose,
  onSaved,
}: {
  family: FactorPackFamily
  cloneFrom: FactorPackEdition | null
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const createEdition = useCreateFactorPackEdition()
  const [editionId, setEditionId] = useState('')
  const [name, setName] = useState(cloneFrom?.name ?? family.name)
  const [source, setSource] = useState(cloneFrom?.source ?? '')
  const [sourceUrl, setSourceUrl] = useState(cloneFrom?.sourceUrl ?? '')
  const [publicationYear, setPublicationYear] = useState(
    cloneFrom?.publicationYear ? String(cloneFrom.publicationYear) : '',
  )
  const [gwpBasis, setGwpBasis] = useState(cloneFrom?.gwpBasis ?? 'AR5')
  const [appliesFrom, setAppliesFrom] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [refusal, setRefusal] = useState<string | null>(null)

  return (
    <Modal
      title={cloneFrom ? `Clone ${cloneFrom.editionId}` : `New edition of ${family.name}`}
      onClose={onClose}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          setErrors({})
          setRefusal(null)
          createEdition.mutate(
            {
              packKey: family.packKey,
              input: {
                editionId: editionId.trim(),
                cloneFrom: cloneFrom?.editionId ?? null,
                name: name.trim(),
                source: source.trim(),
                sourceUrl: sourceUrl.trim(),
                publicationYear: publicationYear ? Number(publicationYear) : null,
                gwpBasis: gwpBasis.trim(),
                license: '',
                retrieved: '',
                notes: '',
                appliesFrom: appliesFrom || null,
              },
            },
            {
              onSuccess: () =>
                onSaved(
                  cloneFrom
                    ? `${editionId.trim()} was created from ${cloneFrom.editionId} with its ${cloneFrom.rowCount.toLocaleString()} rows.`
                    : `${editionId.trim()} was created as an empty draft.`,
                ),
              onError: (failure) => {
                const fields = fieldErrors(failure)
                if (fields) setErrors(fields)
                else setRefusal(refusalMessage(failure))
              },
            },
          )
        }}
      >
        <p className="text-sm text-ink-muted">
          {cloneFrom
            ? `The draft starts with the ${cloneFrom.rowCount.toLocaleString()} rows of ${cloneFrom.editionId}, copied. Correcting a copy leaves the published edition as it is.`
            : 'The draft starts empty. It is invisible to organizations until it is published.'}
        </p>
        <div className="mt-4 flex flex-col gap-4">
          <InputField
            label="Edition identifier"
            hint="The citation a report prints, so it never changes: 'defra-2026', 'defra-2026.r2'."
            value={editionId}
            error={errors.editionId}
            onChange={(event) => setEditionId(event.target.value)}
          />
          <InputField
            label="Name"
            value={name}
            error={errors.name}
            onChange={(event) => setName(event.target.value)}
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
            hint="The set the publication states; the gas split is reconciled against it."
            value={gwpBasis}
            error={errors.gwpBasis}
            onChange={(event) => setGwpBasis(event.target.value)}
          >
            <option value="AR5">AR5</option>
            <option value="AR6">AR6</option>
          </SelectField>
          <InputField
            label="Applies from"
            type="date"
            value={appliesFrom}
            error={errors.appliesFrom}
            onChange={(event) => setAppliesFrom(event.target.value)}
          />
        </div>
        {refusal && (
          <p role="alert" className="mt-3 text-sm font-medium text-danger">
            {refusal}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={createEdition.isPending}>
            Create draft
          </Button>
        </div>
      </form>
    </Modal>
  )
}
