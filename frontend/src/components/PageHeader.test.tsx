import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import { Chip } from './Chip'
import { PageHeader } from './PageHeader'

test('a page header carries the way back, the trail, the title and its actions', () => {
  render(
    <MemoryRouter>
      <PageHeader
        back={{ to: '/app/ghg/1/inventories' }}
        crumbs={[{ label: 'Inventories', to: '/app/ghg/1/inventories' }, { label: 'FY2025' }]}
        status="Boundary version 3"
        title="FY2025"
        chips={<Chip tone="primary">Final</Chip>}
        subtitle="2025-01-01 → 2025-12-31"
        actions={<button type="button">Publish</button>}
      />
    </MemoryRouter>,
  )
  expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute(
    'href',
    '/app/ghg/1/inventories',
  )
  expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
  expect(screen.getByText('FY2025', { selector: '[aria-current="page"]' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1, name: 'FY2025' })).toBeInTheDocument()
  expect(screen.getByText('Final')).toBeInTheDocument()
  expect(screen.getByText('Boundary version 3')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument()
})

test('without a trail the header is the title row alone', () => {
  render(
    <MemoryRouter>
      <PageHeader title="Facilities" />
    </MemoryRouter>,
  )
  expect(screen.queryByRole('link', { name: 'Back' })).not.toBeInTheDocument()
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { level: 1, name: 'Facilities' })).toBeInTheDocument()
})
