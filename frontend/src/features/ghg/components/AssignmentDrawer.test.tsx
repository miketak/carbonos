import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { renderWithProviders } from '../../../test/utils'
import { AssignmentsSection } from './AssignmentsSection'
import type { Assignment, AssignmentPage, EmissionFactor, Unit } from '../api'

vi.mock('../api', () => import('../testApiMock'))

import { listEmissionFactors, mockEmissionFactors } from '../testApiMock'
import {
  classifyAssignment,
  excludeAssignment,
  includeAssignment,
  listCoverage,
  listDensities,
  listFacilities,
  listOrganizationUnits,
  listStreams,
  searchAssignments,
} from '../api'

const units: Unit[] = [
  {
    code: 'litre',
    label: 'Litre',
    dimension: 'VOLUME',
    toCanonical: 0.001,
    custom: false,
    definition: null,
  },
  {
    code: 'm3',
    label: 'Cubic metre',
    dimension: 'VOLUME',
    toCanonical: 1,
    custom: false,
    definition: null,
  },
  {
    code: 'US-gallon',
    label: 'US gallon',
    dimension: 'VOLUME',
    toCanonical: 0.003785411784,
    custom: false,
    definition: null,
  },
  {
    code: 'kWh',
    label: 'Kilowatt-hour',
    dimension: 'ENERGY',
    toCanonical: 1,
    custom: false,
    definition: null,
  },
]

const kg: Unit = {
  code: 'kg',
  label: 'Kilogram',
  dimension: 'MASS',
  toCanonical: 1,
  custom: false,
  definition: null,
}

const tonne: Unit = {
  code: 'tonne',
  label: 'Tonne',
  dimension: 'MASS',
  toCanonical: 1000,
  custom: false,
  definition: null,
}

const unclassified: Assignment = {
  id: 'as-1',
  activityId: 'act-1',
  activityType: 'Diesel consumption',
  facilityId: 'fac-1',
  facilityName: 'Tema Plant',
  streamId: null,
  streamName: null,
  periodStart: '2025-01-01',
  periodEnd: '2025-01-31',
  quantity: 1200,
  unit: 'litre',
  dataQuality: 'MEASURED',
  dataQualityTier: 1,
  uncertaintyPercent: null,
  evidenceRef: 'INV-2938',
  streamKind: null,
  contractorOperated: null,
  defaultScope: null,
  defaultCategory: null,
  allowedCategories: null,
  included: true,
  exclusionReason: null,
  exclusionDetail: null,
  exclusionJustification: null,
  estimatedKgCo2e: null,
  estimateState: null,
  gas: null,
  classified: false,
  scope: null,
  category: null,
  leaseType: null,
  emissionFactorId: null,
  factorName: null,
  scopeJustification: null,
  proxy: false,
  proxyJustification: null,
  densityId: null,
  densityMaterial: null,
  densityKgPerLitre: null,
  inheritedLeaseType: null,
  suggestedFactorId: null,
  suggestedFactorName: null,
  inherited: false,
  changedSincePublication: null,
}

const classified: Assignment = {
  ...unclassified,
  classified: true,
  scope: 'SCOPE_1',
  category: 'MOBILE_COMBUSTION',
  emissionFactorId: 'ef-1',
  factorName: 'Diesel',
}

const dieselFactor: EmissionFactor = {
  id: 'ef-1',
  organizationId: 'org-1',
  name: 'Diesel',
  defaultScope: 'SCOPE_1',
  defaultCategory: 'MOBILE_COMBUSTION',
  scopeAgnostic: true,
  unit: 'litre',
  dimension: 'VOLUME',
  kgCo2ePerUnit: 2.66,
  gases: {
    co2: 2.6307,
    ch4: 0.0001,
    n2o: 0.0001,
    hfcs: 0,
    pfcs: 0,
    sf6: 0,
    nf3: 0,
    hfcsKg: 0,
    pfcsKg: 0,
  },
  biogenicCo2KgPerUnit: 0,
  gwpSet: 'AR5',
  blendGwpSource: null,
  blendComposition: null,
  ch4Fossil: true,
  co2eOnly: false,
  source: 'DEFRA 2025',
  sourceUrl: null,
  publicationYear: 2025,
  dataYear: 2025,
  validFrom: null,
  validTo: null,
  note: null,
  approved: true,
  pack: null,
  packs: [],
  packCode: null,
  gridRegion: null,
  reportingBasis: 'SCOPES',
  sourceCategory: null,
  sourceActivity: null,
  sourceDetail: null,
  sourceEdition: null,
  locallyEdited: false,
  supersededById: null,
  versions: [],
}

function pageOf(items: Assignment[]): AssignmentPage {
  return {
    items,
    page: 0,
    size: 50,
    total: items.length,
    included: items.filter((a) => a.included && a.classified).length,
    excluded: items.filter((a) => !a.included).length,
    unclassified: items.filter((a) => a.included && !a.classified).length,
  }
}

beforeEach(() => {
  vi.mocked(searchAssignments)
    .mockReset()
    .mockResolvedValue(pageOf([unclassified]))
  vi.mocked(listCoverage).mockReset().mockResolvedValue([])
  vi.mocked(listFacilities).mockReset().mockResolvedValue([])
  vi.mocked(listStreams).mockReset().mockResolvedValue([])
  vi.mocked(listDensities).mockReset().mockResolvedValue([])
  vi.mocked(listOrganizationUnits).mockReset().mockResolvedValue(units)
  vi.mocked(classifyAssignment).mockReset()
  vi.mocked(excludeAssignment).mockReset()
  vi.mocked(includeAssignment).mockReset()
  mockEmissionFactors([dieselFactor])
})

/**
 * The register with a record open in the drawer (spec 05.6). The drawer is
 * addressed by `?record=`, so the suite opens straight onto it, exactly as a
 * pasted link does.
 */
function renderDrawer(recordId = 'as-1', myRole: 'OWNER' | 'VERIFIER' = 'OWNER') {
  return renderWithProviders(
    <AssignmentsSection organizationId="org-1" inventoryId="inv-1" editable myRole={myRole} />,
    {
      route: `/app/ghg/org-1/inventories/inv-1?tab=records&record=${recordId}`,
      path: '/app/ghg/:organizationId/inventories/:inventoryId',
    },
  )
}

test('the drawer opens on the record named in the URL, with its place in the page', async () => {
  vi.mocked(searchAssignments).mockResolvedValue(
    pageOf([unclassified, { ...unclassified, id: 'as-2', activityType: 'Grid electricity' }]),
  )
  renderDrawer('as-2')

  const drawer = await screen.findByRole('dialog', { name: 'Grid electricity' })
  expect(within(drawer).getByText('2/2')).toBeInTheDocument()
  expect(within(drawer).getByRole('button', { name: 'Next record' })).toBeDisabled()
  expect(within(drawer).getByRole('button', { name: 'Previous record' })).toBeEnabled()
})

test('a record the filters left behind says so instead of rendering nothing', async () => {
  renderDrawer('as-missing')

  const drawer = await screen.findByRole('dialog', { name: /not in this view/i })
  expect(within(drawer).getByText(/not on the page in front of you/i)).toBeInTheDocument()
})

test('the picker cites each publication and hides unapproved rows (spec 02.3)', async () => {
  const user = userEvent.setup()
  mockEmissionFactors([
    dieselFactor,
    {
      ...dieselFactor,
      id: 'ef-own',
      organizationId: 'org-1',
      name: 'Diesel',
      source: 'GOIL fuel analysis certificate 2025-03',
      publicationYear: 2025,
      dataYear: 2025,
      pack: 'defra-2026',
      packs: ['defra-2026'],
      packCode: 'GOIL:diesel',
      approved: false,
    },
  ])
  renderDrawer()

  await user.click(await screen.findByRole('button', { name: /choose factor/i }))
  const picker = screen.getByLabelText('Classify Diesel consumption')
  // the two factors share a name and unit; the publication line tells them apart. Spec 02.10
  // retired the shared library, so the picker is one flat list with no tier headings.
  expect(
    await within(picker).findByText(/DEFRA 2025 \(published 2025, data year 2025\)/),
  ).toBeInTheDocument()
  expect(within(picker).queryByText('Shared library')).not.toBeInTheDocument()
  expect(within(picker).queryByText('This organization')).not.toBeInTheDocument()
  // the unapproved row is hidden until the toggle reveals it (FU-03: the server hides it)
  expect(within(picker).queryByText('unapproved')).not.toBeInTheDocument()
  await user.click(screen.getByLabelText(/Show unapproved/))
  expect(await within(picker).findByText('unapproved')).toBeInTheDocument()
  expect(within(picker).getByText(/GOIL fuel analysis certificate.*defra-2026/)).toBeInTheDocument()
  // the search covers the pack tag as well as the name and the publication
  await user.type(screen.getByLabelText('Search factors for Diesel consumption'), 'defra-2026')
  await waitFor(() =>
    expect(within(picker).queryByText(/DEFRA 2025 \(published 2025/)).not.toBeInTheDocument(),
  )
  expect(within(picker).getByText(/GOIL fuel analysis certificate/)).toBeInTheDocument()
})

test('the picker asks the server for its page and tells same-named factors apart (FU-03)', async () => {
  const user = userEvent.setup()
  // the three DEFRA butane rows differ only by unit; two of them convert from a litre record
  const butane = (id: string, unit: string, dimension: 'VOLUME' | 'MASS', value: number) => ({
    ...dieselFactor,
    id,
    organizationId: 'org-1',
    name: 'Gaseous fuels: Butane',
    unit,
    dimension,
    kgCo2ePerUnit: value,
    sourceCategory: 'Fuels',
    sourceActivity: 'Gaseous fuels / Butane',
    sourceDetail: null,
  })
  mockEmissionFactors([
    butane('ef-butane-litre', 'litre', 'VOLUME', 1.74533),
    butane('ef-butane-m3', 'm3', 'VOLUME', 1745.33),
    butane('ef-butane-tonne', 'tonne', 'MASS', 3033.38067),
  ])
  renderDrawer()

  await user.click(await screen.findByRole('button', { name: /choose factor/i }))
  const picker = screen.getByLabelText('Classify Diesel consumption')

  // the filters are the server's: the record is in litre, so only the volume rows are asked for
  await waitFor(() =>
    expect(listEmissionFactors).toHaveBeenCalledWith(
      'org-1',
      expect.objectContaining({ dimension: ['VOLUME'], includeUnapproved: false, size: 50 }),
    ),
  )
  const options = await within(picker).findAllByRole('button')
  expect(options).toHaveLength(2)
  // and no two options read alike: the value and the publisher's activity sit under the name
  expect(
    within(picker).getByText(/Gaseous fuels \/ Butane · 1.745 kg CO₂e \/ litre/),
  ).toBeInTheDocument()
  expect(
    within(picker).getByText(/Gaseous fuels \/ Butane · 1,745.33 kg CO₂e \/ m3/),
  ).toBeInTheDocument()

  // typing goes to the server rather than narrowing a list the browser already holds
  await user.type(screen.getByLabelText('Search factors for Diesel consumption'), 'butane')
  await waitFor(() =>
    expect(listEmissionFactors).toHaveBeenLastCalledWith(
      'org-1',
      expect.objectContaining({ q: 'butane' }),
    ),
  )
})

test('classifying a record sends the factor with its default scope and category', async () => {
  const user = userEvent.setup()
  vi.mocked(classifyAssignment).mockResolvedValue(classified)
  renderDrawer()

  // spec 05.5: no factor list renders until asked for; the picker opens on demand
  expect(screen.queryByLabelText('Classify Diesel consumption')).not.toBeInTheDocument()
  await user.click(await screen.findByRole('button', { name: /choose factor/i }))
  await user.click(
    within(await screen.findByLabelText('Classify Diesel consumption')).getByRole('button', {
      name: /Diesel/,
    }),
  )
  await waitFor(() =>
    expect(classifyAssignment).toHaveBeenCalledWith('as-1', {
      emissionFactorId: 'ef-1',
      scope: 'SCOPE_1',
      category: 'MOBILE_COMBUSTION',
    }),
  )
})

test('moving a scope-agnostic factor to scope 3 sends a scope 3 category', async () => {
  const user = userEvent.setup()
  vi.mocked(searchAssignments).mockResolvedValue(pageOf([classified]))
  vi.mocked(classifyAssignment).mockResolvedValue({
    ...classified,
    scope: 'SCOPE_3',
    category: 'PURCHASED_GOODS_SERVICES',
  })
  renderDrawer()

  await user.selectOptions(await screen.findByLabelText('Diesel consumption scope'), 'SCOPE_3')
  await waitFor(() =>
    expect(classifyAssignment).toHaveBeenCalledWith('as-1', {
      emissionFactorId: 'ef-1',
      scope: 'SCOPE_3',
      category: 'PURCHASED_GOODS_SERVICES',
    }),
  )
})

test('a scope that departs from the factor default is visible', async () => {
  vi.mocked(searchAssignments).mockResolvedValue(
    pageOf([{ ...classified, scope: 'SCOPE_3', category: 'PURCHASED_GOODS_SERVICES' }]),
  )
  renderDrawer()

  expect(await screen.findByText(/'Diesel' suggests Scope 1/)).toBeInTheDocument()
})

test('shows the unit conversion when the fact and factor units differ', async () => {
  vi.mocked(searchAssignments).mockResolvedValue(
    pageOf([{ ...classified, unit: 'US-gallon', quantity: 10000 }]),
  )
  renderDrawer()

  // 10,000 US-gallon -> ~37,854 litre, previewed next to the per-litre factor
  // (loosely matched so locale number grouping doesn't make the test brittle)
  expect(await screen.findByText(/US-gallon → .*litre × 2\.66 kg CO₂e\/litre/)).toBeInTheDocument()
})

test('a record in mass against a factor per litre converts through the chosen density (spec 02.2)', async () => {
  const user = userEvent.setup()
  vi.mocked(listOrganizationUnits).mockResolvedValue([...units, tonne, kg])
  vi.mocked(listDensities).mockResolvedValue([
    {
      id: 'den-1',
      organizationId: null,
      typical: true,
      material: 'Diesel',
      kgPerLitre: 0.84,
      source: 'Typical mid-range density',
      note: null,
    },
    {
      id: 'den-2',
      organizationId: 'org-1',
      typical: false,
      material: 'Diesel (GOIL)',
      kgPerLitre: 0.8325,
      source: 'GOIL CoA',
      note: null,
    },
  ])
  const inTonnes: Assignment = {
    ...classified,
    unit: 'tonne',
    quantity: 12,
    densityId: 'den-1',
    densityMaterial: 'Diesel',
    densityKgPerLitre: 0.84,
  }
  vi.mocked(searchAssignments).mockResolvedValue(pageOf([inTonnes]))
  vi.mocked(classifyAssignment).mockResolvedValue({ ...inTonnes, densityId: 'den-2' })
  renderDrawer()

  // 12 t = 12,000 kg / 0.84 = 14,285.71 litre, previewed with the density named
  expect(
    await screen.findByText(/12 tonne → 14,285\.7143 litre \(density of Diesel, 0\.84 kg\/litre\)/),
  ).toBeInTheDocument()
  await user.selectOptions(screen.getByLabelText('Diesel consumption density'), 'den-2')
  await waitFor(() =>
    expect(classifyAssignment).toHaveBeenCalledWith('as-1', {
      emissionFactorId: 'ef-1',
      scope: 'SCOPE_1',
      category: 'MOBILE_COMBUSTION',
      densityId: 'den-2',
    }),
  )
})

test('the drawer suggests the grid factor of the facility and names an inherited lease (spec 03.4)', async () => {
  const user = userEvent.setup()
  mockEmissionFactors([
    {
      ...dieselFactor,
      id: 'ef-grid',
      name: 'Grid electricity, Ghana (2024)',
      defaultScope: 'SCOPE_2',
      defaultCategory: 'PURCHASED_ELECTRICITY',
      scopeAgnostic: false,
      unit: 'kWh',
      dimension: 'ENERGY',
      kgCo2ePerUnit: 0.469,
      co2eOnly: true,
      source: 'Ember Yearly Electricity Data',
      dataYear: 2024,
      pack: 'ghana',
      packs: ['ghana'],
      packCode: 'GHANA:grid:GHA:2024',
      gridRegion: 'GHA',
    },
  ])
  vi.mocked(searchAssignments).mockResolvedValue(
    pageOf([
      {
        ...unclassified,
        activityType: 'Grid electricity',
        unit: 'kWh',
        quantity: 5000,
        suggestedFactorId: 'ef-grid',
        suggestedFactorName: 'Grid electricity, Ghana (2024)',
        inheritedLeaseType: 'OPERATING_LEASE_IN',
      },
    ]),
  )
  vi.mocked(classifyAssignment).mockResolvedValue({ ...classified, emissionFactorId: 'ef-grid' })
  renderDrawer()

  expect(await screen.findByText(/operating lease \(leased in\) inherited/)).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: /Suggested for this facility's grid/ }))
  await waitFor(() =>
    expect(classifyAssignment).toHaveBeenCalledWith('as-1', {
      emissionFactorId: 'ef-grid',
      scope: 'SCOPE_2',
      category: 'PURCHASED_ELECTRICITY',
    }),
  )
})

test('the scope select is enabled for a scope 2 factor and asks why the scope departs (finding F34)', async () => {
  const user = userEvent.setup()
  const gridFactor: EmissionFactor = {
    ...dieselFactor,
    id: 'ef-2',
    name: 'Grid electricity (Ghana)',
    defaultScope: 'SCOPE_2',
    defaultCategory: 'PURCHASED_ELECTRICITY',
    // the lock the screen kept: a factor that is not scope-agnostic (specs 04.1, 04.3, 04.7)
    scopeAgnostic: false,
    unit: 'kWh',
    dimension: 'ENERGY',
  }
  const onGrid: Assignment = {
    ...unclassified,
    activityType: 'Tenant electricity',
    unit: 'kWh',
    classified: true,
    emissionFactorId: 'ef-2',
    factorName: 'Grid electricity (Ghana)',
    scope: 'SCOPE_2',
    category: 'PURCHASED_ELECTRICITY',
  }
  const departed: Assignment = {
    ...onGrid,
    scope: 'SCOPE_3',
    category: 'DOWNSTREAM_LEASED_ASSETS',
  }
  mockEmissionFactors([dieselFactor, gridFactor])
  // the view refetches after the classification, and then the record sits in scope 3
  vi.mocked(searchAssignments)
    .mockResolvedValueOnce(pageOf([onGrid]))
    .mockResolvedValue(pageOf([departed]))
  vi.mocked(classifyAssignment).mockResolvedValue(departed)
  renderDrawer()

  const scope = await screen.findByLabelText('Tenant electricity scope')
  expect(scope).toBeEnabled()
  expect(screen.queryByText("This factor's scope is inherent.")).not.toBeInTheDocument()

  await user.selectOptions(scope, 'SCOPE_3')
  await waitFor(() =>
    expect(classifyAssignment).toHaveBeenCalledWith(
      'as-1',
      expect.objectContaining({ scope: 'SCOPE_3' }),
    ),
  )
  // spec 04.3: a scope that departs from the factor's default asks for a justification
  expect(await screen.findByLabelText('Tenant electricity scope justification')).toBeInTheDocument()
})

test('a methodology exclusion asks for a justification and an estimated magnitude (spec 04.4)', async () => {
  const user = userEvent.setup()
  vi.mocked(excludeAssignment).mockResolvedValue({
    ...unclassified,
    included: false,
    exclusionReason: 'METHODOLOGY',
    exclusionJustification: 'no published factor for sodium cyanide',
    estimatedKgCo2e: 8400,
  })
  renderDrawer()

  await user.click(await screen.findByRole('tab', { name: 'Exclude' }))
  await user.click(screen.getByRole('button', { name: 'Methodology exclusion' }))
  const form = screen.getByRole('form', { name: /justification/i })
  await user.type(
    within(form).getByLabelText('Justification'),
    'no published factor for sodium cyanide',
  )
  await user.type(within(form).getByLabelText(/Estimated emissions left out/), '8400')
  await user.click(within(form).getByRole('button', { name: 'Exclude' }))

  await waitFor(() =>
    expect(excludeAssignment).toHaveBeenCalledWith('as-1', {
      reason: 'METHODOLOGY',
      justification: 'no published factor for sodium cyanide',
      estimatedKgCo2e: 8400,
    }),
  )
})

test('an exclusion is sized, stated to emit nothing, or not estimated (spec 04.8)', async () => {
  const user = userEvent.setup()
  vi.mocked(excludeAssignment).mockResolvedValue({
    ...unclassified,
    included: false,
    exclusionReason: 'METHODOLOGY',
    exclusionJustification: 'no published factor for sodium cyanide; supplier study pending',
    estimateState: 'NOT_ESTIMATED',
  })
  renderDrawer()

  await user.click(await screen.findByRole('tab', { name: 'Exclude' }))
  await user.click(screen.getByRole('button', { name: 'Methodology exclusion' }))
  const form = screen.getByRole('form', { name: /justification/i })
  await user.type(
    within(form).getByLabelText('Justification'),
    'no published factor for sodium cyanide; supplier study pending',
  )
  // nothing can be sent until one of the three answers is given
  expect(within(form).getByRole('button', { name: 'Exclude' })).toBeDisabled()
  await user.click(within(form).getByLabelText('Not estimated'))
  expect(within(form).getByLabelText(/Estimated emissions left out/)).toBeDisabled()
  await user.click(within(form).getByRole('button', { name: 'Exclude' }))

  await waitFor(() =>
    expect(excludeAssignment).toHaveBeenCalledWith('as-1', {
      reason: 'METHODOLOGY',
      justification: 'no published factor for sodium cyanide; supplier study pending',
      notEstimated: true,
    }),
  )
})

test('a Montreal Protocol gas is excluded with the gas, and only on a mass record (spec 04.8)', async () => {
  const user = userEvent.setup()
  vi.mocked(listOrganizationUnits).mockResolvedValue([...units, kg])
  const topUp: Assignment = {
    ...unclassified,
    activityType: 'R-22 top-up',
    quantity: 85,
    unit: 'kg',
  }
  vi.mocked(searchAssignments).mockResolvedValue(pageOf([topUp]))
  vi.mocked(excludeAssignment).mockResolvedValue({
    ...topUp,
    included: false,
    exclusionReason: 'OUTSIDE_SCOPES_NON_KYOTO',
    exclusionJustification: 'HCFC-22 is a Montreal Protocol gas, reported outside the scopes',
    gas: 'HCFC-22',
  })
  renderDrawer()

  await user.click(await screen.findByRole('tab', { name: 'Exclude' }))
  await user.click(
    screen.getByRole('button', { name: 'Outside the scopes: Montreal Protocol gas' }),
  )
  const form = screen.getByRole('form', { name: /justification/i })
  await user.type(
    within(form).getByLabelText('Justification'),
    'HCFC-22 is a Montreal Protocol gas, reported outside the scopes',
  )
  // the form asks for the gas, never a magnitude
  expect(within(form).queryByLabelText(/Estimated emissions left out/)).not.toBeInTheDocument()
  await user.type(within(form).getByLabelText('Gas'), 'HCFC-22')
  await user.click(within(form).getByRole('button', { name: 'Exclude' }))

  await waitFor(() =>
    expect(excludeAssignment).toHaveBeenCalledWith('as-1', {
      reason: 'OUTSIDE_SCOPES_NON_KYOTO',
      justification: 'HCFC-22 is a Montreal Protocol gas, reported outside the scopes',
      gas: 'HCFC-22',
    }),
  )
})

test('the Montreal reason is not offered for a record that is not a mass (spec 04.8)', async () => {
  const user = userEvent.setup()
  renderDrawer()

  await user.click(await screen.findByRole('tab', { name: 'Exclude' }))
  expect(
    screen.queryByRole('button', { name: 'Outside the scopes: Montreal Protocol gas' }),
  ).not.toBeInTheDocument()
})

test('a verifier reads the classification and is not offered the exclusion form (spec 01.4)', async () => {
  const user = userEvent.setup()
  vi.mocked(searchAssignments).mockResolvedValue(pageOf([classified]))
  renderDrawer('as-1', 'VERIFIER')

  const drawer = await screen.findByRole('dialog', { name: 'Diesel consumption' })
  // the factor arrives on its own query, so the classification waits for it
  expect(await within(drawer).findByLabelText('Diesel consumption scope')).toBeDisabled()
  expect(within(drawer).queryByRole('button', { name: /change factor/i })).not.toBeInTheDocument()
  await user.click(within(drawer).getByRole('tab', { name: 'Exclude' }))
  expect(within(drawer).getByText(/You are reading\./)).toBeInTheDocument()
  expect(within(drawer).queryByRole('form')).not.toBeInTheDocument()
})

test('an excluded record states its decision and offers the way back in (DR-03)', async () => {
  const user = userEvent.setup()
  vi.mocked(searchAssignments).mockResolvedValue(
    pageOf([
      {
        ...unclassified,
        included: false,
        exclusionReason: 'OUTSIDE_BOUNDARY',
        exclusionDetail: 'Tema JV: member from 2025-07-01',
      },
    ]),
  )
  vi.mocked(includeAssignment).mockResolvedValue(unclassified)
  renderDrawer()

  const drawer = await screen.findByRole('dialog', { name: 'Diesel consumption' })
  expect(within(drawer).getByText(/Tema JV: member from 2025-07-01/)).toBeInTheDocument()
  expect(within(drawer).queryByRole('tab', { name: 'Classify' })).not.toBeInTheDocument()
  await user.click(within(drawer).getByRole('button', { name: /Re-include Diesel consumption/ }))
  await waitFor(() => expect(includeAssignment).toHaveBeenCalledWith('as-1'))
})
