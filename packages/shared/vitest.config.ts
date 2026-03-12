import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'shared',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: true,
    clearMocks: true,
    restoreMocks: true,
  },
})
