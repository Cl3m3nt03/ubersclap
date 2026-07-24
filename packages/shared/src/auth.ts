/**
 * Schemas d'authentification — partages API et mobile.
 */

import { z } from 'zod';
import { uuidSchema, instantSchema } from './schemas';
import { VAT_REGIMES, type VatRegime } from './money';
import { MEMBERSHIP_ROLES, PLAN_TIERS, SUBSCRIPTION_STATUSES } from './plans';

/**
 * Mot de passe : longueur minimale, aucune regle de composition.
 *
 * Imposer « une majuscule, un chiffre, un caractere special » produit des
 * mots de passe plus courts, plus previsibles et plus souvent notes sur un
 * papier. La longueur est le seul facteur qui compte vraiment.
 */
export const passwordSchema = z
  .string()
  .min(10, 'Le mot de passe doit faire au moins 10 caractères')
  .max(200, 'Le mot de passe est trop long');

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Adresse email invalide');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().trim().min(1, 'Le prénom est obligatoire').max(100),
  lastName: z.string().trim().min(1, 'Le nom est obligatoire').max(100),
  phone: z.string().trim().min(6).max(20).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Le mot de passe est obligatoire'),
  /** Affiche dans un futur ecran « appareils connectes ». */
  deviceName: z.string().trim().max(128).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const authUserSchema = z.object({
  id: uuidSchema,
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['DRIVER', 'MANAGER', 'ADMIN']),
  createdAt: instantSchema,
});

export const VAT_REGIME_LABEL: Record<VatRegime, string> = {
  FRANCHISE: 'Franchise en base',
  NORMAL: 'TVA 10 %',
};

/** Profil professionnel. Tous les champs alimentent le PDF de facture. */
export const driverProfileSchema = z.object({
  companyName: z.string().nullable(),
  legalForm: z.string().nullable(),
  siret: z.string().nullable(),
  vatNumber: z.string().nullable(),
  vtcRegistrationNumber: z.string().nullable(),
  vatRegime: z.enum(VAT_REGIMES).nullable(),
  address: z.string().nullable(),
  logoUrl: z.string().nullable(),
});

export type DriverProfile = z.infer<typeof driverProfileSchema>;

/**
 * `GET /v1/me` — compte et profil pro en un seul appel (ADR-010).
 *
 * Deux requetes au demarrage pour afficher un seul ecran serait du gaspillage
 * sur une connexion mobile.
 */
/** Organisation de l'utilisateur et son role. Toujours presente au MVP. */
export const organizationContextSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  role: z.enum(MEMBERSHIP_ROLES),
});

export type OrganizationContext = z.infer<typeof organizationContextSchema>;

/** Abonnement de l'organisation. */
export const planContextSchema = z.object({
  tier: z.enum(PLAN_TIERS),
  status: z.enum(SUBSCRIPTION_STATUSES),
});

export type PlanContext = z.infer<typeof planContextSchema>;

export const meSchema = authUserSchema.extend({
  phone: z.string().nullable(),
  profile: driverProfileSchema,
  /** Nullable defensif : un compte anterieur au systeme d'orgs n'en a pas. */
  organization: organizationContextSchema.nullable(),
  plan: planContextSchema.nullable(),
});

export type Me = z.infer<typeof meSchema>;

/** `PATCH /v1/me`. Un champ vide efface la valeur, d'ou le `nullable`. */
export const updateMeSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(20).nullable().optional(),

  companyName: z.string().trim().max(200).nullable().optional(),
  legalForm: z.string().trim().max(100).nullable().optional(),
  siret: z
    .string()
    .trim()
    .regex(/^\d{14}$/, 'Le SIRET compte 14 chiffres')
    .nullable()
    .optional(),
  vatNumber: z.string().trim().max(20).nullable().optional(),
  vtcRegistrationNumber: z.string().trim().max(50).nullable().optional(),
  vatRegime: z.enum(VAT_REGIMES).nullable().optional(),
  address: z.string().trim().nullable().optional(),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;

export const authResponseSchema = z.object({
  user: authUserSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;

/** Contenu du JWT d'acces. Volontairement minimal. */
export interface AccessTokenPayload {
  sub: string;
  role: 'DRIVER' | 'MANAGER' | 'ADMIN';
}
