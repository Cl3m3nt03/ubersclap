import { useMemo } from 'react';
import { sumCents, type CourseWithClient } from '@ubersclap/shared';

import {
  addDays,
  endOfDay,
  endOfMonth,
  isSameDay,
  startOfDay,
  startOfMonth,
} from '../dates';
import { useCourses } from './courses';
import { useExpenses } from './expenses';
import { useInvoices } from './invoices';

export interface DaySummary {
  revenueCents: number;
  courses: number;
  distanceMeters: number;
  workedMinutes: number;
  /** Ecart de chiffre d'affaires avec la veille. `null` si la veille est vide. */
  deltaPercent: number | null;
}

/**
 * Le resume du jour, calcule a partir des courses deja chargees.
 *
 * `GET /v1/dashboard` existe au contrat (ADR-010) mais pas encore cote
 * serveur. En attendant, ces chiffres se deduisent exactement des courses de
 * la journee : un endpoint dedie ne changerait que le lieu du calcul.
 *
 * Effet de bord utile : ces memes courses alimentent la liste « prochaines
 * courses » et restent lisibles hors ligne, ce qu'un agregat serveur ne
 * permettrait pas.
 */
export function useDaySummary() {
  const today = startOfDay();
  const yesterday = addDays(today, -1);

  // Une seule requete pour les deux journees : la comparaison a la veille ne
  // vaut pas un second aller-retour reseau.
  const query = useCourses({
    from: yesterday.toISOString(),
    to: endOfDay(today).toISOString(),
  });

  const summary = useMemo(() => {
    const courses = query.data ?? [];

    const todayCourses = courses.filter((course) =>
      isSameDay(new Date(course.scheduledAt), today),
    );
    const yesterdayCourses = courses.filter((course) =>
      isSameDay(new Date(course.scheduledAt), yesterday),
    );

    const todayRevenue = revenueOf(todayCourses);
    const yesterdayRevenue = revenueOf(yesterdayCourses);

    return {
      today: todayCourses,
      summary: {
        revenueCents: todayRevenue,
        courses: todayCourses.filter((c) => c.status !== 'CANCELLED').length,
        distanceMeters: sum(todayCourses.map((c) => c.distanceMeters ?? 0)),
        workedMinutes: sum(todayCourses.map((c) => c.durationMinutes ?? 0)),
        deltaPercent:
          yesterdayRevenue === 0
            ? null
            : Math.round(
                ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100,
              ),
      } satisfies DaySummary,
    };
    // `today` et `yesterday` sont recalcules a chaque rendu mais designent la
    // meme journee : seules les donnees doivent declencher le recalcul.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data]);

  return { ...query, ...summary };
}

export interface MonthSummary {
  /** CA TTC des courses terminees du mois. */
  revenueCents: number;
  /** Depenses du mois. */
  expenseCents: number;
  /** Resultat = CA - depenses. Indicateur de tresorerie, pas un resultat comptable. */
  netCents: number;
  /** Factures envoyees ou en retard, pas encore payees. */
  outstandingCents: number;
}

/**
 * Le bilan du mois : CA, depenses, resultat et encours a recouvrer.
 *
 * Le mois est la maille du chauffeur. On agrege trois sources deja typees —
 * courses terminees, depenses, factures impayees — plutot qu'un endpoint
 * dedie : le calcul est exact, reste lisible hors ligne, et ne double aucun
 * aller-retour reseau.
 */
export function useMonthSummary() {
  const from = startOfMonth().toISOString();
  const to = endOfMonth().toISOString();

  const coursesQuery = useCourses({ from, to });
  const expensesQuery = useExpenses({ from, to });
  const invoicesQuery = useInvoices();

  const summary = useMemo<MonthSummary>(() => {
    const revenueCents = revenueOf(coursesQuery.data ?? []);
    const expenseCents = sumCents(
      (expensesQuery.data ?? []).map((expense) => expense.amountCents),
    );
    const outstandingCents = sumCents(
      (invoicesQuery.data ?? [])
        .filter((i) => i.status === 'SENT' || i.status === 'OVERDUE')
        .map((i) => i.totalInclTaxCents),
    );

    return {
      revenueCents,
      expenseCents,
      netCents: revenueCents - expenseCents,
      outstandingCents,
    };
  }, [coursesQuery.data, expensesQuery.data, invoicesQuery.data]);

  return {
    summary,
    isPending:
      coursesQuery.isPending || expensesQuery.isPending || invoicesQuery.isPending,
  };
}

/**
 * Le chiffre d'affaires ne compte que les courses terminees.
 *
 * Une course prevue a 18 h n'est pas un revenu : compter les reservations
 * gonflerait le chiffre du matin puis le ferait baisser en cas d'annulation.
 * Le prix final prime sur le prix annonce — c'est celui qui sera facture.
 */
function revenueOf(courses: CourseWithClient[]): number {
  return sum(
    courses
      .filter((course) => course.status === 'COMPLETED')
      .map((course) => course.finalPriceInclTaxCents ?? course.priceInclTaxCents),
  );
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
