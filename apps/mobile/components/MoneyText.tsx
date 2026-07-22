import { Text, type TextProps } from 'react-native';
import { formatEuros, type Cents } from '@ubersclap/shared';

type Props = Omit<TextProps, 'children'> & {
  cents: Cents;
  /** Masque le symbole € — utile dans une colonne deja intitulee "Montant". */
  hideSymbol?: boolean;
};

/**
 * Affiche un montant.
 *
 * Le seul composant autorise a rendre de l'argent. Il garantit trois choses
 * qu'on ne peut pas laisser a la discipline de chacun :
 *
 * 1. `tabular-nums` — sans quoi 120,00 € et 65,00 € ne s'alignent pas
 *    verticalement dans une liste, parce que les chiffres n'ont pas la meme
 *    largeur. C'est l'app d'un chauffeur qui lit des montants en deux
 *    secondes. Voir DESIGN_DIRECTION.md, point 1.
 * 2. Le format francais — virgule decimale, espace insecable avant le symbole.
 * 3. La conversion depuis les centimes entiers (ADR-009).
 */
export function MoneyText({ cents, hideSymbol, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[{ fontVariant: ['tabular-nums'] }, style]}
      // Un montant lu par un lecteur d'ecran doit s'entendre en euros,
      // pas se traduire en suite de caracteres.
      accessibilityLabel={formatEuros(cents)}
    >
      {formatEuros(cents, { symbol: !hideSymbol })}
    </Text>
  );
}

/** Meme garantie de chiffres tabulaires, pour les heures et les distances. */
export function NumericText({ style, ...rest }: TextProps) {
  return <Text {...rest} style={[{ fontVariant: ['tabular-nums'] }, style]} />;
}
