import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Course,
  CourseStatus,
  CourseWithClient,
  CreateCourseInput,
} from '@ubersclap/shared';

import { apiRequest } from '../api';
import { queryKeys } from './keys';

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

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCourseInput) =>
      apiRequest<Course>('/courses', {
        method: 'POST',
        body: input,
        // La cle d'idempotence est l'ID de la course (ADR-010 + ADR-011) :
        // un rejeu apres coupure reseau porte la meme cle et ne cree pas de
        // doublon, sans avoir a stocker une cle separee.
        idempotencyKey: input.id,
      }),
    onSuccess: () => {
      // Le serveur peut avoir cree le client au passage : les deux listes
      // bougent apres une creation de course.
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
      void queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useTransitionCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      to,
      finalPriceInclTaxCents,
    }: {
      id: string;
      to: CourseStatus;
      finalPriceInclTaxCents?: number;
    }) =>
      apiRequest<Course>(`/courses/${id}/transitions`, {
        method: 'POST',
        body: { to, finalPriceInclTaxCents },
      }),
    onSuccess: (course) => {
      queryClient.setQueryData(queryKeys.course(course.id), course);
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}
