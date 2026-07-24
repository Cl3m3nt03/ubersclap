import { useQuery } from '@tanstack/react-query';
import type { GeoSuggestion, RouteResult } from '@ubersclap/shared';

import { apiRequest } from '../api';
import { queryKeys } from './keys';

const MIN_QUERY_LENGTH = 3;

/**
 * Suggestions d'adresses pour une saisie partielle.
 *
 * En-deca de trois caracteres la recherche ne discrimine rien : on n'appelle
 * meme pas le serveur. La liste precedente reste affichee pendant la frappe
 * suivante (`placeholderData`) pour eviter le clignotement du menu.
 *
 * Les suggestions ne sont pas persistees hors-ligne : sans reseau il n'y a de
 * toute facon pas de geocodage, et une adresse suggeree hier n'a aucune valeur
 * demain.
 */
export function useAddressAutocomplete(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: queryKeys.geoAutocomplete(trimmed.toLowerCase()),
    queryFn: ({ signal }) =>
      apiRequest<GeoSuggestion[]>('/geo/autocomplete', {
        query: { q: trimmed },
        signal,
      }),
    enabled: trimmed.length >= MIN_QUERY_LENGTH,
    placeholderData: (previous) => previous,
    staleTime: 5 * 60_000,
    gcTime: 5 * 60_000,
    meta: { persist: false },
  });
}

/**
 * Distance et duree en voiture entre deux points.
 *
 * Imperatif plutot que `useQuery` : l'itineraire n'est calcule qu'une fois les
 * deux adresses geocodees, a un instant precis du remplissage du formulaire,
 * pas en reaction continue a un etat.
 */
export function fetchRoute(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
  signal?: AbortSignal,
): Promise<RouteResult> {
  return apiRequest<RouteResult>('/geo/route', {
    query: {
      from: `${from.latitude},${from.longitude}`,
      to: `${to.latitude},${to.longitude}`,
    },
    signal,
  });
}
