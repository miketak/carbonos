/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
    testTimeout: 15000,
  },
})
