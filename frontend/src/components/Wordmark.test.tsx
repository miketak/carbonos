import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Wordmark } from './Wordmark'

test('says the product name as a word, capitalised by style only', () => {
  render(<Wordmark />)
  const word = screen.getByText('CarbonOS')
  expect(word).toHaveClass('uppercase')
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

test('a dark surface gets a white wordmark', () => {
  render(<Wordmark surface="dark" size="splash" />)
  expect(screen.getByText('CarbonOS')).toHaveClass('text-white')
})
