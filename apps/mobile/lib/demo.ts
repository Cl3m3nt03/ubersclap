/**
 * Mode démonstration — EXPO_PUBLIC_DEMO_MODE=1.
 *
 * Sert les fixtures de @cadance/shared à la place de l'API : l'app tourne
 * sans backend, avec des données françaises plausibles et des agrégats vrais.
 * Usage prévu : captures de référence pour la landing page (SETUP_PLAN.md,
 * phase 3), démos, développement d'écrans sans serveur.
 *
 * L'interception se fait au niveau d'`apiRequest` (voir api.ts) : c'est le
 * seul point de passage de toutes les requêtes, donc les écrans, les hooks et
 * la file offline restent strictement identiques au mode réel.
 */

import {
  createDemoData,
  type Course,
  type CourseWithClient,
  type DemoData,
} from '@cadance/shared';

export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === '1';

let cached: DemoData | null = null;

/** Les fixtures, générées une fois par session (dates relatives à maintenant). */
export function demoData(): DemoData {
  if (!cached) cached = createDemoData();
  return cached;
}

interface DemoRequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
}

/**
 * Répond à une requête comme le ferait l'API, depuis les fixtures.
 *
 * Couvre les routes que les écrans lisent. Les écritures (POST/PATCH) rendent
 * un écho plausible sans persister : une démo n'a pas de base de données.
 */
export function demoRequest<T>(path: string, options: DemoRequestOptions = {}): T {
  const data = demoData();
  const { method = 'GET', query } = options;
  const [route] = path.split('?');
  const segments = (route ?? '').split('/').filter(Boolean);

  if (route === '/me') return data.driver as T;

  if (route === '/courses' && method === 'GET') {
    return filterCourses(data.courses, query) as T;
  }

  if (segments[0] === 'courses' && segments.length === 2 && method === 'GET') {
    const course = data.courses.find((c) => c.id === segments[1]);
    if (course) return stripClient(course) as T;
  }

  if (route === '/clients' && method === 'GET') {
    const search = String(query?.search ?? '').trim().toLowerCase();
    const clients = search
      ? data.clients.filter((c) =>
          `${c.firstName} ${c.lastName} ${c.company ?? ''}`
            .toLowerCase()
            .includes(search),
        )
      : data.clients;
    return clients as T;
  }

  if (segments[0] === 'clients' && segments.length === 2 && method === 'GET') {
    const client = data.clientDetails.find((c) => c.id === segments[1]);
    if (client) return client as T;
  }

  if (route === '/invoices' && method === 'GET') return data.invoices as T;

  if (route === '/invoices/billable-courses' && method === 'GET') {
    // Terminées et pas encore facturées : en démo, les terminées du jour.
    return data.courses.filter((c) => c.status === 'COMPLETED').slice(-2) as T;
  }

  if (route === '/expenses' && method === 'GET') {
    return filterByInstant(data.expenses, (e) => e.spentAt, query) as T;
  }

  if (segments[0] === 'geo') return [] as T;

  // Écritures : écho minimal, rien n'est persisté.
  if (method === 'POST' || method === 'PATCH') {
    return (options.body ?? {}) as T;
  }

  throw new Error(`Mode démo : route non couverte ${method} ${route}`);
}

function filterCourses(
  courses: CourseWithClient[],
  query?: Record<string, string | number | undefined | null>,
): CourseWithClient[] {
  let result = filterByInstant(courses, (c) => c.scheduledAt, query);
  const status = query?.status;
  if (status) result = result.filter((c) => c.status === status);
  const clientId = query?.clientId;
  if (clientId) result = result.filter((c) => c.clientId === clientId);
  return result;
}

function filterByInstant<T>(
  items: T[],
  instant: (item: T) => string,
  query?: Record<string, string | number | undefined | null>,
): T[] {
  const from = query?.from ? Date.parse(String(query.from)) : null;
  const to = query?.to ? Date.parse(String(query.to)) : null;

  return items.filter((item) => {
    const t = Date.parse(instant(item));
    if (from !== null && t < from) return false;
    if (to !== null && t > to) return false;
    return true;
  });
}

function stripClient(course: CourseWithClient): Course {
  const { client: _client, ...rest } = course;
  return rest;
}
