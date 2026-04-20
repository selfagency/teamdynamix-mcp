import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node18',
  outDir: 'dist',
  sourcemap: true,
  clean: true,
  dts: true,
});
