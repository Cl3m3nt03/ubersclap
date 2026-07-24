import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  ClientDetail,
  ClientRecord,
  CreateClientInput,
} from '@ubersclap/shared';

import { apiRequest } from '../api';
import { mutationKeys, queryKeys } from './keys';

export function useClients(search?: string) {
  return useQuery({
    queryKey: queryKeys.clients(search),
    queryFn: () =>
      apiRequest<ClientRecord[]>('/clients', { query: { search } }),
    /**
     * La liste precedente reste affichee pendant la frappe.
     *
     * Sans ca, chaque lettre tapee vide l'ecran une fraction de seconde : la
     * liste clignote et devient illisible.
     */
    placeholderData: (previous) => previous,
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: queryKeys.client(id),
    queryFn: () => apiRequest<ClientDetail>(`/clients/${id}`),
    enabled: Boolean(id),
  });
}

/**
 * `mutationFn` et `onSuccess` vivent dans `registerMutationDefaults` (ADR-011),
 * pour que la creation faite hors-ligne soit rejouable apres un redemarrage.
 */
export function useCreateClient() {
  return useMutation<ClientRecord, unknown, CreateClientInput>({
    mutationKey: mutationKeys.createClient,
  });
}

/**
 * Met a jour une fiche client.
 *
 * Appel direct plutot que file offline : corriger un numero ou un email est un
 * geste ponctuel, fait en ligne depuis la fiche, pas une saisie a enfiler sans
 * reseau. L'ecran invalide ensuite la fiche et la liste.
 */
export function updateClient(
  id: string,
  patch: Partial<Omit<CreateClientInput, 'id'>>,
): Promise<ClientRecord> {
  return apiRequest<ClientRecord>(`/clients/${id}`, {
    method: 'PATCH',
    body: patch,
  });
}
