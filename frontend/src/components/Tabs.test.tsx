import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { Tabs } from './Tabs'

test('tabs mark the selected one, show counts, and the arrow keys move the selection', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(
    <Tabs
      label="Readiness"
      value="all"
      onChange={onChange}
      tabs={[
        { value: 'all', label: 'All records', count: 18 },
        { value: 'attention', label: 'Needs attention', count: 4 },
      ]}
    />,
  )
  const all = screen.getByRole('tab', { name: 'All records 18' })
  expect(all).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByRole('tab', { name: 'Needs attention 4' })).toHaveAttribute(
    'aria-selected',
    'false',
  )
  all.focus()
  await user.keyboard('{ArrowRight}')
  expect(onChange).toHaveBeenLastCalledWith('attention')
  await user.click(screen.getByRole('tab', { name: 'Needs attention 4' }))
  expect(onChange).toHaveBeenLastCalledWith('attention')
})
