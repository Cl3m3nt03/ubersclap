import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, ArrowDown, MapPin } from 'lucide-react-native';
import {
  COURSE_STATUS_LABEL,
  COURSE_TRANSITION_LABEL,
  COURSE_TYPE_LABEL,
  formatLongDate,
  formatTime,
  light,
  nextStatuses,
  type CourseStatus,
} from '@ubersclap/shared';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MoneyText } from '@/components/MoneyText';
import { StatusBadge } from '@/components/StatusBadge';
import { ErrorState, LoadingState } from '@/components/QueryState';
import { useCourse, useTransitionCourse } from '@/lib/queries/courses';

/**
 * Fiche d'une course.
 *
 * L'ecran existe surtout pour ses deux boutons : demarrer et terminer. C'est
 * le geste le plus repete de la journee, il se fait au volant arrete, donc il
 * est en bas de l'ecran et occupe toute la largeur.
 */
export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: course, isPending, error, refetch } = useCourse(id);
  const transition = useTransitionCourse();
  const [failure, setFailure] = useState<string | null>(null);

  async function apply(to: CourseStatus) {
    setFailure(null);
    try {
      await transition.mutateAsync({ id, to });
    } catch (cause) {
      setFailure(cause instanceof Error ? cause.message : 'Action impossible');
    }
  }

  function confirmCancel() {
    Alert.alert(
      'Annuler la course ?',
      'Cette action est définitive : une course annulée ne peut plus être modifiée.',
      [
        { text: 'Revenir', style: 'cancel' },
        {
          text: 'Annuler la course',
          style: 'destructive',
          onPress: () => void apply('CANCELLED'),
        },
      ],
    );
  }

  return (
    <View className="flex-1 bg-canvas">
      <View
        className="flex-row items-center gap-3 px-6 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={12}
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: light.border }}
        >
          <ArrowLeft size={20} color={light.ink} />
        </Pressable>
        <Text className="font-extra text-[24px] tracking-tight text-ink">
          Course
        </Text>
      </View>

      {isPending ? (
        <LoadingState />
      ) : error || !course ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            <Card>
              <View className="flex-row items-start justify-between">
                <View>
                  <Text className="font-medium text-[14px] text-ink-faint">
                    {formatLongDate(new Date(course.scheduledAt))}
                  </Text>
                  <Text className="mt-0.5 font-extra text-[28px] tracking-tight text-ink">
                    {formatTime(new Date(course.scheduledAt))}
                  </Text>
                </View>
                <StatusBadge status={course.status} />
              </View>

              <View
                className="mt-4 border-t pt-4"
                style={{ borderTopColor: light.border }}
              >
                <Waypoint label="Départ" value={course.pickup.label} />
                <View className="items-center py-2 pl-1">
                  <ArrowDown size={18} color={light.inkFaint} />
                </View>
                <Waypoint label="Destination" value={course.destination.label} />
              </View>
            </Card>

            <Card className="mt-4">
              <Row label="Prix annoncé">
                <MoneyText
                  cents={course.priceInclTaxCents}
                  className="font-extra text-[17px] text-ink"
                />
              </Row>
              {course.finalPriceInclTaxCents !== null ? (
                <Row label="Prix facturé">
                  <MoneyText
                    cents={course.finalPriceInclTaxCents}
                    className="font-extra text-[17px] text-ink"
                  />
                </Row>
              ) : null}
              <Row label="Type">
                <Text className="font-bold text-[15px] text-ink">
                  {COURSE_TYPE_LABEL[course.type]}
                </Text>
              </Row>
              <Row label="Passagers">
                <Text className="font-bold text-[15px] text-ink">
                  {course.passengers}
                  {course.luggage > 0 ? ` · ${course.luggage} bagages` : ''}
                  {course.childSeat ? ' · siège enfant' : ''}
                </Text>
              </Row>
            </Card>

            {course.notes ? (
              <Card className="mt-4">
                <Text className="font-extra text-[12px] uppercase tracking-widest text-ink-faint">
                  Notes
                </Text>
                <Text className="mt-2 font-medium text-[15px] text-ink">
                  {course.notes}
                </Text>
              </Card>
            ) : null}

            {failure ? (
              <View
                className="mt-4 rounded-md p-4"
                style={{ backgroundColor: '#FEF2F2' }}
              >
                <Text
                  className="font-bold text-[14px]"
                  style={{ color: light.danger }}
                >
                  {failure}
                </Text>
              </View>
            ) : null}
          </ScrollView>

          <TransitionBar
            status={course.status}
            busy={transition.isPending}
            onAdvance={apply}
            onCancel={confirmCancel}
          />
        </>
      )}
    </View>
  );
}

/**
 * Les actions disponibles viennent de la machine a etats partagee.
 *
 * Le bouton n'existe donc jamais pour une transition que le serveur refusera :
 * l'UI et l'API lisent la meme table (ADR-004).
 */
function TransitionBar({
  status,
  busy,
  onAdvance,
  onCancel,
}: {
  status: CourseStatus;
  busy: boolean;
  onAdvance: (to: CourseStatus) => void;
  onCancel: () => void;
}) {
  const insets = useSafeAreaInsets();
  const available = nextStatuses(status);
  const advance = available.filter((next) => next !== 'CANCELLED');

  if (available.length === 0) {
    return (
      <View
        className="border-t bg-surface px-6 pt-4"
        style={{
          borderTopColor: light.border,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        <Text className="text-center font-medium text-[14px] text-ink-faint">
          Course {COURSE_STATUS_LABEL[status].toLowerCase()} — plus aucune action
          possible.
        </Text>
      </View>
    );
  }

  return (
    <View
      className="gap-3 border-t bg-surface px-6 pt-4"
      style={{
        borderTopColor: light.border,
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      {advance.map((next) => (
        <Button
          key={next}
          label={COURSE_TRANSITION_LABEL[next]}
          loading={busy}
          onPress={() => onAdvance(next)}
        />
      ))}

      {available.includes('CANCELLED') ? (
        <Button
          label="Annuler la course"
          variant="ghost"
          disabled={busy}
          onPress={onCancel}
        />
      ) : null}
    </View>
  );
}

function Waypoint({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <MapPin size={18} color={light.indigo} />
      <View className="flex-1">
        <Text className="font-extra text-[12px] uppercase tracking-widest text-ink-faint">
          {label}
        </Text>
        <Text className="mt-0.5 font-bold text-[15px] text-ink">{value}</Text>
      </View>
    </View>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between py-1.5">
      <Text className="font-medium text-[14px] text-ink-muted">{label}</Text>
      {children}
    </View>
  );
}
