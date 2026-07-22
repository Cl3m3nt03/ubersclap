import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

/**
 * Ouvre une route sans authentification.
 *
 * A n'utiliser que sur `/auth/*` et `/health`. Toute autre usage doit etre
 * justifie en revue : la garde est globale precisement pour que l'ouverture
 * soit un acte visible dans le diff.
 */
export const Public = () => SetMetadata(IS_PUBLIC, true);
