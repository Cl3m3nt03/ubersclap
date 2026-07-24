/**
 * Cles de cache, centralisees.
 *
 * Eparpillees dans les ecrans, elles finissent par diverger d'une lettre et
 * l'invalidation d'une mutation rate silencieusement la liste qu'elle devait
 * rafraichir.
 */
export const queryKeys = {
  courses: (filters?: { from?: string; to?: string; status?: string }) =>
    ['courses', filters ?? {}] as const,
  course: (id: string) => ['course', id] as const,
  clients: (search?: string) => ['clients', search ?? ''] as const,
  client: (id: string) => ['client', id] as const,
  geoAutocomplete: (query: string) => ['geo', 'autocomplete', query] as const,
  invoices: () => ['invoices'] as const,
};

/**
 * Cles de mutation, indispensables a l'offline (ADR-011).
 *
 * Une mutation mise en pause hors-ligne ne persiste que sa cle et ses
 * variables, jamais sa fonction. Pour la rejouer apres un redemarrage, le
 * client doit retrouver la `mutationFn` par cette cle — voir
 * `registerMutationDefaults`. Sans cle stable, la mutation en pause est
 * illisible au reveil et la saisie est perdue.
 */
export const mutationKeys = {
  createCourse: ['createCourse'] as const,
  transitionCourse: ['transitionCourse'] as const,
  createClient: ['createClient'] as const,
};
