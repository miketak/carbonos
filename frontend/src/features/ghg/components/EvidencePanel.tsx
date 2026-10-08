import { useDateFormat } from '../../../lib/dates'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField } from '../../../components/Field'
import { useToast } from '../../../components/toast'
import { fieldErrors, refusalMessage } from '../../../lib/api'
import { evidenceDownloadUrl } from '../api'
import { formatDateTime } from '../format'
import { WRITE_TOOLTIP } from '../roles'
import type { MyRole } from '../roles'
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

function FileIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-ink-muted"
    >
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
    </svg>
  )
}

/**
 * The evidence behind a record or an instrument (spec 04.4): files kept in
 * the object store and links to a document system, so a verifier's sample
 * traces from a line to the primary document without a chase. Rendered in
 * the evidence modal and on the record detail's Evidence tab (spec 04.6).
 */
export function EvidencePanel({
  owner,
  organizationId,
  editable,
  myRole,
}: {
  owner: EvidenceOwner
  organizationId: string
  editable: boolean
  myRole?: MyRole
}) {
  const dateFormat = useDateFormat()
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
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ink-muted">
        Invoices, meter photos, registers and certificates. Files print on the run's lines and in
        the calculation file; a link opens the document where it lives.
      </p>
      {evidenceQuery.data && evidenceQuery.data.length === 0 && (
        <p className="rounded-lg border border-dashed border-hairline-strong px-6 py-8 text-center text-sm text-ink-muted">
          No evidence attached yet.
        </p>
      )}
      {evidenceQuery.data && evidenceQuery.data.length > 0 && (
        <ul className="flex flex-col gap-2 text-sm">
          {evidenceQuery.data.map((item) => (
            <li
              key={item.id}
              className="flex min-h-[52px] items-center gap-3 rounded-lg border border-hairline px-3.5 py-2"
            >
              <FileIcon />
              <span className="min-w-0 flex-1">
                {item.kind === 'FILE' ? (
                  <a
                    href={evidenceDownloadUrl(item.id)}
                    className="font-medium text-link hover:underline"
                    download
                  >
                    {item.name}
                  </a>
                ) : (
                  <a
                    href={item.url ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-link hover:underline"
                  >
                    {item.name}
                  </a>
                )}
                <span className="block text-[13px] text-ink-muted">
                  {item.kind === 'FILE' ? `file, ${formatSize(item.sizeBytes)}` : 'link'} ·{' '}
                  {item.uploadedBy}, {formatDateTime(item.uploadedAt, dateFormat)}
                </span>
              </span>
              {editable ? (
                <button
                  type="button"
                  aria-label={`Remove ${item.name}`}
                  className="text-[13px] font-medium text-link hover:underline"
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
                    className="text-[13px] font-medium text-link opacity-50"
                    disabled
                    title={WRITE_TOOLTIP}
                    aria-describedby={`evidence-role-${item.id}`}
                  >
                    remove
                  </button>
                  <span id={`evidence-role-${item.id}`} className="sr-only">
                    {WRITE_TOOLTIP}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {editable && (
        <div className="flex flex-col gap-5 border-t border-hairline pt-5">
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
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
                  onError: (error) => toast(refusalMessage(error, myRole), 'error'),
                })
                event.target.value = ''
              }}
            />
            <span className="text-[13px] font-normal text-ink-muted">
              {uploadErrors?.file ?? 'PDF, image, spreadsheet or text, up to 20 MB.'}
            </span>
          </label>
          <form onSubmit={submitLink} className="grid gap-x-6 gap-y-5 md:grid-cols-2">
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
            <div className="flex justify-end md:col-span-2">
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                disabled={linkUrl.trim() === ''}
                busy={addLink.isPending}
              >
                Add link
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
