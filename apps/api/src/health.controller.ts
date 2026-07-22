import { Controller, Get, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE } from './database/database.module';
import type { Database } from './database/client';

@Controller('health')
export class HealthController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Verifie que l'API repond ET que la base repond.
   *
   * Un health check qui renvoie 200 sans toucher la base ment : il reste vert
   * pendant que l'application est incapable de servir la moindre requete.
   */
  @Get()
  async check() {
    await this.db.execute(sql`select 1`);
    return { status: 'ok', database: 'ok' };
  }
}
