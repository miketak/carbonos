import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { renderWithProviders } from '../test/utils'
import { NotFoundPage } from './NotFoundPage'

test('an unknown address says so and offers a way back', () => {
  renderWithProviders(<NotFoundPage />, { route: '/no-such-page', path: '*' })

  expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/app')
})
