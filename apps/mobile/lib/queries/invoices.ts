import { useQuery } from '@tanstack/react-query';
import type { InvoiceSummary } from '@ubersclap/shared';

import { apiRequest } from '../api';
import { queryKeys } from './keys';

/**
 * Liste des factures.
 *
 * On charge tout et on filtre / calcule l'encours cote client : le nombre de
 * factures d'un chauffeur independant reste modeste, et un seul chargement
 * evite de repartir au reseau a chaque changement d'onglet.
 */
export function useInvoices() {
  return useQuery({
    queryKey: queryKeys.invoices(),
    queryFn: () => apiRequest<InvoiceSummary[]>('/invoices'),
  });
}
