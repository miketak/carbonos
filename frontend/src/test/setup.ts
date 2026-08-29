import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// vitest runs with globals: false, so testing-library cannot register its
// own auto-cleanup; without this the DOM accumulates across tests in a file.
afterEach(() => {
  cleanup()
})
