import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

// vitest runs with globals: false, so testing-library cannot register its
// own auto-cleanup; without this the DOM accumulates across tests in a file.
afterEach(() => {
  cleanup()
})

// findBy*/waitFor default to 1s, which the first render in a file can exceed
// when the runner shares a loaded machine; keep waits generous, not flaky.
configure({ asyncUtilTimeout: 10000 })
