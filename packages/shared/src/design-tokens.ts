/**
 * Tokens de design — source unique.
 *
 * Origine : projet Superdesign "ubersclap" (design context sauvegarde).
 * Voir DESIGN_DIRECTION.md pour les regles d'usage et les ecarts corriges.
 *
 * Consomme par NativeWind (mobile) ET par le generateur de PDF (backend).
 * Une couleur ne doit jamais etre ecrite en dur ailleurs.
 */

/** Gradients — signalent une VALEUR importante, jamais une decoration. */
export const gradient = {
  /** L'argent gagne : CA, montants encaisses. */
  teal: ['#0D9488', '#2DD4BF'],
  /** Le volume d'activite : nombre de courses. */
  coral: ['#F43F5E', '#FB7185'],
  /** Le temps : heures travaillees, durees. */
  purple: ['#7C3AED', '#A78BFA'],
} as const;

export type GradientName = keyof typeof gradient;

/** Palette claire — mode par defaut. */
export const light = {
  /** Primaire : CTA, onglet actif, liens. */
  indigo: '#4F46E5',
  indigoSoft: '#818CF8',

  bg: '#FDFDFD',
  surface: '#FFFFFF',
  border: '#F3F4F6',

  ink: '#1A1C1E',
  inkMuted: '#6B7280',
  inkFaint: '#9CA3AF',

  /** Semantique — absente du design context d'origine, figee ici. */
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',
} as const;

/**
 * Palette sombre.
 *
 * Une part importante de l'activite VTC est nocturne : un ecran blanc en plein
 * habitacle la nuit eblouit. Les tokens sont definis des maintenant meme si le
 * theme n'est branche qu'en v1.1 — l'ajouter apres coup imposerait de reprendre
 * chaque ecran. Voir DESIGN_DIRECTION.md, point 3.
 *
 * Les gradients teal / coral / purple fonctionnent tels quels sur fond sombre.
 */
export const dark = {
  indigo: '#818CF8',
  indigoSoft: '#A5B4FC',

  bg: '#0F1115',
  surface: '#181B21',
  border: '#252932',

  ink: '#F4F5F7',
  inkMuted: '#9BA3AF',
  inkFaint: '#6B7280',

  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
} as const;

export type Palette = typeof light;

export const radius = {
  /** Chips, badges. */
  sm: 12,
  /** Boutons, champs de saisie. */
  md: 16,
  /** Cartes. */
  lg: 24,
} as const;

export const space = {
  /** Padding horizontal d'ecran. */
  screen: 24,
  card: 20,
  /** Entre deux blocs. */
  section: 32,
  /** Entre cartes d'une grille. */
  grid: 16,
} as const;

/**
 * Tailles de cible tactile.
 *
 * Le design context d'origine indiquait 44 px — la norme iOS, pensee pour un
 * usage assis, a deux mains, au calme. Le contexte reel ici est : dans une
 * voiture, une seule main, parfois des gants. Voir DESIGN_DIRECTION.md, point 2.
 */
export const touch = {
  /** Action primaire : CTA, onglets, appel client. */
  primary: 56,
  /** Action secondaire. */
  secondary: 44,
} as const;

export const font = {
  family: 'PlusJakartaSans',
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extra: '800',
  },
  size: {
    /** Plus petit label admissible. 10 px etait illisible en voiture. */
    micro: 12,
    label: 13,
    body: 16,
    title: 20,
    display: 28,
    hero: 40,
  },
} as const;
