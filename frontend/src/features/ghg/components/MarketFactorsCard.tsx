import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField, SelectField } from '../../../components/Field'
import { GlassCard } from '../../../components/GlassCard'
import { useToast } from '../../../components/toast'
import { fieldErrors, problemDetail } from '../../../lib/api'
import { checkNumber, collectErrors } from '../../../lib/validate'
import { instrumentLabels } from '../format'
import {
  useFacilitiesQuery,
  useMarketFactorsQuery,
  useRemoveMarketFactor,
  useSetMarketFactor,
  useSetResidualMix,
} from '../useGhg'
import { EvidenceModal } from './EvidenceModal'
import type { Inventory, MarketFactor, MarketInstrument } from '../api'

/** The eight Scope 2 Quality Criteria in the Guidance's order (spec 07.6). */
export const criteriaTitles: string[] = [
  'Conveys the GHG emission rate attribute of the generation it represents',
  'Is the only instrument carrying that attribute claim (no double counting)',
  'Is tracked and retired or cancelled by or on behalf of the company',
  'Is issued and redeemed as close as possible to the period of consumption',
  'Is sourced from the same market as the consuming operations',
  'A supplier-specific factor rests on delivered electricity net of certificates sold',
  'Untracked electricity in the market takes a residual mix where one is published',
  'Contract or certificate references, quantity, vintage and retirement are held as evidence',
]

const answerLabels: Record<'MET' | 'NOT_MET' | 'UNANSWERED', string> = {
  MET: 'met',
  NOT_MET: 'not met',
  UNANSWERED: 'unanswered',
}

/**
 * Market-based scope 2 (spec 07.1, 07.2, Scope 2 Guidance): a contractual
 * instrument per facility for this inventory's period, whether it meets the
 * eight Scope 2 Quality Criteria, and whether a residual mix is available for
 * the instruments' markets. When any instrument exists, the report shows scope
 * 2 location-based and market-based side by side and prints the disclosures.
 */
export function MarketFactorsCard({
  organizationId,
  inventory,
}: {
  organizationId: string
  inventory: Inventory
}) {
  const inventoryId = inventory.id
  const editable = inventory.status === 'DRAFT'
  const factorsQuery = useMarketFactorsQuery(inventoryId)
  const facilitiesQuery = useFacilitiesQuery(organizationId)
  const set = useSetMarketFactor(inventoryId)
  const remove = useRemoveMarketFactor(inventoryId)
  const toast = useToast()
  const facilities = facilitiesQuery.data ?? []
  const [facilityId, setFacilityId] = useState('')
  const [instrument, setInstrument] = useState<MarketInstrument>('SUPPLIER_SPECIFIC')
  const [factor, setFactor] = useState('')
  const [source, setSource] = useState('')
  const [criteria, setCriteria] = useState<(boolean | null)[]>(Array(8).fill(null))
  const [certificateId, setCertificateId] = useState('')
  const [registry, setRegistry] = useState('')
  const [vintage, setVintage] = useState('')
  const [retirementDate, setRetirementDate] = useState('')
  const [qualityNotes, setQualityNotes] = useState('')
  const [evidenceFor, setEvidenceFor] = useState<MarketFactor | null>(null)
  const [coveredMwh, setCoveredMwh] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [clientErrors, setClientErrors] = useState<Record<string, string> | undefined>()

  const chosenFacility = facilityId || facilities[0]?.id || ''
  const errors = clientErrors ?? fieldErrors(set.error)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!chosenFacility) return
    const invalid = collectErrors({
      kgCo2ePerKwh: checkNumber(factor, { label: 'kg CO₂e per kWh', min: 0, required: true }),
      coveredKwh: checkNumber(coveredMwh, {
        label: 'Covered quantity',
        positive: true,
        required: true,
      }),
      vintage: checkNumber(vintage, { label: 'Vintage', min: 1990, max: 2100 }),
    })
    setClientErrors(invalid)
    if (invalid) return
    set.mutate(
      {
        facilityId: chosenFacility,
        input: {
          instrumentType: instrument,
          kgCo2ePerKwh: Number(factor),
          source,
          criteria,
          certificateId: certificateId.trim() === '' ? undefined : certificateId.trim(),
          registry: registry.trim() === '' ? undefined : registry.trim(),
          vintage: vintage.trim() === '' ? undefined : Number(vintage),
          retirementDate: retirementDate === '' ? undefined : retirementDate,
          qualityNotes: qualityNotes.trim() === '' ? undefined : qualityNotes,
          coveredKwh: Number(coveredMwh) * 1000,
          periodStart: periodStart === '' ? undefined : periodStart,
          periodEnd: periodEnd === '' ? undefined : periodEnd,
        },
      },
      {
        onSuccess: (saved) => {
          setFactor('')
          setSource('')
          setCriteria(Array(8).fill(null))
          setCertificateId('')
          setRegistry('')
          setVintage('')
          setRetirementDate('')
          setQualityNotes('')
          setCoveredMwh('')
          setPeriodStart('')
          setPeriodEnd('')
          toast(`Instrument recorded for ${saved.facilityName}.`)
        },
        onError: (error) => {
          if (!fieldErrors(error)) {
            toast(problemDetail(error) ?? 'Could not save the instrument.', 'error')
          }
        },
      },
    )
  }

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl">Market-based scope 2 instruments</h2>
      <p className="text-sm text-ink-muted">
        Every run reports scope 2 location-based and market-based side by side. An instrument
        applies to the megawatt-hours it covers over its period; the balance, and every facility
        without an instrument, takes the residual mix, or the grid average when none is published.
        An instrument that does not meet the Scope 2 Quality Criteria is not applied.
      </p>
      {factorsQuery.data && factorsQuery.data.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                <th className="px-3 py-2 font-semibold">Facility</th>
                <th className="px-3 py-2 font-semibold">Instrument</th>
                <th className="px-3 py-2 font-semibold">kg CO₂e/kWh</th>
                <th className="px-3 py-2 font-semibold">Covers</th>
                <th className="px-3 py-2 font-semibold">Source</th>
                <th className="px-3 py-2 font-semibold">Quality criteria</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {factorsQuery.data.map((entry) => (
                <tr key={entry.id} className="border-b border-teal/5 last:border-0">
                  <td className="px-3 py-2 font-medium">{entry.facilityName}</td>
                  <td className="px-3 py-2">{instrumentLabels[entry.instrumentType]}</td>
                  <td className="px-3 py-2 tabular-nums">{entry.kgCo2ePerKwh}</td>
                  <td className="px-3 py-2 text-ink-muted tabular-nums">
                    {entry.coveredKwh === null
                      ? 'every kWh'
                      : `${(entry.coveredKwh / 1000).toLocaleString()} MWh`}
                    {(entry.periodStart || entry.periodEnd) && (
                      <span className="block text-xs">
                        {entry.periodStart ?? inventory.periodStart} →{' '}
                        {entry.periodEnd ?? inventory.periodEnd}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-ink-muted">{entry.source}</td>
                  <td className="px-3 py-2">
                    {entry.meetsQualityCriteria
                      ? 'All eight met'
                      : `Not applied: ${entry.notMetCount > 0 ? `${entry.notMetCount} not met` : ''}${entry.notMetCount > 0 && entry.unansweredCount > 0 ? ', ' : ''}${entry.unansweredCount > 0 ? `${entry.unansweredCount} unanswered` : ''}`}
                    <span className="block text-xs text-ink-muted">
                      {entry.criteria
                        .map((criterion, index) => `${index + 1} ${answerLabels[criterion.answer]}`)
                        .join(' · ')}
                    </span>
                    {(entry.certificateId ||
                      entry.registry ||
                      entry.vintage ||
                      entry.retirementDate) && (
                      <span className="block text-xs text-ink-muted">
                        {[
                          entry.certificateId,
                          entry.registry,
                          entry.vintage ? `vintage ${entry.vintage}` : null,
                          entry.retirementDate ? `retired ${entry.retirementDate}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    )}
                    {entry.qualityNotes && (
                      <span className="block text-xs text-ink-muted">{entry.qualityNotes}</span>
                    )}
                    <button
                      type="button"
                      className="block text-xs text-link hover:underline"
                      onClick={() => setEvidenceFor(entry)}
                    >
                      Evidence
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {editable && (
                      <Button
                        variant="ghost"
                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        aria-label={`Remove instrument for ${entry.facilityName}`}
                        onClick={() =>
                          remove.mutate(entry.facilityId, {
                            onError: (error) =>
                              toast(problemDetail(error) ?? 'Could not remove.', 'error'),
                          })
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {factorsQuery.data?.length === 0 && (
        <p className="mt-4 text-sm text-ink-muted">
          No instruments recorded: the market-based figure uses the residual mix, or the grid
          average where none is published, and the report says so.
        </p>
      )}
      {editable && facilities.length > 0 && (
        <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-4 md:items-end" noValidate>
          <SelectField
            label="Facility"
            value={chosenFacility}
            onChange={(event) => setFacilityId(event.target.value)}
          >
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Instrument"
            value={instrument}
            onChange={(event) => setInstrument(event.target.value as MarketInstrument)}
          >
            {Object.entries(instrumentLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          <InputField
            label="kg CO₂e per kWh"
            type="number"
            min="0"
            step="0.000001"
            value={factor}
            onChange={(event) => setFactor(event.target.value)}
            error={errors?.kgCo2ePerKwh}
            required
          />
          <InputField
            label="Source"
            placeholder="Supplier certificate 2025"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            required
          />
          <InputField
            label="Covered quantity (MWh)"
            type="number"
            min="0.001"
            step="0.001"
            value={coveredMwh}
            onChange={(event) => setCoveredMwh(event.target.value)}
            error={errors?.coveredKwh}
            hint="The megawatt-hours the instrument covers; the balance takes the residual mix or grid average."
            required
          />
          <InputField
            label="Covers from (optional)"
            type="date"
            value={periodStart}
            onChange={(event) => setPeriodStart(event.target.value)}
            hint={`Defaults to ${inventory.periodStart}`}
          />
          <InputField
            label="Covers to (optional)"
            type="date"
            value={periodEnd}
            onChange={(event) => setPeriodEnd(event.target.value)}
            hint={`Defaults to ${inventory.periodEnd}`}
          />
          <InputField
            label="Certificate or contract reference"
            placeholder="IREC-GH-2025-0417"
            value={certificateId}
            onChange={(event) => setCertificateId(event.target.value)}
          />
          <InputField
            label="Registry"
            placeholder="I-TRACK"
            value={registry}
            onChange={(event) => setRegistry(event.target.value)}
          />
          <InputField
            label="Vintage (year)"
            type="number"
            min="1990"
            max="2100"
            value={vintage}
            onChange={(event) => setVintage(event.target.value)}
            error={errors?.vintage}
          />
          <InputField
            label="Retirement date"
            type="date"
            value={retirementDate}
            onChange={(event) => setRetirementDate(event.target.value)}
          />
          <fieldset className="md:col-span-4">
            <legend className="text-sm font-medium">Scope 2 Quality Criteria, one at a time</legend>
            <p className="text-xs text-ink-muted">
              The instrument is applied only when all eight are met; an unanswered criterion counts
              as not met until it is answered.
            </p>
            <ol className="mt-2 flex flex-col gap-1">
              {criteriaTitles.map((title, index) => (
                <li key={title} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="w-5 font-mono text-xs text-ink-muted">{index + 1}</span>
                  <select
                    aria-label={`Criterion ${index + 1}`}
                    value={criteria[index] === null ? '' : criteria[index] ? 'true' : 'false'}
                    onChange={(event) =>
                      setCriteria(
                        criteria.map((value, i) =>
                          i === index
                            ? event.target.value === ''
                              ? null
                              : event.target.value === 'true'
                            : value,
                        ),
                      )
                    }
                    className="rounded-lg border border-teal/20 bg-white/70 px-2 py-1 text-xs focus:ring-2 focus:ring-teal focus:outline-none"
                  >
                    <option value="">Not yet answered</option>
                    <option value="true">Met</option>
                    <option value="false">Not met</option>
                  </select>
                  <span className="min-w-0 flex-1">{title}</span>
                </li>
              ))}
            </ol>
          </fieldset>
          <div className="md:col-span-2">
            <InputField
              label="Quality notes"
              placeholder="Which criteria are met, and why any are not"
              value={qualityNotes}
              onChange={(event) => setQualityNotes(event.target.value)}
              maxLength={500}
            />
          </div>
          <div className="flex justify-end md:col-span-4">
            <Button type="submit" className="px-4 py-1.5 text-sm" busy={set.isPending}>
              Add instrument
            </Button>
          </div>
        </form>
      )}
      <ResidualMix inventory={inventory} editable={editable} />
      {evidenceFor && (
        <EvidenceModal
          owner={{ marketFactorId: evidenceFor.id }}
          organizationId={organizationId}
          title={`Evidence for the ${evidenceFor.facilityName} instrument`}
          editable={editable}
          onClose={() => setEvidenceFor(null)}
        />
      )}
    </GlassCard>
  )
}

/** The Scope 2 Guidance disclosure: is an adjusted residual mix available, and at what factor? */
function ResidualMix({ inventory, editable }: { inventory: Inventory; editable: boolean }) {
  const set = useSetResidualMix(inventory.id)
  const toast = useToast()
  const [available, setAvailable] = useState(
    inventory.residualMixAvailable === null ? '' : String(inventory.residualMixAvailable),
  )
  const [factor, setFactor] = useState(
    inventory.residualMixKgCo2ePerKwh === null ? '' : String(inventory.residualMixKgCo2ePerKwh),
  )
  const [factorError, setFactorError] = useState<string | undefined>()

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        if (available === '') return
        const invalid =
          available === 'true' ? checkNumber(factor, { label: 'Residual mix', min: 0 }) : undefined
        setFactorError(invalid)
        if (invalid) return
        set.mutate(
          {
            available: available === 'true',
            kgCo2ePerKwh: available === 'true' && factor !== '' ? Number(factor) : undefined,
          },
          {
            onSuccess: () => toast('Residual mix recorded.'),
            onError: (error) =>
              toast(problemDetail(error) ?? 'Could not record the residual mix.', 'error'),
          },
        )
      }}
      className="mt-4 grid gap-3 border-t border-teal/10 pt-4 md:grid-cols-3 md:items-end"
    >
      <SelectField
        label="Residual mix available"
        value={available}
        disabled={!editable}
        onChange={(event) => setAvailable(event.target.value)}
        hint="Every run reports market-based, so the Guidance requires this disclosure either way: an absent residual mix may mean double counting between consumers."
      >
        <option value="">Not yet stated</option>
        <option value="true">Yes, an adjusted residual mix is published</option>
        <option value="false">No residual mix is available</option>
      </SelectField>
      <InputField
        label="Residual mix, kg CO₂e per kWh"
        type="number"
        min="0"
        step="0.000001"
        value={factor}
        disabled={!editable || available !== 'true'}
        onChange={(event) => setFactor(event.target.value)}
        error={factorError ?? fieldErrors(set.error)?.kgCo2ePerKwh}
      />
      {editable && (
        <div className="flex justify-end">
          <Button type="submit" className="px-4 py-1.5 text-sm" busy={set.isPending}>
            Save residual mix
          </Button>
        </div>
      )}
    </form>
  )
}
