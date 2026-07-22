/**
 * Donnees de demonstration.
 *
 * Provisoire : a remplacer par TanStack Query sur l'API des que le backend
 * existe. Les formes respectent deja les schemas de @ubersclap/shared pour que
 * la bascule ne demande pas de retoucher les ecrans.
 *
 * Les montants sont en CENTIMES (ADR-009), les distances en METRES.
 */

import type { CourseRowData } from '@/components/CourseRow';

function at(hours: number, minutes: number): Date {
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export const driver = {
  firstName: 'Jean-Luc',
  lastName: 'Moreau',
};

export const todayCourses: CourseRowData[] = [
  {
    id: '01930000-0000-7000-8000-000000000001',
    scheduledAt: at(8, 30),
    clientName: 'M. Robert Lefebvre',
    pickup: 'Gare de Lyon',
    destination: 'Orly Ouest',
    priceCents: 6500,
    status: 'COMPLETED',
  },
  {
    id: '01930000-0000-7000-8000-000000000002',
    scheduledAt: at(10, 15),
    clientName: 'Sophie Bertrand',
    pickup: 'Hôtel Ritz',
    destination: 'La Défense',
    priceCents: 4500,
    status: 'COMPLETED',
  },
  {
    id: '01930000-0000-7000-8000-000000000003',
    scheduledAt: at(14, 30),
    clientName: 'M. Robert Lefebvre',
    pickup: 'Aéroport CDG T2E',
    destination: 'Hôtel Plaza Athénée',
    priceCents: 5500,
    status: 'CONFIRMED',
  },
  {
    id: '01930000-0000-7000-8000-000000000004',
    scheduledAt: at(17, 0),
    clientName: 'Groupe Vallier',
    pickup: 'Opéra Garnier',
    destination: 'Aéroport CDG T1',
    priceCents: 12000,
    status: 'CONFIRMED',
    pendingSync: true,
  },
];

export const todaySummary = {
  revenueCents: 18450,
  courses: 8,
  distanceMeters: 245_000,
  workedMinutes: 380,
  /** Ecart avec la veille, en pourcentage. */
  deltaPercent: 12,
};

export const clients = [
  {
    id: '01930000-0000-7000-8000-0000000000a1',
    firstName: 'Robert',
    lastName: 'Lefebvre',
    company: 'Lefebvre & Associés',
    courses: 24,
    totalCents: 186_000,
  },
  {
    id: '01930000-0000-7000-8000-0000000000a2',
    firstName: 'Sophie',
    lastName: 'Bertrand',
    company: 'Hôtel Ritz',
    courses: 41,
    totalCents: 312_500,
  },
  {
    id: '01930000-0000-7000-8000-0000000000a3',
    firstName: 'Marc',
    lastName: 'Vallier',
    company: 'Groupe Vallier',
    courses: 12,
    totalCents: 144_000,
  },
];

export const invoices = [
  {
    id: '01930000-0000-7000-8000-0000000000b1',
    invoiceNumber: '2026-00042',
    clientName: 'Hôtel Ritz',
    issuedAt: new Date(2026, 6, 20),
    totalInclTaxCents: 312_500,
    status: 'PAID' as const,
    courseCount: 41,
  },
  {
    id: '01930000-0000-7000-8000-0000000000b2',
    invoiceNumber: '2026-00041',
    clientName: 'Lefebvre & Associés',
    issuedAt: new Date(2026, 6, 18),
    totalInclTaxCents: 186_000,
    status: 'SENT' as const,
    courseCount: 24,
  },
  {
    id: '01930000-0000-7000-8000-0000000000b3',
    invoiceNumber: '2026-00040',
    clientName: 'Groupe Vallier',
    issuedAt: new Date(2026, 5, 30),
    totalInclTaxCents: 144_000,
    status: 'OVERDUE' as const,
    courseCount: 12,
  },
];
