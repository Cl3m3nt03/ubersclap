import { Injectable, Logger } from '@nestjs/common';
import type { GeoSuggestion, RouteResult } from '@ubersclap/shared';

import type { GeoProvider, LatLng } from './geo-provider';

/**
 * Fournisseur gratuit fonde sur OpenStreetMap.
 *
 * - Geocodage : Nominatim.
 * - Itineraire : OSRM (serveur de demonstration public).
 *
 * Aucune cle, aucun cout — le choix par defaut tant que le volume reste faible.
 * La contrepartie est la politique d'usage de Nominatim : un User-Agent
 * identifiable est obligatoire, et pas plus d'une requete par seconde. On
 * serialise donc les appels sortants avec un intervalle minimal ; le cache du
 * service, lui, evite la plupart des appels.
 *
 * Le serveur OSRM de demonstration n'a aucune garantie de disponibilite : c'est
 * acceptable en developpement, mais la bascule vers un fournisseur avec SLA
 * (Google, ou un OSRM auto-heberge) se fait en changeant GEO_PROVIDER, sans
 * toucher au reste.
 */
@Injectable()
export class OsmGeoProvider implements GeoProvider {
  private readonly logger = new Logger(OsmGeoProvider.name);

  private readonly nominatimUrl =
    process.env.NOMINATIM_URL?.replace(/\/+$/, '') ??
    'https://nominatim.openstreetmap.org';
  private readonly osrmUrl =
    process.env.OSRM_URL?.replace(/\/+$/, '') ??
    'https://router.project-osrm.org';
  // Nominatim exige un User-Agent identifiable avec un moyen de contact.
  private readonly userAgent =
    process.env.GEO_USER_AGENT ?? "Uber's Clap/0.1 (contact@ubersclap.dev)";

  /** Serialise les appels Nominatim en respectant l'intervalle minimal. */
  private nominatimGate: Promise<void> = Promise.resolve();
  private static readonly MIN_INTERVAL_MS = 1_100;

  async autocomplete(query: string, limit: number): Promise<GeoSuggestion[]> {
    const params = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      addressdetails: '1',
      limit: String(limit),
      // Biais France : un chauffeur francais tape « gare » et veut ses gares,
      // pas une homonyme a l'autre bout du monde. Le biais n'exclut pas
      // l'etranger, il le classe apres.
      countrycodes: 'fr',
      'accept-language': 'fr',
    });

    const rows = await this.throttledNominatim<NominatimPlace[]>(
      `${this.nominatimUrl}/search?${params.toString()}`,
    );
    if (!rows) return [];

    return rows
      .map((row) => ({
        label: row.display_name,
        latitude: Number(row.lat),
        longitude: Number(row.lon),
      }))
      .filter(
        (s) => Number.isFinite(s.latitude) && Number.isFinite(s.longitude),
      );
  }

  async route(from: LatLng, to: LatLng): Promise<RouteResult | null> {
    // OSRM attend lon,lat — l'inverse de la convention habituelle.
    const coords = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
    const url = `${this.osrmUrl}/route/v1/driving/${coords}?overview=false`;

    const body = await this.fetchJson<OsrmResponse>(url);
    if (!body || body.code !== 'Ok') return null;

    const route = body.routes?.[0];
    if (!route) return null;

    return {
      distanceMeters: Math.round(route.distance),
      durationMinutes: Math.round(route.duration / 60),
    };
  }

  /**
   * Enchaine les appels Nominatim un par un, en tenant l'intervalle minimal.
   *
   * Chaque appel attend que le precedent ait rendu la main puis laisse passer
   * le delai reglementaire avant de rendre la main a son tour. Deux requetes
   * simultanees ne peuvent donc pas doubler le serveur.
   */
  private throttledNominatim<T>(url: string): Promise<T | null> {
    const run = this.nominatimGate.then(async () => {
      const result = await this.fetchJson<T>(url, {
        'User-Agent': this.userAgent,
      });
      await delay(OsmGeoProvider.MIN_INTERVAL_MS);
      return result;
    });

    // La barriere avance meme si l'appel echoue : une erreur ne doit pas figer
    // toute la file.
    this.nominatimGate = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  private async fetchJson<T>(
    url: string,
    headers: Record<string, string> = {},
  ): Promise<T | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json', ...headers },
        signal: controller.signal,
      });
      if (!response.ok) {
        this.logger.warn(`Geo upstream ${response.status} sur ${url}`);
        return null;
      }
      return (await response.json()) as T;
    } catch (cause) {
      this.logger.warn(
        `Geo upstream injoignable: ${cause instanceof Error ? cause.message : cause}`,
      );
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface NominatimPlace {
  display_name: string;
  lat: string;
  lon: string;
}

interface OsrmResponse {
  code: string;
  routes?: { distance: number; duration: number }[];
}
