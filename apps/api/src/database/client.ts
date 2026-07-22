import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = ReturnType<typeof createDatabase>;

export function createDatabase(url: string) {
  const client = postgres(url, {
    max: 10,
    // Les identifiants sont deja en snake_case dans le schema : pas de
    // transformation automatique, qui masquerait les erreurs de nommage.
    transform: undefined,
  });

  return drizzle(client, { schema });
}

export { schema };
