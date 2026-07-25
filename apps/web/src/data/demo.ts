/**
 * Données de démonstration de la landing — propres à apps/web.
 *
 * Distinctes de packages/shared/src/fixtures/demo.ts (qui alimente le mode
 * démo de l'app) : la landing montre UN MOIS COMPLET d'activité d'un
 * chauffeur qui travaille vraiment, calibré sur le persona du
 * DESIGN_CONTEXT.md §1 : le VTC généraliste intra-muros. ~200 courses par
 * mois, panier moyen ~24 €, CA de l'ordre de 4 800 €, ~1 300 km parcourus en
 * ~110 h — soit ~11,8 km/h, la vitesse réelle de circulation dans Paris.
 * C'est le chiffre que le visiteur lit et auquel il doit pouvoir se comparer.
 *
 * Règles tenues ici :
 *  - Les agrégats (CA, volume, temps, encours) sont CALCULÉS depuis les
 *    courses générées, jamais écrits en dur : vrais par construction.
 *  - Les listes affichées dans les mockups sont des tranches courtes ;
 *    la vue agenda montre UNE JOURNÉE (~9 courses), pas le mois.
 *    C'est l'agrégat qui porte la crédibilité, pas la longueur des listes.
 *  - Une course à 14:30 aujourd'hui sert d'ancre à la micro-action Agenda
 *    (DESIGN_CONTEXT.md §7). Format 14:30 dans les interfaces reconstruites,
 *    « 14 h 30 » réservé à la prose (arbitrage DESIGN_CONTEXT.md §3).
 *  - Formatage FR strict via les helpers de @cadance/shared, en LECTURE
 *    SEULE — rien n'est modifié dans packages/shared.
 *  - Aucun nom de personne réelle, aucun lorem ipsum.
 *  - Génération STRICTEMENT déterministe : toute la génération part de
 *    DEMO_REFERENCE_DATE, une date figée — jamais du jour du build. Deux
 *    builds à une semaine d'écart produisent des données identiques au
 *    octet près. À l'écran, on n'affiche que des dates RELATIVES
 *    (« Aujourd'hui », noms de jours) via les libellés fournis ici, jamais
 *    une date absolue (DESIGN_CONTEXT.md §6).
 */

import {
  sumCents,
  breakdownFromInclTax,
  type Cents,
  type CourseStatus,
  type CourseType,
  type ExpenseCategory,
  type InvoiceStatus,
} from '@cadance/shared';

// ------------------------------------------------------------ Référence

/**
 * Date de référence FIGÉE — le « aujourd'hui » du monde de démonstration.
 *
 * Un mercredi à 12:00 : le milieu de semaine donne un agenda du jour crédible.
 * Ne jamais remplacer par `new Date()` : les captures de régression visuelle
 * (phase 9) doivent être identiques d'un build à l'autre.
 */
export const DEMO_REFERENCE_DATE = new Date(2026, 6, 22, 12, 0, 0, 0); // mercredi 22 juillet 2026

/** Noms de jours pour l'affichage relatif dans les mockups. */
const WEEKDAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const;

/**
 * Libellé RELATIF d'une date du monde de démo : « Aujourd'hui », « Demain »,
 * « Hier », sinon le nom du jour. Jamais de date absolue à l'écran.
 */
export function relativeDayLabel(date: Date, reference: Date = DEMO_REFERENCE_DATE): string {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(date) - startOfDay(reference)) / 86_400_000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  if (days === -1) return 'Hier';
  return WEEKDAYS[date.getDay()]!;
}

// ------------------------------------------------------------------ Types

export interface LandingClient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  company: string | null;
}

export interface LandingCourse {
  id: string;
  scheduledAt: Date;
  client: LandingClient;
  pickup: string;
  destination: string;
  priceCents: Cents;
  distanceMeters: number;
  durationMinutes: number;
  status: CourseStatus;
  type: CourseType;
}

export interface LandingInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  status: InvoiceStatus;
  issuedAt: Date;
  totalInclTaxCents: Cents;
  courseCount: number;
}

export interface LandingExpense {
  id: string;
  spentAt: Date;
  category: ExpenseCategory;
  amountCents: Cents;
  description: string;
}

/** Agrégats du mois — VRAIS, calculés depuis les courses générées. */
export interface LandingAggregates {
  revenueCents: Cents;
  courseCount: number;
  workedMinutes: number;
  distanceMeters: number;
  expenseCents: Cents;
  outstandingCents: Cents;
}

export interface LandingDemo {
  clients: LandingClient[];
  /** Le mois complet — sert au calcul, jamais affiché intégralement. */
  month: {
    courses: LandingCourse[];
    invoices: LandingInvoice[];
    expenses: LandingExpense[];
  };
  aggregates: LandingAggregates;
  /** Tranches courtes, prêtes pour les mockups. */
  display: {
    /** La vue agenda : UNE JOURNÉE (~9 courses), avec l'ancre de 14:30. */
    todayCourses: LandingCourse[];
    /** Les dernières courses (12 lignes). */
    recentCourses: LandingCourse[];
    /** Les dernières factures (8 lignes). */
    invoices: LandingInvoice[];
    /** Les dernières dépenses (12 lignes). */
    expenses: LandingExpense[];
  };
}

// ------------------------------------------------------------- Identifiants

/** UUID déterministes valides — préfixe 5 pour ne pas croiser les fixtures app. */
function demoId(prefix: number, n: number): string {
  return `00000000-0000-4000-8000-${String(prefix)}${String(n).padStart(11, '0')}`;
}

// ------------------------------------------------------------------- Dates

function at(now: Date, dayOffset: number, hours: number, minutes: number): Date {
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + dayOffset,
    hours,
    minutes,
    0,
    0,
  );
}

// ---------------------------------------------------------------- Clients

const CLIENT_ROWS: Array<Omit<LandingClient, 'id'>> = [
  { firstName: 'Karim', lastName: 'Belkacem', phone: '06 12 45 78 90', company: null },
  { firstName: 'Sophie', lastName: 'Marchand', phone: '06 24 81 35 07', company: 'Agence Voyages Horizon' },
  { firstName: 'Laurent', lastName: 'Petit', phone: '06 45 09 62 13', company: null },
  { firstName: 'Amélie', lastName: 'Rousseau', phone: '07 58 12 44 26', company: null },
  { firstName: 'Nadia', lastName: 'Benali', phone: '06 71 30 58 42', company: null },
  { firstName: 'Thomas', lastName: 'Lefèvre', phone: '06 88 27 19 53', company: 'Cabinet Vernet & Associés' },
  { firstName: 'Claire', lastName: 'Fontaine', phone: '07 63 92 40 18', company: null },
  { firstName: 'Marc-Antoine', lastName: 'Girard', phone: '06 09 74 51 86', company: null },
  { firstName: 'Isabelle', lastName: 'Charpentier', phone: '06 37 58 20 94', company: 'Hôtel Le Meridional' },
  { firstName: 'Olivier', lastName: 'Blanchard', phone: '07 82 46 13 57', company: null },
];

// ---------------------------------------------------------------- Trajets
//
// Répertoire de trajets intra-muros identifiables, cyclé de façon
// déterministe — le quotidien du généraliste parisien : courses courtes,
// panier moyen ~24 €, vitesse ~11,8 km/h (la circulation réelle dans Paris).
// Pas de transferts aéroport en volume : le CA vient du nombre de courses,
// pas de la longueur des trajets.

interface RouteTemplate {
  pickup: string;
  destination: string;
  priceCents: Cents;
  distanceMeters: number;
  durationMinutes: number;
  type: CourseType;
}

const ROUTES: RouteTemplate[] = [
  { pickup: 'Place de la République, 75003 Paris', destination: 'Place de la Bastille, 75011 Paris', priceCents: 1400, distanceMeters: 2400, durationMinutes: 13, type: 'ONE_WAY' },
  { pickup: 'Gare Montparnasse, 75015 Paris', destination: 'Gare du Nord, 75010 Paris', priceCents: 2600, distanceMeters: 6800, durationMinutes: 34, type: 'STATION' },
  { pickup: 'Opéra Garnier, 75009 Paris', destination: 'Rue des Archives, Le Marais, 75004 Paris', priceCents: 1600, distanceMeters: 3200, durationMinutes: 17, type: 'ONE_WAY' },
  { pickup: 'Avenue des Champs-Élysées, 75008 Paris', destination: 'Gare de Lyon, 75012 Paris', priceCents: 2800, distanceMeters: 7400, durationMinutes: 38, type: 'STATION' },
  { pickup: 'Saint-Germain-des-Prés, 75006 Paris', destination: 'Place de la République, 75003 Paris', priceCents: 2200, distanceMeters: 6000, durationMinutes: 30, type: 'ONE_WAY' },
  { pickup: 'Place du Trocadéro, 75016 Paris', destination: 'Musée du Louvre, 75001 Paris', priceCents: 2000, distanceMeters: 5000, durationMinutes: 26, type: 'ONE_WAY' },
  { pickup: 'Gare de l’Est, 75010 Paris', destination: 'Butte Montmartre, 75018 Paris', priceCents: 1800, distanceMeters: 4400, durationMinutes: 23, type: 'STATION' },
  { pickup: 'Bercy Village, 75012 Paris', destination: 'Les Batignolles, 75017 Paris', priceCents: 3600, distanceMeters: 10600, durationMinutes: 52, type: 'ONE_WAY' },
  { pickup: 'Porte de Versailles, 75015 Paris', destination: 'Gare du Nord, 75010 Paris', priceCents: 3100, distanceMeters: 9000, durationMinutes: 45, type: 'STATION' },
  { pickup: 'Place de la Bastille, 75011 Paris', destination: 'Belleville, 75020 Paris', priceCents: 1800, distanceMeters: 4100, durationMinutes: 21, type: 'ONE_WAY' },
  { pickup: 'Esplanade des Invalides, 75007 Paris', destination: 'Parc des Buttes-Chaumont, 75019 Paris', priceCents: 3300, distanceMeters: 9200, durationMinutes: 47, type: 'ONE_WAY' },
  { pickup: 'Carrefour de l’Odéon, 75006 Paris', destination: 'Gare Saint-Lazare, 75008 Paris', priceCents: 2100, distanceMeters: 5400, durationMinutes: 28, type: 'STATION' },
  { pickup: 'Place de la Nation, 75011 Paris', destination: 'Pigalle, 75009 Paris', priceCents: 3000, distanceMeters: 8600, durationMinutes: 44, type: 'ONE_WAY' },
  { pickup: 'Hôtel Le Meridional, 21 Rue du Bac, 75007 Paris', destination: 'Gare de Lyon, 75012 Paris', priceCents: 2400, distanceMeters: 5900, durationMinutes: 30, type: 'ONE_WAY' },
];

/**
 * Heures de départ par jour de semaine (0 = dimanche).
 * 50 courses par semaine → ~215 créneaux sur 30 jours, ~200 courses tenues
 * une fois les annulations retirées : le rythme du généraliste intra-muros.
 */
const HOURS_BY_WEEKDAY: ReadonlyArray<ReadonlyArray<[number, number]>> = [
  // Dimanche — journée calme.
  [[10, 0], [11, 45], [14, 0], [16, 30], [18, 15]],
  // Lundi.
  [[7, 30], [9, 0], [11, 15], [14, 30], [17, 0], [18, 45], [20, 15]],
  // Mardi.
  [[7, 15], [8, 45], [10, 30], [12, 15], [15, 0], [17, 30], [19, 15]],
  // Mercredi.
  [[7, 45], [9, 30], [11, 0], [13, 30], [15, 45], [17, 15], [19, 0], [20, 45]],
  // Jeudi.
  [[7, 30], [9, 15], [11, 30], [14, 0], [16, 15], [18, 0], [20, 30]],
  // Vendredi — journée chargée, soirée comprise.
  [[7, 15], [8, 45], [10, 15], [12, 30], [15, 15], [17, 45], [19, 30], [21, 15]],
  // Samedi — soirée comprise.
  [[9, 0], [10, 45], [13, 0], [15, 30], [17, 45], [19, 45], [21, 30], [23, 0]],
];

// ------------------------------------------------------------- Génération

export function createLandingDemo(now: Date = DEMO_REFERENCE_DATE): LandingDemo {
  const clients: LandingClient[] = CLIENT_ROWS.map((row, index) => ({
    id: demoId(5, index + 1),
    ...row,
  }));

  // ---- Un mois de courses, jour par jour, déterministe.

  const courses: LandingCourse[] = [];
  let sequence = 0;

  for (let dayOffset = -29; dayOffset <= 0; dayOffset += 1) {
    const weekday = at(now, dayOffset, 12, 0).getDay();
    const slots =
      dayOffset === 0
        ? // Aujourd'hui : la journée type du généraliste (~9 courses), matin
          // terminé, après-midi confirmé. L'ancre de 14:30 sert la
          // micro-action Agenda (la course qui se pose dans le créneau).
          ([
            [7, 30],
            [9, 0],
            [10, 15],
            [11, 45],
            [14, 30],
            [16, 0],
            [17, 30],
            [19, 0],
            [20, 45],
          ] as ReadonlyArray<[number, number]>)
        : HOURS_BY_WEEKDAY[weekday]!;

    for (const [hours, minutes] of slots) {
      const route = ROUTES[sequence % ROUTES.length]!;
      const client = clients[sequence % clients.length]!;

      // ~1 course sur 17 annulée dans le passé : la réalité d'un agenda,
      // sans peser sur le CA.
      let status: CourseStatus;
      if (dayOffset === 0) {
        status = hours < 12 ? 'COMPLETED' : 'CONFIRMED';
      } else {
        status = sequence % 17 === 13 ? 'CANCELLED' : 'COMPLETED';
      }

      courses.push({
        id: demoId(6, sequence + 1),
        scheduledAt: at(now, dayOffset, hours, minutes),
        client,
        pickup: route.pickup,
        destination: route.destination,
        priceCents: route.priceCents,
        distanceMeters: route.distanceMeters,
        durationMinutes: route.durationMinutes,
        status,
        type: route.type,
      });

      sequence += 1;
    }
  }

  // ---- Dépenses du mois : le coût de roulage réel d'un temps plein
  // intra-muros. Quasiment pas de péage dans Paris : le mix penche vers le
  // carburant, le lavage fréquent (clientèle en continu), l'entretien,
  // l'assurance et les abonnements (stationnement résidentiel, téléphone).

  const expenseRows: Array<{
    day: number;
    h: number;
    category: ExpenseCategory;
    amountCents: Cents;
    description: string;
  }> = [
    { day: -29, h: 7, category: 'FUEL', amountCents: 5240, description: 'Plein essence' },
    { day: -27, h: 14, category: 'OTHER', amountCents: 1200, description: 'Lavage extérieur' },
    { day: -25, h: 9, category: 'OTHER', amountCents: 1990, description: 'Abonnement téléphone pro' },
    { day: -25, h: 9, category: 'OTHER', amountCents: 3990, description: 'Abonnement comptabilité en ligne' },
    { day: -24, h: 8, category: 'FUEL', amountCents: 4980, description: 'Plein essence' },
    { day: -22, h: 15, category: 'OTHER', amountCents: 2400, description: 'Lavage intérieur et extérieur' },
    { day: -20, h: 11, category: 'MAINTENANCE', amountCents: 8900, description: 'Plaquettes de frein avant' },
    { day: -19, h: 8, category: 'FUEL', amountCents: 5100, description: 'Plein essence' },
    { day: -17, h: 10, category: 'PARKING', amountCents: 4550, description: 'Stationnement résidentiel — mensualité' },
    { day: -15, h: 9, category: 'INSURANCE', amountCents: 12840, description: 'Assurance professionnelle — mensualité' },
    { day: -14, h: 8, category: 'FUEL', amountCents: 5320, description: 'Plein essence' },
    { day: -12, h: 14, category: 'OTHER', amountCents: 1200, description: 'Lavage extérieur' },
    { day: -10, h: 8, category: 'FUEL', amountCents: 4890, description: 'Plein essence' },
    { day: -9, h: 16, category: 'MAINTENANCE', amountCents: 6450, description: 'Vidange et filtres' },
    { day: -7, h: 14, category: 'OTHER', amountCents: 2400, description: 'Lavage intérieur et extérieur' },
    { day: -5, h: 8, category: 'FUEL', amountCents: 5150, description: 'Plein essence' },
    { day: -4, h: 12, category: 'PARKING', amountCents: 780, description: 'Parking Indigo — pause déjeuner' },
    { day: -2, h: 14, category: 'OTHER', amountCents: 1200, description: 'Lavage extérieur' },
    { day: -1, h: 8, category: 'FUEL', amountCents: 5210, description: 'Plein essence' },
    { day: 0, h: 13, category: 'OTHER', amountCents: 990, description: 'Recharge lave-glace et microfibre' },
  ];

  const expenses: LandingExpense[] = expenseRows.map((row, index) => ({
    id: demoId(7, index + 1),
    spentAt: at(now, row.day, row.h, 0),
    category: row.category,
    amountCents: row.amountCents,
    description: row.description,
  }));

  // ---- Factures : numérotation chronologique continue, statuts variés.
  //
  // Le généraliste intra-muros facture ses clients réguliers en groupé
  // (hôtel, agence, cabinet) et quelques particuliers à la course. Les
  // montants collent au panier moyen ~24 € : 6 courses ≈ 145 €. La série du
  // mois va de -00031 à -00038 ; l'encours (envoyées + en retard) reste
  // proportionné au CA (~1 semaine de facturation).

  const year = now.getFullYear();
  const invoiceRows: Array<{
    number: number;
    clientIndex: number;
    status: InvoiceStatus;
    issuedDay: number;
    totalInclTaxCents: Cents;
    courseCount: number;
  }> = [
    { number: 31, clientIndex: 4, status: 'OVERDUE', issuedDay: -38, totalInclTaxCents: 9800, courseCount: 4 },
    { number: 32, clientIndex: 1, status: 'PAID', issuedDay: -26, totalInclTaxCents: 21400, courseCount: 9 },
    { number: 33, clientIndex: 8, status: 'PAID', issuedDay: -21, totalInclTaxCents: 26800, courseCount: 11 },
    { number: 34, clientIndex: 5, status: 'PAID', issuedDay: -16, totalInclTaxCents: 18200, courseCount: 8 },
    { number: 35, clientIndex: 0, status: 'PAID', issuedDay: -11, totalInclTaxCents: 7400, courseCount: 3 },
    { number: 36, clientIndex: 2, status: 'PAID', issuedDay: -7, totalInclTaxCents: 12600, courseCount: 5 },
    { number: 37, clientIndex: 1, status: 'SENT', issuedDay: -3, totalInclTaxCents: 23800, courseCount: 10 },
    { number: 38, clientIndex: 8, status: 'SENT', issuedDay: -1, totalInclTaxCents: 16400, courseCount: 7 },
  ];

  const invoices: LandingInvoice[] = invoiceRows.map((row, index) => {
    const client = clients[row.clientIndex]!;
    // Vérité arithmétique HT/TVA/TTC au centime (transport de personnes, 10 %).
    const breakdown = breakdownFromInclTax(row.totalInclTaxCents, 'NORMAL');

    return {
      id: demoId(8, index + 1),
      invoiceNumber: `${year}-${String(row.number).padStart(5, '0')}`,
      clientName: client.company ?? `${client.firstName} ${client.lastName}`,
      status: row.status,
      issuedAt: at(now, row.issuedDay, 11, 0),
      totalInclTaxCents: breakdown.inclTax,
      courseCount: row.courseCount,
    };
  });

  // ---- Agrégats VRAIS, calculés — jamais écrits en dur.

  const completed = courses.filter((c) => c.status === 'COMPLETED');

  const aggregates: LandingAggregates = {
    revenueCents: sumCents(completed.map((c) => c.priceCents)),
    courseCount: courses.filter((c) => c.status !== 'CANCELLED').length,
    workedMinutes: completed.reduce((total, c) => total + c.durationMinutes, 0),
    distanceMeters: completed.reduce((total, c) => total + c.distanceMeters, 0),
    expenseCents: sumCents(expenses.map((e) => e.amountCents)),
    outstandingCents: sumCents(
      invoices
        .filter((i) => i.status === 'SENT' || i.status === 'OVERDUE')
        .map((i) => i.totalInclTaxCents),
    ),
  };

  // ---- Tranches d'affichage : 10-12 lignes maximum par mockup.

  const today = courses.filter(
    (c) => c.scheduledAt.getDate() === now.getDate() && c.scheduledAt.getMonth() === now.getMonth(),
  );

  return {
    clients,
    month: { courses, invoices, expenses },
    aggregates,
    display: {
      todayCourses: today,
      recentCourses: courses.filter((c) => c.status !== 'CANCELLED').slice(-12),
      invoices: invoices.slice(-8),
      expenses: expenses.slice(-12).reverse(),
    },
  };
}
