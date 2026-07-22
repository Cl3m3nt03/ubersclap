import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { TrendingUp, Plus, FileText, Users, CarFront } from 'lucide-react-native';
import {
  formatLongDate,
  formatDistance,
  formatDuration,
  light,
  touch,
} from '@ubersclap/shared';

import { PageHeader } from '@/components/PageHeader';
import { StatCard, Card } from '@/components/Card';
import { MoneyText, NumericText } from '@/components/MoneyText';
import { CourseRow } from '@/components/CourseRow';
import { EmptyState } from '@/components/EmptyState';
import { driver, todayCourses, todaySummary } from '@/lib/mock';

export default function DashboardScreen() {
  const upcoming = todayCourses.filter((c) => c.status === 'CONFIRMED');

  return (
    <View className="flex-1 bg-canvas">
      <PageHeader
        greeting={`Bonjour, ${driver.firstName} 👋`}
        title="Tableau de bord"
        onNotifications={() => {}}
        unreadCount={2}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-3 font-medium text-[14px] text-ink-faint">
          {formatLongDate(new Date())}
        </Text>

        {/* Le chiffre d'affaires est l'element le plus gros de l'ecran :
            c'est la seule information que le chauffeur cherche en l'ouvrant. */}
        <StatCard
          tone="teal"
          label="Chiffre d'affaires — aujourd'hui"
          footer={
            <View className="flex-row items-center gap-1.5">
              <TrendingUp size={14} color="rgba(255,255,255,0.9)" />
              <Text className="font-bold text-[13px] text-white/90">
                +{todaySummary.deltaPercent}% vs hier
              </Text>
            </View>
          }
        >
          <MoneyText
            cents={todaySummary.revenueCents}
            className="font-extra text-[40px] leading-[46px] tracking-tight text-white"
          />
        </StatCard>

        <View className="mt-4 flex-row gap-4">
          <View className="flex-1">
            <StatCard tone="coral" label="Courses">
              <NumericText className="font-extra text-[28px] text-white">
                {String(todaySummary.courses).padStart(2, '0')}
              </NumericText>
            </StatCard>
          </View>
          <View className="flex-1">
            <StatCard tone="purple" label="Heures">
              <NumericText className="font-extra text-[28px] text-white">
                {formatDuration(todaySummary.workedMinutes)}
              </NumericText>
            </StatCard>
          </View>
        </View>

        <Card className="mt-4 flex-row items-center justify-between">
          <View>
            <Text className="font-extra text-[12px] uppercase tracking-widest text-ink-faint">
              Distance parcourue
            </Text>
            <NumericText className="mt-1 font-extra text-[22px] text-ink">
              {formatDistance(todaySummary.distanceMeters)}
            </NumericText>
          </View>
          <CarFront size={28} color={light.inkFaint} />
        </Card>

        <SectionTitle>Accès rapide</SectionTitle>

        <View className="flex-row gap-4">
          <QuickAction
            icon={<Plus size={22} color="#FFFFFF" />}
            label="Réserver"
            color={light.indigo}
            onPress={() => router.push('/course/nouvelle')}
          />
          <QuickAction
            icon={<FileText size={22} color="#FFFFFF" />}
            label="Facturer"
            color="#0D9488"
            onPress={() => router.push('/factures')}
          />
          <QuickAction
            icon={<Users size={22} color="#FFFFFF" />}
            label="Clients"
            color="#F43F5E"
            onPress={() => router.push('/clients')}
          />
        </View>

        <View className="mt-8 flex-row items-center justify-between">
          <Text className="font-extra text-[20px] tracking-tight text-ink">
            Prochaines courses
          </Text>
          <Pressable
            onPress={() => router.push('/agenda')}
            accessibilityRole="button"
            hitSlop={12}
          >
            <Text className="font-bold text-[14px] text-indigo">Voir tout</Text>
          </Pressable>
        </View>

        <View className="mt-3 gap-3">
          {upcoming.length === 0 ? (
            <Card>
              <EmptyState
                icon={CarFront}
                title="Aucune course à venir aujourd'hui"
                hint="Créez une réservation pour remplir votre journée."
                actionLabel="Créer une course"
                onAction={() => router.push('/course/nouvelle')}
              />
            </Card>
          ) : (
            upcoming.map((course) => (
              <CourseRow
                key={course.id}
                course={course}
                onPress={() => {}}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="mb-3 mt-8 font-extra text-[20px] tracking-tight text-ink">
      {children}
    </Text>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-1 items-center gap-2"
      style={{ minHeight: touch.primary }}
    >
      <View
        className="h-14 w-14 items-center justify-center rounded-md"
        style={{ backgroundColor: color }}
      >
        {icon}
      </View>
      <Text className="font-bold text-[13px] text-ink-muted">{label}</Text>
    </Pressable>
  );
}
