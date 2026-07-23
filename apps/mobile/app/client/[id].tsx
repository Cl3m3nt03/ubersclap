import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, Mail, CarFront } from 'lucide-react-native';
import {
  CLIENT_CATEGORY_LABEL,
  formatShortDate,
  initials,
  light,
  touch,
} from '@ubersclap/shared';

import { Card } from '@/components/Card';
import { CourseRow } from '@/components/CourseRow';
import { MoneyText, NumericText } from '@/components/MoneyText';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState, LoadingState } from '@/components/QueryState';
import { useClient } from '@/lib/queries/clients';
import { useCourses } from '@/lib/queries/courses';
import { toCourseRow } from '@/lib/course-row';

/**
 * Fiche client.
 *
 * Le chiffre qui compte n'est pas le nombre de courses mais ce que le client
 * a rapporte : c'est lui qui decide si le chauffeur decroche a 5 h du matin.
 */
export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { data: client, isPending, error, refetch } = useClient(id);
  const history = useCourses({ clientId: id });

  // Les plus recentes d'abord : l'API trie par heure croissante pour l'agenda,
  // un historique se lit dans l'autre sens.
  const courses = [...(history.data ?? [])].reverse();

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
          Client
        </Text>
      </View>

      {isPending ? (
        <LoadingState />
      ) : error || !client ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <Card className="items-center">
            <View
              className="h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: '#EEF2FF' }}
            >
              <Text className="font-extra text-[20px] text-indigo">
                {initials(client.firstName, client.lastName)}
              </Text>
            </View>

            <Text className="mt-3 font-extra text-[20px] text-ink">
              {client.firstName} {client.lastName}
            </Text>
            {client.company ? (
              <Text className="font-medium text-[14px] text-ink-muted">
                {client.company}
              </Text>
            ) : null}
            <Text className="mt-1 font-bold text-[12px] uppercase tracking-widest text-indigo">
              {CLIENT_CATEGORY_LABEL[client.category]}
            </Text>

            <View className="mt-5 w-full flex-row gap-3">
              <ContactAction
                label="Appeler"
                icon={<Phone size={18} color="#FFFFFF" />}
                color={light.indigo}
                onPress={() => void Linking.openURL(`tel:${client.phone}`)}
              />
              {client.email ? (
                <ContactAction
                  label="Écrire"
                  icon={<Mail size={18} color="#FFFFFF" />}
                  color="#0D9488"
                  onPress={() => void Linking.openURL(`mailto:${client.email}`)}
                />
              ) : null}
            </View>
          </Card>

          <View className="mt-4 flex-row gap-4">
            <Card className="flex-1">
              <Text className="font-extra text-[12px] uppercase tracking-widest text-ink-faint">
                Chiffre d'affaires
              </Text>
              <MoneyText
                cents={client.stats.totalCents}
                className="mt-1 font-extra text-[20px] text-ink"
              />
            </Card>
            <Card className="flex-1">
              <Text className="font-extra text-[12px] uppercase tracking-widest text-ink-faint">
                Courses
              </Text>
              <NumericText className="mt-1 font-extra text-[20px] text-ink">
                {String(client.stats.courseCount)}
              </NumericText>
            </Card>
          </View>

          {client.stats.lastCourseAt ? (
            <Text className="mt-3 font-medium text-[13px] text-ink-faint">
              Dernière course le{' '}
              {formatShortDate(new Date(client.stats.lastCourseAt))}
            </Text>
          ) : null}

          {client.notes ? (
            <Card className="mt-4">
              <Text className="font-extra text-[12px] uppercase tracking-widest text-ink-faint">
                Notes
              </Text>
              <Text className="mt-2 font-medium text-[15px] text-ink">
                {client.notes}
              </Text>
            </Card>
          ) : null}

          <Text className="mb-3 mt-8 font-extra text-[20px] tracking-tight text-ink">
            Historique
          </Text>

          {history.isPending ? (
            <LoadingState label="Chargement de l'historique…" />
          ) : courses.length === 0 ? (
            <Card>
              <EmptyState
                icon={CarFront}
                title="Aucune course"
                hint="Ce client n'a pas encore de course enregistrée."
              />
            </Card>
          ) : (
            <View className="gap-3">
              {courses.map((course) => (
                <CourseRow
                  key={course.id}
                  course={toCourseRow(course)}
                  onPress={() => router.push(`/course/${course.id}`)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ContactAction({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-1 flex-row items-center justify-center gap-2 rounded-md"
      style={{ height: touch.secondary, backgroundColor: color }}
    >
      {icon}
      <Text className="font-bold text-[14px] text-white">{label}</Text>
    </Pressable>
  );
}
