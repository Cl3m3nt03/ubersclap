import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  Course,
  CourseStatus,
  CourseWithClient,
  CreateCourseInput,
} from '@ubersclap/shared';

import { apiRequest } from '../api';
import { mutationKeys, queryKeys } from './keys';
import type { TransitionCourseInput } from './mutations';

export interface CourseFilters {
  from?: string;
  to?: string;
  status?: CourseStatus;
  clientId?: string;
}

/**
 * Les courses sur une plage de dates.
 *
 * Une seule route sert le tableau de bord, l'agenda du jour et la semaine
 * (ADR-010) : c'est la meme question posee avec des bornes differentes.
 */
export function useCourses(filters: CourseFilters = {}) {
  return useQuery({
    queryKey: queryKeys.courses(filters),
    queryFn: () =>
      apiRequest<CourseWithClient[]>('/courses', { query: { ...filters } }),
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: queryKeys.course(id),
    queryFn: () => apiRequest<Course>(`/courses/${id}`),
    enabled: Boolean(id),
  });
}

/**
 * `mutationFn` et `onSuccess` vivent dans `registerMutationDefaults` (ADR-011) :
 * une mutation creee hors-ligne doit pouvoir etre rejouee apres un redemarrage,
 * quand la closure du composant n'existe plus. Le hook ne fournit que la cle.
 */
export function useCreateCourse() {
  return useMutation<Course, unknown, CreateCourseInput>({
    mutationKey: mutationKeys.createCourse,
  });
}

export function useTransitionCourse() {
  return useMutation<Course, unknown, TransitionCourseInput>({
    mutationKey: mutationKeys.transitionCourse,
  });
}
