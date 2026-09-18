import { useState } from 'react'
import { Button } from '../../../components/Button'
import { InputField, TextAreaField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'
import { fieldErrors, refusalMessage } from '../../../lib/api'
import { usePublishFactorPackEdition, useUploadFactorPackEvidence } from '../useFactorPacks'
import type { FactorPackEdition, FactorPackFinding } from '../api'

interface PublishEditionDialogProps {
  edition: FactorPackEdition
  /** The live validation report: publication is refused while any of it stands. */
  findings: FactorPackFinding[]
  onClose: () => void
  onPublished: (message: string) => void
  onOpenBlastRadius: () => void
}

/**
 * The publication gate (spec 02.5). Publishing an edition is one act with one
 * record, so the dialog shows every condition at once: every rule passing, the
 * source document stored with its SHA-256, the document named as a verifier
 * would cite it, the date it applies from, and an approver who is not the
 * curator.
 *
 * <p>Publishing moves no organization's numbers. It raises one notice per
 * holder, and each organization decides for itself whether to adopt the
 * edition (spec 02.7). The dialog says so, because a maintainer who believes
 * otherwise will publish differently.
 */
export function PublishEditionDialog({
  edition,
  findings,
  onClose,
  onPublished,
  onOpenBlastRadius,
}: PublishEditionDialogProps) {
  const upload = useUploadFactorPackEvidence()
  const publish = usePublishFactorPackEdition()
  const [sourceDocument, setSourceDocument] = useState(edition.sourceDocument ?? edition.source)
  const [appliesFrom, setAppliesFrom] = useState(edition.appliesFrom ?? '')
  const [erratum, setErratum] = useState(edition.erratum)
  const [erratumNote, setErratumNote] = useState(edition.erratumNote ?? '')
  const [checksum, setChecksum] = useState(edition.evidenceChecksum)
  const [evidenceName, setEvidenceName] = useState(edition.evidenceName)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [refusal, setRefusal] = useState<string | null>(null)

  const rulesPass = findings.length === 0
  const dated = appliesFrom !== ''
  const ready = rulesPass && checksum !== null && dated

  return (
    <Modal title={`Publish ${edition.editionId}`} onClose={onClose}>
      <p className="text-sm text-ink-muted">
        Publishing freezes the edition and its {edition.rowCount.toLocaleString()} rows for good and
        computes the change log against the predecessor. It moves no organization&apos;s numbers:
        each holder gets one notice and decides for itself whether to adopt the edition.
      </p>

      <ul className="mt-4 flex flex-col gap-2 text-sm">
        <GateItem met={rulesPass}>
          {rulesPass
            ? 'Every publication rule passes.'
            : `${findings.length} ${findings.length === 1 ? 'row breaks' : 'rows break'} a rule. Each is a hard failure, never a warning, because a published edition is a citation.`}
        </GateItem>
        <GateItem met={checksum !== null}>
          {checksum === null
            ? 'No source document yet. Upload the publication this edition was transcribed from.'
            : `${evidenceName ?? 'The source document'} is on file.`}
        </GateItem>
        <GateItem met={dated}>
          {dated
            ? `The edition applies from ${appliesFrom}, the vintage boundary an adoption is run from.`
            : 'Give the date the edition applies from. It is the vintage boundary an adoption is run from.'}
        </GateItem>
        <GateItem met>
          The approver must not be the curator. {edition.curator ?? 'Somebody else'} built this
          draft, so somebody else publishes it.
        </GateItem>
      </ul>

      <div className="mt-4">
        <label
          htmlFor="evidence-file"
          className="block text-xs font-semibold tracking-wide text-ink-muted uppercase"
        >
          Source document
        </label>
        <input
          id="evidence-file"
          type="file"
          className="mt-1 block w-full text-sm"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            setRefusal(null)
            upload.mutate(
              { editionId: edition.editionId, file },
              {
                onSuccess: (stored) => {
                  setChecksum(stored.checksum)
                  setEvidenceName(stored.name)
                },
                onError: (failure) => setRefusal(refusalMessage(failure)),
              },
            )
          }}
        />
        {checksum && (
          <p className="mt-2 text-xs text-ink-muted">
            SHA-256{' '}
            <code data-testid="evidence-checksum" className="font-mono break-all">
              {checksum}
            </code>
            , computed over the bytes stored.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <InputField
          label="Source document as cited"
          value={sourceDocument}
          error={errors.sourceDocument}
          onChange={(event) => setSourceDocument(event.target.value)}
        />
        <InputField
          label="Applies from"
          type="date"
          value={appliesFrom}
          error={errors.appliesFrom}
          onChange={(event) => setAppliesFrom(event.target.value)}
        />
      </div>

      <label className="mt-4 flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={erratum}
          onChange={(event) => setErratum(event.target.checked)}
        />
        <span>
          This edition is an erratum. Publishing it marks{' '}
          {edition.supersedesId ?? 'the predecessor'} as holding an error; its wrong values are
          never edited, because reports already rest on them.
        </span>
      </label>
      {erratum && (
        <div className="mt-3">
          <TextAreaField
            label="What was wrong"
            value={erratumNote}
            error={errors.erratumNote}
            onChange={(event) => setErratumNote(event.target.value)}
          />
        </div>
      )}

      {refusal && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          {refusal}
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onOpenBlastRadius}>
          Read the blast radius
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!ready}
          busy={publish.isPending}
          onClick={() => {
            setErrors({})
            setRefusal(null)
            publish.mutate(
              {
                editionId: edition.editionId,
                input: {
                  sourceDocument: sourceDocument.trim(),
                  appliesFrom,
                  erratum,
                  erratumNote: erratum ? erratumNote.trim() : null,
                },
              },
              {
                onSuccess: () => onPublished(`${edition.editionId} was published.`),
                onError: (failure) => {
                  const fields = fieldErrors(failure)
                  if (fields) setErrors(fields)
                  else setRefusal(refusalMessage(failure))
                },
              },
            )
          }}
        >
          Publish
        </Button>
      </div>
    </Modal>
  )
}

function GateItem({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span aria-hidden="true" className={met ? 'text-bright-teal' : 'text-red-600'}>
        {met ? '✓' : '✕'}
      </span>
      <span className="sr-only">{met ? 'Met: ' : 'Not met: '}</span>
      <span className={met ? 'text-ink-muted' : 'font-medium text-red-600'}>{children}</span>
    </li>
  )
}
