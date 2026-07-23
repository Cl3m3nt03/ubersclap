import * as SQLite from 'expo-sqlite';
import type {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client';

/**
 * Persistance du cache TanStack Query en SQLite local (ADR-011).
 *
 * Le cache — planning, clients, courses — et surtout la file des mutations en
 * pause doivent survivre a la fermeture de l'app. Un chauffeur qui cree une
 * course dans un parking souterrain puis tue l'app avant de retrouver du reseau
 * ne doit pas perdre sa saisie : la mutation en pause est serialisee ici et
 * rejouee au prochain demarrage en ligne.
 *
 * Une seule ligne KV suffit : TanStack serialise tout le client en un objet.
 * SQLite plutot qu'AsyncStorage — plafonne a 6 Mo sur Android — pour ne jamais
 * tronquer silencieusement la file de mutations.
 */

const DATABASE = 'ubersclap.db';
const KEY = 'reactQuery';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE);
      await db.execAsync(
        'CREATE TABLE IF NOT EXISTS query_cache (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);',
      );
      return db;
    })();
  }

  return dbPromise;
}

export const sqlitePersister: Persister = {
  async persistClient(client: PersistedClient) {
    const db = await getDb();
    await db.runAsync(
      'INSERT OR REPLACE INTO query_cache (key, value) VALUES (?, ?);',
      KEY,
      JSON.stringify(client),
    );
  },

  async restoreClient() {
    const db = await getDb();
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM query_cache WHERE key = ?;',
      KEY,
    );

    if (!row) return undefined;

    try {
      return JSON.parse(row.value) as PersistedClient;
    } catch {
      // Blob corrompu : mieux vaut repartir d'un cache vide qu'un crash au
      // demarrage. Les donnees serveur seront refetchees, rien n'est perdu.
      return undefined;
    }
  },

  async removeClient() {
    const db = await getDb();
    await db.runAsync('DELETE FROM query_cache WHERE key = ?;', KEY);
  },
};
