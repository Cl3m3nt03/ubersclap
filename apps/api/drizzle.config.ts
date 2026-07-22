import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  // Les migrations sont relues avant d'etre appliquees : jamais de `push` sur
  // une base qui contient des donnees comptables.
  strict: true,
  verbose: true,
});
