import { View, Text, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { light, touch } from '@ubersclap/shared';

type Props = {
  greeting?: string;
  title: string;
  onNotifications?: () => void;
  unreadCount?: number;
  /** Action a droite du titre. Prioritaire sur la cloche de notifications. */
  right?: React.ReactNode;
};

/**
 * En-tete d'ecran.
 *
 * Deux ecarts assumes avec le prototype Superdesign :
 *
 * 1. Le titre est en aplat indigo, pas en degrade. `bg-clip-text` n'existe pas
 *    en React Native : il faudrait MaskedView + LinearGradient imbriques sur
 *    un element present sur les cinq ecrans, pour un effet purement decoratif.
 *    L'aplat gagne aussi en contraste. Voir DESIGN_DIRECTION.md, point 4.
 *
 * 2. Le padding haut vient de useSafeAreaInsets, pas d'un `pt-14` en dur.
 *    Une valeur fixe est juste sur un iPhone a encoche et fausse partout
 *    ailleurs — y compris sur Android, majoritaire chez les chauffeurs.
 */
export function PageHeader({
  greeting,
  title,
  onNotifications,
  unreadCount = 0,
  right,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-end justify-between px-6 pb-4"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="flex-1">
        {greeting ? (
          <Text className="font-medium text-[15px] text-ink-faint">{greeting}</Text>
        ) : null}
        <Text
          className="font-extra text-[28px] tracking-tight text-indigo"
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      {right ? (
        right
      ) : onNotifications ? (
        <Pressable
          onPress={onNotifications}
          accessibilityRole="button"
          accessibilityLabel={
            unreadCount > 0
              ? `Notifications, ${unreadCount} non lues`
              : 'Notifications'
          }
          className="items-center justify-center rounded-full bg-surface"
          style={{
            width: touch.secondary,
            height: touch.secondary,
            borderWidth: 1,
            borderColor: light.border,
          }}
        >
          <Bell size={20} color={light.indigo} />
          {unreadCount > 0 ? (
            <View
              className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: light.danger }}
            />
          ) : null}
        </Pressable>
      ) : null}
    </View>
  );
}
