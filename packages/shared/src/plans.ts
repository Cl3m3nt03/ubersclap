/**
 * Abonnements, tiers et permissions — ADR-015.
 *
 * On pose ici la structure des offres AVANT de developper le Business, pour que
 * toute l'app raisonne en termes de « ce tier / ce role a-t-il le droit ? »
 * plutot qu'en cas particuliers dissemines. Le jour ou une societe de transport
 * ajoute des chauffeurs, il n'y a qu'a etendre ces tables, pas a reecrire les
 * ecrans.
 */

export const PLAN_TIERS = ['SOLO', 'BUSINESS'] as const;
export type PlanTier = (typeof PLAN_TIERS)[number];

export const PLAN_LABEL: Record<PlanTier, string> = {
  SOLO: 'Solo',
  BUSINESS: 'Entreprise',
};

export const SUBSCRIPTION_STATUSES = [
  'TRIALING',
  'ACTIVE',
  'PAST_DUE',
  'CANCELLED',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Un abonnement donne acces tant qu'il n'est ni impaye ni resilie. */
export function subscriptionIsActive(status: SubscriptionStatus): boolean {
  return status === 'ACTIVE' || status === 'TRIALING';
}

/**
 * Roles au sein d'une organisation.
 *
 * Reprend l'enum `user_role` cote base. En SOLO le chauffeur est ADMIN de son
 * organisation d'une personne ; en BUSINESS les trois roles se distinguent.
 */
export const MEMBERSHIP_ROLES = ['ADMIN', 'MANAGER', 'DRIVER'] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const MEMBERSHIP_ROLE_LABEL: Record<MembershipRole, string> = {
  ADMIN: 'Administrateur',
  MANAGER: 'Manager',
  DRIVER: 'Chauffeur',
};

/**
 * Ce qu'une offre inclut.
 *
 * Le tier SOLO couvre l'activite d'un independant ; BUSINESS ajoute tout ce qui
 * touche au travail a plusieurs. Une fonctionnalite verrouillee cote UI se lit
 * ici, jamais en dur dans un ecran.
 */
export const PLAN_FEATURES = [
  'clients',
  'courses',
  'invoicing',
  'expenses',
  'stats',
  'pdf_export',
  'agenda',
  // Reserve BUSINESS
  'multi_user',
  'course_dispatch',
  'shared_clients',
  'shared_history',
  'central_billing',
  'role_permissions',
] as const;
export type PlanFeature = (typeof PLAN_FEATURES)[number];

const SOLO_FEATURES: PlanFeature[] = [
  'clients',
  'courses',
  'invoicing',
  'expenses',
  'stats',
  'pdf_export',
  'agenda',
];

export const PLAN_FEATURES_BY_TIER: Record<PlanTier, readonly PlanFeature[]> = {
  SOLO: SOLO_FEATURES,
  BUSINESS: [
    ...SOLO_FEATURES,
    'multi_user',
    'course_dispatch',
    'shared_clients',
    'shared_history',
    'central_billing',
    'role_permissions',
  ],
};

/** Le tier donne-t-il acces a cette fonctionnalite ? */
export function planAllows(tier: PlanTier, feature: PlanFeature): boolean {
  return PLAN_FEATURES_BY_TIER[tier].includes(feature);
}

/**
 * Permissions d'un role, cumulatives : un ADMIN peut tout ce qu'un MANAGER
 * peut, qui peut tout ce qu'un DRIVER peut.
 *
 * Les chaines sont de la forme `ressource:action`. C'est volontairement une
 * liste plate et lisible : la garde d'acces Business posera la question
 * `roleCan(role, 'members:manage')`, pas un arbre de conditions.
 */
export const PERMISSIONS = [
  'courses:own',
  'clients:read',
  'expenses:own',
  'invoices:own',
  'courses:all',
  'courses:assign',
  'clients:write',
  'invoices:all',
  'members:manage',
  'org:manage',
  'billing:manage',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const DRIVER_PERMISSIONS: Permission[] = [
  'courses:own',
  'clients:read',
  'expenses:own',
  'invoices:own',
];

const MANAGER_PERMISSIONS: Permission[] = [
  ...DRIVER_PERMISSIONS,
  'courses:all',
  'courses:assign',
  'clients:write',
  'invoices:all',
];

export const ROLE_PERMISSIONS: Record<MembershipRole, readonly Permission[]> = {
  DRIVER: DRIVER_PERMISSIONS,
  MANAGER: MANAGER_PERMISSIONS,
  ADMIN: [...MANAGER_PERMISSIONS, 'members:manage', 'org:manage', 'billing:manage'],
};

export function roleCan(role: MembershipRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
