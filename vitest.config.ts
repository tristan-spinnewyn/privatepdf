import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json-summary', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/__tests__/**',
        'src/types/**',
        'src/**/*.d.ts',
        'src/main.tsx',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
      },
    },
  },
});
