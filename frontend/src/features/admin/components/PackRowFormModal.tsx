import { useState } from 'react'
import { Button } from '../../../components/Button'
import { InputField, SelectField, TextAreaField } from '../../../components/Field'
import { Modal } from '../../../components/Modal'
import { fieldErrors, refusalMessage } from '../../../lib/api'
import { useCreateFactorPackRow, useUpdateFactorPackRow } from '../useFactorPacks'
import type { FactorPackRow, ReportingBasis, RowInput, Scope } from '../api'

/** The Standard's scope 1 kinds, the two scope 2 kinds, and the fifteen scope 3 categories. */
const categories: Record<Scope, string[]> = {
  SCOPE_1: [
    'STATIONARY_COMBUSTION',
    'MOBILE_COMBUSTION',
    'PROCESS_EMISSIONS',
    'FUGITIVE_EMISSIONS',
  ],
  SCOPE_2: ['PURCHASED_ELECTRICITY', 'PURCHASED_HEAT_STEAM', 'PURCHASED_COOLING'],
  SCOPE_3: [
    'PURCHASED_GOODS_SERVICES',
    'CAPITAL_GOODS',
    'FUEL_ENERGY_RELATED',
    'UPSTREAM_TRANSPORT',
    'WASTE_GENERATED',
    'BUSINESS_TRAVEL',
    'EMPLOYEE_COMMUTING',
    'UPSTREAM_LEASED_ASSETS',
    'DOWNSTREAM_TRANSPORT',
    'PROCESSING_SOLD_PRODUCTS',
    'USE_SOLD_PRODUCTS',
    'END_OF_LIFE_SOLD_PRODUCTS',
    'DOWNSTREAM_LEASED_ASSETS',
    'FRANCHISES',
    'INVESTMENTS',
  ],
}

/** The gases a row may state, each held apart from the CO2e total it sums to. */
const gases = [
  { key: 'co2KgPerUnit', label: 'CO2 (kg per unit)' },
  { key: 'ch4KgPerUnit', label: 'CH4 (kg per unit)' },
  { key: 'n2oKgPerUnit', label: 'N2O (kg per unit)' },
  { key: 'hfcsKgPerUnit', label: 'HFCs (kg per unit)' },
  { key: 'pfcsKgPerUnit', label: 'PFCs (kg per unit)' },
  { key: 'sf6KgPerUnit', label: 'SF6 (kg per unit)' },
  { key: 'nf3KgPerUnit', label: 'NF3 (kg per unit)' },
  { key: 'biogenicCo2KgPerUnit', label: 'Biogenic CO2 (kg per unit)' },
] as const

type GasKey = (typeof gases)[number]['key']

type Text = Record<string, string>

function initialText(row: FactorPackRow | null): Text {
  const number = (value: number | null | undefined) =>
    value === null || value === undefined ? '' : String(value)
  return {
    code: row?.code ?? '',
    name: row?.name ?? '',
    unit: row?.unit ?? '',
    kgCo2ePerUnit: number(row?.kgCo2ePerUnit),
    co2KgPerUnit: number(row?.co2KgPerUnit),
    ch4KgPerUnit: number(row?.ch4KgPerUnit),
    n2oKgPerUnit: number(row?.n2oKgPerUnit),
    hfcsKgPerUnit: number(row?.hfcsKgPerUnit),
    pfcsKgPerUnit: number(row?.pfcsKgPerUnit),
    sf6KgPerUnit: number(row?.sf6KgPerUnit),
    nf3KgPerUnit: number(row?.nf3KgPerUnit),
    biogenicCo2KgPerUnit: number(row?.biogenicCo2KgPerUnit),
    blendComposition: row?.blendComposition ?? '',
    blendGwpSource: row?.blendGwpSource ?? '',
    dataYear: number(row?.dataYear),
    sourcePublication: row?.sourcePublication ?? '',
    sourceUrl: row?.sourceUrl ?? '',
    publicationYear: number(row?.publicationYear),
    sourceCategory: row?.sourceCategory ?? '',
    sourceActivity: row?.sourceActivity ?? '',
    sourceDetail: row?.sourceDetail ?? '',
    notes: row?.notes ?? '',
  }
}

/**
 * The row editor of the workbench (spec 02.5). Every gas is stated apart from
 * the CO2e total, and a field left empty stays null: the publication states
 * nothing about that gas, which is not the same as a stated zero. The
 * publisher's taxonomy is three fields, because 1,157 of the 1,868 DESNZ rows
 * share a display name and the parts are what tell two of them apart.
 */
export function PackRowFormModal({
  editionId,
  row,
  onClose,
  onSaved,
}: {
  editionId: string
  row: FactorPackRow | null
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const createRow = useCreateFactorPackRow()
  const updateRow = useUpdateFactorPackRow()
  const [text, setText] = useState<Text>(() => initialText(row))
  const [scope, setScope] = useState<Scope>(row?.defaultScope ?? 'SCOPE_1')
  const [category, setCategory] = useState(row?.defaultCategory ?? 'STATIONARY_COMBUSTION')
  const [scopeAgnostic, setScopeAgnostic] = useState(row?.scopeAgnostic ?? false)
  const [ch4Fossil, setCh4Fossil] = useState(row?.ch4Fossil ?? true)
  const [co2eOnly, setCo2eOnly] = useState(row?.co2eOnly ?? false)
  const [approved, setApproved] = useState(row?.approved ?? false)
  const [basis, setBasis] = useState<ReportingBasis>(row?.reportingBasis ?? 'SCOPES')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [refusal, setRefusal] = useState<string | null>(null)

  const set = (key: string) => (value: string) =>
    setText((current) => ({ ...current, [key]: value }))
  const numberOrNull = (key: string) => (text[key] === '' ? null : Number(text[key]))
  const textOrNull = (key: string) => (text[key].trim() === '' ? null : text[key].trim())

  const pending = createRow.isPending || updateRow.isPending

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    setErrors({})
    setRefusal(null)
    const input: RowInput = {
      code: text.code.trim(),
      name: text.name.trim(),
      defaultScope: scope,
      defaultCategory: category,
      scopeAgnostic,
      unit: text.unit.trim(),
      kgCo2ePerUnit: Number(text.kgCo2ePerUnit === '' ? 0 : text.kgCo2ePerUnit),
      co2KgPerUnit: numberOrNull('co2KgPerUnit'),
      ch4KgPerUnit: numberOrNull('ch4KgPerUnit'),
      ch4Fossil,
      n2oKgPerUnit: numberOrNull('n2oKgPerUnit'),
      hfcsKgPerUnit: numberOrNull('hfcsKgPerUnit'),
      pfcsKgPerUnit: numberOrNull('pfcsKgPerUnit'),
      sf6KgPerUnit: numberOrNull('sf6KgPerUnit'),
      nf3KgPerUnit: numberOrNull('nf3KgPerUnit'),
      biogenicCo2KgPerUnit: numberOrNull('biogenicCo2KgPerUnit'),
      blendComposition: textOrNull('blendComposition'),
      blendGwpSource: textOrNull('blendGwpSource'),
      dataYear: numberOrNull('dataYear'),
      sourcePublication: textOrNull('sourcePublication'),
      sourceUrl: textOrNull('sourceUrl'),
      publicationYear: numberOrNull('publicationYear'),
      sourceCategory: textOrNull('sourceCategory'),
      sourceActivity: textOrNull('sourceActivity'),
      sourceDetail: textOrNull('sourceDetail'),
      co2eOnly,
      approved,
      notes: textOrNull('notes'),
      reportingBasis: basis,
    }
    const onError = (failure: unknown) => {
      const fields = fieldErrors(failure)
      if (fields) setErrors(fields)
      else setRefusal(refusalMessage(failure))
    }
    if (row) {
      updateRow.mutate(
        { editionId, rowId: row.id, input },
        { onSuccess: () => onSaved(`${input.code} was saved.`), onError },
      )
    } else {
      createRow.mutate(
        { editionId, input },
        { onSuccess: () => onSaved(`${input.code} was added.`), onError },
      )
    }
  }

  return (
    <Modal title={row ? `Edit ${row.code}` : 'Add a row'} onClose={onClose} size="lg">
      <form noValidate onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Code"
            hint="Two or more colon-separated segments naming the publication and the row. It never changes once published."
            value={text.code}
            error={errors.code}
            onChange={(event) => set('code')(event.target.value)}
          />
          <InputField
            label="Name"
            value={text.name}
            error={errors.name}
            onChange={(event) => set('name')(event.target.value)}
          />
          <SelectField
            label="Default scope"
            value={scope}
            error={errors.defaultScope}
            onChange={(event) => {
              const next = event.target.value as Scope
              setScope(next)
              if (!categories[next].includes(category)) setCategory(categories[next][0])
            }}
          >
            <option value="SCOPE_1">Scope 1</option>
            <option value="SCOPE_2">Scope 2</option>
            <option value="SCOPE_3">Scope 3</option>
          </SelectField>
          <SelectField
            label="Default category"
            value={category}
            error={errors.defaultCategory}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories[scope].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Unit"
            hint="One the registry knows; free text is refused."
            value={text.unit}
            error={errors.unit}
            onChange={(event) => set('unit')(event.target.value)}
          />
          <InputField
            label="kg CO2e per unit"
            type="number"
            step="any"
            value={text.kgCo2ePerUnit}
            error={errors.kgCo2ePerUnit}
            onChange={(event) => set('kgCo2ePerUnit')(event.target.value)}
          />
        </div>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold">The gas split</legend>
          <p className="mt-1 text-xs text-ink-muted">
            Leave a gas empty where the publication states nothing about it: that is not the same as
            a stated zero. Where any component is stated, the sum under the edition's GWP basis must
            come to the CO2e above within one percent, and the biogenic CO2 sits beside the total,
            never inside it.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {gases.map((gas) => (
              <InputField
                key={gas.key}
                label={gas.label}
                type="number"
                step="any"
                value={text[gas.key as GasKey]}
                error={errors[gas.key]}
                onChange={(event) => set(gas.key)(event.target.value)}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={ch4Fossil}
                onChange={(event) => setCh4Fossil(event.target.checked)}
              />
              The methane is fossil in origin (fuel combustion, venting)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={co2eOnly}
                onChange={(event) => setCo2eOnly(event.target.checked)}
              />
              The row publishes a CO2e total with no gas split
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={scopeAgnostic}
                onChange={(event) => setScopeAgnostic(event.target.checked)}
              />
              The row is scope-agnostic: the accountant chooses the scope
            </label>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <InputField
              label="Blend composition"
              hint="As 'HFC-32:0.5,HFC-125:0.5'; a blend without one keeps the CO2e its source applied."
              value={text.blendComposition}
              error={errors.blendComposition}
              onChange={(event) => set('blendComposition')(event.target.value)}
            />
            <InputField
              label="Blend GWP source"
              value={text.blendGwpSource}
              error={errors.blendGwpSource}
              onChange={(event) => set('blendGwpSource')(event.target.value)}
            />
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold">Provenance and the publisher's taxonomy</legend>
          <p className="mt-1 text-xs text-ink-muted">
            The category, the activity and the detail are recorded apart, because concatenating them
            loses what tells two rows sharing a display name apart.
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <InputField
              label="Source publication"
              value={text.sourcePublication}
              error={errors.sourcePublication}
              onChange={(event) => set('sourcePublication')(event.target.value)}
            />
            <InputField
              label="Source URL"
              value={text.sourceUrl}
              error={errors.sourceUrl}
              onChange={(event) => set('sourceUrl')(event.target.value)}
            />
            <InputField
              label="Publication year"
              type="number"
              value={text.publicationYear}
              error={errors.publicationYear}
              onChange={(event) => set('publicationYear')(event.target.value)}
            />
            <InputField
              label="Data year"
              type="number"
              value={text.dataYear}
              error={errors.dataYear}
              onChange={(event) => set('dataYear')(event.target.value)}
            />
            <InputField
              label="Source category"
              value={text.sourceCategory}
              error={errors.sourceCategory}
              onChange={(event) => set('sourceCategory')(event.target.value)}
            />
            <InputField
              label="Source activity"
              value={text.sourceActivity}
              error={errors.sourceActivity}
              onChange={(event) => set('sourceActivity')(event.target.value)}
            />
          </div>
          <div className="mt-4">
            <InputField
              label="Source detail"
              value={text.sourceDetail}
              error={errors.sourceDetail}
              onChange={(event) => set('sourceDetail')(event.target.value)}
            />
          </div>
        </fieldset>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Reporting basis"
            hint="A Montreal Protocol gas is not a Kyoto gas: its mass is reported outside every scope."
            value={basis}
            error={errors.reportingBasis}
            onChange={(event) => setBasis(event.target.value as ReportingBasis)}
          >
            <option value="SCOPES">SCOPES: counted in the scopes</option>
            <option value="OUTSIDE_SCOPES_NON_KYOTO">
              OUTSIDE_SCOPES_NON_KYOTO: a Montreal Protocol gas
            </option>
          </SelectField>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={approved}
              onChange={(event) => setApproved(event.target.checked)}
            />
            Approved for use in a calculation
          </label>
        </div>
        <div className="mt-4">
          <TextAreaField
            label="Notes"
            value={text.notes}
            error={errors.notes}
            onChange={(event) => set('notes')(event.target.value)}
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
          <Button type="submit" busy={pending}>
            {row ? 'Save row' : 'Add row'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
