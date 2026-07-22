import {
  createParamDecorator,
  InternalServerErrorException,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * Injecte l'identifiant du chauffeur authentifie.
 *
 * C'est la SEULE source admise pour un `driverId`. Il ne doit jamais provenir
 * du corps de la requete, d'un parametre d'URL ou d'une chaine de requete :
 * sinon n'importe quel client peut lire les donnees d'un autre chauffeur en
 * changeant un identifiant.
 *
 * ADR-007 : toute requete metier commence par `where driverId = <cette valeur>`.
 */
export const CurrentDriverId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<Request>();
    const driverId = request.driver?.sub;

    if (!driverId) {
      // Ne peut survenir que si la garde a ete contournee — un `@Public()`
      // pose par erreur sur une route metier. On echoue bruyamment plutot
      // que de servir des donnees sans filtre.
      throw new InternalServerErrorException(
        'CurrentDriverId utilisé sur une route non authentifiée',
      );
    }

    return driverId;
  },
);
