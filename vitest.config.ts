import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@lib': path.resolve('src/lib'),
      '@commands': path.resolve('src/lib/commands/own'),
    },
  },
  test: {
    include: ['src/test/**/*.test.ts'],
  },
});
