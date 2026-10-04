import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { DetailHeader, SplitView, SummaryRow } from './SplitView'

test('a split view names its list and its detail, and a summary row marks the open record', async () => {
  const user = userEvent.setup()
  const open = vi.fn()
  render(
    <SplitView
      listLabel="Activity"
      detailLabel="Haul fleet diesel"
      list={
        <>
          <SummaryRow
            title="Haul fleet diesel"
            meta="Nyame Pit and Plant · 2025"
            value="11,923,608 L"
            selected
            onClick={open}
          />
          <SummaryRow
            title="Contract haulage diesel"
            meta="Nyame Pit and Plant · 2025"
            issue="Missing evidence"
            value="1,200,000 L"
            selected={false}
            attention
            onClick={open}
          />
        </>
      }
      detail={
        <DetailHeader
          eyebrow="Scope 1 / Mobile combustion"
          title="Haul fleet diesel"
          meta="ACT-0001 · Updated just now"
          controls={<button type="button">Close</button>}
        />
      }
    />,
  )
  expect(screen.getByRole('region', { name: 'Activity' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Haul fleet diesel' })).toBeInTheDocument()
  const current = screen.getByRole('button', { name: /Haul fleet diesel/ })
  expect(current).toHaveAttribute('aria-current', 'true')
  const next = screen.getByRole('button', { name: /Contract haulage diesel/ })
  expect(next).not.toHaveAttribute('aria-current')
  expect(screen.getByText('Missing evidence')).toHaveClass('text-warning')
  await user.click(next)
  expect(open).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('heading', { level: 2, name: 'Haul fleet diesel' })).toBeInTheDocument()
  expect(screen.getByText('Scope 1 / Mobile combustion')).toBeInTheDocument()
})
