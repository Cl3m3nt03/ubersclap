import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * Valide un corps de requete contre un schema Zod partage.
 *
 * Le schema vient de @ubersclap/shared, donc l'API et le mobile valident
 * exactement les memes regles. Une divergence entre les deux devient
 * impossible : c'est le seul vrai gain d'un stack TypeScript de bout en bout.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        message: 'Données invalides',
        code: 'VALIDATION_ERROR',
        // Les messages des schemas sont deja rediges en francais pour
        // l'utilisateur final : ils sont affichables tels quels.
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    return result.data;
  }
}
