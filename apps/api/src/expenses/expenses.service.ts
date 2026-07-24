import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import type {
  CreateExpenseInput,
  UpdateExpenseInput,
} from '@ubersclap/shared';

import { DATABASE } from '../database/database.module';
import type { Database } from '../database/client';
import { expenses } from '../database/schema';
import { serializeExpense } from '../common/serialize';

@Injectable()
export class ExpensesService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async list(
    driverId: string,
    filters: { from?: string; to?: string; courseId?: string } = {},
  ) {
    const rows = await this.db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.driverId, driverId),
          isNull(expenses.deletedAt),
          filters.from ? gte(expenses.spentAt, new Date(filters.from)) : undefined,
          filters.to ? lte(expenses.spentAt, new Date(filters.to)) : undefined,
          filters.courseId ? eq(expenses.courseId, filters.courseId) : undefined,
        ),
      )
      .orderBy(desc(expenses.spentAt))
      .limit(500);

    return rows.map(serializeExpense);
  }

  async create(driverId: string, input: CreateExpenseInput) {
    const [created] = await this.db
      .insert(expenses)
      .values({
        id: input.id,
        driverId,
        courseId: input.courseId,
        vehicleId: input.vehicleId,
        category: input.category,
        amountCents: input.amountCents,
        description: input.description,
        spentAt: new Date(input.spentAt),
      })
      .returning();

    return serializeExpense(created);
  }

  async update(driverId: string, id: string, patch: UpdateExpenseInput) {
    await this.findRow(driverId, id);

    const [updated] = await this.db
      .update(expenses)
      .set({
        category: patch.category,
        amountCents: patch.amountCents,
        description: patch.description,
        courseId: patch.courseId,
        vehicleId: patch.vehicleId,
        spentAt: patch.spentAt ? new Date(patch.spentAt) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(expenses.id, id), eq(expenses.driverId, driverId)))
      .returning();

    return serializeExpense(updated);
  }

  /**
   * Suppression logique : une depense supprimee reste dans l'historique
   * comptable de l'annee, elle disparait seulement des listes.
   */
  async remove(driverId: string, id: string) {
    await this.findRow(driverId, id);
    await this.db
      .update(expenses)
      .set({ deletedAt: new Date() })
      .where(and(eq(expenses.id, id), eq(expenses.driverId, driverId)));
  }

  private async findRow(driverId: string, id: string) {
    const record = await this.db.query.expenses.findFirst({
      where: and(
        eq(expenses.id, id),
        eq(expenses.driverId, driverId),
        isNull(expenses.deletedAt),
      ),
    });

    if (!record) {
      throw new NotFoundException({
        message: 'Dépense introuvable',
        code: 'EXPENSE_NOT_FOUND',
      });
    }

    return record;
  }
}
