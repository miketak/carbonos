import { SelectField } from '../../../components/Field'
import type { SourceStream } from '../api'
import { emptyNewSource, NewSourceFields } from './NewSourceFields'
import type { NewSourceDraft } from './NewSourceFields'

export { emptyNewSource }
export type { NewSourceDraft }

const NEW_SOURCE = '__new__'

/**
 * The record's emission source (spec 04.10): the facility's sources, or
 * "New emission source…", which opens a panel under the select so the source
 * is described where the invoice is in hand and saved with the record. Any
 * other choice closes the panel.
 */
export function EmissionSourceField({
  facilityName,
  streams,
  value,
  newSource,
  canCreate,
  error,
  nameError,
  onChange,
  onNewSourceChange,
}: {
  facilityName?: string
  streams: SourceStream[]
  /** The chosen source's id, or '' for none. */
  value: string
  /** The panel's draft, or null while the panel is closed. */
  newSource: NewSourceDraft | null
  canCreate: boolean
  error?: string
  nameError?: string
  onChange: (streamId: string) => void
  onNewSourceChange: (draft: NewSourceDraft | null) => void
}) {
  return (
    <>
      <SelectField
        label="Emission source"
        value={newSource ? NEW_SOURCE : value}
        error={error}
        onChange={(event) => {
          const next = event.target.value
          if (next === NEW_SOURCE) {
            onChange('')
            onNewSourceChange({ ...emptyNewSource })
          } else {
            onNewSourceChange(null)
            onChange(next)
          }
        }}
      >
        <option value="">No emission source</option>
        {streams.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
        {canCreate && <option value={NEW_SOURCE}>New emission source…</option>}
      </SelectField>
      {newSource && (
        <fieldset className="flex flex-col gap-4 rounded-lg border border-hairline bg-surface-sunken p-4 md:col-span-2">
          <legend className="px-1 text-[13px] font-medium">New emission source</legend>
          <p className="text-[13px] text-ink-muted">
            Added to {facilityName ?? 'the facility'} when the record is saved. The kind fixes the
            categories its records can be classified into; the emission factor is chosen in each
            inventory's review.
          </p>
          <NewSourceFields draft={newSource} nameError={nameError} onChange={onNewSourceChange} />
        </fieldset>
      )}
    </>
  )
}
