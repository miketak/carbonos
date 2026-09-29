/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import helpPlugin from './scripts/vite-plugin-help.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), helpPlugin()],
  build: {
    // scripts/check-bundle.mjs reads the manifest to hold the help within its budget
    manifest: true,
  },
  server: {
    proxy: {
      // Local dev: forward API calls to the Spring Boot backend
      '/api': 'http://localhost:8080',
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: './src/test/setup.ts',
    // parallel jsdom workers can starve slower machines; 5s default is too tight
    testTimeout: 30000,
  },
})
