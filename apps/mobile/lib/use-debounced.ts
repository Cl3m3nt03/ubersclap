import { useEffect, useState } from 'react';

/**
 * Retarde une valeur.
 *
 * Sur un champ de recherche, chaque frappe declencherait sinon une requete :
 * « Lefebvre » en produit neuf, dont huit inutiles, sur un reseau mobile.
 */
export function useDebounced<T>(value: T, delayMs = 300): T {
  const [delayed, setDelayed] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDelayed(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return delayed;
}
