/**
 * Jeu de données de démonstration — marché français, région parisienne.
 *
 * Sert trois usages : le mode démo de l'app mobile (EXPO_PUBLIC_DEMO_MODE),
 * les mockups de la landing page, et une base de données de développement.
 *
 * Règles tenues ici :
 *  - Aucun nom de personne réelle, aucun lorem ipsum.
 *  - Les agrégats (CA, volume, temps) sont CALCULÉS depuis les courses,
 *    jamais écrits en dur : ils sont vrais par construction.
 *  - Numérotation de factures chronologique continue, sans trou (ADR-012),
 *    cohérente avec les statuts (l'impayée en retard est la plus ancienne).
 *  - Montants en centimes entiers (ADR-009), sommés via sumCents.
 *  - Les dates sont RELATIVES à `now` : l'agenda du jour a toujours des
 *    courses, quelle que soit la date de la capture d'écran.
 *
 * Le formatage (virgule décimale, espace insécable avant €, jj/mm/aaaa)
 * n'est pas fait ici : il appartient à format.ts / money.ts au moment de
 * l'affichage. Les fixtures ne stockent que des valeurs typées.
 */

import { sumCents, breakdownFromInclTax, type Cents } from '../money';
import type { CourseStatus, CourseType } from '../course';
import type {
  ClientCategory,
  ClientDetail,
  ClientRecord,
  CourseWithClient,
  Expense,
  ExpenseCategory,
  InvoiceStatus,
  InvoiceSummary,
} from '../schemas';
import type { Me } from '../auth';

// ------------------------------------------------------------- Identifiants

/**
 * UUID déterministes et valides (v4/variante 8) : les mêmes identifiants à
 * chaque exécution, pour des captures reproductibles et des tests stables.
 */
function demoId(prefix: number, n: number): string {
  return `00000000-0000-4000-8000-${String(prefix)}${String(n).padStart(11, '0')}`;
}

const DRIVER_ID = demoId(9, 1);

// ------------------------------------------------------------------- Dates

function at(now: Date, dayOffset: number, hours: number, minutes: number): Date {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hours, minutes, 0, 0);
  return d;
}

function iso(date: Date): string {
  return date.toISOString();
}

// ------------------------------------------------------------------ Données

export interface DemoData {
  driver: Me;
  clients: ClientRecord[];
  clientDetails: ClientDetail[];
  courses: CourseWithClient[];
  invoices: InvoiceSummary[];
  expenses: Expense[];
  /** Agrégats VRAIS, calculés depuis les courses terminées de la semaine. */
  aggregates: DemoAggregates;
}

export interface DemoAggregates {
  /** CA TTC des courses terminées (teal — l'argent gagné). */
  revenueCents: Cents;
  /** Nombre de courses non annulées (coral — le volume). */
  courseCount: number;
  /** Minutes de conduite des courses terminées (purple — le temps). */
  workedMinutes: number;
  /** Kilométrage des courses terminées, en mètres. */
  distanceMeters: number;
  /** Total des dépenses de la semaine. */
  expenseCents: Cents;
  /** Encours : factures envoyées ou en retard, pas encore payées. */
  outstandingCents: Cents;
}

export function createDemoData(now: Date = new Date()): DemoData {
  // ----------------------------------------------------------- 8 clients

  const clientRows: Array<{
    n: number;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    company: string | null;
    category: ClientCategory;
    notes: string | null;
  }> = [
    { n: 1, firstName: 'Karim', lastName: 'Belkacem', phone: '06 12 45 78 90', email: 'k.belkacem@exemple.fr', company: null, category: 'VIP', notes: 'Toujours une bouteille d’eau à bord. Règle en fin de mois.' },
    { n: 2, firstName: 'Sophie', lastName: 'Marchand', phone: '06 24 81 35 07', email: 'reservation@voyages-horizon.fr', company: 'Agence Voyages Horizon', category: 'BUSINESS', notes: 'Transferts aéroport pour ses clients. Facture groupée mensuelle.' },
    { n: 3, firstName: 'Laurent', lastName: 'Petit', phone: '06 45 09 62 13', email: null, company: null, category: 'REGULAR', notes: 'Gare de Lyon le lundi, retour le jeudi.' },
    { n: 4, firstName: 'Amélie', lastName: 'Rousseau', phone: '07 58 12 44 26', email: 'amelie.rousseau@exemple.fr', company: null, category: 'OCCASIONAL', notes: null },
    { n: 5, firstName: 'Nadia', lastName: 'Benali', phone: '06 71 30 58 42', email: null, company: null, category: 'REGULAR', notes: 'Préfère être appelée 10 minutes avant l’arrivée.' },
    { n: 6, firstName: 'Thomas', lastName: 'Lefèvre', phone: '06 88 27 19 53', email: 't.lefevre@vernet-associes.fr', company: 'Cabinet Vernet & Associés', category: 'BUSINESS', notes: 'Siège à La Défense. Reçus obligatoires.' },
    { n: 7, firstName: 'Claire', lastName: 'Fontaine', phone: '07 63 92 40 18', email: null, company: null, category: 'OCCASIONAL', notes: null },
    { n: 8, firstName: 'Marc-Antoine', lastName: 'Girard', phone: '06 09 74 51 86', email: 'ma.girard@exemple.fr', company: null, category: 'PROSPECT', notes: 'Recommandé par Karim Belkacem.' },
  ];

  const clients: ClientRecord[] = clientRows.map((row) => ({
    id: demoId(1, row.n),
    driverId: DRIVER_ID,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    email: row.email,
    company: row.company,
    category: row.category,
    notes: row.notes,
    createdAt: iso(at(now, -90 - row.n * 7, 10, 0)),
    updatedAt: iso(at(now, -7, 18, 0)),
  }));

  const clientById = new Map(clients.map((c) => [c.id, c]));

  // -------------------------------------------- 12 courses sur une semaine

  const courseRows: Array<{
    n: number;
    day: number;
    h: number;
    m: number;
    clientN: number;
    pickup: string;
    destination: string;
    priceCents: Cents;
    distanceMeters: number;
    durationMinutes: number;
    status: CourseStatus;
    type: CourseType;
    passengers?: number;
    luggage?: number;
    notes?: string;
  }> = [
    { n: 1, day: -6, h: 8, m: 30, clientN: 2, pickup: '8 Avenue Montaigne, 75008 Paris', destination: 'Aéroport Paris-Charles-de-Gaulle, Terminal 2E, 95700 Roissy-en-France', priceCents: 7800, distanceMeters: 34200, durationMinutes: 48, status: 'COMPLETED', type: 'AIRPORT', luggage: 2 },
    { n: 2, day: -6, h: 15, m: 0, clientN: 3, pickup: 'Gare de Lyon, Place Louis-Armand, 75012 Paris', destination: '25 Avenue Charles-de-Gaulle, 92200 Neuilly-sur-Seine', priceCents: 3200, distanceMeters: 9800, durationMinutes: 28, status: 'COMPLETED', type: 'STATION', luggage: 1 },
    { n: 3, day: -5, h: 11, m: 15, clientN: 1, pickup: 'Place Vendôme, 75001 Paris', destination: 'Château de Versailles, Place d’Armes, 78000 Versailles', priceCents: 6500, distanceMeters: 23400, durationMinutes: 40, status: 'COMPLETED', type: 'ONE_WAY', passengers: 2 },
    { n: 4, day: -4, h: 9, m: 45, clientN: 5, pickup: '5 Rue de la Ferme, 92100 Boulogne-Billancourt', destination: 'Gare Montparnasse, 17 Boulevard de Vaugirard, 75015 Paris', priceCents: 2850, distanceMeters: 7600, durationMinutes: 24, status: 'COMPLETED', type: 'STATION', luggage: 1 },
    { n: 5, day: -4, h: 19, m: 30, clientN: 4, pickup: '12 Rue de Rivoli, 75004 Paris', destination: 'Aéroport Paris-Orly, Terminal 4, 94390 Orly', priceCents: 4700, distanceMeters: 19800, durationMinutes: 35, status: 'CANCELLED', type: 'AIRPORT', notes: 'Vol annulé par la compagnie.' },
    { n: 6, day: -3, h: 7, m: 0, clientN: 6, pickup: 'Tour First, 1 Place des Saisons, 92400 Courbevoie', destination: 'Aéroport Paris-Charles-de-Gaulle, Terminal 2E, 95700 Roissy-en-France', priceCents: 8200, distanceMeters: 38200, durationMinutes: 45, status: 'COMPLETED', type: 'AIRPORT', luggage: 2 },
    { n: 7, day: -3, h: 18, m: 20, clientN: 1, pickup: 'Palais des Congrès, 2 Place de la Porte Maillot, 75017 Paris', destination: 'Place Vendôme, 75001 Paris', priceCents: 2600, distanceMeters: 5400, durationMinutes: 22, status: 'COMPLETED', type: 'EVENT' },
    { n: 8, day: -2, h: 10, m: 0, clientN: 7, pickup: 'Aéroport Paris-Orly, Terminal 4, 94390 Orly', destination: '12 Rue de Rivoli, 75004 Paris', priceCents: 4650, distanceMeters: 19800, durationMinutes: 38, status: 'COMPLETED', type: 'AIRPORT', luggage: 3, passengers: 2 },
    { n: 9, day: -1, h: 8, m: 15, clientN: 2, pickup: 'Aéroport Paris-Charles-de-Gaulle, Terminal 2E, 95700 Roissy-en-France', destination: '8 Avenue Montaigne, 75008 Paris', priceCents: 8000, distanceMeters: 34200, durationMinutes: 52, status: 'COMPLETED', type: 'AIRPORT', luggage: 2 },
    { n: 10, day: 0, h: 9, m: 30, clientN: 3, pickup: '25 Avenue Charles-de-Gaulle, 92200 Neuilly-sur-Seine', destination: 'Gare de Lyon, Place Louis-Armand, 75012 Paris', priceCents: 3400, distanceMeters: 9800, durationMinutes: 30, status: 'COMPLETED', type: 'STATION', luggage: 1 },
    // La course de 14 h 30 : celle qui « se pose dans le créneau » de la
    // micro-action Agenda (DESIGN_CONTEXT.md §7).
    { n: 11, day: 0, h: 14, m: 30, clientN: 1, pickup: 'Place Vendôme, 75001 Paris', destination: 'Aéroport Paris-Charles-de-Gaulle, Terminal 2E, 95700 Roissy-en-France', priceCents: 7500, distanceMeters: 32600, durationMinutes: 42, status: 'CONFIRMED', type: 'AIRPORT', luggage: 2 },
    { n: 12, day: 1, h: 16, m: 0, clientN: 8, pickup: 'Gare Montparnasse, 17 Boulevard de Vaugirard, 75015 Paris', destination: '13 Rue au Pain, 78100 Saint-Germain-en-Laye', priceCents: 5500, distanceMeters: 24800, durationMinutes: 40, status: 'DRAFT', type: 'ONE_WAY', notes: 'Devis à confirmer par téléphone.' },
  ];

  const courses: CourseWithClient[] = courseRows.map((row) => {
    const client = clientById.get(demoId(1, row.clientN))!;
    const scheduled = at(now, row.day, row.h, row.m);

    return {
      id: demoId(2, row.n),
      driverId: DRIVER_ID,
      clientId: client.id,
      type: row.type,
      status: row.status,
      pickup: { label: row.pickup },
      destination: { label: row.destination },
      scheduledAt: iso(scheduled),
      timezone: 'Europe/Paris',
      passengers: row.passengers ?? 1,
      luggage: row.luggage ?? 0,
      childSeat: false,
      priceInclTaxCents: row.priceCents,
      finalPriceInclTaxCents: row.status === 'COMPLETED' ? row.priceCents : null,
      distanceMeters: row.distanceMeters,
      durationMinutes: row.durationMinutes,
      notes: row.notes ?? null,
      createdAt: iso(at(now, row.day - 2, 12, 0)),
      updatedAt: iso(scheduled),
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
      },
    };
  });

  // --------------------------------------------------------- 6 factures
  //
  // Numérotation chronologique continue (ADR-012) : la plus ancienne porte le
  // plus petit numéro. L'impayée en retard est donc la première de la série.
  // Montants TTC ; le détail HT/TVA se déduit via breakdownFromInclTax
  // (transport de personnes : TVA 10 %).

  const year = now.getFullYear();
  const invoiceRows: Array<{
    n: number;
    number: number;
    clientN: number;
    status: InvoiceStatus;
    issuedDay: number;
    dueDay: number | null;
    paid: boolean;
    totalInclTaxCents: Cents;
    courseCount: number;
  }> = [
    { n: 1, number: 12, clientN: 5, status: 'OVERDUE', issuedDay: -45, dueDay: -15, paid: false, totalInclTaxCents: 5700, courseCount: 2 },
    { n: 2, number: 13, clientN: 6, status: 'PAID', issuedDay: -28, dueDay: 2, paid: true, totalInclTaxCents: 24600, courseCount: 3 },
    { n: 3, number: 14, clientN: 2, status: 'PAID', issuedDay: -21, dueDay: 9, paid: true, totalInclTaxCents: 15800, courseCount: 2 },
    { n: 4, number: 15, clientN: 1, status: 'PAID', issuedDay: -14, dueDay: 16, paid: true, totalInclTaxCents: 9100, courseCount: 2 },
    { n: 5, number: 16, clientN: 3, status: 'SENT', issuedDay: -5, dueDay: 25, paid: false, totalInclTaxCents: 6600, courseCount: 2 },
    // Courses n°1 et n°9 de la semaine : 78,00 € + 80,00 € = 158,00 €.
    { n: 6, number: 17, clientN: 2, status: 'SENT', issuedDay: -1, dueDay: 29, paid: false, totalInclTaxCents: 15800, courseCount: 2 },
  ];

  const invoices: InvoiceSummary[] = invoiceRows.map((row) => {
    const client = clientById.get(demoId(1, row.clientN))!;
    // Vérité arithmétique : HT + TVA = TTC, au centime près.
    const breakdown = breakdownFromInclTax(row.totalInclTaxCents, 'NORMAL');

    return {
      id: demoId(3, row.n),
      invoiceNumber: `${year}-${String(row.number).padStart(5, '0')}`,
      status: row.status,
      issuedAt: iso(at(now, row.issuedDay, 11, 0)),
      dueAt: row.dueDay === null ? null : iso(at(now, row.dueDay, 23, 59)),
      totalInclTaxCents: breakdown.inclTax,
      clientName: client.company ?? `${client.firstName} ${client.lastName}`,
      courseCount: row.courseCount,
    };
  });

  // -------------------------------------------------------- 10 dépenses

  const expenseRows: Array<{
    n: number;
    day: number;
    h: number;
    category: ExpenseCategory;
    amountCents: Cents;
    description: string;
  }> = [
    { n: 1, day: -6, h: 7, category: 'FUEL', amountCents: 6540, description: 'Plein gazole' },
    { n: 2, day: -6, h: 9, category: 'TOLL', amountCents: 990, description: 'Péage A14 — La Défense' },
    { n: 3, day: -5, h: 14, category: 'OTHER', amountCents: 2400, description: 'Lavage intérieur et extérieur' },
    { n: 4, day: -4, h: 8, category: 'FUEL', amountCents: 5820, description: 'Plein gazole' },
    { n: 5, day: -3, h: 7, category: 'PARKING', amountCents: 1800, description: 'Parking CDG T2E — attente passager' },
    { n: 6, day: -3, h: 17, category: 'TOLL', amountCents: 920, description: 'Péage A14 — retour Paris' },
    { n: 7, day: -2, h: 11, category: 'MAINTENANCE', amountCents: 18950, description: 'Révision 60 000 km' },
    { n: 8, day: -1, h: 9, category: 'INSURANCE', amountCents: 12840, description: 'Assurance professionnelle — mensualité' },
    { n: 9, day: -1, h: 19, category: 'FUEL', amountCents: 7200, description: 'Plein gazole' },
    { n: 10, day: 0, h: 8, category: 'TOLL', amountCents: 640, description: 'Péage A13' },
  ];

  const expenses: Expense[] = expenseRows.map((row) => ({
    id: demoId(4, row.n),
    driverId: DRIVER_ID,
    courseId: null,
    vehicleId: null,
    category: row.category,
    amountCents: row.amountCents,
    description: row.description,
    spentAt: iso(at(now, row.day, row.h, 0)),
    receiptUrl: null,
    createdAt: iso(at(now, row.day, row.h, 5)),
    updatedAt: iso(at(now, row.day, row.h, 5)),
  }));

  // ------------------------------------------- Agrégats VRAIS, calculés

  const completed = courses.filter((c) => c.status === 'COMPLETED');

  const aggregates: DemoAggregates = {
    revenueCents: sumCents(
      completed.map((c) => c.finalPriceInclTaxCents ?? c.priceInclTaxCents),
    ),
    courseCount: courses.filter((c) => c.status !== 'CANCELLED').length,
    workedMinutes: completed.reduce((total, c) => total + (c.durationMinutes ?? 0), 0),
    distanceMeters: completed.reduce((total, c) => total + (c.distanceMeters ?? 0), 0),
    expenseCents: sumCents(expenses.map((e) => e.amountCents)),
    outstandingCents: sumCents(
      invoices
        .filter((i) => i.status === 'SENT' || i.status === 'OVERDUE')
        .map((i) => i.totalInclTaxCents),
    ),
  };

  // ------------------------------------- Détails clients (stats vraies)

  const clientDetails: ClientDetail[] = clients.map((client) => {
    const own = courses.filter(
      (c) => c.clientId === client.id && c.status !== 'CANCELLED',
    );
    const ownCompleted = own.filter((c) => c.status === 'COMPLETED');
    const last = own
      .map((c) => c.scheduledAt)
      .sort()
      .at(-1);

    return {
      ...client,
      stats: {
        courseCount: own.length,
        totalCents: sumCents(
          ownCompleted.map((c) => c.finalPriceInclTaxCents ?? c.priceInclTaxCents),
        ),
        lastCourseAt: last ?? null,
      },
    };
  });

  // -------------------------------------------------- Chauffeur de démo

  const driver: Me = {
    id: DRIVER_ID,
    email: 'demo@exemple.fr',
    firstName: 'Julien',
    lastName: 'Moreau',
    role: 'ADMIN',
    createdAt: iso(at(now, -180, 9, 0)),
    phone: '06 12 34 56 78',
    profile: {
      companyName: 'Julien Moreau EI',
      legalForm: 'Entreprise individuelle',
      siret: '12345678900012',
      vatNumber: 'FR12345678900',
      vtcRegistrationNumber: 'EVTC075200001',
      vatRegime: 'NORMAL',
      address: '14 Rue des Peupliers, 92130 Issy-les-Moulineaux',
      logoUrl: null,
    },
    organization: {
      id: demoId(9, 2),
      name: 'Julien Moreau EI',
      role: 'ADMIN',
    },
    plan: { tier: 'SOLO', status: 'TRIALING' },
  };

  return { driver, clients, clientDetails, courses, invoices, expenses, aggregates };
}
