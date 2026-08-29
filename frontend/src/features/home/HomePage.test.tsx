import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderWithProviders } from '../../test/utils'
import { HomePage } from './HomePage'

test('renders the product name', () => {
  renderWithProviders(<HomePage />)
  expect(screen.getByRole('heading', { name: /carbonos/i })).toBeInTheDocument()
})
