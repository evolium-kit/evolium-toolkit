import { defineConfig } from 'vitest/config';

/** Testes das partes puras dos scripts de `tools/`, em Node. */
export default defineConfig({
  test: {
    name: 'tools',
    environment: 'node',
    include: ['tools/**/*.spec.mjs'],
    root: process.cwd(),
  },
});
