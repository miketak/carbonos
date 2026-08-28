import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { HomePage } from './HomePage'

test('renders the product name', () => {
  render(<HomePage />)
  expect(screen.getByRole('heading', { name: /carbonos/i })).toBeInTheDocument()
})
