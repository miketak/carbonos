import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { StatusDot } from './StatusDot'

test('a status is a word beside a dot, never the dot alone', () => {
  render(
    <StatusDot tone="warning" title="Missing quantity, missing unit">
      Missing quantity +1
    </StatusDot>,
  )
  const status = screen.getByText('Missing quantity +1')
  expect(status).toHaveAttribute('title', 'Missing quantity, missing unit')
  expect(status).toHaveClass('text-warning')
  expect(status.querySelector('[aria-hidden="true"]')).not.toBeNull()
})
