import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'ubersclap.accessToken';
const REFRESH_KEY = 'ubersclap.refreshToken';

/**
 * Stockage des jetons.
 *
 * Keychain iOS / Keystore Android via SecureStore : un jeton de 30 jours qui
 * traine dans AsyncStorage est lisible par n'importe quelle sauvegarde non
 * chiffree et par un appareil roote.
 *
 * Le web n'a pas d'equivalent — SecureStore n'y est pas implemente. On y
 * retombe sur `localStorage`, ce qui est acceptable parce que le web n'est
 * qu'un mode de developpement ici, jamais une cible de production.
 */

let cachedAccessToken: string | null = null;
let cachedRefreshToken: string | null = null;
let loaded = false;

async function readItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function writeItem(key: string, value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (value === null) globalThis.localStorage?.removeItem(key);
      else globalThis.localStorage?.setItem(key, value);
    } catch {
      // Mode navigation privee : on garde les jetons en memoire pour la session.
    }
    return;
  }

  if (value === null) await SecureStore.deleteItemAsync(key);
  else await SecureStore.setItemAsync(key, value);
}

/** Charge les jetons persistes. A appeler une fois au demarrage. */
export async function loadTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  const [access, refresh] = await Promise.all([
    readItem(ACCESS_KEY),
    readItem(REFRESH_KEY),
  ]);

  cachedAccessToken = access;
  cachedRefreshToken = refresh;
  loaded = true;

  return { accessToken: access, refreshToken: refresh };
}

export async function saveTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  cachedAccessToken = tokens.accessToken;
  cachedRefreshToken = tokens.refreshToken;
  loaded = true;

  await Promise.all([
    writeItem(ACCESS_KEY, tokens.accessToken),
    writeItem(REFRESH_KEY, tokens.refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  cachedAccessToken = null;
  cachedRefreshToken = null;

  await Promise.all([writeItem(ACCESS_KEY, null), writeItem(REFRESH_KEY, null)]);
}

/**
 * Lecture synchrone depuis le cache memoire.
 *
 * L'intercepteur HTTP passe sur chaque requete : un aller-retour Keychain a
 * chaque appel couterait plus cher que la requete elle-meme.
 */
export function getAccessToken(): string | null {
  return cachedAccessToken;
}

export function getRefreshToken(): string | null {
  return cachedRefreshToken;
}

export function tokensLoaded(): boolean {
  return loaded;
}
