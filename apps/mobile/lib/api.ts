import { API_BASE_URL } from './config';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from './tokens';
import { uuidv7 } from './uuid';

/** Erreur renvoyee par l'API — forme imposee par ADR-010. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Panne reseau : la requete n'a jamais atteint le serveur. */
export class NetworkError extends Error {
  constructor(readonly cause?: unknown) {
    super('Pas de connexion');
    this.name = 'NetworkError';
  }
}

export function isOfflineError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  /**
   * Cle d'idempotence (ADR-010). Obligatoire sur les POST cote serveur.
   * Fournie explicitement quand la mutation est rejouee depuis la file
   * offline : rejouer avec une nouvelle cle recreerait un doublon.
   */
  idempotencyKey?: string;
  /** Requetes publiques : login, register, refresh. */
  anonymous?: boolean;
  signal?: AbortSignal;
}

// -------------------------------------------------------- Session expiree

type SessionExpiredListener = () => void;

let sessionExpiredListener: SessionExpiredListener | null = null;

/**
 * Le client HTTP ne connait pas la navigation.
 *
 * Quand le refresh echoue, la session est morte et l'app doit revenir a
 * l'ecran de connexion. Plutot que d'importer le routeur ici — ce qui
 * couplerait la couche reseau a l'UI — on previent le provider d'auth, qui
 * sait quoi faire.
 */
export function onSessionExpired(listener: SessionExpiredListener): () => void {
  sessionExpiredListener = listener;
  return () => {
    if (sessionExpiredListener === listener) sessionExpiredListener = null;
  };
}

// ---------------------------------------------------------------- Refresh

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Rafraichit la session, une seule fois a la fois.
 *
 * Au retour de veille, cinq requetes partent ensemble et prennent cinq 401.
 * Sans ce verrou, cinq refresh partiraient en parallele : la rotation cote
 * serveur (ADR de securite) revoquerait les jetons les uns apres les autres et
 * declencherait la detection de rejeu, qui deconnecte toutes les sessions.
 */
async function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = (await response.json()) as {
        accessToken: string;
        refreshToken: string;
      };

      await saveTokens(data);
      return true;
    } catch {
      // Panne reseau : la session n'est pas invalide, elle est injoignable.
      // On ne purge rien, l'appel sera retente plus tard.
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

// ------------------------------------------------------------- Requetes

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, query, anonymous = false, signal } = options;

  const idempotencyKey =
    method === 'POST' ? (options.idempotencyKey ?? uuidv7()) : undefined;

  const send = async (): Promise<Response> => {
    const headers: Record<string, string> = { Accept: 'application/json' };

    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

    if (!anonymous) {
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }

    try {
      return await fetch(buildUrl(path, query), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });
    } catch (cause) {
      // `fetch` ne rejette que si la requete n'est jamais partie. Un 500 est
      // une reponse ; ceci est une absence de reseau.
      throw new NetworkError(cause);
    }
  };

  let response = await send();

  if (response.status === 401 && !anonymous) {
    const refreshed = await refreshSession();

    if (refreshed) {
      // Meme cle d'idempotence au rejeu : le serveur a pu traiter la premiere
      // requete avant de repondre 401, la rejouer ne doit rien dupliquer.
      response = await send();
    } else {
      await clearTokens();
      sessionExpiredListener?.();
    }
  }

  if (!response.ok) throw await toApiError(response);

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

function buildUrl(
  path: string,
  query?: Record<string, string | number | undefined | null>,
): string {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;

  const params = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    );

  return params.length > 0 ? `${url}?${params.join('&')}` : url;
}

async function toApiError(response: Response): Promise<ApiError> {
  let message = 'Une erreur est survenue';
  let code = 'UNKNOWN_ERROR';
  let details: unknown;

  try {
    const payload = (await response.json()) as {
      message?: string | string[];
      code?: string;
      details?: unknown;
    };

    // Nest renvoie parfois un tableau de messages de validation.
    if (Array.isArray(payload.message)) message = payload.message.join('\n');
    else if (payload.message) message = payload.message;

    if (payload.code) code = payload.code;
    details = payload.details;
  } catch {
    // Corps vide ou non-JSON : le statut HTTP reste informatif.
  }

  return new ApiError(response.status, message, code, details);
}
