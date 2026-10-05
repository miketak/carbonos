import { InputField, SelectField } from '../../../components/Field'
import { streamKindLabels } from '../format'
import type { SourceStream, StreamKind } from '../api'

const NEW_SOURCE = '__new__'

/** The emission source the form is about to create with the record (spec 04.10), as typed. */
export interface NewSourceDraft {
  name: string
  kind: StreamKind
  fuel: string
  meterOrSupplier: string
  contractorOperated: boolean
}

export const emptyNewSource: NewSourceDraft = {
  name: '',
  kind: 'STATIONARY_COMBUSTION',
  fuel: '',
  meterOrSupplier: '',
  contractorOperated: false,
}

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
  const patch = (changes: Partial<NewSourceDraft>) =>
    onNewSourceChange({ ...(newSource ?? emptyNewSource), ...changes })

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
          <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
            <InputField
              label="Source name *"
              placeholder="Standby gensets"
              value={newSource.name}
              onChange={(event) => patch({ name: event.target.value })}
              error={nameError}
              required
            />
            <SelectField
              label="Kind"
              value={newSource.kind}
              onChange={(event) => patch({ kind: event.target.value as StreamKind })}
            >
              {Object.entries(streamKindLabels).map(([kind, label]) => (
                <option key={kind} value={kind}>
                  {label}
                </option>
              ))}
            </SelectField>
            <InputField
              label="Fuel or material (optional)"
              placeholder="Diesel"
              value={newSource.fuel}
              onChange={(event) => patch({ fuel: event.target.value })}
            />
            <InputField
              label="Meter or supplier (optional)"
              placeholder="Bulk tank dip, ECG account 1234"
              value={newSource.meterOrSupplier}
              onChange={(event) => patch({ meterOrSupplier: event.target.value })}
            />
          </div>
          <label className="flex min-h-11 items-center gap-2.5 text-[15px]">
            <input
              type="checkbox"
              checked={newSource.contractorOperated}
              onChange={(event) => patch({ contractorOperated: event.target.checked })}
              className="size-[18px] accent-primary"
            />
            Operated by a contractor (its emissions default to scope 3)
          </label>
        </fieldset>
      )}
    </>
  )
}
