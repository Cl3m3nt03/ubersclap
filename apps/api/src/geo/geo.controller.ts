import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { GeoSuggestion, RouteResult } from '@ubersclap/shared';

import { GeoService } from './geo.service';
import type { LatLng } from './providers/geo-provider';

/**
 * Proxy de geocodage et d'itineraire.
 *
 * Le mobile passe par ici plutot que d'appeler le fournisseur directement :
 * la cle et le quota restent cote serveur, le cache est mutualise entre tous
 * les appareils, et changer de fournisseur ne demande aucune mise a jour de
 * l'app. Les routes sont resserrees par @Throttle : ce sont des appels
 * sortants factures ou limites, pas des lectures de la base locale.
 */
@Controller('geo')
@Throttle({ default: { ttl: 60_000, limit: 40 } })
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get('autocomplete')
  autocomplete(@Query('q') q?: string): Promise<GeoSuggestion[]> {
    return this.geo.autocomplete(q ?? '');
  }

  @Get('route')
  async route(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<RouteResult> {
    const origin = parsePoint(from, 'from');
    const destination = parsePoint(to, 'to');

    const result = await this.geo.route(origin, destination);
    if (!result) {
      throw new UnprocessableEntityException({
        message: 'Aucun itinéraire routier entre ces deux points',
        code: 'NO_ROUTE',
      });
    }
    return result;
  }
}

/** Parse « lat,lng » en coordonnees validees. */
function parsePoint(raw: string | undefined, field: string): LatLng {
  const parts = (raw ?? '').split(',');
  const latitude = Number(parts[0]);
  const longitude = Number(parts[1]);

  const valid =
    parts.length === 2 &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180;

  if (!valid) {
    throw new BadRequestException({
      message: `Paramètre « ${field} » attendu au format lat,lng`,
      code: 'INVALID_COORDINATES',
    });
  }

  return { latitude, longitude };
}
