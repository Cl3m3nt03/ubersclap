import { useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import {
  formatLongDate,
  formatDuration,
  findConflictingIds,
  courseTimeWindow,
  light,
  touch,
  type CourseWithClient,
} from '@ubersclap/shared';

import { PageHeader } from '@/components/PageHeader';
import { CourseRow } from '@/components/CourseRow';
import { EmptyState } from '@/components/EmptyState';
import { Card } from '@/components/Card';
import { ErrorState, LoadingState } from '@/components/QueryState';
import { useCourses } from '@/lib/queries/courses';
import { addDays, endOfDay, isSameDay, startOfDay } from '@/lib/dates';
import { toCourseRow } from '@/lib/course-row';

export default function AgendaScreen() {
  const [day, setDay] = useState(() => startOfDay());

  const { data, isPending, isRefetching, error, refetch } = useCourses({
    from: day.toISOString(),
    to: endOfDay(day).toISOString(),
  });

  // Le serveur trie deja par heure, mais la liste doit rester juste si une
  // course est ajoutee au cache avant d'etre confirmee par le serveur.
  const courses = [...(data ?? [])].sort(
    (a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  );

  const today = isSameDay(day, new Date());
  const conflicts = findConflictingIds(courses);

  return (
    <View className="flex-1 bg-canvas">
      <PageHeader
        title="Agenda"
        greeting={today ? "Aujourd'hui" : formatLongDate(day)}
      />

      <DayNavigator
        day={day}
        onChange={setDay}
        onToday={() => setDay(startOfDay())}
        showToday={!today}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={light.indigo}
          />
        }
      >
        {isPending ? (
          <LoadingState label="Chargement de la journée…" />
        ) : error ? (
          <Card>
            <ErrorState error={error} onRetry={() => void refetch()} />
          </Card>
        ) : courses.length === 0 ? (
          <Card>
            <EmptyState
              icon={CalendarDays}
              title="Journée vide"
              hint={
                today
                  ? "Aucune course prévue aujourd'hui."
                  : `Aucune course le ${formatLongDate(day)}.`
              }
              actionLabel="Créer une course"
              onAction={() => router.push('/course/nouvelle')}
            />
          </Card>
        ) : (
          courses.map((course, index) => (
            <View key={course.id}>
              <Gap previous={courses[index - 1]} current={course} />
              <CourseRow
                course={toCourseRow(course)}
                conflict={conflicts.has(course.id)}
                onPress={() => router.push(`/course/${course.id}`)}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function DayNavigator({
  day,
  onChange,
  onToday,
  showToday,
}: {
  day: Date;
  onChange: (next: Date) => void;
  onToday: () => void;
  showToday: boolean;
}) {
  return (
    <View className="flex-row items-center gap-3 px-6 pb-4">
      <ArrowButton
        label="Jour précédent"
        onPress={() => onChange(addDays(day, -1))}
      >
        <ChevronLeft size={20} color={light.ink} />
      </ArrowButton>

      <Text className="flex-1 text-center font-bold text-[15px] text-ink">
        {formatLongDate(day)}
      </Text>

      <ArrowButton label="Jour suivant" onPress={() => onChange(addDays(day, 1))}>
        <ChevronRight size={20} color={light.ink} />
      </ArrowButton>

      {showToday ? (
        <Pressable
          onPress={onToday}
          accessibilityRole="button"
          className="justify-center rounded-sm px-3"
          style={{
            height: touch.secondary,
            borderWidth: 1,
            borderColor: light.indigo,
          }}
        >
          <Text className="font-bold text-[13px] text-indigo">Aujourd'hui</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ArrowButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      className="items-center justify-center rounded-full bg-surface"
      style={{
        width: touch.secondary,
        height: touch.secondary,
        borderWidth: 1,
        borderColor: light.border,
      }}
    >
      {children}
    </Pressable>
  );
}

/**
 * Le temps libre entre deux courses.
 *
 * Un chauffeur vend du temps : les blancs de sa journee sont son manque a
 * gagner. Une simple liste ne les montre pas. On les rend visibles, et on
 * signale les enchainements trop serres — c'est la detection de conflit
 * annoncee dans FEATURES.md, rendue lisible plutot que reduite a une alerte.
 */
function Gap({
  previous,
  current,
}: {
  previous?: CourseWithClient;
  current: CourseWithClient;
}) {
  if (!previous) return null;

  // Le temps libre part de la FIN estimee de la course precedente (depart +
  // duree de l'itineraire), pas de son heure de depart : c'est ce qui rend le
  // conflit reel visible plutot qu'un simple ecart entre deux horaires.
  const previousEnd = courseTimeWindow(previous).end;
  const currentStart = new Date(current.scheduledAt).getTime();
  const minutes = Math.round((currentStart - previousEnd) / 60_000);

  const overlap = minutes < 0;
  const tooTight = minutes >= 0 && minutes < 15;
  const danger = overlap || tooTight;

  return (
    <View className="flex-row items-center gap-2 py-2.5 pl-[26px]">
      <View
        className="h-full w-px"
        style={{ backgroundColor: danger ? light.danger : light.border }}
      />
      <Text
        className="font-bold text-[13px]"
        style={{ color: danger ? light.danger : light.inkFaint }}
      >
        {overlap
          ? `Chevauchement de ${formatDuration(-minutes)}`
          : tooTight
            ? `Seulement ${formatDuration(minutes)} entre les deux`
            : `${formatDuration(minutes)} libre`}
      </Text>
    </View>
  );
}
