import angular from '@analogjs/vite-plugin-angular';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [angular()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    allowOnly: false,
    environment: 'jsdom',
    globals: true,
    include: ['test/**/*.spec.ts'],
    setupFiles: ['test/setup.ts'],
  },
});
