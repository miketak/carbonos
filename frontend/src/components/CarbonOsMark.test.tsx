import { render } from '@testing-library/react'
import { expect, test } from 'vitest'
import favicon from '../../public/favicon.svg?raw'
import { CarbonOsMark } from './CarbonOsMark'
import {
  MARK_BARS,
  MARK_BAR_HEIGHT,
  MARK_GRADIENT,
  MARK_RING,
  MARK_RING_STROKE,
} from './carbonOsMarkGeometry'

test('is decoration unless titled, and two marks never share a gradient', () => {
  const { container } = render(
    <>
      <CarbonOsMark />
      <CarbonOsMark />
      <CarbonOsMark title="CarbonOS" />
    </>,
  )
  const marks = container.querySelectorAll('svg')
  expect(marks[0]).toHaveAttribute('aria-hidden', 'true')
  expect(marks[2]).toHaveAttribute('role', 'img')
  const ids = [...container.querySelectorAll('linearGradient')].map((g) => g.id)
  expect(new Set(ids).size).toBe(3)
})

test('the favicon is drawn from the same numbers', () => {
  expect(favicon).toContain(`d="${MARK_RING}"`)
  expect(favicon).toContain(`stroke-width="${MARK_RING_STROKE}"`)
  for (const [, colour] of MARK_GRADIENT) expect(favicon).toContain(colour)
  for (const bar of MARK_BARS) {
    expect(favicon).toContain(
      `<rect x="${bar.x}" y="${bar.y}" width="${bar.width}" height="${MARK_BAR_HEIGHT}"`,
    )
  }
})
