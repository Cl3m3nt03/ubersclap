// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // Port de référence des consignes (CLAUDE.md racine : http://localhost:4321).
  server: { port: 4321 },
});
