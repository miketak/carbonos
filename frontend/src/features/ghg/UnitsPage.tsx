import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField, SelectField } from '../../components/Field'
import { GlassCard } from '../../components/GlassCard'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { fieldErrors, problemDetail } from '../../lib/api'
import { groupUnits } from './units'
import {
  useCreateCustomUnit,
  useCreateDensity,
  useCustomUnitsQuery,
  useDeleteCustomUnit,
  useDeleteDensity,
  useDensitiesQuery,
  useUnitsQuery,
} from './useGhg'

/**
 * The organization's units (spec 02.2): custom units defined as multiples of
 * a registered unit ("1 drum = 200 litre"), and densities that let a record
 * in mass drive a factor per litre and the other way round. Shared typical
 * densities are planning values; the gate warns until a supplier's figure
 * replaces them.
 */
export function UnitsPage() {
  const { organizationId = '' } = useParams()
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl">Units and densities</h1>
        <p className="text-sm text-ink-muted">
          Records are kept in the unit they arrive in. A custom unit converts like the registered
          unit it is a multiple of; a density bridges mass and volume. Every run line prints the
          conversion it applied.
        </p>
      </div>
      <CustomUnitsCard organizationId={organizationId} />
      <DensitiesCard organizationId={organizationId} />
    </section>
  )
}

function CustomUnitsCard({ organizationId }: { organizationId: string }) {
  const customUnitsQuery = useCustomUnitsQuery(organizationId)
  const unitsQuery = useUnitsQuery()
  const create = useCreateCustomUnit(organizationId)
  const remove = useDeleteCustomUnit(organizationId)
  const toast = useToast()
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [baseUnit, setBaseUnit] = useState('litre')
  const [factor, setFactor] = useState('')
  const errors = fieldErrors(create.error)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate(
      { code: code.trim(), label: label.trim(), baseUnit, factor: Number(factor) },
      {
        onSuccess: (unit) => {
          setCode('')
          setLabel('')
          setFactor('')
          toast(`${unit.definition} defined.`)
        },
        onError: (error) => {
          if (!fieldErrors(error))
            toast(problemDetail(error) ?? 'Could not define the unit.', 'error')
        },
      },
    )
  }

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl">Custom units</h2>
      <p className="text-sm text-ink-muted">
        A drum, a bag, a truckload: define it as a multiple of a registered unit and records in it
        convert like any other.
      </p>
      {customUnitsQuery.isPending && (
        <div aria-label="Loading custom units" className="mt-4">
          <Skeleton className="h-10" />
        </div>
      )}
      {customUnitsQuery.data && customUnitsQuery.data.length > 0 && (
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
              <th className="px-3 py-2 font-semibold">Unit</th>
              <th className="px-3 py-2 font-semibold">Definition</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {customUnitsQuery.data.map((unit) => (
              <tr key={unit.id} className="border-b border-teal/5 last:border-0">
                <td className="px-3 py-2">
                  <span className="font-medium">{unit.code}</span>
                  <span className="block text-xs text-ink-muted">{unit.label}</span>
                </td>
                <td className="px-3 py-2 tabular-nums">{unit.definition}</td>
                <td className="px-3 py-2 text-right">
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    onClick={() =>
                      remove.mutate(unit.id, {
                        onSuccess: () => toast(`${unit.code} deleted.`),
                        onError: (error) =>
                          toast(problemDetail(error) ?? 'Could not delete the unit.', 'error'),
                      })
                    }
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-5 md:items-end">
        <InputField
          label="Code"
          placeholder="drum"
          value={code}
          maxLength={30}
          error={errors?.code}
          onChange={(event) => setCode(event.target.value)}
          required
        />
        <InputField
          label="Label"
          placeholder="Drum (200 L)"
          value={label}
          error={errors?.label}
          onChange={(event) => setLabel(event.target.value)}
          required
        />
        <InputField
          label="One unit equals"
          type="number"
          min="0.000001"
          step="any"
          placeholder="200"
          value={factor}
          error={errors?.factor}
          onChange={(event) => setFactor(event.target.value)}
          required
        />
        <SelectField
          label="Of"
          value={baseUnit}
          error={errors?.baseUnit}
          onChange={(event) => setBaseUnit(event.target.value)}
        >
          {groupUnits(unitsQuery.data ?? []).map((group) => (
            <optgroup key={group.dimension} label={group.label}>
              {group.units.map((unit) => (
                <option key={unit.code} value={unit.code}>
                  {unit.label} ({unit.code})
                </option>
              ))}
            </optgroup>
          ))}
        </SelectField>
        <Button
          type="submit"
          className="px-4 py-1.5 text-sm"
          busy={create.isPending}
          disabled={code.trim() === '' || label.trim() === '' || Number(factor) <= 0}
        >
          Define unit
        </Button>
      </form>
    </GlassCard>
  )
}

function DensitiesCard({ organizationId }: { organizationId: string }) {
  const densitiesQuery = useDensitiesQuery(organizationId)
  const create = useCreateDensity(organizationId)
  const remove = useDeleteDensity(organizationId)
  const toast = useToast()
  const [material, setMaterial] = useState('')
  const [kgPerLitre, setKgPerLitre] = useState('')
  const [source, setSource] = useState('')
  const [note, setNote] = useState('')
  const errors = fieldErrors(create.error)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate(
      {
        material: material.trim(),
        kgPerLitre: Number(kgPerLitre),
        source: source.trim(),
        note: note.trim() === '' ? undefined : note.trim(),
      },
      {
        onSuccess: (density) => {
          setMaterial('')
          setKgPerLitre('')
          setSource('')
          setNote('')
          toast(`Density of ${density.material} recorded.`)
        },
        onError: (error) => {
          if (!fieldErrors(error))
            toast(problemDetail(error) ?? 'Could not record the density.', 'error')
        },
      },
    )
  }

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl">Densities</h2>
      <p className="text-sm text-ink-muted">
        Fuel is often invoiced by mass and its factor published per litre. A density converts
        between them; the line prints the arithmetic. Typical values are for planning: the gate
        warns until the supplier's certificate of analysis replaces them.
      </p>
      {densitiesQuery.isPending && (
        <div aria-label="Loading densities" className="mt-4">
          <Skeleton className="h-10" />
        </div>
      )}
      {densitiesQuery.data && densitiesQuery.data.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                <th className="px-3 py-2 font-semibold">Material</th>
                <th className="px-3 py-2 font-semibold">kg per litre</th>
                <th className="px-3 py-2 font-semibold">Source</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {densitiesQuery.data.map((density) => (
                <tr key={density.id} className="border-b border-teal/5 last:border-0">
                  <td className="px-3 py-2">
                    <span className="font-medium">{density.material}</span>
                    {density.typical && (
                      <span className="ml-2 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        Typical value
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{density.kgPerLitre}</td>
                  <td className="px-3 py-2 text-xs text-ink-muted">
                    {density.source}
                    {density.note && <span className="block">{density.note}</span>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {!density.typical && (
                      <Button
                        variant="ghost"
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        onClick={() =>
                          remove.mutate(density.id, {
                            onSuccess: () => toast(`Density of ${density.material} deleted.`),
                            onError: (error) =>
                              toast(
                                problemDetail(error) ?? 'Could not delete the density.',
                                'error',
                              ),
                          })
                        }
                      >
                        Delete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-5 md:items-end">
        <InputField
          label="Material"
          placeholder="Diesel (GOIL, 2025 CoA)"
          value={material}
          error={errors?.material}
          onChange={(event) => setMaterial(event.target.value)}
          required
        />
        <InputField
          label="kg per litre"
          type="number"
          min="0.00001"
          step="any"
          placeholder="0.8325"
          value={kgPerLitre}
          error={errors?.kgPerLitre}
          onChange={(event) => setKgPerLitre(event.target.value)}
          required
        />
        <InputField
          label="Source"
          placeholder="Supplier certificate of analysis, batch 2025-03"
          value={source}
          error={errors?.source}
          onChange={(event) => setSource(event.target.value)}
          required
        />
        <InputField
          label="Note (optional)"
          value={note}
          error={errors?.note}
          onChange={(event) => setNote(event.target.value)}
        />
        <Button
          type="submit"
          className="px-4 py-1.5 text-sm"
          busy={create.isPending}
          disabled={material.trim() === '' || Number(kgPerLitre) <= 0 || source.trim() === ''}
        >
          Record density
        </Button>
      </form>
    </GlassCard>
  )
}
