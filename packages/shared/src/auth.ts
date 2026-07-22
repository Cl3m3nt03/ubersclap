/**
 * Schemas d'authentification — partages API et mobile.
 */

import { z } from 'zod';
import { uuidSchema, instantSchema } from './schemas';

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
