import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import { InputField, SelectField } from '../../components/Field'
import { PageHeader } from '../../components/PageHeader'
import { Panel, PanelBody, PanelHead } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { Table, Td, Th, TwoLine } from '../../components/Table'
import { useToast } from '../../components/toast'
import { fieldErrors, refusalMessage } from '../../lib/api'
import { RoleButton } from './components/RoleButton'
import { mayWrite, WRITE_TOOLTIP } from './roles'
import { groupUnits } from './units'
import {
  useCreateCustomUnit,
  useCreateDensity,
  useCustomUnitsQuery,
  useDeleteCustomUnit,
  useDeleteDensity,
  useDensitiesQuery,
  useOrganizationQuery,
  useUnitsQuery,
} from './useGhg'
import type { Organization } from './api'

/** The last row's rule would double the hairline over the add form, so the table drops it. */
const tableInPanel = '[&_tbody_tr:last-child_td]:border-b-0'

/**
 * The organization's units (spec 02.2): custom units defined as multiples of
 * a registered unit ("1 drum = 200 litre"), and densities that let a record
 * in mass drive a factor per litre and the other way round. Shared typical
 * densities are planning values; the gate warns until a supplier's figure
 * replaces them.
 */
export function UnitsPage() {
  const { organizationId = '' } = useParams()
  const organizationQuery = useOrganizationQuery(organizationId)
  const myRole = organizationQuery.data?.myRole ?? null
  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        back={{ to: `/app/ghg/${organizationId}` }}
        title="Units and densities"
        subtitle="Records are kept in the unit they arrive in. A custom unit converts like the registered unit it is a multiple of; a density bridges mass and volume. Every run line prints the conversion it applied."
      />
      <CustomUnitsCard organizationId={organizationId} myRole={myRole} />
      <DensitiesCard organizationId={organizationId} myRole={myRole} />
    </section>
  )
}

function CustomUnitsCard({
  organizationId,
  myRole,
}: {
  organizationId: string
  myRole: Organization['myRole']
}) {
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
  const generalError = create.isError && !errors ? refusalMessage(create.error, myRole) : undefined

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
      },
    )
  }

  return (
    <Panel role="region" aria-label="Custom units">
      <PanelHead
        title="Custom units"
        description="A drum, a bag, a truckload: define it as a multiple of a registered unit and records in it convert like any other."
      />
      {customUnitsQuery.isPending && (
        <PanelBody aria-label="Loading custom units">
          <Skeleton className="h-10" />
        </PanelBody>
      )}
      {customUnitsQuery.data && customUnitsQuery.data.length > 0 && (
        <Table className={tableInPanel}>
          <thead>
            <tr>
              <Th>Unit</Th>
              <Th>Definition</Th>
              <Th className="w-28" />
            </tr>
          </thead>
          <tbody>
            {customUnitsQuery.data.map((unit) => (
              <tr key={unit.id}>
                <Td>
                  <TwoLine primary={unit.code} secondary={unit.label} />
                </Td>
                <Td>{unit.definition}</Td>
                <Td align="right">
                  <RoleButton
                    allowed={mayWrite(myRole)}
                    tooltip={WRITE_TOOLTIP}
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      remove.mutate(unit.id, {
                        onSuccess: () => toast(`${unit.code} deleted.`),
                        onError: (error) => toast(refusalMessage(error, myRole), 'error'),
                      })
                    }
                  >
                    Delete
                  </RoleButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {mayWrite(myRole) && (
        <form
          onSubmit={submit}
          className="grid gap-3 border-t border-hairline p-5 md:grid-cols-[1fr_1.4fr_1fr_1.2fr_auto] md:items-end"
        >
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
            variant="secondary"
            busy={create.isPending}
            disabled={code.trim() === '' || label.trim() === '' || Number(factor) <= 0}
          >
            Define unit
          </Button>
          {generalError && (
            <p role="alert" className="text-sm font-medium text-danger md:col-span-5">
              {generalError}
            </p>
          )}
        </form>
      )}
    </Panel>
  )
}

function DensitiesCard({
  organizationId,
  myRole,
}: {
  organizationId: string
  myRole: Organization['myRole']
}) {
  const densitiesQuery = useDensitiesQuery(organizationId)
  const create = useCreateDensity(organizationId)
  const remove = useDeleteDensity(organizationId)
  const toast = useToast()
  const [material, setMaterial] = useState('')
  const [kgPerLitre, setKgPerLitre] = useState('')
  const [source, setSource] = useState('')
  const [note, setNote] = useState('')
  const errors = fieldErrors(create.error)
  const generalError = create.isError && !errors ? refusalMessage(create.error, myRole) : undefined

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
      },
    )
  }

  return (
    <Panel role="region" aria-label="Densities">
      <PanelHead
        title="Densities"
        description="Fuel is often invoiced by mass and its factor published per litre. A density converts between them; the line prints the arithmetic. Typical values are for planning: the gate warns until the supplier's certificate of analysis replaces them."
      />
      {densitiesQuery.isPending && (
        <PanelBody aria-label="Loading densities">
          <Skeleton className="h-10" />
        </PanelBody>
      )}
      {densitiesQuery.data && densitiesQuery.data.length > 0 && (
        <Table className={tableInPanel}>
          <thead>
            <tr>
              <Th>Material</Th>
              <Th align="right">kg per litre</Th>
              <Th>Source</Th>
              <Th className="w-28" />
            </tr>
          </thead>
          <tbody>
            {densitiesQuery.data.map((density) => (
              <tr key={density.id}>
                <Td>
                  <span className="inline-flex flex-wrap items-center gap-2">
                    <span className="font-medium">{density.material}</span>
                    {density.typical && <Chip>Typical value</Chip>}
                  </span>
                </Td>
                <Td align="right">{density.kgPerLitre}</Td>
                <Td className={density.typical ? 'text-ink-muted' : ''}>
                  {density.source}
                  {density.note && (
                    <span className="block text-[13px] text-ink-muted">{density.note}</span>
                  )}
                </Td>
                <Td align="right">
                  {!density.typical && (
                    <RoleButton
                      allowed={mayWrite(myRole)}
                      tooltip={WRITE_TOOLTIP}
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        remove.mutate(density.id, {
                          onSuccess: () => toast(`Density of ${density.material} deleted.`),
                          onError: (error) => toast(refusalMessage(error, myRole), 'error'),
                        })
                      }
                    >
                      Delete
                    </RoleButton>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {mayWrite(myRole) && (
        <form
          onSubmit={submit}
          className="grid gap-3 border-t border-hairline p-5 md:grid-cols-[1.4fr_0.8fr_1.6fr_1fr_auto] md:items-end"
        >
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
            variant="secondary"
            busy={create.isPending}
            disabled={material.trim() === '' || Number(kgPerLitre) <= 0 || source.trim() === ''}
          >
            Record density
          </Button>
          {generalError && (
            <p role="alert" className="text-sm font-medium text-danger md:col-span-5">
              {generalError}
            </p>
          )}
        </form>
      )}
    </Panel>
  )
}
