import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/*/src/**/*.test.js', 'packages/*/src/**/*.spec.js', 'apps/*/src/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['packages/core/src/**/*.js'],
      exclude: ['**/node_modules/**', '**/*.test.js'],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
})
