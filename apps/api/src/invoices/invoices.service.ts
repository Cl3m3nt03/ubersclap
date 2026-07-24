import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { v7 as uuidv7 } from 'uuid';
import {
  breakdownFromInclTax,
  formatShortDate,
  type CreateInvoiceInput,
  type Invoice,
  type InvoiceStatus,
  type InvoiceSummary,
} from '@ubersclap/shared';

import { DATABASE } from '../database/database.module';
import type { Database } from '../database/client';
import {
  clients,
  courses,
  driverProfiles,
  invoiceLines,
  invoiceSequences,
  invoices,
  users,
} from '../database/schema';
import { serializeInvoice, serializeInvoiceSummary } from '../common/serialize';
import { buildIssuerSnapshot } from './issuer-snapshot';

const DEFAULT_DUE_DAYS = 30;

@Injectable()
export class InvoicesService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async list(
    driverId: string,
    filters: { status?: InvoiceStatus } = {},
  ): Promise<InvoiceSummary[]> {
    const rows = await this.db
      .select({
        invoice: invoices,
        firstName: clients.firstName,
        lastName: clients.lastName,
        company: clients.company,
        courseCount: sql<number>`count(${invoiceLines.id})::int`,
      })
      .from(invoices)
      .innerJoin(clients, eq(invoices.clientId, clients.id))
      .leftJoin(invoiceLines, eq(invoiceLines.invoiceId, invoices.id))
      .where(
        and(
          eq(invoices.driverId, driverId),
          filters.status ? eq(invoices.status, filters.status) : undefined,
        ),
      )
      .groupBy(invoices.id, clients.firstName, clients.lastName, clients.company)
      .orderBy(desc(invoices.issuedAt))
      .limit(200);

    return rows.map((row) =>
      serializeInvoiceSummary(
        row.invoice,
        row.company ?? `${row.firstName} ${row.lastName}`,
        row.courseCount,
      ),
    );
  }

  async findOne(driverId: string, id: string): Promise<Invoice> {
    const invoice = await this.findRow(driverId, id);
    const lines = await this.db
      .select()
      .from(invoiceLines)
      .where(eq(invoiceLines.invoiceId, id))
      .orderBy(invoiceLines.createdAt);

    return serializeInvoice(invoice, lines);
  }

  /**
   * Emet une facture couvrant 1..N courses (ADR-005).
   *
   * L'emission est immediate : un numero est attribue, la facture est figee.
   * Il n'y a pas d'etat brouillon numerote — un numero consomme est un numero
   * qui ne doit jamais manquer dans la suite (ADR-012), donc on ne l'attribue
   * qu'a l'instant ou la facture devient un document opposable.
   */
  async create(driverId: string, input: CreateInvoiceInput): Promise<Invoice> {
    const user = await this.db.query.users.findFirst({
      where: and(eq(users.id, driverId), isNull(users.deletedAt)),
    });
    const profile = await this.db.query.driverProfiles.findFirst({
      where: eq(driverProfiles.userId, driverId),
    });

    // Sans regime de TVA ni SIRET, la facture serait fausse et pourtant
    // numerotee — donc indeletable. On refuse avant de consommer un numero.
    if (!user || !profile?.vatRegime || !profile?.siret) {
      throw new UnprocessableEntityException({
        message:
          'Complétez votre SIRET et votre régime de TVA dans le profil avant de facturer',
        code: 'INCOMPLETE_ISSUER_PROFILE',
      });
    }
    const vatRegime = profile.vatRegime;

    const client = await this.db.query.clients.findFirst({
      where: and(
        eq(clients.id, input.clientId),
        eq(clients.driverId, driverId),
        isNull(clients.deletedAt),
      ),
    });
    if (!client) {
      throw new NotFoundException({
        message: 'Client introuvable',
        code: 'CLIENT_NOT_FOUND',
      });
    }

    const billable = await this.db
      .select()
      .from(courses)
      .where(
        and(
          eq(courses.driverId, driverId),
          inArray(courses.id, input.courseIds),
          isNull(courses.deletedAt),
        ),
      );

    if (billable.length !== input.courseIds.length) {
      throw new BadRequestException({
        message: 'Une course sélectionnée est introuvable',
        code: 'COURSE_NOT_FOUND',
      });
    }
    for (const course of billable) {
      if (course.status !== 'COMPLETED') {
        throw new BadRequestException({
          message: 'Seule une course terminée peut être facturée',
          code: 'COURSE_NOT_BILLABLE',
        });
      }
      if (course.clientId !== input.clientId) {
        throw new BadRequestException({
          message: 'Toutes les courses doivent appartenir au même client',
          code: 'COURSE_CLIENT_MISMATCH',
        });
      }
    }

    // Une course ne se facture qu'une fois : deux factures sur la meme course
    // encaisseraient deux fois le client.
    const alreadyInvoiced = await this.db
      .select({ courseId: invoiceLines.courseId })
      .from(invoiceLines)
      .innerJoin(invoices, eq(invoiceLines.invoiceId, invoices.id))
      .where(
        and(
          eq(invoices.driverId, driverId),
          inArray(invoiceLines.courseId, input.courseIds),
        ),
      );
    if (alreadyInvoiced.length > 0) {
      throw new ConflictException({
        message: 'Une course sélectionnée est déjà facturée',
        code: 'COURSE_ALREADY_INVOICED',
      });
    }

    // Montants figes a l'emission. Le HT est deduit du TTC annonce au client
    // (money.ts) : c'est le prix parle qui fait foi, pas un HT theorique.
    const lineValues = billable.map((course) => {
      const priceIncl = course.finalPriceInclTaxCents ?? course.priceInclTaxCents;
      const breakdown = breakdownFromInclTax(priceIncl, vatRegime);
      return {
        courseId: course.id,
        label: `Transport de personnes — ${course.pickupLabel} → ${course.destinationLabel} (${formatShortDate(course.scheduledAt)})`,
        unitPriceExclTaxCents: breakdown.exclTax,
        taxRate: breakdown.rate,
        taxCents: breakdown.tax,
        inclCents: breakdown.inclTax,
      };
    });

    const totalExclTaxCents = sum(lineValues.map((l) => l.unitPriceExclTaxCents));
    const taxCents = sum(lineValues.map((l) => l.taxCents));
    const totalInclTaxCents = sum(lineValues.map((l) => l.inclCents));

    const year = new Date().getFullYear();
    const now = new Date();
    const dueAt = input.dueAt ? new Date(input.dueAt) : addDays(now, DEFAULT_DUE_DAYS);
    const snapshot = buildIssuerSnapshot(user, profile, client, vatRegime);

    await this.db.transaction(async (tx) => {
      // Numerotation continue et sans trou (ADR-012) : la ligne du compteur est
      // creee si besoin, puis verrouillee (`FOR UPDATE`) le temps d'incrementer.
      // Deux emissions simultanees se serialisent sur ce verrou plutot que de
      // se disputer le meme numero.
      await tx
        .insert(invoiceSequences)
        .values({ driverId, year, lastNumber: 0 })
        .onConflictDoNothing();

      const [sequence] = await tx
        .select()
        .from(invoiceSequences)
        .where(
          and(
            eq(invoiceSequences.driverId, driverId),
            eq(invoiceSequences.year, year),
          ),
        )
        .for('update');

      const nextNumber = sequence.lastNumber + 1;
      await tx
        .update(invoiceSequences)
        .set({ lastNumber: nextNumber })
        .where(
          and(
            eq(invoiceSequences.driverId, driverId),
            eq(invoiceSequences.year, year),
          ),
        );

      const invoiceNumber = `${year}-${String(nextNumber).padStart(5, '0')}`;

      await tx.insert(invoices).values({
        id: input.id,
        driverId,
        clientId: input.clientId,
        invoiceNumber,
        status: 'SENT',
        issuedAt: now,
        dueAt,
        totalExclTaxCents,
        taxCents,
        totalInclTaxCents,
        issuerSnapshot: JSON.stringify(snapshot),
      });

      await tx.insert(invoiceLines).values(
        lineValues.map((line) => ({
          id: uuidv7(),
          invoiceId: input.id,
          courseId: line.courseId,
          label: line.label,
          quantity: 1,
          unitPriceExclTaxCents: line.unitPriceExclTaxCents,
          taxRate: line.taxRate,
        })),
      );
    });

    return this.findOne(driverId, input.id);
  }

  /** Ligne brute + lignes, pour la generation du PDF. */
  async findRowWithLines(driverId: string, id: string) {
    const invoice = await this.findRow(driverId, id);
    const lines = await this.db
      .select()
      .from(invoiceLines)
      .where(eq(invoiceLines.invoiceId, id))
      .orderBy(invoiceLines.createdAt);
    return { invoice, lines };
  }

  private async findRow(driverId: string, id: string) {
    const invoice = await this.db.query.invoices.findFirst({
      where: and(eq(invoices.id, id), eq(invoices.driverId, driverId)),
    });

    if (!invoice) {
      throw new NotFoundException({
        message: 'Facture introuvable',
        code: 'INVOICE_NOT_FOUND',
      });
    }

    return invoice;
  }
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
