import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import { formatLongDate, formatDuration, light } from '@ubersclap/shared';

import { PageHeader } from '@/components/PageHeader';
import { CourseRow, type CourseRowData } from '@/components/CourseRow';
import { EmptyState } from '@/components/EmptyState';
import { Card } from '@/components/Card';
import { todayCourses } from '@/lib/mock';

export default function AgendaScreen() {
  const courses = [...todayCourses].sort(
    (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime(),
  );

  return (
    <View className="flex-1 bg-canvas">
      <PageHeader title="Agenda" greeting={formatLongDate(new Date())} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {courses.length === 0 ? (
          <Card>
            <EmptyState
              icon={CalendarDays}
              title="Journée vide"
              hint="Aucune course prévue aujourd'hui."
              actionLabel="Créer une course"
              onAction={() => router.push('/course/nouvelle')}
            />
          </Card>
        ) : (
          courses.map((course, index) => (
            <View key={course.id}>
              <Gap previous={courses[index - 1]} current={course} />
              <CourseRow course={course} onPress={() => {}} />
            </View>
          ))
        )}
      </ScrollView>
    </View>
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
  previous?: CourseRowData;
  current: CourseRowData;
}) {
  if (!previous) return null;

  const minutes = Math.round(
    (current.scheduledAt.getTime() - previous.scheduledAt.getTime()) / 60_000,
  );

  // Seuil provisoire. A remplacer par un temps de trajet reel via Directions
  // API des que la cartographie est branchee.
  const tooTight = minutes < 45;

  return (
    <View className="flex-row items-center gap-2 py-2.5 pl-[26px]">
      <View
        className="h-full w-px"
        style={{ backgroundColor: tooTight ? light.danger : light.border }}
      />
      <Text
        className="font-bold text-[13px]"
        style={{ color: tooTight ? light.danger : light.inkFaint }}
      >
        {tooTight
          ? `Seulement ${formatDuration(minutes)} entre les deux`
          : `${formatDuration(minutes)} libre`}
      </Text>
    </View>
  );
}
