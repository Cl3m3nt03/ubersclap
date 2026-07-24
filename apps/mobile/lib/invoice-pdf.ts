import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { API_BASE_URL } from './config';
import { apiRequest } from './api';
import { getAccessToken } from './tokens';

/**
 * Telecharge le PDF d'une facture et ouvre la feuille de partage.
 *
 * Le telechargement passe par `downloadAsync` et non par le client HTTP : il
 * ecrit un fichier, pas du JSON. Il court-circuite donc l'intercepteur et son
 * rafraichissement automatique de jeton — d'ou l'appel prealable a l'API, qui
 * renouvelle le jeton si besoin avant qu'on le lise pour l'en-tete.
 */
export async function shareInvoicePdf(invoice: {
  id: string;
  invoiceNumber: string;
}): Promise<void> {
  // Force un passage par l'intercepteur : si le jeton d'acces a expire, il est
  // renouvele ici, avant le telechargement qui, lui, ne sait pas le faire.
  await apiRequest(`/invoices/${invoice.id}`);
  const token = getAccessToken();

  const target = `${FileSystem.cacheDirectory}facture-${invoice.invoiceNumber}.pdf`;
  const result = await FileSystem.downloadAsync(
    `${API_BASE_URL}/invoices/${invoice.id}/pdf`,
    target,
    { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
  );

  if (result.status !== 200) {
    throw new Error('Téléchargement du PDF impossible');
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: `Facture ${invoice.invoiceNumber}`,
    });
  }
}
