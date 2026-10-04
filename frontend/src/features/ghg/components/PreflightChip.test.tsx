import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { PreflightChip, summarizePreflight } from './PreflightChip'
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

const warning: ValidationReport = {
  ...passing,
  gates: passing.gates.map((gate) =>
    gate.gate === 'EMISSION_FACTOR'
      ? {
          ...gate,
          status: 'WARNINGS',
          findings: [
            {
              severity: 'WARNING',
              message: 'Diesel (GOIL CoA) is self-approved: nobody else could check it.',
            },
          ],
        }
      : gate,
  ),
}

const blocked: ValidationReport = {
  ready: false,
  freezeBlockers: [
    {
      activityId: 'act-1',
      recordRef: 'ACT-0012',
      activityType: 'Genset diesel',
      facilityName: 'Nkran',
      problem: 'is not classified',
    },
  ],
  gates: passing.gates.map((gate) =>
    gate.gate === 'CLASSIFICATION'
      ? {
          ...gate,
          status: 'BLOCKED',
          findings: [{ severity: 'ERROR', message: "'Genset diesel' is unclassified" }],
        }
      : gate,
  ),
}

test('a frozen inventory whose gates pass is ready to launch, and the popover lists the gates (spec 10)', async () => {
  const user = userEvent.setup()
  render(<PreflightChip report={passing} status="FROZEN" onResolve={vi.fn()} />)

  const chip = screen.getByRole('button', { name: 'Ready to launch' })
  expect(chip).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

  await user.click(chip)
  const popover = screen.getByRole('dialog', { name: 'Pre-flight checks' })
  expect(within(popover).getByText('Every gate passes.')).toBeInTheDocument()
  const gates = within(popover).getByRole('list', { name: 'Gates' })
  expect(within(gates).getAllByRole('listitem')).toHaveLength(5)
  expect(within(gates).getAllByText('Pass')).toHaveLength(5)
  expect(within(gates).getByText('Reporting boundary')).toBeInTheDocument()
  expect(within(popover).queryByRole('button', { name: /resolve/i })).toBeNull()

  await user.click(within(popover).getByRole('button', { name: 'Close' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('a warning turns the chip amber and prints the finding under its gate', async () => {
  const user = userEvent.setup()
  render(<PreflightChip report={warning} status="FROZEN" onResolve={vi.fn()} />)

  await user.click(screen.getByRole('button', { name: 'Ready to launch · 1 warning' }))
  const popover = screen.getByRole('dialog', { name: 'Pre-flight checks' })
  expect(within(popover).getByText('Every gate passes; 1 carries a warning.')).toBeInTheDocument()
  const gate = within(popover).getByText('Emission factors').closest('li')!
  expect(within(gate).getByText('Warn')).toBeInTheDocument()
  expect(
    within(gate).getByText('Diesel (GOIL CoA) is self-approved: nobody else could check it.'),
  ).toBeInTheDocument()
})

test('a blocking gate holds the launch, counts it, and the footer leads to the fix', async () => {
  const user = userEvent.setup()
  const onResolve = vi.fn()
  render(<PreflightChip report={blocked} status="DRAFT" onResolve={onResolve} />)

  await user.click(screen.getByRole('button', { name: 'Launch on hold · 1 blocking' }))
  const popover = screen.getByRole('dialog', { name: 'Pre-flight checks' })
  expect(
    within(popover).getByText('Classification is blocking. 1 record would also stop a freeze.'),
  ).toBeInTheDocument()
  const gate = within(popover).getByText('Classification').closest('li')!
  expect(within(gate).getByText('Hold')).toBeInTheDocument()
  expect(within(gate).getByText("'Genset diesel' is unclassified")).toBeInTheDocument()

  await user.click(within(popover).getByRole('button', { name: 'Resolve 1 record →' }))
  expect(onResolve).toHaveBeenCalledTimes(1)
  // the popover closes so the register the link leads to is in view
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('a base-year hold keeps the launch available and says what it holds (spec 06.1)', () => {
  const held = summarizePreflight(
    {
      ...passing,
      gates: [
        ...passing.gates.slice(0, 4),
        {
          gate: 'BASE_YEAR',
          status: 'BLOCKED',
          findings: [{ severity: 'ERROR', message: 'Base year flagged for recalculation.' }],
        },
      ],
    },
    'FROZEN',
  )
  expect(held.tone).toBe('warn')
  expect(held.label).toBe('Ready to launch')
  expect(held.summary).toBe('Base year holds the final designation; runs stay available.')
  expect(held.resolve).toBe('Resolve the findings →')
})

test('a published inventory says its runs are a record, not that it is ready (spec 05.1)', async () => {
  const user = userEvent.setup()
  render(<PreflightChip report={passing} status="PUBLISHED" onResolve={vi.fn()} />)

  expect(screen.queryByRole('button', { name: /ready to launch/i })).toBeNull()
  // the sentence stays on the screen without a click; the popover still lists the gates
  await user.click(
    screen.getByRole('button', {
      name: 'Published. The runs are a record; a correction restates the year.',
    }),
  )
  const popover = screen.getByRole('dialog', { name: 'Pre-flight checks' })
  expect(within(popover).getByText('Every gate passes.')).toBeInTheDocument()
  expect(within(popover).getAllByText('Pass')).toHaveLength(5)
  expect(within(popover).queryByRole('button', { name: /resolve/i })).toBeNull()
})
