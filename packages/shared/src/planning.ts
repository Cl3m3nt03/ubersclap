/**
 * Detection de conflits d'agenda.
 *
 * Un chauffeur ne peut pas conduire deux courses en meme temps. Deux courses
 * sont en conflit quand leurs fenetres temporelles se chevauchent — la fenetre
 * allant du depart prevu a l'arrivee estimee.
 *
 * La duree vient de l'itineraire calcule (module geo). Quand elle manque — une
 * adresse tapee sans etre resolue — on retombe sur une duree par defaut :
 * mieux vaut signaler un chevauchement probable que de n'en signaler aucun.
 */

import type { CourseStatus } from './course';

/** Duree retenue quand l'itineraire n'a pas ete calcule. */
export const DEFAULT_COURSE_DURATION_MIN = 60;

export interface SchedulableCourse {
  id: string;
  /** Instant absolu ISO 8601 (ADR-008). */
  scheduledAt: string;
  durationMinutes: number | null;
  status: CourseStatus;
}

export interface TimeWindow {
  start: number;
  end: number;
}

export function courseTimeWindow(course: SchedulableCourse): TimeWindow {
  const start = Date.parse(course.scheduledAt);
  const minutes = course.durationMinutes ?? DEFAULT_COURSE_DURATION_MIN;
  return { start, end: start + minutes * 60_000 };
}

/**
 * Deux courses se chevauchent-elles ?
 *
 * Une course annulee ne compte pas : elle n'occupe plus le chauffeur. Le test
 * est strict aux bornes — deux courses qui s'enchainent pile (l'une finit quand
 * l'autre commence) ne sont pas en conflit.
 */
export function coursesOverlap(a: SchedulableCourse, b: SchedulableCourse): boolean {
  if (a.status === 'CANCELLED' || b.status === 'CANCELLED') return false;
  const wa = courseTimeWindow(a);
  const wb = courseTimeWindow(b);
  return wa.start < wb.end && wb.start < wa.end;
}

/** Identifiants des courses qui en chevauchent au moins une autre dans la liste. */
export function findConflictingIds(courses: SchedulableCourse[]): Set<string> {
  const conflicting = new Set<string>();
  for (let i = 0; i < courses.length; i += 1) {
    const a = courses[i];
    if (!a) continue;
    for (let j = i + 1; j < courses.length; j += 1) {
      const b = courses[j];
      if (!b) continue;
      if (coursesOverlap(a, b)) {
        conflicting.add(a.id);
        conflicting.add(b.id);
      }
    }
  }
  return conflicting;
}

/** Les courses de `others` que `candidate` chevauche (elle-meme exclue). */
export function conflictsFor<T extends SchedulableCourse>(
  candidate: SchedulableCourse,
  others: readonly T[],
): T[] {
  return others.filter(
    (other) => other.id !== candidate.id && coursesOverlap(candidate, other),
  );
}
