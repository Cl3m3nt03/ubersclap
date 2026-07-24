import { Module } from '@nestjs/common';

import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';
import { GEO_PROVIDER } from './providers/geo-provider';
import { OsmGeoProvider } from './providers/osm.provider';

/**
 * Le fournisseur est choisi ici, au demarrage, selon GEO_PROVIDER.
 *
 * `osm` (defaut) : gratuit, sans cle, fonde sur OpenStreetMap.
 * `google` : precis, avec SLA, mais paye et pilote par GOOGLE_MAPS_API_KEY.
 *
 * Le jour ou GoogleGeoProvider existe, il s'ajoute a ce switch et rien d'autre
 * ne bouge : service, controleur et mobile ne connaissent que l'interface.
 */
function resolveGeoProvider() {
  switch (process.env.GEO_PROVIDER) {
    case 'google':
      throw new Error(
        'GEO_PROVIDER=google : GoogleGeoProvider pas encore implémenté',
      );
    case 'osm':
    case undefined:
    case '':
      return OsmGeoProvider;
    default:
      throw new Error(`GEO_PROVIDER inconnu : ${process.env.GEO_PROVIDER}`);
  }
}

@Module({
  controllers: [GeoController],
  providers: [
    GeoService,
    OsmGeoProvider,
    { provide: GEO_PROVIDER, useExisting: resolveGeoProvider() },
  ],
  exports: [GeoService],
})
export class GeoModule {}
