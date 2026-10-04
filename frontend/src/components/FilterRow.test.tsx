import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { FilterRow, FilterSelect, SearchField } from './FilterRow'

test('the search and the filters share one row and keep their labels for a reader', () => {
  render(
    <FilterRow search={<SearchField label="Search" placeholder="Find an activity" />}>
      <FilterSelect label="Facility">
        <option>All facilities</option>
      </FilterSelect>
      <FilterSelect label="Stream">
        <option>All streams</option>
      </FilterSelect>
      <FilterSelect label="Period">
        <option>All periods</option>
      </FilterSelect>
      <FilterSelect label="Sort by">
        <option>Period</option>
      </FilterSelect>
    </FilterRow>,
  )
  expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveAttribute(
    'placeholder',
    'Find an activity',
  )
  for (const label of ['Facility', 'Stream', 'Period', 'Sort by']) {
    expect(screen.getByRole('combobox', { name: label })).toBeInTheDocument()
  }
  const row = screen.getByRole('searchbox').closest('.grid')
  expect(row?.className).toContain('repeat(4,minmax(0,1fr))')
})
