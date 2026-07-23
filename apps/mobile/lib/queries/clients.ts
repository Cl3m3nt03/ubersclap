import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ClientDetail,
  ClientRecord,
  CreateClientInput,
} from '@ubersclap/shared';

import { apiRequest } from '../api';
import { queryKeys } from './keys';

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

export function useCreateClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateClientInput) =>
      apiRequest<ClientRecord>('/clients', {
        method: 'POST',
        body: input,
        idempotencyKey: input.id,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
