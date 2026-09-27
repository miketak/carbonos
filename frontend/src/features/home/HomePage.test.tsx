import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { HomePage } from './HomePage'
import { TIERS } from './landing/landingData'

test('leads with the one-liner and the wordmark', () => {
  renderWithProviders(<HomePage />)
  expect(
    screen.getByRole('heading', { level: 1, name: /survives verification/i }),
  ).toBeInTheDocument()
  expect(screen.getAllByText('CarbonOS').length).toBeGreaterThan(0)
  expect(document.title).toMatch(/CarbonOS/)
})

test('falls back to the static illustration without WebGL', () => {
  renderWithProviders(<HomePage />)
  expect(screen.getByRole('img', { name: /scope 1, scope 2 and scope 3/i })).toBeInTheDocument()
})

test('publishes every tier with its cedi price', () => {
  renderWithProviders(<HomePage />)
  for (const tier of TIERS) {
    const card = screen.getByRole('article', { name: tier.name })
    expect(within(card).getByText(tier.price)).toBeInTheDocument()
  }
})

test('the gas table ties to the total', async () => {
  renderWithProviders(<HomePage />)
  await userEvent.click(screen.getByRole('button', { name: 'Table view' }))
  const total = screen.getByRole('row', { name: /^Total/ })
  expect(within(total).getByText('86,412')).toBeInTheDocument()
})

test('the hero button opens the form titled for the pilot', async () => {
  renderWithProviders(<HomePage />)
  await userEvent.click(screen.getAllByRole('button', { name: 'Ask about the pilot' })[0])
  expect(screen.getByRole('dialog', { name: 'Ask about the pilot' })).toBeInTheDocument()
})

test('the nav button opens the plain access form', async () => {
  renderWithProviders(<HomePage />)
  await userEvent.click(screen.getAllByRole('button', { name: 'Request access' })[0])
  expect(screen.getByRole('dialog', { name: 'Request access' })).toBeInTheDocument()
})
