import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@lib': path.resolve('src/lib'),
      '@commands': path.resolve('src/lib/commands/own'),
      '@testutil': path.resolve('src/test/util'),
    },
  },
  test: {
    include: ['src/test/**/*.test.ts'],
  },
});
