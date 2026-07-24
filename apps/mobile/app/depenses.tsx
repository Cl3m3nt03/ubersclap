import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Plus, Fuel, Receipt } from 'lucide-react-native';
import {
  EXPENSE_CATEGORY_LABEL,
  formatShortDate,
  sumCents,
  light,
  touch,
  type Expense,
} from '@ubersclap/shared';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { MoneyText } from '@/components/MoneyText';
import { EmptyState } from '@/components/EmptyState';
import { LoadingState, ErrorState } from '@/components/QueryState';
import { useExpenses } from '@/lib/queries/expenses';
import { startOfMonth, endOfMonth } from '@/lib/dates';

/**
 * Depenses du mois.
 *
 * Le mois est la maille comptable du chauffeur : c'est a cette echelle qu'il
 * suit ce qu'il depense en carburant, peages et entretien, et que le resultat
 * net prend un sens. La liste est donc bornee au mois courant.
 */
export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const from = startOfMonth().toISOString();
  const to = endOfMonth().toISOString();
  const { data: expenses, isLoading, isError, error, refetch, isRefetching } =
    useExpenses({ from, to });

  const total = useMemo(
    () => sumCents((expenses ?? []).map((e) => e.amountCents)),
    [expenses],
  );

  return (
    <View className="flex-1 bg-canvas">
      <View
        className="flex-row items-center justify-between px-6 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center gap-3">
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
            Dépenses
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/depense/nouvelle')}
          accessibilityRole="button"
          accessibilityLabel="Ajouter une dépense"
          hitSlop={12}
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: light.indigo }}
        >
          <Plus size={22} color="#FFFFFF" />
        </Pressable>
      </View>

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
        <Card className="mb-4">
          <Text className="font-extra text-[12px] uppercase tracking-widest text-ink-faint">
            Total ce mois-ci
          </Text>
          <MoneyText cents={total} className="mt-1 font-extra text-[28px] text-ink" />
        </Card>

        {isLoading ? (
          <LoadingState label="Chargement des dépenses…" />
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : (expenses ?? []).length === 0 ? (
          <Card>
            <EmptyState
              icon={Receipt}
              title="Aucune dépense ce mois-ci"
              hint="Notez un plein, un péage ou un entretien pour suivre votre résultat net."
              actionLabel="Ajouter une dépense"
              onAction={() => router.push('/depense/nouvelle')}
            />
          </Card>
        ) : (
          <View className="gap-3">
            {(expenses ?? []).map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function ExpenseRow({ expense }: { expense: Expense }) {
  return (
    <View
      className="flex-row items-center gap-3 rounded-lg bg-surface p-4"
      style={{ minHeight: touch.primary }}
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: '#EEF2FF' }}
      >
        {expense.category === 'FUEL' ? (
          <Fuel size={18} color={light.indigo} />
        ) : (
          <Receipt size={18} color={light.indigo} />
        )}
      </View>
      <View className="flex-1">
        <Text className="font-bold text-[15px] text-ink">
          {EXPENSE_CATEGORY_LABEL[expense.category]}
        </Text>
        <Text className="mt-0.5 font-medium text-[13px] text-ink-faint" numberOfLines={1}>
          {expense.description
            ? `${formatShortDate(new Date(expense.spentAt))} · ${expense.description}`
            : formatShortDate(new Date(expense.spentAt))}
        </Text>
      </View>
      <MoneyText cents={expense.amountCents} className="font-extra text-[16px] text-ink" />
    </View>
  );
}
