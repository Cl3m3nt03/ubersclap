import { View, Text, Platform, type ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradient, radius, type GradientName } from '@ubersclap/shared';
import type { ReactNode } from 'react';

/**
 * Ombre.
 *
 * `shadow-[0_4px_20px_rgba(...)]` du prototype HTML n'a pas d'equivalent
 * direct : iOS utilise shadowColor/Offset/Opacity/Radius, Android `elevation`
 * et ne sait pas colorer une ombre. Voir le tableau de portage dans
 * DESIGN_DIRECTION.md.
 */
export const softShadow = Platform.select({
  ios: {
    shadowColor: '#1A1C1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  android: { elevation: 3 },
  default: {},
});

export function Card({ style, className, ...rest }: ViewProps) {
  return (
    <View
      {...rest}
      style={[softShadow, style]}
      className={['rounded-lg bg-surface p-5', className].filter(Boolean).join(' ')}
    />
  );
}

/**
 * Carte en degrade — reservee a une VALEUR importante, jamais decorative.
 *
 * Teal = l'argent gagne. Coral = le volume d'activite. Purple = le temps.
 * Trois degrades maximum par ecran : au-dela, plus rien ne ressort.
 */
export function StatCard({
  tone,
  label,
  children,
  footer,
}: {
  tone: GradientName;
  label: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <LinearGradient
      colors={gradient[tone] as unknown as readonly [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: radius.lg, padding: 20 }, softShadow]}
    >
      <Text className="font-extra text-[12px] uppercase tracking-widest text-white/80">
        {label}
      </Text>
      <View className="mt-2">{children}</View>
      {footer ? <View className="mt-3">{footer}</View> : null}
    </LinearGradient>
  );
}
