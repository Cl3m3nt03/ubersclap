import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

/**
 * Applique les migrations en attente.
 *
 * Connexion dediee avec `max: 1` : une migration ne doit jamais s'executer en
 * parallele d'elle-meme.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL manquant. Copiez .env.example vers .env.');
    process.exit(1);
  }

  const client = postgres(url, { max: 1 });

  try {
    await migrate(drizzle(client), { migrationsFolder: './drizzle' });
    console.log('Migrations appliquées.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Échec des migrations :', error);
  process.exit(1);
});
