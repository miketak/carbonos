import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { StatusDot } from './StatusDot'
import { StatusPill } from './StatusPill'

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

test('the old pill tones map onto the dot tones', () => {
  render(
    <>
      <StatusPill tone="ready">Ready</StatusPill>
      <StatusPill tone="draft">Draft</StatusPill>
    </>,
  )
  expect(screen.getByText('Ready')).toHaveClass('text-ink')
  expect(screen.getByText('Draft')).toHaveClass('text-ink-muted')
})
