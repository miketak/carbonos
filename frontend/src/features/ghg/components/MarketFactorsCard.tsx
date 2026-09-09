import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../../components/Button'
import { InputField, SelectField } from '../../../components/Field'
import { GlassCard } from '../../../components/GlassCard'
import { useToast } from '../../../components/toast'
import { problemDetail } from '../../../lib/api'
import { instrumentLabels } from '../format'
import {
  useFacilitiesQuery,
  useMarketFactorsQuery,
  useRemoveMarketFactor,
  useSetMarketFactor,
  useSetResidualMix,
} from '../useGhg'
import type { Inventory, MarketInstrument } from '../api'

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
  const [meetsCriteria, setMeetsCriteria] = useState(true)
  const [qualityNotes, setQualityNotes] = useState('')

  const chosenFacility = facilityId || facilities[0]?.id || ''

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!chosenFacility) return
    set.mutate(
      {
        facilityId: chosenFacility,
        input: {
          instrumentType: instrument,
          kgCo2ePerKwh: Number(factor),
          source,
          meetsQualityCriteria: meetsCriteria,
          qualityNotes: qualityNotes.trim() === '' ? undefined : qualityNotes,
        },
      },
      {
        onSuccess: (saved) => {
          setFactor('')
          setSource('')
          setQualityNotes('')
          toast(`Instrument recorded for ${saved.facilityName}.`)
        },
        onError: (error) =>
          toast(problemDetail(error) ?? 'Could not save the instrument.', 'error'),
      },
    )
  }

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl">Market-based scope 2 instruments</h2>
      <p className="text-sm text-ink-muted">
        When any facility has a contractual instrument, the report shows scope 2 location-based and
        market-based side by side. An instrument that does not meet the Scope 2 Quality Criteria is
        replaced by the residual mix, or by the location-based figure when none is available.
      </p>
      {factorsQuery.data && factorsQuery.data.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-teal/10 text-xs text-ink-muted uppercase">
                <th className="px-3 py-2 font-semibold">Facility</th>
                <th className="px-3 py-2 font-semibold">Instrument</th>
                <th className="px-3 py-2 font-semibold">kg CO₂e/kWh</th>
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
                  <td className="px-3 py-2 text-ink-muted">{entry.source}</td>
                  <td className="px-3 py-2">
                    {entry.meetsQualityCriteria ? 'Met' : 'Not met'}
                    {entry.qualityNotes && (
                      <span className="block text-xs text-ink-muted">{entry.qualityNotes}</span>
                    )}
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
          No instruments recorded: scope 2 is reported location-based only.
        </p>
      )}
      {editable && facilities.length > 0 && (
        <form onSubmit={submit} className="mt-4 grid gap-3 md:grid-cols-4 md:items-end">
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
            required
          />
          <InputField
            label="Source"
            placeholder="Supplier certificate 2025"
            value={source}
            onChange={(event) => setSource(event.target.value)}
            required
          />
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input
              type="checkbox"
              checked={meetsCriteria}
              onChange={(event) => setMeetsCriteria(event.target.checked)}
              className="size-4 accent-teal"
            />
            Meets the eight Scope 2 Quality Criteria
          </label>
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
      {(factorsQuery.data?.length ?? 0) > 0 && (
        <ResidualMix inventory={inventory} editable={editable} />
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

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (available === '') return
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
        hint="The Guidance requires the disclosure either way: an absent residual mix may mean double counting between consumers."
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
