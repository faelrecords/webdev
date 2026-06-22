import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: { target: 'es2022', sourcemap: true },
  test: { environment: 'jsdom', setupFiles: './src/test/setup.ts', exclude: [...configDefaults.exclude, 'tests/e2e/**'] },
});
