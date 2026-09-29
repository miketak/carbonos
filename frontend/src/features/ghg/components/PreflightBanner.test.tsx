import { render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { PreflightBanner } from './PreflightBanner'
import type { ValidationReport } from '../api'

const passing: ValidationReport = {
  ready: true,
  freezeBlockers: [],
  gates: [
    { gate: 'BOUNDARY', status: 'PASSED', findings: [] },
    { gate: 'COMPLETENESS', status: 'PASSED', findings: [] },
    { gate: 'CLASSIFICATION', status: 'PASSED', findings: [] },
    { gate: 'EMISSION_FACTOR', status: 'PASSED', findings: [] },
    { gate: 'BASE_YEAR', status: 'PASSED', findings: [] },
  ],
}

test('a frozen inventory whose gates pass is ready to launch a run (spec 05.6)', () => {
  render(<PreflightBanner report={passing} status="FROZEN" onResolve={vi.fn()} />)

  expect(screen.getByText('Ready to launch a run')).toBeInTheDocument()
  expect(screen.getByText('Every gate passes.')).toBeInTheDocument()
})

test('a published inventory says its runs are a record, not that it is ready (spec 05.1)', () => {
  render(<PreflightBanner report={passing} status="PUBLISHED" onResolve={vi.fn()} />)

  expect(
    screen.getByText('Published. The runs are a record; a correction restates the year.'),
  ).toBeInTheDocument()
  expect(screen.queryByText('Ready to launch a run')).toBeNull()
  expect(screen.queryByRole('button', { name: /resolve/i })).toBeNull()
})
