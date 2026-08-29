import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { CoverageMatrix } from './CoverageMatrix'
import type { Activity, Facility } from '../api'

const facilities: Facility[] = [
  {
    id: 'fac-1',
    name: 'Accra HQ',
    location: 'Accra',
    equitySharePercent: 100,
    controlled: true,
    createdAt: '2026-08-01T00:00:00Z',
  },
  {
    id: 'fac-2',
    name: 'Kumasi Processing',
    location: 'Kumasi',
    equitySharePercent: 60,
    controlled: false,
    createdAt: '2026-08-01T00:00:00Z',
  },
]

const activity = (id: string, facilityId: string, scope: Activity['scope']): Activity => ({
  id,
  facilityId,
  facilityName: 'irrelevant',
  emissionFactorId: 'ef-1',
  factorName: 'Diesel',
  scope,
  category: 'MOBILE_COMBUSTION',
  quantity: 1,
  unit: 'litre',
  activityDate: '2026-05-01',
  note: null,
  unweightedKgCo2e: 2.66,
})

test('renders nothing without facilities', () => {
  const { container } = render(<CoverageMatrix facilities={[]} activities={[]} />)
  expect(container).toBeEmptyDOMElement()
})

test('marks covered facility-scope cells and totals the percentage', () => {
  render(
    <CoverageMatrix
      facilities={facilities}
      activities={[
        activity('a1', 'fac-1', 'SCOPE_1'),
        activity('a2', 'fac-1', 'SCOPE_1'), // duplicate cell counts once
        activity('a3', 'fac-2', 'SCOPE_2'),
      ]}
    />,
  )

  // 2 covered cells of 6 → 33%
  expect(screen.getByText('33% complete')).toBeInTheDocument()
  expect(screen.getAllByText('covered')).toHaveLength(2)
  expect(screen.getAllByText('no data')).toHaveLength(4)
  expect(screen.getByText('Accra HQ')).toBeInTheDocument()
  expect(screen.getByText('Kumasi Processing')).toBeInTheDocument()
})
