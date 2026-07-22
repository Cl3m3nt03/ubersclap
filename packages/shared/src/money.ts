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

export type VatRegime = 'FRANCHISE' | 'NORMAL';

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
