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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, ArrowDown, Check } from 'lucide-react-native';
import {
  COURSE_TYPES,
  COURSE_TYPE_LABEL,
  parseEuros,
  formatEuros,
  initials,
  light,
  touch,
  type CourseType,
} from '@ubersclap/shared';

import { Button } from '@/components/Button';
import { clients } from '@/lib/mock';

/**
 * Creation d'une course.
 *
 * Objectif de USER_FLOW.md : moins de 30 secondes, une seule main. D'ou les
 * champs pleine largeur, les cibles a 56 px, et un seul bouton d'action fixe
 * en bas — dans la zone atteignable au pouce.
 */
export default function NewCourseScreen() {
  const insets = useSafeAreaInsets();

  const [client, setClient] = useState(clients[0]);
  const [pickup, setPickup] = useState('Hôtel Ritz, Paris');
  const [destination, setDestination] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<CourseType>('ONE_WAY');

  const priceCents = parseEuros(price);
  const canSubmit =
    Boolean(client) && destination.trim().length > 0 && priceCents !== null;

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
          Nouvelle course
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
        <FieldLabel>Client</FieldLabel>
        <View className="flex-row flex-wrap gap-2">
          {clients.map((item) => {
            const active = client?.id === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setClient(item)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className="flex-row items-center gap-2 rounded-sm px-3"
                style={{
                  height: touch.secondary,
                  backgroundColor: active ? light.indigo : light.surface,
                  borderWidth: 1,
                  borderColor: active ? light.indigo : light.border,
                }}
              >
                <View
                  className="h-7 w-7 items-center justify-center rounded-full"
                  style={{ backgroundColor: active ? 'rgba(255,255,255,0.2)' : '#EEF2FF' }}
                >
                  <Text
                    className="font-extra text-[11px]"
                    style={{ color: active ? '#FFFFFF' : light.indigo }}
                  >
                    {initials(item.firstName, item.lastName)}
                  </Text>
                </View>
                <Text
                  className="font-bold text-[14px]"
                  style={{ color: active ? '#FFFFFF' : light.ink }}
                >
                  {item.firstName} {item.lastName}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FieldLabel>Départ</FieldLabel>
        <Input value={pickup} onChangeText={setPickup} placeholder="Adresse de départ" />

        <View className="items-center py-2">
          <ArrowDown size={20} color={light.inkFaint} />
        </View>

        <FieldLabel>Destination</FieldLabel>
        <Input
          value={destination}
          onChangeText={setDestination}
          placeholder="Adresse d'arrivée"
        />

        <FieldLabel>Prix TTC</FieldLabel>
        <Input
          value={price}
          onChangeText={setPrice}
          placeholder="0,00 €"
          keyboardType="decimal-pad"
        />
        {priceCents !== null && priceCents > 0 ? (
          <Text className="mt-1.5 font-medium text-[13px] text-ink-faint">
            Soit {formatEuros(priceCents)} TTC
          </Text>
        ) : null}

        <FieldLabel>Type de course</FieldLabel>
        <View className="flex-row flex-wrap gap-2">
          {COURSE_TYPES.map((item) => {
            const active = type === item;
            return (
              <Pressable
                key={item}
                onPress={() => setType(item)}
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
                  {COURSE_TYPE_LABEL[item]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Action principale fixee en bas : zone du pouce. */}
      <View
        className="border-t bg-surface px-6 pt-4"
        style={{
          borderTopColor: light.border,
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        <Button
          label="Créer la course"
          disabled={!canSubmit}
          onPress={() => router.back()}
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
