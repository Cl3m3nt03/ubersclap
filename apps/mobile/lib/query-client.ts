import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api';

/**
 * Cache de donnees serveur.
 *
 * Les reglages par defaut de TanStack Query visent le web : refetch a chaque
 * focus, cache court. Un chauffeur ouvre et ferme l'app dix fois par jour sur
 * un forfait mobile — on garde les donnees plus longtemps et on ne refait un
 * appel que quand elles ont vraiment vieilli.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Le cache survit largement a une mise en arriere-plan : rouvrir l'app
      // doit afficher la journee immediatement, pas un ecran de chargement.
      gcTime: 24 * 60 * 60 * 1000,
      retry: (failureCount, error) => {
        // Un 4xx ne se repare pas en insistant : la requete est refusee, pas
        // perdue. Seules les pannes reseau et les 5xx valent un nouvel essai.
        if (error instanceof ApiError && error.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
