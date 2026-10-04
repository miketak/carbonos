import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Wordmark } from './Wordmark'

test('says the product name as one word to a reader, and draws it two-tone', () => {
  render(<Wordmark />)
  expect(screen.getByText('CarbonOS')).toHaveClass('sr-only')
  const drawn = screen.getByText('Carbon')
  expect(drawn).toHaveAttribute('aria-hidden', 'true')
  expect(drawn).not.toHaveClass('uppercase')
  expect(screen.getByText('OS')).toHaveClass('text-teal-deep')
  expect(screen.getByText('by ECORIV')).toBeInTheDocument()
  expect(document.querySelector('svg')).not.toBeNull()
})

test('the byline can be replaced or dropped, and the symbol left out', () => {
  const { rerender } = render(<Wordmark byline="by ECORIV Land Limited" />)
  expect(screen.getByText('by ECORIV Land Limited')).toBeInTheDocument()
  rerender(<Wordmark byline={false} symbol={false} />)
  expect(screen.queryByText(/by ECORIV/)).not.toBeInTheDocument()
  expect(document.querySelector('svg')).toBeNull()
})

test('a dark surface gets a white wordmark with a bright-teal OS', () => {
  render(<Wordmark surface="dark" size="splash" />)
  expect(screen.getByText('Carbon')).toHaveClass('text-white')
  expect(screen.getByText('OS')).toHaveClass('text-bright-teal')
})
