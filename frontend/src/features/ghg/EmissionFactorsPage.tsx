import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { InputField, SelectField } from '../../components/Field'
import { GlassCard } from '../../components/GlassCard'
import { Modal } from '../../components/Modal'
import { Skeleton } from '../../components/Skeleton'
import { useToast } from '../../components/toast'
import { fieldErrors, refusalMessage } from '../../lib/api'
import { ScopeBadge } from './components/badges'
import { RoleButton } from './components/RoleButton'
import { categoriesForScope, categoryLabel, scopeLabels } from './format'
import { mayWrite, WRITE_TOOLTIP } from './roles'
import {
  useCreateEmissionFactor,
  useDeleteEmissionFactor,
  useEmissionFactorsQuery,
  useFactorPacksQuery,
  useImportFactorPack,
  useOrganizationQuery,
  useSetFactorApproval,
} from './useGhg'
import type { ActivityCategory, EmissionFactor, GhgScope, Organization } from './api'

/** "CO2 2.6307 · CH4 0.0001 (fossil) · N2O 0.0001", listing only the gases the factor carries (spec 07.1). */
function gasSplit(factor: EmissionFactor): string {
  const parts: string[] = []
  const gases: [string, number][] = [
    ['CO₂', factor.gases.co2],
    ['CH₄', factor.gases.ch4],
    ['N₂O', factor.gases.n2o],
    ['HFCs', factor.gases.hfcsKg],
    ['PFCs', factor.gases.pfcsKg],
    ['SF₆', factor.gases.sf6],
    ['NF₃', factor.gases.nf3],
  ]
  for (const [gas, kg] of gases) {
    if (kg <= 0) continue
    const origin = gas === 'CH₄' ? (factor.ch4Fossil ? ' (fossil)' : ' (biogenic)') : ''
    parts.push(`${gas} ${kg.toLocaleString(undefined, { maximumFractionDigits: 6 })}${origin}`)
  }
  if (factor.biogenicCo2KgPerUnit > 0) {
    parts.push(
      `biogenic CO₂ ${factor.biogenicCo2KgPerUnit.toLocaleString(undefined, { maximumFractionDigits: 6 })}`,
    )
  }
  if (factor.blendComposition) parts.push(`blend ${factor.blendComposition}`)
  if (factor.co2eOnly) parts.push('CO₂e only (no gas split published)')
  return parts.join(' · ')
}

/** "Source, published 2025, data year 2024, valid 2025-01-01 to 2025-12-31" (spec 02.1). */
function provenance(factor: EmissionFactor): string {
  const bits = [factor.source]
  if (factor.publicationYear) bits.push(`published ${factor.publicationYear}`)
  if (factor.dataYear && factor.dataYear !== factor.publicationYear)
    bits.push(`data year ${factor.dataYear}`)
  if (factor.validFrom || factor.validTo)
    bits.push(`valid ${factor.validFrom ?? '…'} to ${factor.validTo ?? '…'}`)
  return bits.join(', ')
}

function FactorTable({
  factors,
  editable,
  myRole,
  onApprove,
  onDelete,
}: {
  factors: EmissionFactor[]
  editable: boolean
  myRole?: Organization['myRole']
  onApprove?: (factor: EmissionFactor, approved: boolean) => void
  onDelete?: (factor: EmissionFactor) => void
}) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
          <th className="px-4 py-3 font-semibold">Factor</th>
          <th className="px-4 py-3 font-semibold">Suggested scope</th>
          <th className="px-4 py-3 font-semibold">Factor value</th>
          <th className="px-4 py-3 font-semibold">Gases (kg per unit)</th>
          <th className="px-4 py-3 font-semibold">Source and vintage</th>
          <th className="px-4 py-3 font-semibold">Status</th>
          {editable && <th className="px-4 py-3" />}
        </tr>
      </thead>
      <tbody>
        {factors.map((factor) => (
          <tr key={factor.id} className="border-b border-teal/5 last:border-0">
            <td className="px-4 py-3">
              <span className="font-medium">{factor.name}</span>
              {factor.pack && (
                <span className="block text-xs text-ink-muted">pack {factor.pack}</span>
              )}
            </td>
            <td className="px-4 py-3">
              <span className="inline-flex items-center gap-1.5">
                <ScopeBadge scope={factor.defaultScope} />
                <span className="text-xs text-ink-muted">
                  {categoryLabel(factor.defaultCategory)}
                  {factor.scopeAgnostic ? ' · any scope' : ''}
                </span>
              </span>
            </td>
            <td className="px-4 py-3 whitespace-nowrap">
              {factor.kgCo2ePerUnit} kg CO₂e/{factor.unit}
            </td>
            <td className="px-4 py-3 text-xs text-ink-muted">{gasSplit(factor)}</td>
            <td className="px-4 py-3 text-xs text-ink-muted">
              {factor.sourceUrl ? (
                <a href={factor.sourceUrl} target="_blank" rel="noreferrer" className="text-link">
                  {provenance(factor)}
                </a>
              ) : (
                provenance(factor)
              )}
              {factor.note && <span className="block">{factor.note}</span>}
            </td>
            <td className="px-4 py-3">
              {factor.approved ? (
                <span className="rounded-full bg-accent-green/25 px-2 py-0.5 text-xs font-semibold text-dark-teal">
                  Approved
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  Not approved
                </span>
              )}
            </td>
            {editable && (
              <td className="px-4 py-3 text-right whitespace-nowrap">
                <RoleButton
                  allowed={mayWrite(myRole)}
                  tooltip={WRITE_TOOLTIP}
                  variant="ghost"
                  className="px-2 py-1 text-xs"
                  onClick={() => onApprove?.(factor, !factor.approved)}
                >
                  {factor.approved ? 'Unapprove' : 'Approve'}
                </RoleButton>
                <RoleButton
                  allowed={mayWrite(myRole)}
                  tooltip={WRITE_TOOLTIP}
                  variant="ghost"
                  className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  aria-label={`Delete factor ${factor.name}`}
                  onClick={() => onDelete?.(factor)}
                >
                  Delete
                </RoleButton>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/**
 * The emission factor library (spec 02.1): the shared, read-only seed and the
 * organization's own factors with full provenance, plus the packs built from
 * published tables that an organization imports as its own factors.
 */
export function EmissionFactorsPage() {
  const { organizationId = '' } = useParams()
  const factorsQuery = useEmissionFactorsQuery(organizationId)
  const packsQuery = useFactorPacksQuery()
  const organizationQuery = useOrganizationQuery(organizationId)
  const importPack = useImportFactorPack(organizationId)
  const approve = useSetFactorApproval(organizationId)
  const remove = useDeleteEmissionFactor(organizationId)
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const factors = factorsQuery.data
  const own = factors?.filter((factor) => factor.organizationId !== null) ?? []
  const library = factors?.filter((factor) => factor.organizationId === null) ?? []
  const myRole = organizationQuery.data?.myRole ?? null

  const onApprove = (factor: EmissionFactor, approved: boolean) =>
    approve.mutate(
      { id: factor.id, approved },
      { onError: (error) => toast(refusalMessage(error, myRole), 'error') },
    )
  const onDelete = (factor: EmissionFactor) =>
    remove.mutate(factor.id, {
      onSuccess: () => toast(`${factor.name} deleted.`),
      onError: (error) => toast(refusalMessage(error, myRole), 'error'),
    })

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl">Emission factors</h1>
          <p className="text-sm text-ink-muted">
            The shared library plus this organization's own factors, each with its source, vintage
            and validity. Only approved factors can be run. A factor suggests a scope; the
            classification decides (Corporate Standard chapter 4).
          </p>
        </div>
        <RoleButton
          allowed={mayWrite(myRole)}
          tooltip={WRITE_TOOLTIP}
          className="px-4 py-1.5 text-sm"
          onClick={() => setAdding(true)}
        >
          Add factor
        </RoleButton>
      </div>

      <GlassCard className="animate-fade-up p-6">
        <h2 className="text-lg">Factor packs</h2>
        <p className="text-sm text-ink-muted">
          Built from published tables. Importing a pack adds its factors to this organization with
          their citations; a second import updates them in place.
        </p>
        {packsQuery.isPending && <Skeleton className="mt-3 h-16" />}
        {packsQuery.data && (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {packsQuery.data.map((pack) => (
              <li
                key={pack.id}
                className="flex flex-col gap-1 rounded-xl border border-teal/10 bg-white/40 p-3 text-sm"
              >
                <span className="font-medium">{pack.name}</span>
                <span className="text-xs text-ink-muted">
                  {pack.factorCount} factors · {pack.source}
                  {pack.publicationYear ? `, ${pack.publicationYear}` : ''} · IPCC {pack.gwpBasis} ·
                  retrieved {pack.retrieved}
                </span>
                {pack.notes && <span className="text-xs text-ink-muted">{pack.notes}</span>}
                <div>
                  <RoleButton
                    allowed={mayWrite(myRole)}
                    tooltip={WRITE_TOOLTIP}
                    variant="ghost"
                    className="px-3 py-1 text-xs"
                    aria-label={`Import pack ${pack.name}`}
                    busy={importPack.isPending && importPack.variables === pack.id}
                    onClick={() =>
                      importPack.mutate(pack.id, {
                        onSuccess: (result) =>
                          toast(
                            `${pack.name}: ${result.created} factors added, ${result.updated} updated.`,
                          ),
                        onError: (error) => toast(refusalMessage(error, myRole), 'error'),
                      })
                    }
                  >
                    Import pack
                  </RoleButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <GlassCard className="animate-fade-up overflow-x-auto p-0">
        <h2 className="px-4 pt-4 text-lg">This organization's factors</h2>
        {factorsQuery.isPending && (
          <div aria-label="Loading emission factors" className="flex flex-col gap-2 p-4">
            <Skeleton className="h-8" />
          </div>
        )}
        {factors && own.length === 0 && (
          <p className="px-4 pb-4 text-sm text-ink-muted">
            None yet. Import a pack or add a supplier-specific factor.
          </p>
        )}
        {own.length > 0 && (
          <FactorTable
            factors={own}
            editable
            myRole={myRole}
            onApprove={onApprove}
            onDelete={onDelete}
          />
        )}
      </GlassCard>

      <GlassCard className="animate-fade-up overflow-x-auto p-0">
        <h2 className="px-4 pt-4 text-lg">Shared library</h2>
        <p className="px-4 pb-2 text-xs text-ink-muted">
          Seeded and read-only; every factor cites its publication, table and data year.
        </p>
        {library.length > 0 && <FactorTable factors={library} editable={false} />}
      </GlassCard>

      {adding && (
        <FactorFormModal
          organizationId={organizationId}
          myRole={myRole}
          onClose={() => setAdding(false)}
          onSaved={(name) => {
            setAdding(false)
            toast(`${name} added.`)
          }}
        />
      )}
    </section>
  )
}

function FactorFormModal({
  organizationId,
  myRole,
  onClose,
  onSaved,
}: {
  organizationId: string
  myRole: Organization['myRole']
  onClose: () => void
  onSaved: (name: string) => void
}) {
  const create = useCreateEmissionFactor(organizationId)
  const [name, setName] = useState('')
  const [scope, setScope] = useState<GhgScope>('SCOPE_1')
  const [category, setCategory] = useState<ActivityCategory>('STATIONARY_COMBUSTION')
  const [unit, setUnit] = useState('')
  const [kgCo2e, setKgCo2e] = useState('')
  const [co2, setCo2] = useState('')
  const [ch4, setCh4] = useState('')
  const [ch4Fossil, setCh4Fossil] = useState(true)
  const [n2o, setN2o] = useState('')
  const [source, setSource] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [publicationYear, setPublicationYear] = useState('')
  const [dataYear, setDataYear] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')
  const [approved, setApproved] = useState(true)
  const errors = fieldErrors(create.error)
  const generalError = create.isError && !errors ? refusalMessage(create.error, myRole) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate(
      {
        name,
        defaultScope: scope,
        defaultCategory: category,
        scopeAgnostic: scope === 'SCOPE_1',
        unit,
        kgCo2ePerUnit: Number(kgCo2e),
        co2KgPerUnit: co2 === '' ? undefined : Number(co2),
        ch4KgPerUnit: ch4 === '' ? undefined : Number(ch4),
        ch4Fossil,
        n2oKgPerUnit: n2o === '' ? undefined : Number(n2o),
        source,
        sourceUrl: sourceUrl.trim() === '' ? undefined : sourceUrl,
        publicationYear: publicationYear === '' ? undefined : Number(publicationYear),
        dataYear: dataYear === '' ? undefined : Number(dataYear),
        validFrom: validFrom === '' ? undefined : validFrom,
        validTo: validTo === '' ? undefined : validTo,
        approved,
      },
      { onSuccess: (factor) => onSaved(factor.name) },
    )
  }

  return (
    <Modal title="Add an emission factor" onClose={onClose}>
      <form onSubmit={submit} className="grid gap-3 md:grid-cols-2" noValidate>
        <div className="md:col-span-2">
          <InputField
            label="Name"
            placeholder="Heavy fuel oil (GOIL analysis 2025)"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={errors?.name}
            required
          />
        </div>
        <SelectField
          label="Suggested scope"
          value={scope}
          onChange={(event) => {
            const next = event.target.value as GhgScope
            setScope(next)
            setCategory(categoriesForScope(next)[0].category)
          }}
        >
          {(Object.keys(scopeLabels) as GhgScope[]).map((value) => (
            <option key={value} value={value}>
              {scopeLabels[value]}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Category"
          value={category}
          onChange={(event) => setCategory(event.target.value as ActivityCategory)}
        >
          {categoriesForScope(scope).map((entry) => (
            <option key={entry.category} value={entry.category}>
              {entry.label}
            </option>
          ))}
        </SelectField>
        <InputField
          label="Unit"
          placeholder="tonne, litre, kWh"
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          error={errors?.unit}
          required
        />
        <InputField
          label="kg CO₂e per unit"
          type="number"
          step="0.000001"
          value={kgCo2e}
          onChange={(event) => setKgCo2e(event.target.value)}
          error={errors?.kgCo2ePerUnit}
          required
        />
        <InputField
          label="CO₂ kg per unit (optional)"
          type="number"
          step="0.000001"
          value={co2}
          onChange={(event) => setCo2(event.target.value)}
        />
        <InputField
          label="CH₄ kg per unit (optional)"
          type="number"
          step="0.00000001"
          value={ch4}
          onChange={(event) => setCh4(event.target.value)}
        />
        <InputField
          label="N₂O kg per unit (optional)"
          type="number"
          step="0.00000001"
          value={n2o}
          onChange={(event) => setN2o(event.target.value)}
        />
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            checked={ch4Fossil}
            onChange={(event) => setCh4Fossil(event.target.checked)}
            className="size-4 accent-teal"
          />
          Methane is of fossil origin
        </label>
        <div className="md:col-span-2">
          <InputField
            label="Source (publication, table, data year)"
            placeholder="GOIL fuel analysis certificate 2025-03"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            error={errors?.source}
            required
          />
        </div>
        <div className="md:col-span-2">
          <InputField
            label="Source URL (optional)"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
          />
        </div>
        <InputField
          label="Publication year"
          type="number"
          value={publicationYear}
          onChange={(event) => setPublicationYear(event.target.value)}
        />
        <InputField
          label="Data year"
          type="number"
          value={dataYear}
          onChange={(event) => setDataYear(event.target.value)}
        />
        <InputField
          label="Valid from (optional)"
          type="date"
          value={validFrom}
          onChange={(event) => setValidFrom(event.target.value)}
        />
        <InputField
          label="Valid to (optional)"
          type="date"
          value={validTo}
          onChange={(event) => setValidTo(event.target.value)}
        />
        <label className="flex items-center gap-2 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={approved}
            onChange={(event) => setApproved(event.target.checked)}
            className="size-4 accent-teal"
          />
          Approved for use in runs
        </label>
        {generalError && (
          <p role="alert" className="text-sm font-medium text-red-600 md:col-span-2">
            {generalError}
          </p>
        )}
        <div className="mt-2 flex justify-end gap-2 md:col-span-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={create.isPending}>
            Add factor
          </Button>
        </div>
      </form>
    </Modal>
  )
}
