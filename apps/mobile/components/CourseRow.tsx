import { View, Text, Pressable } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import {
  formatTime,
  light,
  touch,
  type CourseStatus,
  type Cents,
} from '@ubersclap/shared';
import { MoneyText, NumericText } from './MoneyText';
import { StatusBadge } from './StatusBadge';

export type CourseRowData = {
  id: string;
  scheduledAt: Date;
  clientName: string;
  pickup: string;
  destination: string;
  priceCents: Cents;
  status: CourseStatus;
  /** Creee hors ligne, pas encore synchronisee (ADR-011). */
  pendingSync?: boolean;
};

/**
 * Une ligne de course. Reutilisee sur le tableau de bord, l'agenda et
 * la fiche client.
 *
 * Hierarchie imposee : heure > client > lieu > montant. C'est la regle de
 * USER_FLOW.md, et elle tient parce qu'un chauffeur lit cette ligne en deux
 * secondes, souvent en diagonale.
 */
export function CourseRow({
  course,
  onPress,
}: {
  course: CourseRowData;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Course de ${formatTime(course.scheduledAt)}, ${course.clientName}, ${course.pickup} vers ${course.destination}`}
      className="flex-row items-center gap-3 rounded-lg bg-surface px-4 py-3.5"
      style={{ minHeight: touch.primary }}
    >
      {/* Heure — toujours a gauche, toujours au meme endroit. */}
      <View className="items-center" style={{ width: 52 }}>
        <NumericText className="font-extra text-[17px] text-ink">
          {formatTime(course.scheduledAt)}
        </NumericText>
      </View>

      <View className="h-9 w-px" style={{ backgroundColor: light.border }} />

      <View className="flex-1">
        <Text className="font-bold text-[15px] text-ink" numberOfLines={1}>
          {course.clientName}
        </Text>

        <View className="mt-0.5 flex-row items-center gap-1">
          <Text
            className="shrink font-medium text-[13px] text-ink-muted"
            numberOfLines={1}
          >
            {course.pickup}
          </Text>
          <ArrowRight size={12} color={light.inkFaint} />
          <Text
            className="shrink font-medium text-[13px] text-ink-muted"
            numberOfLines={1}
          >
            {course.destination}
          </Text>
        </View>
      </View>

      <View className="items-end gap-1.5">
        <MoneyText cents={course.priceCents} className="font-extra text-[15px] text-ink" />
        {course.pendingSync ? <PendingSyncChip /> : <StatusBadge status={course.status} />}
      </View>
    </Pressable>
  );
}

/**
 * Une course creee sans reseau doit se voir.
 *
 * Sans ce signal, le chauffeur ne sait pas si sa course est enregistree, et
 * la recree — c'est exactement le doublon que l'idempotence evite cote serveur
 * (ADR-010). L'UI doit dire la meme chose que le backend.
 */
function PendingSyncChip() {
  return (
    <View className="rounded-sm px-2.5 py-1" style={{ backgroundColor: '#FFFBEB' }}>
      <Text
        className="font-extra text-[12px] uppercase tracking-wider"
        style={{ color: light.warning }}
      >
        À synchroniser
      </Text>
    </View>
  );
}
