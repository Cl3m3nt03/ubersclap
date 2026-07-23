import { getRandomBytes } from 'expo-crypto';

const HEX: string[] = Array.from({ length: 256 }, (_, byte) =>
  byte.toString(16).padStart(2, '0'),
);

/**
 * UUID v7 genere cote mobile (ADR-011).
 *
 * L'identifiant doit exister avant tout aller-retour reseau : une course creee
 * dans un parking souterrain est referencee par l'ecran, la file de mutations
 * et le serveur avec la meme valeur. Un ID attribue par le serveur rendrait
 * l'offline impossible.
 *
 * v7 plutot que v4 : les 48 premiers bits sont l'horodatage en millisecondes,
 * donc les cles sont ordonnees dans le temps et les index Postgres ne se
 * fragmentent pas.
 *
 * Ecrit a la main plutot que via `uuid` : le paquet npm depend de
 * `crypto.getRandomValues`, absent de Hermes, ce qui imposerait un polyfill
 * global pour vingt lignes de code.
 */
export function uuidv7(): string {
  const bytes = getRandomBytes(16);
  const timestamp = Date.now();

  // 48 bits d'horodatage, de l'octet de poids fort au plus faible.
  bytes[0] = (timestamp / 0x10000000000) & 0xff;
  bytes[1] = (timestamp / 0x100000000) & 0xff;
  bytes[2] = (timestamp / 0x1000000) & 0xff;
  bytes[3] = (timestamp / 0x10000) & 0xff;
  bytes[4] = (timestamp / 0x100) & 0xff;
  bytes[5] = timestamp & 0xff;

  // Version 7 sur les 4 bits hauts de l'octet 6.
  bytes[6] = 0x70 | (bytes[6] & 0x0f);
  // Variante RFC 4122 (10xx) sur les 2 bits hauts de l'octet 8.
  bytes[8] = 0x80 | (bytes[8] & 0x3f);

  const hex = Array.from(bytes, (byte) => HEX[byte]);

  return [
    hex.slice(0, 4).join(''),
    hex.slice(4, 6).join(''),
    hex.slice(6, 8).join(''),
    hex.slice(8, 10).join(''),
    hex.slice(10, 16).join(''),
  ].join('-');
}
