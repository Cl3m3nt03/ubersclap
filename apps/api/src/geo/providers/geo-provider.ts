import type { GeoSuggestion, RouteResult } from '@ubersclap/shared';

export interface LatLng {
  latitude: number;
  longitude: number;
}

/**
 * Fournisseur de geocodage et d'itineraire.
 *
 * Une seule interface derriere laquelle vivent OpenStreetMap aujourd'hui et
 * Google demain. Le service et le controleur ne connaissent que ce contrat ;
 * changer de fournisseur ne touche a rien d'autre que le module qui choisit
 * l'implementation. La cle d'API, quand il y en aura une, reste ici — cote
 * serveur — et jamais dans le bundle mobile.
 */
export interface GeoProvider {
  /** Suggestions d'adresses pour une saisie partielle. */
  autocomplete(query: string, limit: number): Promise<GeoSuggestion[]>;

  /**
   * Distance et duree en voiture entre deux points.
   *
   * `null` quand aucun itineraire routier n'existe (points sur des continents
   * differents, coordonnees en pleine mer) : l'appelant traite l'absence, il
   * n'invente pas une distance a vol d'oiseau.
   */
  route(from: LatLng, to: LatLng): Promise<RouteResult | null>;
}

/** Jeton d'injection : l'implementation est choisie dans GeoModule selon l'env. */
export const GEO_PROVIDER = Symbol('GEO_PROVIDER');
