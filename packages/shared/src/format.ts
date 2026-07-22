/**
 * Formatage francais — dates, heures, distances, durees.
 *
 * Ecrit a la main pour la meme raison que money.ts : le PDF genere cote serveur
 * doit produire exactement la meme chaine que l'ecran mobile.
 */

const NBSP = ' ';

const DAYS = [
  'Dimanche',
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
] as const;

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** "Mercredi 22 juillet" */
export function formatLongDate(date: Date): string {
  return `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

/** "22/07/2026" — format des documents legaux. */
export function formatShortDate(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** "11:00" */
export function formatTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * "Aujourd'hui", "Demain", "Hier", sinon la date longue.
 *
 * Compare des jours calendaires, pas des ecarts de 24 h : une course a 23 h
 * et une course a 1 h du matin ne sont pas "le meme jour" a 2 h d'intervalle.
 */
export function formatRelativeDay(date: Date, now: Date = new Date()): string {
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  const days = Math.round(
    (startOfDay(date) - startOfDay(now)) / 86_400_000,
  );

  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Demain';
  if (days === -1) return 'Hier';
  return formatLongDate(date);
}

/** Distance stockee en metres, affichee en kilometres : 38200 -> "38 km" */
export function formatDistance(meters: number): string {
  const km = meters / 1000;
  const value = km < 10 ? km.toFixed(1).replace('.', ',') : String(Math.round(km));
  return `${value}${NBSP}km`;
}

/** 380 -> "6 h 20", 52 -> "52 min" */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;

  if (hours === 0) return `${rest}${NBSP}min`;
  if (rest === 0) return `${hours}${NBSP}h`;
  return `${hours}${NBSP}h${NBSP}${pad(rest)}`;
}

/** Initiales pour un avatar : "Jean", "Dupont" -> "JD" */
export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
