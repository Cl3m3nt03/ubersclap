import { View, Text } from 'react-native';
import {
  COURSE_STATUS_LABEL,
  COURSE_STATUS_TONE,
  light,
  type CourseStatus,
  type StatusTone,
} from '@ubersclap/shared';

const TONE_STYLE: Record<StatusTone, { bg: string; fg: string }> = {
  neutral: { bg: '#F3F4F6', fg: light.inkMuted },
  info: { bg: '#EEF2FF', fg: light.indigo },
  success: { bg: '#ECFDF5', fg: light.success },
  warning: { bg: '#FFFBEB', fg: light.warning },
  danger: { bg: '#FEF2F2', fg: light.danger },
};

/**
 * Badge de statut.
 *
 * Le libelle vient de @ubersclap/shared, jamais d'une chaine ecrite sur place :
 * une course "Confirmée" doit s'appeler pareil sur les cinq ecrans. C'est ce
 * qui rend l'interface apprenable.
 */
export function StatusBadge({ status }: { status: CourseStatus }) {
  const tone = TONE_STYLE[COURSE_STATUS_TONE[status]];

  return (
    <View
      className="rounded-sm px-2.5 py-1"
      style={{ backgroundColor: tone.bg }}
    >
      <Text
        className="font-extra text-[12px] uppercase tracking-wider"
        style={{ color: tone.fg }}
      >
        {COURSE_STATUS_LABEL[status]}
      </Text>
    </View>
  );
}
