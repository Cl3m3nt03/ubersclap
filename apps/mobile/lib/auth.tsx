import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type {
  AuthResponse,
  AuthUser,
  LoginInput,
  RegisterInput,
} from '@ubersclap/shared';

import { apiRequest, onSessionExpired } from './api';
import {
  clearTokens,
  getRefreshToken,
  loadTokens,
  saveTokens,
} from './tokens';

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Session du chauffeur.
 *
 * `status` a trois etats et pas un booleen : au demarrage on ne sait pas
 * encore. Traiter « on ne sait pas » comme « deconnecte » ferait clignoter
 * l'ecran de connexion a chaque ouverture de l'app, alors que la session est
 * valide 30 jours.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { refreshToken } = await loadTokens();

      if (!refreshToken) {
        if (!cancelled) setStatus('anonymous');
        return;
      }

      try {
        // `/me` valide la session et remplit le profil en un seul appel. Un
        // 401 declenche le refresh dans le client HTTP, de facon transparente.
        const profile = await apiRequest<AuthUser>('/me');
        if (cancelled) return;
        setUser(profile);
        setStatus('authenticated');
      } catch {
        /**
         * On reste connecte en cas d'echec.
         *
         * Le cas le plus frequent au demarrage n'est pas un jeton invalide,
         * c'est l'absence de reseau — l'app s'ouvre dans un parking. Deconnecter
         * la, c'est rendre inaccessibles des donnees locales parfaitement
         * lisibles. Une vraie expiration passe par `onSessionExpired`.
         */
        if (cancelled) return;
        setStatus('authenticated');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null);
        setStatus('anonymous');
        queryClient.clear();
      }),
    [queryClient],
  );

  const adopt = useCallback(
    async (response: AuthResponse) => {
      await saveTokens(response);
      setUser(response.user);
      setStatus('authenticated');
      // Les donnees en cache appartiennent au compte precedent : les garder
      // afficherait les courses d'un autre chauffeur le temps d'un refetch.
      queryClient.clear();
    },
    [queryClient],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: input,
        anonymous: true,
      });
      await adopt(response);
    },
    [adopt],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const response = await apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: input,
        anonymous: true,
      });
      await adopt(response);
    },
    [adopt],
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();

    // L'etat local est vide d'abord : une deconnexion doit aboutir meme sans
    // reseau. Le serveur revoque le jeton quand il peut, et de toute facon il
    // expire tout seul.
    await clearTokens();
    setUser(null);
    setStatus('anonymous');
    queryClient.clear();

    if (refreshToken) {
      await apiRequest<void>('/auth/logout', {
        method: 'POST',
        body: { refreshToken },
        anonymous: true,
      }).catch(() => undefined);
    }
  }, [queryClient]);

  const value = useMemo(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return value;
}
