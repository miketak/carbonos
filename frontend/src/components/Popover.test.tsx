import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test } from 'vitest'
import { Popover } from './Popover'

function Checks() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button type="button">Elsewhere</button>
      <Popover
        open={open}
        onClose={() => setOpen(false)}
        label="Pre-flight checks"
        trigger={
          <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            Ready to launch
          </button>
        }
      >
        <p>Every gate passes.</p>
      </Popover>
    </div>
  )
}

test('a popover opens under its trigger and closes on Esc, outside, or the trigger', async () => {
  const user = userEvent.setup()
  render(<Checks />)
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Ready to launch' }))
  const dialog = screen.getByRole('dialog', { name: 'Pre-flight checks' })
  expect(dialog).not.toHaveAttribute('aria-modal')
  expect(screen.getByText('Every gate passes.')).toBeInTheDocument()

  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Ready to launch' })).toHaveFocus()

  await user.click(screen.getByRole('button', { name: 'Ready to launch' }))
  await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Ready to launch' }))
  await user.click(screen.getByRole('button', { name: 'Ready to launch' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
