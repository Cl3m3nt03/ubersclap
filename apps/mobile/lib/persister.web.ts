import type {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client';

/**
 * Persistance du cache — variante web.
 *
 * Metro résout ce fichier à la place de persister.ts quand la cible est le
 * web (résolution de plateforme `.web.ts`). expo-sqlite n'y est pas
 * utilisable — son worker wasm ne passe pas le bundling — et la cible web ne
 * sert qu'aux captures de référence de la landing (SETUP_PLAN.md, phase 3)
 * et au développement rapide : localStorage suffit largement.
 *
 * L'app de production reste native ; le vrai persister SQLite (ADR-011) est
 * inchangé côté iOS/Android.
 */

const KEY = 'cadance.reactQuery';

export const sqlitePersister: Persister = {
  async persistClient(client: PersistedClient) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(client));
    } catch {
      // Quota dépassé ou stockage indisponible : le cache est un confort,
      // jamais une condition de fonctionnement.
    }
  },

  async restoreClient() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return undefined;
      return JSON.parse(raw) as PersistedClient;
    } catch {
      return undefined;
    }
  },

  async removeClient() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // Rien à faire : au pire la clé reste.
    }
  },
};
