import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField } from '../../../components/Field'
import { useToast } from '../../../components/toast'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { evidenceDownloadUrl } from '../api'
import type { EvidenceOwner } from '../api'
import {
  useAddEvidenceLink,
  useDeleteEvidence,
  useEvidenceQuery,
  useUploadEvidence,
} from '../useGhg'

export function formatSize(bytes: number | null): string {
  if (bytes === null) return ''
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`
  return `${bytes} B`
}

/**
 * The evidence behind a record or an instrument (spec 04.4): files kept in
 * the object store and links to a document system, so a verifier's sample
 * traces from a line to the primary document without a chase. Rendered in
 * the evidence modal and on the drawer's Evidence tab (spec 04.6).
 */
export function EvidencePanel({
  owner,
  organizationId,
  editable,
}: {
  owner: EvidenceOwner
  organizationId: string
  editable: boolean
}) {
  const evidenceQuery = useEvidenceQuery(owner)
  const upload = useUploadEvidence(owner, organizationId)
  const addLink = useAddEvidenceLink(owner, organizationId)
  const remove = useDeleteEvidence(owner, organizationId)
  const toast = useToast()
  const [linkName, setLinkName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const uploadErrors = fieldErrors(upload.error)
  const linkErrors = fieldErrors(addLink.error)

  const submitLink = (event: FormEvent) => {
    event.preventDefault()
    addLink.mutate(
      { name: linkName.trim() === '' ? undefined : linkName.trim(), url: linkUrl.trim() },
      {
        onSuccess: () => {
          setLinkName('')
          setLinkUrl('')
          toast('Link attached.')
        },
      },
    )
  }

  return (
    <div>
      <p className="text-sm text-ink-muted">
        Invoices, meter photos, registers and certificates. Files print on the run's lines and in
        the calculation file; a link opens the document where it lives.
      </p>
      {evidenceQuery.data && evidenceQuery.data.length === 0 && (
        <p className="mt-3 text-sm text-ink-muted">No evidence attached yet.</p>
      )}
      {evidenceQuery.data && evidenceQuery.data.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2 text-sm">
          {evidenceQuery.data.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2">
              <span className="min-w-0">
                {item.kind === 'FILE' ? (
                  <a
                    href={evidenceDownloadUrl(item.id)}
                    className="font-semibold text-link hover:underline"
                    download
                  >
                    {item.name}
                  </a>
                ) : (
                  <a
                    href={item.url ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-link hover:underline"
                  >
                    {item.name}
                  </a>
                )}
                <span className="block text-xs text-ink-muted">
                  {item.kind === 'FILE' ? `file, ${formatSize(item.sizeBytes)}` : 'link'} ·{' '}
                  {item.uploadedBy}, {new Date(item.uploadedAt).toLocaleDateString()}
                </span>
              </span>
              {editable && (
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  className="text-xs text-red-600 hover:underline"
                  onClick={() =>
                    remove.mutate(item.id, {
                      onError: (error) =>
                        toast(problemDetail(error) ?? 'Could not remove the evidence.', 'error'),
                    })
                  }
                >
                  remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {editable && (
        <div className="mt-4 flex flex-col gap-3 border-t border-teal/10 pt-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Attach a file
            <input
              type="file"
              aria-label="Attach a file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.xlsx,.xls,.txt,.docx"
              className="text-sm font-normal"
              disabled={upload.isPending}
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (!file) return
                upload.mutate(file, {
                  onSuccess: () => toast(`${file.name} attached.`),
                  onError: (error) =>
                    toast(problemDetail(error) ?? 'Could not attach the file.', 'error'),
                })
                event.target.value = ''
              }}
            />
            <span className="text-xs font-normal text-ink-muted">
              {uploadErrors?.file ?? 'PDF, image, spreadsheet or text, up to 20 MB.'}
            </span>
          </label>
          <form
            onSubmit={submitLink}
            className="grid gap-2 md:grid-cols-[1fr_1fr_auto] md:items-end"
          >
            <InputField
              label="Link name"
              placeholder="Fuel register"
              value={linkName}
              onChange={(event) => setLinkName(event.target.value)}
            />
            <InputField
              label="URL"
              placeholder="https://"
              value={linkUrl}
              error={linkErrors?.url}
              onChange={(event) => setLinkUrl(event.target.value)}
              required
            />
            <Button
              type="submit"
              variant="ghost"
              className="px-3 py-1.5 text-sm"
              disabled={linkUrl.trim() === ''}
              busy={addLink.isPending}
            >
              Add link
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
