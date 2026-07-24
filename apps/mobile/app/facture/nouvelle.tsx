import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, FileText } from 'lucide-react-native';
import {
  formatShortDate,
  formatEuros,
  sumCents,
  light,
  touch,
  type CourseWithClient,
} from '@ubersclap/shared';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState, ErrorState } from '@/components/QueryState';
import { useBillableCourses, createInvoice } from '@/lib/queries/invoices';
import { queryKeys } from '@/lib/queries/keys';
import { uuidv7 } from '@/lib/uuid';

/** Prix retenu pour la facture : le final prime des qu'il existe. */
function priceOf(course: CourseWithClient): number {
  return course.finalPriceInclTaxCents ?? course.priceInclTaxCents;
}

/**
 * Emission d'une facture.
 *
 * Une facture couvre une a plusieurs courses d'UN meme client (ADR-005) : le
 * cas qui paie l'abonnement, c'est l'hotel qui veut une facture mensuelle
 * groupee, pas quarante factures. On coche donc des courses ; en cocher une
 * d'un autre client repart d'une selection propre, puisqu'on ne facture jamais
 * deux clients sur un meme document.
 */
export default function NewInvoiceScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: courses, isLoading, isError, error, refetch } = useBillableCourses();

  const [clientId, setClientId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Courses groupees par client, dans l'ordre d'apparition.
  const groups = useMemo(() => {
    const map = new Map<string, { client: CourseWithClient['client']; courses: CourseWithClient[] }>();
    for (const course of courses ?? []) {
      const group = map.get(course.clientId);
      if (group) group.courses.push(course);
      else map.set(course.clientId, { client: course.client, courses: [course] });
    }
    return [...map.values()];
  }, [courses]);

  const selectedTotal = useMemo(() => {
    const chosen = (courses ?? []).filter((c) => selected.has(c.id));
    return sumCents(chosen.map(priceOf));
  }, [courses, selected]);

  function toggle(course: CourseWithClient) {
    // Changer de client repart d'une selection vide : une facture = un client.
    if (clientId !== null && course.clientId !== clientId) {
      setClientId(course.clientId);
      setSelected(new Set([course.id]));
      return;
    }

    const next = new Set(selected);
    if (next.has(course.id)) next.delete(course.id);
    else next.add(course.id);

    setSelected(next);
    setClientId(next.size === 0 ? null : course.clientId);
  }

  async function submit() {
    if (clientId === null || selected.size === 0 || saving) return;
    if (!onlineManager.isOnline()) {
      Alert.alert(
        'Connexion requise',
        'La facturation attribue un numéro légal : elle nécessite une connexion.',
      );
      return;
    }

    setSaving(true);
    try {
      const invoice = await createInvoice({
        id: uuidv7(),
        clientId,
        courseIds: [...selected],
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.invoices() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.billableCourses() }),
      ]);
      Alert.alert(
        'Facture émise',
        `Facture ${invoice.invoiceNumber} — ${formatEuros(invoice.totalInclTaxCents)}.`,
        [{ text: 'Voir les factures', onPress: () => router.replace('/factures') }],
      );
    } catch (cause) {
      Alert.alert(
        'Facturation impossible',
        cause instanceof Error ? cause.message : 'Réessayez dans un instant.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-canvas">
      <View
        className="flex-row items-center justify-between px-6 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Text className="font-extra text-[24px] tracking-tight text-ink">
          Facturer
        </Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          hitSlop={12}
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: light.border }}
        >
          <X size={20} color={light.ink} />
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingState label="Chargement des courses…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : groups.length === 0 ? (
        <View className="px-6">
          <EmptyState
            icon={FileText}
            title="Aucune course à facturer"
            hint="Terminez une course pour pouvoir l'ajouter à une facture."
          />
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            <Text className="mb-4 font-medium text-[14px] text-ink-faint">
              Cochez les courses d'un même client à regrouper sur une facture.
            </Text>

            {groups.map((group) => {
              const dimmed = clientId !== null && group.client.id !== clientId;
              return (
                <View key={group.client.id} className="mb-6" style={{ opacity: dimmed ? 0.45 : 1 }}>
                  <Text className="mb-2 font-extra text-[16px] text-ink">
                    {group.client.firstName} {group.client.lastName}
                  </Text>
                  <View className="gap-2">
                    {group.courses.map((course) => (
                      <CourseCheckRow
                        key={course.id}
                        course={course}
                        checked={selected.has(course.id)}
                        onPress={() => toggle(course)}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View
            className="border-t bg-surface px-6 pt-4"
            style={{
              borderTopColor: light.border,
              paddingBottom: Math.max(insets.bottom, 16),
            }}
          >
            {selected.size > 0 ? (
              <Text className="mb-3 text-center font-bold text-[15px] text-ink">
                {selected.size} course{selected.size > 1 ? 's' : ''} · {formatEuros(selectedTotal)}
              </Text>
            ) : null}
            <Button
              label="Émettre la facture"
              icon={<FileText size={18} color="#FFFFFF" />}
              disabled={selected.size === 0}
              loading={saving}
              onPress={submit}
            />
          </View>
        </>
      )}
    </View>
  );
}

function CourseCheckRow({
  course,
  checked,
  onPress,
}: {
  course: CourseWithClient;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      className="flex-row items-center gap-3 rounded-lg p-4"
      style={{
        minHeight: touch.primary,
        borderWidth: 1,
        borderColor: checked ? light.indigo : light.border,
        backgroundColor: checked ? '#EEF2FF' : light.surface,
      }}
    >
      <View
        className="h-6 w-6 items-center justify-center rounded-md"
        style={{
          borderWidth: 1.5,
          borderColor: checked ? light.indigo : light.border,
          backgroundColor: checked ? light.indigo : 'transparent',
        }}
      >
        {checked ? <Check size={14} color="#FFFFFF" /> : null}
      </View>
      <View className="flex-1">
        <Text className="font-bold text-[14px] text-ink" numberOfLines={1}>
          {course.pickup.label} → {course.destination.label}
        </Text>
        <Text className="mt-0.5 font-medium text-[13px] text-ink-faint">
          {formatShortDate(new Date(course.scheduledAt))}
        </Text>
      </View>
      <Text className="font-extra text-[15px] text-ink">
        {formatEuros(priceOf(course))}
      </Text>
    </Pressable>
  );
}
