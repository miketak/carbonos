import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '../components/toast'

interface Options {
  /** Initial URL for the MemoryRouter. */
  route?: string
  /** Extra routes to render alongside the tested element (e.g. a /login stub). */
  extraRoutes?: { path: string; element: ReactElement }[]
  /** Path the tested element is mounted at (default: the initial route). */
  path?: string
}

export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { route = '/', extraRoutes = [], path = route } = options
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path={path} element={ui} />
              {extraRoutes.map((extra) => (
                <Route key={extra.path} path={extra.path} element={extra.element} />
              ))}
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>,
    ),
  }
}
