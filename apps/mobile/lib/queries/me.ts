import { useQuery } from '@tanstack/react-query';
import type { Me, UpdateMeInput } from '@ubersclap/shared';

import { apiRequest } from '../api';
import { queryKeys } from './keys';

/**
 * Compte + profil professionnel du chauffeur connecte (ADR-010 : un seul appel).
 *
 * Le profil alimente chaque facture emise : c'est la source des mentions
 * legales (SIRET, regime de TVA, registre VTC). L'ecran Profil le lit, l'ecran
 * d'edition le renvoie modifie.
 */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => apiRequest<Me>('/me'),
  });
}

/**
 * Met a jour compte et profil pro en une requete.
 *
 * Appel direct plutot que mutation offline : c'est un formulaire que le
 * chauffeur remplit une fois, en ligne, pas un geste repete a enfiler sans
 * reseau. L'ecran gere l'etat de chargement et rafraichit `me` au retour.
 */
export function updateMe(patch: UpdateMeInput): Promise<Me> {
  return apiRequest<Me>('/me', { method: 'PATCH', body: patch });
}
