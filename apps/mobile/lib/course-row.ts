import type { CourseWithClient } from '@ubersclap/shared';

import type { CourseRowData } from '@/components/CourseRow';

/**
 * Ressource d'API → ligne d'agenda.
 *
 * `CourseRow` ne connait que ce qu'elle affiche. Lui passer la course
 * complete l'obligerait a choisir entre prix annonce et prix final a chaque
 * rendu — une regle metier qui n'a rien a faire dans un composant.
 */
export function toCourseRow(course: CourseWithClient): CourseRowData {
  return {
    id: course.id,
    scheduledAt: new Date(course.scheduledAt),
    clientName: `${course.client.firstName} ${course.client.lastName}`,
    pickup: course.pickup.label,
    destination: course.destination.label,
    // Le prix final prime des qu'il existe : c'est celui qui sera facture.
    priceCents: course.finalPriceInclTaxCents ?? course.priceInclTaxCents,
    status: course.status,
  };
}
