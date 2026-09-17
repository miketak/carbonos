import { useEffect } from 'react'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { expect, test } from 'vitest'
import { useInventoryFilters } from './inventoryFilters'
import type { InventoryFilters } from './inventoryFilters'

/**
 * The URL is the workbench's state (spec 05.6), so these assert the contract
 * that makes a link reopen a view: what is read, what is written, and what is
 * left out of the address bar.
 */
let set: (patch: Partial<InventoryFilters>) => void
let filters: InventoryFilters
let search: string

function Probe() {
  const hook = useInventoryFilters()
  const location = useLocation()
  // published after the render rather than during it: assigning to a module
  // variable while rendering is a side effect, and the linter is right about it
  useEffect(() => {
    filters = hook.filters
    set = hook.set
    search = location.search
  })
  return <pre data-testid="query">{JSON.stringify(hook.query)}</pre>
}

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/i/:inventoryId" element={<Probe />} />
      </Routes>
    </MemoryRouter>,
  )
}

function query() {
  return JSON.parse(screen.getByTestId('query').textContent ?? '{}')
}

test('an empty address is the default view', () => {
  renderAt('/i/inv-1')

  expect(filters.tab).toBe('records')
  expect(filters.page).toBe(0)
  expect(filters.record).toBeNull()
  // undefined is dropped by queryString, so the request carries only the page
  expect(query()).toEqual({ page: 0, size: 50 })
})

test('the address is read back into the filters and the query', () => {
  renderAt('/i/inv-1?tab=boundary&q=diesel&status=UNCLASSIFIED&scope=SCOPE_1&facility=fac-1&page=2')

  expect(filters.tab).toBe('boundary')
  expect(filters.q).toBe('diesel')
  expect(filters.status).toBe('UNCLASSIFIED')
  expect(query()).toMatchObject({
    q: 'diesel',
    status: 'UNCLASSIFIED',
    scope: 'SCOPE_1',
    facilityId: 'fac-1',
    page: 2,
    size: 50,
  })
})

test('a value the enum does not know falls back rather than filtering wrongly', () => {
  renderAt('/i/inv-1?tab=nonsense&status=MAYBE&scope=SCOPE_9&lease=SOMETHING')

  expect(filters.tab).toBe('records')
  expect(filters.status).toBe('')
  expect(filters.scope).toBe('')
  expect(filters.lease).toBe('')
})

test('a default is deleted from the address rather than written to it', () => {
  renderAt('/i/inv-1?tab=runs&q=lpg')
  act(() => set({ tab: 'records', q: '' }))

  expect(search).toBe('')
})

test('changing what is listed starts again at the first page', () => {
  renderAt('/i/inv-1?page=4')
  act(() => set({ status: 'EXCLUDED' }))

  expect(filters.page).toBe(0)
  expect(search).toContain('status=EXCLUDED')
  expect(search).not.toContain('page=')
})

test('paging and opening a record leave the page alone', () => {
  renderAt('/i/inv-1?status=EXCLUDED&page=2')
  act(() => set({ record: 'asg-1' }))

  expect(filters.page).toBe(2)
  expect(filters.record).toBe('asg-1')
  expect(search).toContain('page=2')
})

test('the tab travels with the filters, so a reload keeps the reviewer where they were', () => {
  renderAt('/i/inv-1')
  act(() => set({ tab: 'method' }))

  expect(search).toContain('tab=method')
})
