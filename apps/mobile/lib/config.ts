import Constants from 'expo-constants';

const DEFAULT_API_PORT = 3000;

/**
 * URL de base de l'API (ADR-010 : tout est sous /v1, pas de /api en plus).
 *
 * En developpement, `localhost` ne veut rien dire depuis un telephone : c'est
 * le telephone lui-meme. On deduit donc l'adresse LAN du poste depuis celle du
 * serveur Metro, qui est forcement joignable puisque l'app vient d'en etre
 * telechargee. Sans ca, l'app tourne dans Expo Go mais aucun appel n'aboutit.
 *
 * `EXPO_PUBLIC_API_URL` reste prioritaire : c'est ce qui sert en preprod et en
 * production, et ce qui permet de pointer un backend distant en local.
 */
export const API_BASE_URL = resolveApiBaseUrl();

function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:${DEFAULT_API_PORT}/v1`;

  return `http://localhost:${DEFAULT_API_PORT}/v1`;
}
