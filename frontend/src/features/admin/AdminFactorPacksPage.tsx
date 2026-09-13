import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField, SelectField, TextAreaField } from '../../components/Field'
import { GlassCard } from '../../components/GlassCard'
import { Modal } from '../../components/Modal'
import { Skeleton } from '../../components/Skeleton'
import { StatusPill } from '../../components/StatusPill'
import type { PillTone } from '../../components/StatusPill'
import { useToast } from '../../components/toast'
import { fieldErrors, refusalMessage } from '../../lib/api'
import { AdminHeader } from './components/AdminHeader'
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

const tones: Record<FactorPackStatus, PillTone> = {
  DRAFT: 'draft',
  PUBLISHED: 'ready',
  SUPERSEDED: 'neutral',
  WITHDRAWN: 'attention',
}

const statusHints: Record<FactorPackStatus, string> = {
  DRAFT: 'Invisible to organizations, rows mutable.',
  PUBLISHED: 'Importable; its rows and values never change again.',
  SUPERSEDED: 'A successor was published: readable, not importable.',
  WITHDRAWN: 'Withdrawn with a reason: readable, not importable.',
}

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
    <div className="min-h-screen">
      <AdminHeader current="/admin/factor-packs" />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl">Factor packs</h1>
            <p className="mt-1 max-w-3xl text-sm text-ink-muted">
              A family is the lineage of one publication; an edition is one dated release of it, and
              the edition is what a citation names. Only a draft can be changed: once an edition is
              published its rows and values never move again, because reports already rest on them.
              To correct a published edition, clone it into a new draft.
            </p>
          </div>
          <Button onClick={() => setDialog({ kind: 'family' })}>Add family</Button>
        </div>

        {packsQuery.isPending && (
          <div aria-label="Loading factor packs" className="flex flex-col gap-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        )}

        {packsQuery.data?.length === 0 && (
          <GlassCard className="p-10 text-center">
            <h2 className="text-lg">No factor pack families yet</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Add a family for the publication you maintain, then create its first edition.
            </p>
          </GlassCard>
        )}

        <div className="flex flex-col gap-4">
          {families.map((family) => (
            <GlassCard key={family.packKey} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg">{family.name}</h2>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    <code>{family.packKey}</code> ·{' '}
                    {family.kind === 'SOURCE'
                      ? 'A published table'
                      : 'A selection assembled for a sector'}
                  </p>
                  {family.summary && (
                    <p className="mt-2 max-w-2xl text-sm text-ink-muted">{family.summary}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  className="px-3 py-1.5 text-sm"
                  onClick={() => setDialog({ kind: 'edition', family, cloneFrom: null })}
                >
                  New edition
                </Button>
              </div>

              {family.editions.length === 0 ? (
                <p className="mt-4 text-sm text-ink-muted">No editions yet.</p>
              ) : (
                <table className="mt-4 w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                      <th className="px-2 py-2 font-semibold">Edition</th>
                      <th className="px-2 py-2 font-semibold">Status</th>
                      <th className="px-2 py-2 font-semibold">Applies from</th>
                      <th className="px-2 py-2 font-semibold">Rows</th>
                      <th className="px-2 py-2 font-semibold">Held by</th>
                      <th className="px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {family.editions.map((edition) => (
                      <tr key={edition.editionId} className="border-b border-teal/5 last:border-0">
                        <td className="px-2 py-2 font-medium">
                          <Link
                            to={`/admin/factor-packs/${edition.editionId}`}
                            className="font-semibold text-link"
                          >
                            {edition.editionId}
                          </Link>
                          <span className="block text-xs font-normal text-ink-muted">
                            {edition.name}
                          </span>
                        </td>
                        <td className="px-2 py-2">
                          <StatusPill
                            tone={tones[edition.status]}
                            title={statusHints[edition.status]}
                          >
                            {edition.status}
                          </StatusPill>
                        </td>
                        <td className="px-2 py-2 text-ink-muted">{edition.appliesFrom ?? '-'}</td>
                        <td className="px-2 py-2 text-ink-muted">
                          {edition.rowCount.toLocaleString()}
                        </td>
                        <td className="px-2 py-2 text-ink-muted">
                          {edition.holderCount === 0
                            ? 'No organization'
                            : `${edition.holderCount} organization${edition.holderCount === 1 ? '' : 's'}`}
                        </td>
                        <td className="px-2 py-2 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            className="px-2 py-1 text-xs"
                            aria-label={`Clone ${edition.editionId} into a new draft`}
                            onClick={() =>
                              setDialog({ kind: 'edition', family, cloneFrom: edition })
                            }
                          >
                            Clone
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </GlassCard>
          ))}
        </div>
      </main>

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
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
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
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
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
