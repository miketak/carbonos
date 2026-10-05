import { useState } from 'react'
import { Banner } from '../../../components/Banner'
import { Button } from '../../../components/Button'
import { InputField, SelectField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'
import type { BulkRefusedRecord, SourceStream } from '../api'
import { tierLabels } from '../format'

/** The records a refused bulk act named, under the act's dialog (spec 04.11): nothing was changed. */
export function BulkRefusedList({
  refused,
  detail,
}: {
  refused: BulkRefusedRecord[]
  detail?: string
}) {
  return (
    <Banner role="alert" tone="danger" title={detail ?? 'Nothing was changed.'}>
      <ul className="mt-1 flex flex-col gap-0.5 text-[13px]">
        {refused.map((record) => (
          <li key={record.id}>
            <span className="font-semibold">{record.recordRef}:</span> {record.message}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[13px]">Deselect them and try again.</p>
    </Banner>
  )
}

function ReasonField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <InputField
      label="Reason"
      placeholder="Why, for the audit trail of every record"
      value={value}
      minLength={5}
      maxLength={500}
      required
      onChange={(event) => onChange(event.target.value)}
      hint="At least 5 characters. Each record's history carries it, and the organization's history names the act once."
    />
  )
}

function Footer({
  count,
  action,
  disabled,
  busy,
  onClose,
  onConfirm,
}: {
  count: number
  action: string
  disabled: boolean
  busy: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 border-t border-hairline pt-5">
      <span className="text-[13px] text-ink-muted">
        Applies to {count} record{count === 1 ? '' : 's'}.
      </span>
      <span className="flex gap-3">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" disabled={disabled} busy={busy} onClick={onConfirm}>
          {action}
        </Button>
      </span>
    </div>
  )
}

/** Assigns one emission source to records that have none (spec 04.11): a fill, never a move. */
export function BulkAssignSourceDialog({
  count,
  facilityName,
  streams,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  count: number
  facilityName: string
  streams: SourceStream[]
  busy: boolean
  error?: React.ReactNode
  onClose: () => void
  onConfirm: (streamId: string, reason: string) => void
}) {
  const [streamId, setStreamId] = useState('')
  const [reason, setReason] = useState('')
  return (
    <Modal
      title={`Assign an emission source to ${count} record${count === 1 ? '' : 's'}`}
      onClose={onClose}
    >
      <p className="text-sm text-ink-muted">
        The selected records at {facilityName} have no emission source. Each one is corrected with
        this reason; a record that already has a source is changed on the record itself.
      </p>
      <div className="mt-4 flex flex-col gap-4">
        <SelectField
          label="Emission source"
          value={streamId}
          onChange={(event) => setStreamId(event.target.value)}
        >
          <option value="">Choose a source</option>
          {streams.map((stream) => (
            <option key={stream.id} value={stream.id}>
              {stream.name}
            </option>
          ))}
        </SelectField>
        <ReasonField value={reason} onChange={setReason} />
        {error}
      </div>
      <Footer
        count={count}
        action="Assign"
        disabled={streamId === '' || reason.trim().length < 5}
        busy={busy}
        onClose={onClose}
        onConfirm={() => onConfirm(streamId, reason.trim())}
      />
    </Modal>
  )
}

/** Sets one data quality tier on the selected records (spec 04.11). */
export function BulkTierDialog({
  count,
  kinds,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  count: number
  /** The kinds of emission source among the selected records, for the warning when there is more than one. */
  kinds: number
  busy: boolean
  error?: React.ReactNode
  onClose: () => void
  onConfirm: (tier: number, reason: string) => void
}) {
  const [tier, setTier] = useState('')
  const [reason, setReason] = useState('')
  return (
    <Modal
      title={`Set the data quality tier on ${count} record${count === 1 ? '' : 's'}`}
      onClose={onClose}
    >
      <p className="text-sm text-ink-muted">
        A record already at this tier is left as it is. The others are corrected with this reason.
      </p>
      {kinds > 1 && (
        <div className="mt-3">
          <Banner
            tone="warning"
            title={`The selected records are of ${kinds} kinds of emission source; a tier is assessed per source and method.`}
          />
        </div>
      )}
      <div className="mt-4 flex flex-col gap-4">
        <SelectField
          label="Data quality tier"
          value={tier}
          onChange={(event) => setTier(event.target.value)}
        >
          <option value="">Choose a tier</option>
          {Object.entries(tierLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {value}: {label}
            </option>
          ))}
        </SelectField>
        <ReasonField value={reason} onChange={setReason} />
        {error}
      </div>
      <Footer
        count={count}
        action="Set tier"
        disabled={tier === '' || reason.trim().length < 5}
        busy={busy}
        onClose={onClose}
        onConfirm={() => onConfirm(Number(tier), reason.trim())}
      />
    </Modal>
  )
}

/** Attaches the same link to each selected record (spec 04.11): one invoice, many lines. */
export function BulkLinkDialog({
  count,
  busy,
  error,
  linkError,
  onClose,
  onConfirm,
}: {
  count: number
  busy: boolean
  error?: React.ReactNode
  linkError?: string
  onClose: () => void
  onConfirm: (link: { name?: string; url: string }, reason: string) => void
}) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [reason, setReason] = useState('')
  return (
    <Modal
      title={`Add an evidence link to ${count} record${count === 1 ? '' : 's'}`}
      onClose={onClose}
    >
      <p className="text-sm text-ink-muted">
        The same link lands on each selected record, as one invoice stands behind several lines.
      </p>
      <div className="mt-4 flex flex-col gap-4">
        <InputField
          label="Link name"
          placeholder="INV-2938"
          value={name}
          maxLength={255}
          onChange={(event) => setName(event.target.value)}
        />
        <InputField
          label="URL"
          placeholder="https://drive.example.com/invoices/2938"
          value={url}
          maxLength={1000}
          required
          onChange={(event) => setUrl(event.target.value)}
          error={linkError}
        />
        <ReasonField value={reason} onChange={setReason} />
        {error}
      </div>
      <Footer
        count={count}
        action="Add link"
        disabled={url.trim() === '' || reason.trim().length < 5}
        busy={busy}
        onClose={onClose}
        onConfirm={() =>
          onConfirm(
            { name: name.trim() === '' ? undefined : name.trim(), url: url.trim() },
            reason.trim(),
          )
        }
      />
    </Modal>
  )
}
