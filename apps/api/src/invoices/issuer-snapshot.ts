import type { VatRegime } from '@ubersclap/shared';

import type { users, driverProfiles, clients } from '../database/schema';

/**
 * Identite figee au moment de l'emission d'une facture.
 *
 * Une facture emise est immuable (ADR-012) : si le chauffeur change de raison
 * sociale, passe au regime normal ou demenage l'annee suivante, ses anciennes
 * factures doivent continuer d'afficher les mentions exactes a leur date. On
 * copie donc emetteur ET client dans la facture plutot que de dependre de
 * lignes vivantes qui, elles, bougeront.
 */
export interface IssuerSnapshot {
  issuer: {
    name: string;
    companyName: string | null;
    legalForm: string | null;
    siret: string | null;
    vatNumber: string | null;
    vtcRegistrationNumber: string | null;
    vatRegime: VatRegime;
    address: string | null;
    email: string;
    phone: string | null;
  };
  client: {
    name: string;
    company: string | null;
    address: string | null;
    email: string | null;
    phone: string;
  };
}

type UserRow = typeof users.$inferSelect;
type ProfileRow = typeof driverProfiles.$inferSelect;
type ClientRow = typeof clients.$inferSelect;

export function buildIssuerSnapshot(
  user: UserRow,
  profile: ProfileRow,
  client: ClientRow,
  vatRegime: VatRegime,
): IssuerSnapshot {
  return {
    issuer: {
      name: `${user.firstName} ${user.lastName}`,
      companyName: profile.companyName,
      legalForm: profile.legalForm,
      siret: profile.siret,
      vatNumber: profile.vatNumber,
      vtcRegistrationNumber: profile.vtcRegistrationNumber,
      vatRegime,
      address: profile.address,
      email: user.email,
      phone: user.phone,
    },
    client: {
      name: `${client.firstName} ${client.lastName}`,
      company: client.company,
      address: null,
      email: client.email,
      phone: client.phone,
    },
  };
}

export function parseIssuerSnapshot(raw: string | null): IssuerSnapshot | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as IssuerSnapshot;
  } catch {
    return null;
  }
}
