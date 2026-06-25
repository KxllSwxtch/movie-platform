import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  cacheDir: '../../tmp/vite-web',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: [
      'lib/role-permissions.test.ts',
      'lib/__tests__/api-client.test.ts',
      'lib/__tests__/error-messages.test.ts',
      'lib/__tests__/format-utils.test.ts',
      'lib/__tests__/media-url.test.ts',
      'lib/__tests__/public-content-url.test.ts',
      'lib/__tests__/username.test.ts',
      'lib/__tests__/author-identity.test.ts',
      'lib/__tests__/content-normalizers.test.ts',
      'hooks/__tests__/use-series-structure.test.ts',
      'app/**/page.test.tsx',
      'components/content/__tests__/clip-card.test.tsx',
      'components/content/__tests__/short-card.test.tsx',
      'components/content/__tests__/series-card.test.tsx',
      'components/content/__tests__/tutorial-card.test.tsx',
    ],
    exclude: ['node_modules/**', '.next/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
