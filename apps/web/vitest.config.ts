import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'web',
    environment: 'jsdom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    clearMocks: true,
    restoreMocks: true,
  },
})
