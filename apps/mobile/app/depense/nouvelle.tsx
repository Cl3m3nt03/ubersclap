import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { onlineManager } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  createExpenseSchema,
  parseEuros,
  formatEuros,
  light,
  touch,
  type ExpenseCategory,
} from '@ubersclap/shared';

import { Button } from '@/components/Button';
import { DateTimeField } from '@/components/DateTimeField';
import { useCreateExpense } from '@/lib/queries/expenses';
import { uuidv7 } from '@/lib/uuid';

/**
 * Saisie d'une depense.
 *
 * Le geste type se fait a la pompe ou au peage, souvent sans reseau : la
 * depense est donc enfilee comme une course (ADR-011) et l'ecran se ferme
 * aussitot, le bandeau signalant l'attente de synchronisation.
 */
export default function NewExpenseScreen() {
  const insets = useSafeAreaInsets();
  const createExpense = useCreateExpense();

  const [category, setCategory] = useState<ExpenseCategory>('FUEL');
  const [amount, setAmount] = useState('');
  const [spentAt, setSpentAt] = useState(() => new Date());
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const amountCents = parseEuros(amount);
  const canSubmit = amountCents !== null && amountCents > 0;

  async function submit() {
    setError(null);

    const parsed = createExpenseSchema.safeParse({
      id: uuidv7(),
      category,
      amountCents: amountCents ?? 0,
      description: description.trim() || undefined,
      spentAt: spentAt.toISOString(),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Formulaire incomplet');
      return;
    }

    if (!onlineManager.isOnline()) {
      createExpense.mutate(parsed.data);
      router.back();
      return;
    }

    try {
      await createExpense.mutateAsync(parsed.data);
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Enregistrement impossible');
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        className="flex-row items-center justify-between px-6 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Text className="font-extra text-[24px] tracking-tight text-ink">
          Nouvelle dépense
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

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FieldLabel>Catégorie</FieldLabel>
        <View className="flex-row flex-wrap gap-2">
          {EXPENSE_CATEGORIES.map((item) => {
            const active = category === item;
            return (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className="flex-row items-center gap-1.5 rounded-sm px-3"
                style={{
                  height: touch.secondary,
                  borderWidth: 1,
                  borderColor: active ? light.indigo : light.border,
                  backgroundColor: active ? '#EEF2FF' : light.surface,
                }}
              >
                {active ? <Check size={14} color={light.indigo} /> : null}
                <Text
                  className="font-bold text-[14px]"
                  style={{ color: active ? light.indigo : light.inkMuted }}
                >
                  {EXPENSE_CATEGORY_LABEL[item]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FieldLabel>Montant TTC</FieldLabel>
        <Input
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00 €"
          keyboardType="decimal-pad"
        />
        {amountCents !== null && amountCents > 0 ? (
          <Text className="mt-1.5 font-medium text-[13px] text-ink-faint">
            Soit {formatEuros(amountCents)} TTC
          </Text>
        ) : null}

        <FieldLabel>Date</FieldLabel>
        <DateTimeField value={spentAt} onChange={setSpentAt} />

        <FieldLabel>Description</FieldLabel>
        <Input
          value={description}
          onChangeText={setDescription}
          placeholder="Optionnel — station, trajet…"
        />

        {error ? (
          <View className="mt-5 rounded-md p-4" style={{ backgroundColor: '#FEF2F2' }}>
            <Text className="font-bold text-[14px]" style={{ color: light.danger }}>
              {error}
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View
        className="border-t bg-surface px-6 pt-4"
        style={{
          borderTopColor: light.border,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        <Button
          label="Enregistrer la dépense"
          disabled={!canSubmit}
          loading={createExpense.isPending}
          onPress={submit}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 mt-6 font-extra text-[12px] uppercase tracking-widest text-ink-faint">
      {children}
    </Text>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={light.inkFaint}
      className="rounded-md bg-surface px-4 font-medium text-[16px] text-ink"
      style={{ height: touch.primary, borderWidth: 1, borderColor: light.border }}
    />
  );
}
