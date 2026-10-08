import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import { InputField, SelectField, TextAreaField } from '../../components/Field'
import { FilterRow, FilterSelect, SearchField } from '../../components/FilterRow'
import { Modal } from '../../components/Modal'
import { PageHeader } from '../../components/PageHeader'
import { Panel, PanelBody, PanelHead } from '../../components/Panel'
import { Skeleton } from '../../components/Skeleton'
import { StatusDot } from '../../components/StatusDot'
import { Table, TableFooter, Td, Th, TwoLine } from '../../components/Table'
import { useToast } from '../../components/toast'
import { fieldErrors, refusalMessage } from '../../lib/api'
import { PackRowsDrawer } from './components/PackRowsDrawer'
import { RoleButton } from './components/RoleButton'
import {
  categoriesForScope,
  categoryLabel,
  formatDateTime,
  reportingBasisLabels,
  scopeLabels,
} from './format'
import { mayWrite, WRITE_TOOLTIP } from './roles'
import {
  useCreateEmissionFactor,
  useDeleteEmissionFactor,
  useEmissionFactorFacetsQuery,
  useEmissionFactorsQuery,
  useFactorPacksQuery,
  useImportFactorPack,
  useOrganizationQuery,
  useSetFactorApproval,
  useUpdateEmissionFactor,
} from './useGhg'
import type {
  ActivityCategory,
  FactorPack,
  EmissionFactor,
  EmissionFactorInput,
  FactorPackImport,
  FactorVersion,
  GhgScope,
  Organization,
  ReportingBasis,
  SkippedFactorRow,
} from './api'

/** How many of an organization's factors one page of the table holds (FU-03). */
const FACTOR_PAGE_SIZE = 50

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

/**
 * What the import could not deliver (spec 02.6): the rows whose unit the
 * registry cannot convert, named so a preparer knows what the pack left out.
 */
function skippedNote(skipped: SkippedFactorRow[]): string {
  if (skipped.length === 0) return ''
  const named = skipped
    .slice(0, 3)
    .map((row) => `${row.code} (${row.unit})`)
    .join(', ')
  const rest = skipped.length > 3 ? `, and ${skipped.length - 3} more` : ''
  const rows = skipped.length === 1 ? '1 row' : `${skipped.length} rows`
  const units = skipped.length === 1 ? 'a unit' : 'units'
  return ` ${rows} skipped, in ${units} the registry cannot convert: ${named}${rest}.`
}

/** The first few of a list of lineage codes, with a count of the rest. */
function few(codes: string[]): string {
  const named = codes.slice(0, 3).join(', ')
  return codes.length > 3 ? `${named}, and ${codes.length - 3} more` : named
}

/**
 * What an import did, in one sentence (spec 02.6). A version cut is the headline:
 * the organization's earlier figures keep the vintage they were calculated on,
 * and only periods from the edition's applies-from date use the new values.
 */
function importNote(result: FactorPackImport): string {
  const parts = [
    `${result.edition}, applying from ${result.appliesFrom}: ${result.created} added`,
    `${result.versioned} versioned`,
    `${result.tagged} tagged`,
    `${result.unchanged} unchanged.`,
  ]
  let note = parts.join(', ')
  if (result.conflicts.length > 0)
    note += ` ${result.conflicts.length} locally edited row${
      result.conflicts.length === 1 ? '' : 's'
    } left untouched: ${few(result.conflicts)}.`
  if (result.discontinued.length > 0)
    note += ` ${result.discontinued.length} lineage${
      result.discontinued.length === 1 ? '' : 's'
    } this edition drops, retired by nobody: ${few(result.discontinued)}.`
  if (result.splitPeriods.length > 0)
    note += ` It applies inside ${result.splitPeriods
      .map((period) => period.name)
      .join(', ')}, so that period would be calculated on two editions.`
  const movedCount = result.moved.reduce((sum, entry) => sum + entry.assignments, 0)
  if (movedCount > 0)
    note += ` ${movedCount} classification${movedCount === 1 ? '' : 's'} in ${result.moved
      .map((entry) => entry.name)
      .join(', ')} moved to the new vintage.`
  return note + skippedNote(result.skippedUnits)
}

/**
 * A factor's facts as the update endpoint wants them, so an edit of one field
 * (the validity end, for a retirement) sends the rest back unchanged.
 */
function factorInput(factor: EmissionFactor): EmissionFactorInput {
  return {
    name: factor.name,
    defaultScope: factor.defaultScope,
    defaultCategory: factor.defaultCategory,
    scopeAgnostic: factor.scopeAgnostic,
    unit: factor.unit,
    kgCo2ePerUnit: factor.kgCo2ePerUnit,
    co2KgPerUnit: factor.gases.co2,
    ch4KgPerUnit: factor.gases.ch4,
    ch4Fossil: factor.ch4Fossil,
    n2oKgPerUnit: factor.gases.n2o,
    hfcsKgPerUnit: factor.gases.hfcsKg,
    pfcsKgPerUnit: factor.gases.pfcsKg,
    sf6KgPerUnit: factor.gases.sf6,
    nf3KgPerUnit: factor.gases.nf3,
    biogenicCo2KgPerUnit: factor.biogenicCo2KgPerUnit,
    // the stored form: the display form ("50% HFC-32, …") does not parse on the way back
    blendComposition: factor.blendCompositionEntered ?? undefined,
    blendGwpSource: factor.blendGwpSource ?? undefined,
    source: factor.source,
    sourceUrl: factor.sourceUrl ?? undefined,
    publicationYear: factor.publicationYear ?? undefined,
    dataYear: factor.dataYear ?? undefined,
    validFrom: factor.validFrom ?? undefined,
    validTo: factor.validTo ?? undefined,
    note: factor.note ?? undefined,
    approved: factor.approved,
    reportingBasis: factor.reportingBasis,
  }
}

/** "defra-2026, from 2026-01-01 to 2026-12-31": one version of a lineage (spec 02.6). */
function versionLabel(version: FactorVersion): string {
  const window =
    version.validFrom === null && version.validTo === null
      ? 'always applied'
      : `${version.validFrom ?? '…'} to ${version.validTo ?? 'open'}`
  return `${version.sourceEdition ?? 'entered by hand'}, ${window}, ${version.kgCo2ePerUnit}`
}

function FactorTable({
  factors,
  editable,
  myRole,
  onApprove,
  onRetire,
  onDelete,
}: {
  factors: EmissionFactor[]
  editable: boolean
  myRole?: Organization['myRole']
  onApprove?: (factor: EmissionFactor, approved: boolean) => void
  onRetire?: (factor: EmissionFactor) => void
  onDelete?: (factor: EmissionFactor) => void
}) {
  return (
    <Table>
      <thead>
        <tr>
          <Th>Factor</Th>
          <Th>Suggested scope</Th>
          <Th align="right">Factor value</Th>
          <Th>Gases (kg per unit)</Th>
          <Th>Source and vintage</Th>
          <Th>Packs</Th>
          <Th>Status</Th>
          {editable && <Th className="w-40" />}
        </tr>
      </thead>
      <tbody>
        {factors.map((factor) => (
          <tr key={factor.id}>
            <Td>
              {/* FU-03: 1,157 of the 1,868 DEFRA rows share a display name, so the publisher's
                  own category and activity go with it */}
              <TwoLine
                primary={factor.name}
                secondary={
                  (factor.sourceCategory ||
                    factor.reportingBasis === 'OUTSIDE_SCOPES_NON_KYOTO') && (
                    <>
                      {factor.sourceCategory &&
                        [factor.sourceCategory, factor.sourceActivity, factor.sourceDetail]
                          .filter((part) => part !== null && part !== '')
                          .join(' / ')}
                      {factor.reportingBasis === 'OUTSIDE_SCOPES_NON_KYOTO' && (
                        <span className="block text-warning">
                          {reportingBasisLabels[factor.reportingBasis]}
                        </span>
                      )}
                    </>
                  )
                }
              />
            </Td>
            <Td>
              <TwoLine
                primary={scopeLabels[factor.defaultScope]}
                secondary={`${categoryLabel(factor.defaultCategory)}${factor.scopeAgnostic ? ' · any scope' : ''}`}
              />
            </Td>
            <Td align="right">
              {factor.kgCo2ePerUnit} kg CO₂e/{factor.unit}
            </Td>
            <Td className="text-[13px] text-ink-muted">{gasSplit(factor)}</Td>
            <Td className="text-[13px] text-ink-muted">
              {factor.sourceUrl ? (
                <a href={factor.sourceUrl} target="_blank" rel="noreferrer" className="text-link">
                  {provenance(factor)}
                </a>
              ) : (
                provenance(factor)
              )}
              {factor.note && factor.note !== factor.caveat && (
                <span className="block">{factor.note}</span>
              )}
              {/* spec 02.6: a lineage holds one version per vintage, so the chain says which applies */}
              {factor.versions.length > 1 && (
                <details className="mt-1">
                  <summary className="cursor-pointer">
                    {factor.versions.length} versions of this factor
                  </summary>
                  <ul className="mt-1 ml-3 list-disc">
                    {factor.versions.map((version) => (
                      <li key={version.id} className={version.live ? 'font-medium' : undefined}>
                        {versionLabel(version)}
                        {version.live ? ' (live)' : ''}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </Td>
            {/* spec 02.3: the packs that delivered the row, always apart from its source */}
            <Td>
              {factor.packs.length === 0 ? (
                <span className="text-[13px] text-ink-muted">entered by hand</span>
              ) : (
                <span className="flex flex-wrap gap-1">
                  {factor.packs.map((pack) => (
                    <Chip key={pack} title="Delivered by a factor pack">
                      {pack}
                    </Chip>
                  ))}
                </span>
              )}
            </Td>
            <Td>
              <div className="flex flex-col gap-0.5">
                {factor.approved ? (
                  <>
                    <StatusDot tone="success">Approved</StatusDot>
                    {/* spec 02.11: approval is a control, so the record names who and when */}
                    {factor.approvedBy && (
                      <span className="text-[13px] text-ink-muted">
                        by {factor.approvedBy}
                        {factor.approvedAt ? ` on ${formatDateTime(factor.approvedAt)}` : ''}
                        {factor.selfApproved ? ' (self-approved: nobody else could check it)' : ''}
                      </span>
                    )}
                    {factor.approvalNote && (
                      <span className="text-[13px] text-ink-muted">
                        Checked: {factor.approvalNote}
                      </span>
                    )}
                  </>
                ) : (
                  <StatusDot tone="warning">Not approved</StatusDot>
                )}
                {/* spec 02.5 rule 10: the publisher's condition is the reason, until a check lifts it */}
                {factor.caveat && (
                  <span className="text-[13px] text-warning">Caveat: {factor.caveat}</span>
                )}
                {/* spec 02.6: an import leaves this row alone and reports it as a conflict */}
                {factor.locallyEdited && (
                  <span
                    className="text-[13px] text-ink-muted"
                    title="Edited here, so an import leaves it alone and reports it as a conflict."
                  >
                    Locally edited
                  </span>
                )}
              </div>
            </Td>
            {editable && (
              <Td align="right">
                <div className="flex flex-wrap justify-end gap-1">
                  <RoleButton
                    allowed={mayWrite(myRole)}
                    tooltip={WRITE_TOOLTIP}
                    variant="ghost"
                    size="sm"
                    onClick={() => onApprove?.(factor, !factor.approved)}
                  >
                    {factor.approved ? 'Unapprove' : 'Approve'}
                  </RoleButton>
                  {/* spec 02.6: a factor leaves service by its validity end; a pack-derived one is
                      never deleted, its versions being the record of what was calculated with */}
                  <RoleButton
                    allowed={mayWrite(myRole)}
                    tooltip={WRITE_TOOLTIP}
                    variant="ghost"
                    size="sm"
                    aria-label={`Retire factor ${factor.name}`}
                    title={
                      factor.packCode === null
                        ? undefined
                        : 'From a factor pack. Its versions are the record of what was calculated with, so it retires by its validity end instead of being deleted.'
                    }
                    onClick={() => onRetire?.(factor)}
                  >
                    Retire…
                  </RoleButton>
                  {factor.packCode === null && (
                    <RoleButton
                      allowed={mayWrite(myRole)}
                      tooltip={WRITE_TOOLTIP}
                      variant="ghost"
                      size="sm"
                      aria-label={`Delete factor ${factor.name}`}
                      onClick={() => onDelete?.(factor)}
                    >
                      Delete
                    </RoleButton>
                  )}
                </div>
              </Td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

/**
 * The organization's emission factors (spec 02.1) with full provenance, and the
 * packs built from published tables that it imports as its own. Spec 02.10
 * retired the shared library: an organization starts with nothing and
 * establishes its baseline by importing a pack or entering a factor by hand.
 */
export function EmissionFactorsPage() {
  const { organizationId = '' } = useParams()
  const packsQuery = useFactorPacksQuery()
  const organizationQuery = useOrganizationQuery(organizationId)
  const importPack = useImportFactorPack(organizationId)
  const approve = useSetFactorApproval(organizationId)
  const remove = useDeleteEmissionFactor(organizationId)
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  // spec 02.6: the factor whose validity end is being set, if any
  const [retiring, setRetiring] = useState<EmissionFactor | null>(null)
  // spec 02.5 rule 10: the caveated factor whose approval needs a check note, if any
  const [approving, setApproving] = useState<EmissionFactor | null>(null)
  // spec 02.8: the pack whose factors are open for reading, if any
  const [viewing, setViewing] = useState<FactorPack | null>(null)
  // FU-03: an imported edition can be thousands of rows, so the search and the filters are
  // the server's work and the tables show one page each
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [activity, setActivity] = useState('')
  const [unit, setUnit] = useState('')
  const [showUnapproved, setShowUnapproved] = useState(true)
  const [page, setPage] = useState(0)
  const filters = {
    q: search.trim() === '' ? undefined : search.trim(),
    includeUnapproved: showUnapproved,
    sourceCategory: category || undefined,
    sourceActivity: activity || undefined,
    unit: unit || undefined,
  }
  const ownQuery = useEmissionFactorsQuery(organizationId, {
    ...filters,
    page,
    size: FACTOR_PAGE_SIZE,
  })
  const facetsQuery = useEmissionFactorFacetsQuery(organizationId, category || undefined)
  const own = ownQuery.data?.items ?? []
  const ownTotal = ownQuery.data?.total ?? 0
  const hiddenUnapproved = ownQuery.data?.unapproved ?? 0
  const pageCount = Math.max(1, Math.ceil(ownTotal / FACTOR_PAGE_SIZE))
  const filtered =
    search.trim() !== '' || category !== '' || activity !== '' || unit !== '' || !showUnapproved
  const narrow = (change: () => void) => {
    change()
    setPage(0)
  }
  const myRole = organizationQuery.data?.myRole ?? null

  const onApprove = (factor: EmissionFactor, approved: boolean) => {
    if (approved && factor.caveat) {
      setApproving(factor)
      return
    }
    approve.mutate(
      { id: factor.id, approved },
      { onError: (error) => toast(refusalMessage(error, myRole), 'error') },
    )
  }
  const onDelete = (factor: EmissionFactor) =>
    remove.mutate(factor.id, {
      onSuccess: () => toast(`${factor.name} deleted.`),
      onError: (error) => toast(refusalMessage(error, myRole), 'error'),
    })

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        back={{ to: `/app/ghg/${organizationId}` }}
        title="Emission factors"
        subtitle="This organization's factors, each with its source, vintage and validity. Import a pack to establish a baseline, or add one by hand. Only approved factors can be run. A factor suggests a scope; the classification decides (Corporate Standard chapter 4)."
        actions={
          <RoleButton
            allowed={mayWrite(myRole)}
            tooltip={WRITE_TOOLTIP}
            onClick={() => setAdding(true)}
          >
            Add factor
          </RoleButton>
        }
      />

      <Panel>
        <PanelHead
          title="Factor packs"
          description="Built from published tables. Importing an edition adds its factors to this organization with their citations. A later edition never overwrites a figure: it closes the version you hold and cuts a new one from the edition's applies-from date, so a period you have already reported keeps the factors it reported with."
        />
        {packsQuery.isPending && (
          <PanelBody>
            <Skeleton className="h-16" />
          </PanelBody>
        )}
        {packsQuery.data && (
          <Table className="[&_tbody_tr:last-child_td]:border-b-0">
            <thead>
              <tr>
                <Th>Pack</Th>
                <Th align="right">Factors</Th>
                <Th>Source</Th>
                <Th>GWP</Th>
                <Th>Retrieved</Th>
                <Th className="w-60" />
              </tr>
            </thead>
            <tbody>
              {packsQuery.data.map((pack) => (
                <tr key={pack.id}>
                  <Td>
                    <TwoLine
                      primary={pack.name}
                      secondary={
                        <>
                          {pack.id}
                          {pack.notes && <span className="block">{pack.notes}</span>}
                        </>
                      }
                    />
                  </Td>
                  <Td align="right">{pack.factorCount.toLocaleString()}</Td>
                  <Td>
                    {pack.source}
                    {pack.publicationYear ? `, ${pack.publicationYear}` : ''}
                  </Td>
                  <Td>IPCC {pack.gwpBasis}</Td>
                  <Td>{pack.retrieved}</Td>
                  <Td align="right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`View the factors in ${pack.name}`}
                        onClick={() => setViewing(pack)}
                      >
                        View factors
                      </Button>
                      <RoleButton
                        allowed={mayWrite(myRole)}
                        tooltip={WRITE_TOOLTIP}
                        variant="secondary"
                        size="sm"
                        aria-label={`Import pack ${pack.name}`}
                        busy={importPack.isPending && importPack.variables === pack.id}
                        onClick={() =>
                          importPack.mutate(pack.id, {
                            onSuccess: (result) => toast(importNote(result)),
                            onError: (error) => toast(refusalMessage(error, myRole), 'error'),
                          })
                        }
                      >
                        Import pack
                      </RoleButton>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-[-0.01em]">This organization's factors</h2>
          <p className="text-sm text-ink-muted">
            {ownTotal.toLocaleString()} factor{ownTotal === 1 ? '' : 's'}
            {filtered ? ' match' : ''}
          </p>
        </div>
        <FilterRow
          search={
            <SearchField
              label="Search factors"
              placeholder="Name, publication, taxonomy or pack tag"
              value={search}
              onChange={(event) => narrow(() => setSearch(event.target.value))}
            />
          }
        >
          <FilterSelect
            label="Published category"
            value={category}
            onChange={(event) =>
              narrow(() => {
                setCategory(event.target.value)
                setActivity('')
              })
            }
          >
            <option value="">All categories</option>
            {(facetsQuery.data?.categories ?? []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Published activity"
            value={activity}
            onChange={(event) => narrow(() => setActivity(event.target.value))}
          >
            <option value="">All activities</option>
            {(facetsQuery.data?.activities ?? []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Unit"
            value={unit}
            onChange={(event) => narrow(() => setUnit(event.target.value))}
          >
            <option value="">All units</option>
            {(facetsQuery.data?.units ?? []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </FilterSelect>
          <label className="flex min-h-11 items-center gap-2.5 text-[15px]">
            <input
              type="checkbox"
              checked={showUnapproved}
              onChange={(event) => narrow(() => setShowUnapproved(event.target.checked))}
              className="size-[18px] accent-primary"
            />
            Show unapproved
            {hiddenUnapproved > 0 && !showUnapproved && ` (${hiddenUnapproved} hidden)`}
          </label>
        </FilterRow>
        {ownQuery.isPending && (
          <div aria-label="Loading emission factors" className="flex flex-col gap-2">
            <Skeleton className="h-8" />
          </div>
        )}
        {ownQuery.data && own.length === 0 && (
          <p className="text-sm text-ink-muted">
            {filtered
              ? 'No factor matches these filters.'
              : 'None yet. Import a pack or add a supplier-specific factor.'}
          </p>
        )}
        {own.length > 0 && (
          <FactorTable
            factors={own}
            editable
            myRole={myRole}
            onApprove={onApprove}
            onRetire={setRetiring}
            onDelete={onDelete}
          />
        )}
        {pageCount > 1 && (
          <TableFooter
            pager={
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  Previous
                </Button>
                <span aria-hidden="true" className="mx-2 h-5 w-px bg-hairline" />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page + 1 >= pageCount}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </>
            }
          >
            Page {page + 1} of {pageCount}
          </TableFooter>
        )}
      </div>

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

      {retiring && (
        <RetireFactorModal
          organizationId={organizationId}
          factor={retiring}
          myRole={myRole}
          onClose={() => setRetiring(null)}
          onSaved={(validTo) => {
            setRetiring(null)
            toast(`${retiring.name} retired: valid to ${validTo}.`)
          }}
        />
      )}

      {approving && (
        <ApproveCaveatedFactorModal
          organizationId={organizationId}
          factor={approving}
          myRole={myRole}
          onClose={() => setApproving(null)}
          onSaved={() => {
            setApproving(null)
            toast(`${approving.name} approved.`)
          }}
        />
      )}

      {viewing && (
        <PackRowsDrawer
          organizationId={organizationId}
          pack={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </section>
  )
}

/**
 * Sets a factor's validity end (spec 02.6): how a factor leaves service, whether
 * entered by hand or delivered by a pack, since the runs that used it keep it as
 * their record. The rest of the factor goes back to the endpoint unchanged.
 */
/**
 * A caveated factor is approved with the note of what was checked (spec 02.5
 * rule 10, spec 02.11): the caveat is the publisher's condition, the note how
 * it was met, and the report prints both beside the factor.
 */
function ApproveCaveatedFactorModal({
  organizationId,
  factor,
  myRole,
  onClose,
  onSaved,
}: {
  organizationId: string
  factor: EmissionFactor
  myRole: Organization['myRole']
  onClose: () => void
  onSaved: () => void
}) {
  const approve = useSetFactorApproval(organizationId)
  const [note, setNote] = useState('')
  const [missing, setMissing] = useState(false)
  const errors = fieldErrors(approve.error)
  // the dialog shows one field: a refusal about anything else must not vanish
  const generalError =
    approve.isError && !errors?.note ? refusalMessage(approve.error, myRole) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (note.trim() === '') {
      setMissing(true)
      return
    }
    approve.mutate({ id: factor.id, approved: true, note: note.trim() }, { onSuccess: onSaved })
  }

  return (
    <Modal title={`Approve ${factor.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <p className="text-sm text-ink-muted">
          The publisher attached a caveat to this value. Say what you checked before approving it;
          the note prints beside the caveat in the report's factor table.
        </p>
        <p className="text-sm text-warning">Caveat: {factor.caveat}</p>
        <TextAreaField
          label="Check note"
          value={note}
          onChange={(event) => {
            setMissing(false)
            setNote(event.target.value)
          }}
          error={missing ? 'Say what you checked before approving this factor.' : errors?.note}
          required
        />
        {generalError && (
          <p role="alert" className="text-sm font-medium text-danger">
            {generalError}
          </p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={approve.isPending}>
            Approve factor
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function RetireFactorModal({
  organizationId,
  factor,
  myRole,
  onClose,
  onSaved,
}: {
  organizationId: string
  factor: EmissionFactor
  myRole: Organization['myRole']
  onClose: () => void
  onSaved: (validTo: string) => void
}) {
  const update = useUpdateEmissionFactor(organizationId)
  const [validTo, setValidTo] = useState(factor.validTo ?? '')
  const [missing, setMissing] = useState(false)
  const errors = fieldErrors(update.error)
  // the dialog shows one field: a refusal about any other must not vanish
  const generalError =
    update.isError && !errors?.validTo ? refusalMessage(update.error, myRole) : undefined

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (validTo === '') {
      setMissing(true)
      return
    }
    update.mutate(
      { id: factor.id, input: { ...factorInput(factor), validTo } },
      { onSuccess: (saved) => onSaved(saved.validTo ?? validTo) },
    )
  }

  return (
    <Modal title={`Retire ${factor.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
        <p className="text-sm text-ink-muted">
          Set the last day the factor applies. Runs that used it keep it as their record
          {factor.validFrom ? `; it has applied since ${factor.validFrom}` : ''}.
        </p>
        <InputField
          label="Valid to"
          type="date"
          value={validTo}
          min={factor.validFrom ?? undefined}
          onChange={(event) => {
            setMissing(false)
            setValidTo(event.target.value)
          }}
          error={missing ? 'Choose the last day the factor applies.' : errors?.validTo}
          required
        />
        {generalError && (
          <p role="alert" className="text-sm font-medium text-danger">
            {generalError}
          </p>
        )}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" busy={update.isPending}>
            Retire factor
          </Button>
        </div>
      </form>
    </Modal>
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
  // spec 02.1, 02.9: a blend's split is the only route to a figure that reconverts under the
  // inventory's GWP set; a published CO2e without one is kept as the source states it
  const [hfcs, setHfcs] = useState('')
  const [pfcs, setPfcs] = useState('')
  const [sf6, setSf6] = useState('')
  const [nf3, setNf3] = useState('')
  const [blendComposition, setBlendComposition] = useState('')
  const [blendGwpSource, setBlendGwpSource] = useState('')
  const [source, setSource] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [publicationYear, setPublicationYear] = useState('')
  const [dataYear, setDataYear] = useState('')
  const [validFrom, setValidFrom] = useState('')
  const [validTo, setValidTo] = useState('')
  // spec 02.1: use in a run is a deliberate review step (Corporate Standard chapter 7, ISO 14064-1
  // section 8.1), so a factor arrives unapproved and someone ticks it after checking it
  const [approved, setApproved] = useState(false)
  // spec 02.4: a Montreal Protocol gas is disclosed outside the scopes, never inside one
  const [reportingBasis, setReportingBasis] = useState<ReportingBasis>('SCOPES')
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
        hfcsKgPerUnit: hfcs === '' ? undefined : Number(hfcs),
        pfcsKgPerUnit: pfcs === '' ? undefined : Number(pfcs),
        sf6KgPerUnit: sf6 === '' ? undefined : Number(sf6),
        nf3KgPerUnit: nf3 === '' ? undefined : Number(nf3),
        blendComposition: blendComposition.trim() === '' ? undefined : blendComposition.trim(),
        blendGwpSource: blendGwpSource === '' ? undefined : blendGwpSource,
        source,
        sourceUrl: sourceUrl.trim() === '' ? undefined : sourceUrl,
        publicationYear: publicationYear === '' ? undefined : Number(publicationYear),
        dataYear: dataYear === '' ? undefined : Number(dataYear),
        validFrom: validFrom === '' ? undefined : validFrom,
        validTo: validTo === '' ? undefined : validTo,
        approved,
        reportingBasis,
      },
      { onSuccess: (factor) => onSaved(factor.name) },
    )
  }

  return (
    <Modal title="Add an emission factor" size="lg" onClose={onClose}>
      <form onSubmit={submit} className="grid gap-x-6 gap-y-5 md:grid-cols-2" noValidate>
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
        <label className="flex min-h-11 items-center gap-2.5 self-end text-[15px]">
          <input
            type="checkbox"
            checked={ch4Fossil}
            onChange={(event) => setCh4Fossil(event.target.checked)}
            className="size-[18px] accent-primary"
          />
          Methane is of fossil origin
        </label>
        {/* Corporate Standard chapter 4: the seven gas groups. A blend's mass goes under HFCs or
            PFCs, and the composition below splits it by species. */}
        <InputField
          label="HFCs kg per unit (optional)"
          type="number"
          step="0.000001"
          value={hfcs}
          hint="For a refrigerant per kg of gas, 1."
          onChange={(event) => setHfcs(event.target.value)}
        />
        <InputField
          label="PFCs kg per unit (optional)"
          type="number"
          step="0.000001"
          value={pfcs}
          onChange={(event) => setPfcs(event.target.value)}
        />
        <InputField
          label="SF₆ kg per unit (optional)"
          type="number"
          step="0.000001"
          value={sf6}
          onChange={(event) => setSf6(event.target.value)}
        />
        <InputField
          label="NF₃ kg per unit (optional)"
          type="number"
          step="0.000001"
          value={nf3}
          onChange={(event) => setNf3(event.target.value)}
        />
        <InputField
          label="Blend composition (optional)"
          placeholder="HFC-32:0.5,HFC-125:0.5"
          value={blendComposition}
          error={errors?.blendComposition}
          hint="Mass fractions per species. With a composition the run re-derives the figure under the inventory's GWP set."
          onChange={(event) => setBlendComposition(event.target.value)}
        />
        <SelectField
          label="GWP basis of the published figure"
          value={blendGwpSource}
          hint="Which set the source used for its CO₂e; printed when the figure cannot be re-derived."
          onChange={(event) => setBlendGwpSource(event.target.value)}
        >
          <option value="">Not stated by the source</option>
          <option value="AR5">AR5</option>
          <option value="AR6">AR6</option>
          <option value="AR4">AR4</option>
        </SelectField>
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
        <div className="md:col-span-2">
          <SelectField
            label="Reporting basis"
            value={reportingBasis}
            onChange={(event) => setReportingBasis(event.target.value as ReportingBasis)}
          >
            {(Object.keys(reportingBasisLabels) as ReportingBasis[]).map((value) => (
              <option key={value} value={value}>
                {reportingBasisLabels[value]}
              </option>
            ))}
          </SelectField>
          <p className="mt-1.5 text-[13px] text-ink-muted">
            Chapter 4 counts the seven Kyoto gas groups. A Montreal Protocol gas (HCFC-22, a CFC, a
            halon) is reported separately as optional information; no scope total includes it.
          </p>
        </div>
        <label className="flex min-h-11 items-center gap-2.5 text-[15px] md:col-span-2">
          <input
            type="checkbox"
            checked={approved}
            onChange={(event) => setApproved(event.target.checked)}
            className="size-[18px] accent-primary"
          />
          Approved for use in runs
        </label>
        {generalError && (
          <p role="alert" className="text-sm font-medium text-danger md:col-span-2">
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
