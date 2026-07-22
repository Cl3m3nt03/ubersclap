import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ReduceMotion,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { touch } from '@ubersclap/shared';
import type { ReactNode } from 'react';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  /** Occupe toute la largeur. Defaut : true, cas majoritaire en mobile. */
  full?: boolean;
};

/**
 * Bouton.
 *
 * Hauteur 56 px sur les actions primaires, pas 44.
 *
 * 44 px est la norme iOS, pensee pour un usage assis, a deux mains, au calme.
 * Le contexte reel ici est une voiture, une seule main, parfois des gants.
 * Voir DESIGN_DIRECTION.md, point 2.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  full = true,
}: Props) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withTiming(pressed.value ? 0.97 : 1, {
          duration: 120,
          // Respecte "Reduire les animations" du systeme.
          reduceMotion: ReduceMotion.System,
        }),
      },
    ],
  }));

  const inactive = disabled || loading;
  const height = variant === 'ghost' ? touch.secondary : touch.primary;

  const content = (
    <View className="flex-row items-center justify-center gap-2">
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#4F46E5'} />
      ) : (
        icon
      )}
      <Text
        className={[
          'font-bold text-base',
          variant === 'primary' || variant === 'danger'
            ? 'text-white'
            : 'text-indigo',
        ].join(' ')}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <AnimatedPressable
      onPress={inactive ? undefined : onPress}
      onPressIn={() => (pressed.value = 1)}
      onPressOut={() => (pressed.value = 0)}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      accessibilityLabel={label}
      style={[animatedStyle, { height, opacity: inactive ? 0.5 : 1 }]}
      className={[
        full ? 'w-full' : 'self-start px-6',
        'items-center justify-center rounded-md',
        variant === 'primary' && 'bg-indigo',
        variant === 'danger' && 'bg-danger',
        variant === 'secondary' && 'border border-indigo bg-transparent',
        variant === 'ghost' && 'bg-transparent',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {content}
    </AnimatedPressable>
  );
}

/**
 * Variante en degrade, pour l'action principale d'un ecran vide.
 *
 * `bg-gradient-*` de Tailwind n'existe pas en React Native : il faut
 * expo-linear-gradient. Voir le tableau de portage dans DESIGN_DIRECTION.md.
 */
export function GradientButton({
  label,
  onPress,
  colors,
  icon,
}: {
  label: string;
  onPress?: () => void;
  colors: readonly [string, string];
  icon?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="w-full overflow-hidden rounded-md"
      style={{ height: touch.primary }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 flex-row items-center justify-center gap-2">
          {icon}
          <Text className="font-bold text-base text-white">{label}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
