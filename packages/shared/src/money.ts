/**
 * Argent — toujours en centimes entiers.
 *
 * Voir ADR-009 (00_CANON.md) : un `decimal` non precise ou un `float` produit
 * des ecarts d'arrondi. Sur une facture, qui est un document comptable
 * opposable, un ecart d'un centime est un probleme. Les centimes entiers
 * rendent l'arithmetique exacte.
 *
 * Le formatage est ecrit a la main plutot que via Intl : le support d'Intl dans
 * Hermes est inegal selon les plateformes, et le PDF genere cote serveur doit
 * produire exactement la meme chaine que l'ecran mobile.
 */

/** Espace insecable — separateur de milliers francais. */
const NBSP = ' ';

export type Cents = number;

/** Formate des centimes en euros : 12000 -> "120,00 €" */
export function formatEuros(
  cents: Cents,
  options: { symbol?: boolean } = {},
): string {
  const { symbol = true } = options;
  const rounded = Math.round(cents);
  const negative = rounded < 0;
  const absolute = Math.abs(rounded);

  const units = Math.floor(absolute / 100);
  const decimals = String(absolute % 100).padStart(2, '0');
  const grouped = String(units).replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);

  const amount = `${negative ? '-' : ''}${grouped},${decimals}`;
  return symbol ? `${amount}${NBSP}€` : amount;
}

/** Parse une saisie utilisateur en centimes. "120,50" et "120.50" -> 12050 */
export function parseEuros(input: string): Cents | null {
  const cleaned = input.replace(/[\s €]/g, '').replace(',', '.');
  if (cleaned === '' || !/^-?\d*\.?\d*$/.test(cleaned)) return null;

  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;

  return Math.round(value * 100);
}

/**
 * TVA.
 *
 * Le transport de personnes releve du taux reduit a 10 %, pas de 20 %.
 * Un chauffeur en franchise en base facture a 0 % et doit porter la mention
 * "TVA non applicable, art. 293 B du CGI".
 *
 * Voir ADR-012 (00_CANON.md) — a faire valider par un expert-comptable.
 */
export const VAT_RATE = {
  /** Transport de personnes, France. */
  PASSENGER_TRANSPORT: 0.1,
  /** Franchise en base : aucune TVA facturee. */
  FRANCHISE: 0,
} as const;

/**
 * Regime de TVA — pilote le calcul et les mentions de chaque facture.
 *
 * Voir ADR-012 : generer une facture avec TVA pour un chauffeur en franchise
 * en base produit une facture fausse. Le champ n'est donc pas administratif,
 * il est comptable.
 */
export const VAT_REGIMES = ['FRANCHISE', 'NORMAL'] as const;

export type VatRegime = (typeof VAT_REGIMES)[number];

export interface AmountBreakdown {
  exclTax: Cents;
  tax: Cents;
  inclTax: Cents;
  rate: number;
}

/** Calcule HT / TVA / TTC a partir d'un montant hors taxes. */
export function breakdownFromExclTax(
  exclTax: Cents,
  regime: VatRegime,
): AmountBreakdown {
  const rate =
    regime === 'FRANCHISE'
      ? VAT_RATE.FRANCHISE
      : VAT_RATE.PASSENGER_TRANSPORT;

  const tax = Math.round(exclTax * rate);
  return { exclTax, tax, inclTax: exclTax + tax, rate };
}

/**
 * Calcule HT / TVA / TTC a partir d'un montant TTC.
 *
 * C'est le sens courant : un chauffeur annonce un prix TTC a son client
 * ("120 € pour CDG"), pas un prix HT.
 */
export function breakdownFromInclTax(
  inclTax: Cents,
  regime: VatRegime,
): AmountBreakdown {
  const rate =
    regime === 'FRANCHISE'
      ? VAT_RATE.FRANCHISE
      : VAT_RATE.PASSENGER_TRANSPORT;

  const exclTax = Math.round(inclTax / (1 + rate));
  return { exclTax, tax: inclTax - exclTax, inclTax, rate };
}

/** Somme de centimes. Explicite, pour eviter tout `reduce` avec un float. */
export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce<Cents>((total, value) => total + Math.round(value), 0);
}

/**
 * Tarif indicatif — ADR-015 (non tranchee).
 *
 * Le prix d'une course reste saisi et modifiable a la main : un chauffeur
 * negocie, applique un forfait aeroport, arrondit pour un habitue. Ce bareme ne
 * sert qu'a PROPOSER un prix de depart a partir de la distance calculee, jamais
 * a l'imposer.
 *
 * Les deux nombres vivent ici, en un seul endroit, tant qu'ADR-015 n'a pas
 * fige une vraie grille (forfaits, majoration de nuit, minimum de course). Le
 * jour ou le chauffeur pourra les regler lui-meme, ce type devient le contenu
 * d'un reglage ; la fonction de calcul, elle, ne bouge pas.
 */
export interface Tariff {
  /** Prise en charge, appliquee une fois par course. */
  baseFareCents: Cents;
  /** Prix au kilometre parcouru. */
  perKmCents: Cents;
  /** Prix a la minute — 0 par defaut, la plupart facturent au km. */
  perMinuteCents: Cents;
}

export const DEFAULT_TARIFF: Tariff = {
  baseFareCents: 500,
  perKmCents: 200,
  perMinuteCents: 0,
};

/**
 * Prix indicatif TTC d'une course a partir de son itineraire.
 *
 * Arrondi aux 50 centimes : un prix annonce au client est « 42,50 € », pas
 * « 42,37 € ». C'est un devis parle, pas une caisse enregistreuse.
 */
export function suggestFareCents(
  distanceMeters: number,
  durationMinutes: number,
  tariff: Tariff = DEFAULT_TARIFF,
): Cents {
  const km = distanceMeters / 1000;
  const raw =
    tariff.baseFareCents +
    km * tariff.perKmCents +
    durationMinutes * tariff.perMinuteCents;

  return Math.round(raw / 50) * 50;
}
