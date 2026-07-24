import { Inject, Injectable } from '@nestjs/common';
import type { GeoSuggestion, RouteResult } from '@ubersclap/shared';

import { GEO_PROVIDER, type GeoProvider, type LatLng } from './providers/geo-provider';

/** En-deca de trois caracteres, une recherche d'adresse ne discrimine rien. */
const MIN_QUERY_LENGTH = 3;
const MAX_SUGGESTIONS = 6;
const CACHE_TTL_MS = 5 * 60_000;

type CacheEntry<T> = { value: T; expiresAt: number };

/**
 * Geocodage et itineraire, avec un cache court en memoire.
 *
 * Deux frappes successives sur le meme champ, ou deux chauffeurs qui cherchent
 * « Gare de Lyon », ne doivent pas produire deux appels au fournisseur : c'est
 * ce qui garde la consommation sous la limite de Nominatim et la latence basse.
 * Le cache est volontairement en memoire et sans persistance — il protege un
 * pic, il n'est pas une source de verite.
 */
@Injectable()
export class GeoService {
  private readonly autocompleteCache = new Map<string, CacheEntry<GeoSuggestion[]>>();
  private readonly routeCache = new Map<string, CacheEntry<RouteResult | null>>();

  constructor(@Inject(GEO_PROVIDER) private readonly provider: GeoProvider) {}

  async autocomplete(rawQuery: string): Promise<GeoSuggestion[]> {
    const query = rawQuery.trim();
    if (query.length < MIN_QUERY_LENGTH) return [];

    const key = query.toLowerCase();
    const cached = this.read(this.autocompleteCache, key);
    if (cached) return cached;

    const suggestions = await this.provider.autocomplete(query, MAX_SUGGESTIONS);
    this.write(this.autocompleteCache, key, suggestions);
    return suggestions;
  }

  async route(from: LatLng, to: LatLng): Promise<RouteResult | null> {
    const key = `${round(from)}|${round(to)}`;
    const cached = this.routeCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const result = await this.provider.route(from, to);
    this.write(this.routeCache, key, result);
    return result;
  }

  private read<T>(cache: Map<string, CacheEntry<T>>, key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      cache.delete(key);
      return null;
    }
    return entry.value;
  }

  private write<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T) {
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  }
}

/** Arrondi ~11 m : deux points a moins de ca partagent le meme itineraire. */
function round(point: LatLng): string {
  return `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`;
}
