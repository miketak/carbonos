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
      // Local dev: /help/ reaches `make help-serve` (MkDocs on 8001, served
      // at its root), so the in-app Help link works on a dev machine too
      '/help': {
        target: 'http://127.0.0.1:8001',
        rewrite: (path) => path.replace(/^\/help/, ''),
      },
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
