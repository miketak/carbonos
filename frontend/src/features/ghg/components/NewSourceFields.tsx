import { InputField, SelectField } from '../../../components/Field'
import { streamKindLabels } from '../format'
import type { StreamKind } from '../api'

/** The emission source a form is about to create (spec 04.10), as typed. */
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
 * The fields that describe a new emission source (spec 04.10): shared by the
 * activity form's panel and the import preview's decision card (spec 04.11),
 * so a source is described the same way wherever it is born.
 */
export function NewSourceFields({
  draft,
  nameError,
  onChange,
}: {
  draft: NewSourceDraft
  nameError?: string
  onChange: (draft: NewSourceDraft) => void
}) {
  const patch = (changes: Partial<NewSourceDraft>) => onChange({ ...draft, ...changes })
  return (
    <>
      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
        <InputField
          label="Source name *"
          placeholder="Standby gensets"
          value={draft.name}
          onChange={(event) => patch({ name: event.target.value })}
          error={nameError}
          required
        />
        <SelectField
          label="Kind"
          value={draft.kind}
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
          value={draft.fuel}
          onChange={(event) => patch({ fuel: event.target.value })}
        />
        <InputField
          label="Meter or supplier (optional)"
          placeholder="Bulk tank dip, ECG account 1234"
          value={draft.meterOrSupplier}
          onChange={(event) => patch({ meterOrSupplier: event.target.value })}
        />
      </div>
      <label className="flex min-h-11 items-center gap-2.5 text-[15px]">
        <input
          type="checkbox"
          checked={draft.contractorOperated}
          onChange={(event) => patch({ contractorOperated: event.target.checked })}
          className="size-[18px] accent-primary"
        />
        Operated by a contractor (its emissions default to scope 3)
      </label>
    </>
  )
}
