import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { Drawer } from './Drawer'

test('a drawer names itself, focuses its first control, closes on Esc and gives focus back', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(
    <div>
      <button type="button">Opener</button>
      <Drawer eyebrow="Edit activity" title="Purchased electricity" onClose={onClose}>
        <input aria-label="Quantity" />
      </Drawer>
    </div>,
  )
  const drawer = screen.getByRole('dialog', { name: 'Purchased electricity' })
  expect(drawer).not.toHaveAttribute('aria-modal')
  expect(screen.getByText('Edit activity')).toBeInTheDocument()
  expect(screen.getByLabelText('Quantity')).toHaveFocus()

  await user.keyboard('{Escape}')
  expect(onClose).toHaveBeenCalledTimes(1)
  await user.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClose).toHaveBeenCalledTimes(2)
})
