import { View, Text } from 'react-native';
import { light } from '@ubersclap/shared';
import type { LucideIcon } from 'lucide-react-native';
import { Button } from './Button';

/**
 * Ecran vide.
 *
 * Un ecran vide est une invitation a agir, pas un constat. On n'affiche jamais
 * "Aucune donnée" seul : on dit ce qui manque et on donne le bouton qui le
 * cree.
 */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="items-center px-8 py-12">
      <View
        className="mb-4 h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: '#EEF2FF' }}
      >
        <Icon size={28} color={light.indigo} />
      </View>

      <Text className="text-center font-bold text-[17px] text-ink">{title}</Text>

      {hint ? (
        <Text className="mt-1.5 text-center font-medium text-[14px] text-ink-muted">
          {hint}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <View className="mt-6 w-full">
          <Button label={actionLabel} onPress={onAction} />
        </View>
      ) : null}
    </View>
  );
}
