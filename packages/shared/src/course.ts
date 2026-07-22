/**
 * Course — statuts et machine a etats.
 *
 * Voir ADR-004 (00_CANON.md). La doc d'origine proposait trois listes de
 * statuts differentes (9, 5, et 5 en francais). Celle-ci fait foi.
 *
 * INVOICED et PAID ne sont volontairement PAS des statuts de course : une
 * facture peut couvrir plusieurs courses (ADR-005), donc l'etat de facturation
 * appartient a la facture, pas a la course.
 */

export const COURSE_STATUSES = [
  'DRAFT',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

export type CourseStatus = (typeof COURSE_STATUSES)[number];

/** Transitions autorisees. Le serveur refuse tout ce qui n'est pas ici. */
const TRANSITIONS: Record<CourseStatus, readonly CourseStatus[]> = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: CourseStatus, to: CourseStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: CourseStatus): readonly CourseStatus[] {
  return TRANSITIONS[from];
}

export function isTerminal(status: CourseStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

/** Libelles affiches. Une seule source, pour que l'app parle d'une seule voix. */
export const COURSE_STATUS_LABEL: Record<CourseStatus, string> = {
  DRAFT: 'Brouillon',
  CONFIRMED: 'Confirmée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

/**
 * Libelle du bouton qui declenche la transition.
 *
 * Le verbe du bouton doit etre le verbe de la confirmation : "Démarrer"
 * produit "En cours". C'est ce qui rend l'interface apprenable.
 */
export const COURSE_TRANSITION_LABEL: Record<CourseStatus, string> = {
  DRAFT: 'Remettre en brouillon',
  CONFIRMED: 'Confirmer la course',
  IN_PROGRESS: 'Démarrer la course',
  COMPLETED: 'Terminer la course',
  CANCELLED: 'Annuler la course',
};

/** Ton semantique du badge. Mappe sur les tokens, pas sur une couleur brute. */
export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export const COURSE_STATUS_TONE: Record<CourseStatus, StatusTone> = {
  DRAFT: 'neutral',
  CONFIRMED: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export const COURSE_TYPES = [
  'ONE_WAY',
  'ROUND_TRIP',
  'AIRPORT',
  'STATION',
  'EVENT',
  'HOURLY',
  'OTHER',
] as const;

export type CourseType = (typeof COURSE_TYPES)[number];

export const COURSE_TYPE_LABEL: Record<CourseType, string> = {
  ONE_WAY: 'Aller simple',
  ROUND_TRIP: 'Aller-retour',
  AIRPORT: 'Aéroport',
  STATION: 'Gare',
  EVENT: 'Évènement',
  HOURLY: 'Mise à disposition',
  OTHER: 'Autre',
};
