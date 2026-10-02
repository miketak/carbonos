import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@qa': new URL('./src', import.meta.url).pathname } },
  test: { include: ['src/**/*.test.ts'] },
})
