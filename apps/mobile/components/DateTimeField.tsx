import { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarDays, Clock } from 'lucide-react-native';
import { formatLongDate, formatTime, light, touch } from '@ubersclap/shared';

/**
 * Date et heure d'une course.
 *
 * Deux boutons distincts plutot qu'un champ texte : la saisie se fait souvent
 * d'une main, en marchant, et « 24/07 15h30 » tape a la main produit autant de
 * fautes de frappe que de courses.
 *
 * Le selecteur natif differe sur les deux plateformes — iOS affiche un
 * spinner permanent, Android une modale — d'ou l'etat local qui pilote son
 * ouverture.
 */
export function DateTimeField({
  value,
  onChange,
}: {
  value: Date;
  onChange: (next: Date) => void;
}) {
  const [picking, setPicking] = useState<'date' | 'time' | null>(null);

  function handleChange(next: Date | undefined, mode: 'date' | 'time') {
    setPicking(Platform.OS === 'ios' ? picking : null);
    if (!next) return;

    const merged = new Date(value);

    if (mode === 'date') {
      merged.setFullYear(next.getFullYear(), next.getMonth(), next.getDate());
    } else {
      merged.setHours(next.getHours(), next.getMinutes(), 0, 0);
    }

    onChange(merged);
  }

  return (
    <View>
      <View className="flex-row gap-3">
        <Slot
          label={formatLongDate(value)}
          icon={<CalendarDays size={18} color={light.indigo} />}
          active={picking === 'date'}
          onPress={() => setPicking(picking === 'date' ? null : 'date')}
        />
        <Slot
          label={formatTime(value)}
          icon={<Clock size={18} color={light.indigo} />}
          active={picking === 'time'}
          onPress={() => setPicking(picking === 'time' ? null : 'time')}
          compact
        />
      </View>

      {picking ? (
        <DateTimePicker
          value={value}
          mode={picking}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          is24Hour
          locale="fr-FR"
          onChange={(_, next) => handleChange(next, picking)}
        />
      ) : null}
    </View>
  );
}

function Slot({
  label,
  icon,
  active,
  onPress,
  compact = false,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded: active }}
      className={[
        compact ? 'w-28' : 'flex-1',
        'flex-row items-center gap-2 rounded-md bg-surface px-4',
      ].join(' ')}
      style={{
        height: touch.primary,
        borderWidth: 1,
        borderColor: active ? light.indigo : light.border,
      }}
    >
      {icon}
      <Text className="flex-1 font-medium text-[15px] text-ink" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
