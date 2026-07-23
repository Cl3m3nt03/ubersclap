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
};
