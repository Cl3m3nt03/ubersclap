import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { onlineManager } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import {
  CLIENT_CATEGORIES,
  CLIENT_CATEGORY_LABEL,
  createClientSchema,
  light,
  touch,
  type ClientCategory,
} from '@ubersclap/shared';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useCreateClient } from '@/lib/queries/clients';
import { uuidv7 } from '@/lib/uuid';

/**
 * Creation d'un client, sans passer par une course.
 *
 * Le repertoire se remplit tout seul quand on note une reservation, mais un
 * chauffeur veut aussi pouvoir ajouter un habitue en amont — avec son email,
 * qui servira a lui envoyer factures et confirmations.
 */
export default function NewClientScreen() {
  const insets = useSafeAreaInsets();
  const createClient = useCreateClient();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState<ClientCategory>('OCCASIONAL');
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    phone.trim().length >= 6;

  async function submit() {
    setError(null);

    const parsed = createClientSchema.safeParse({
      id: uuidv7(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      company: company.trim() || undefined,
      notes: notes.trim() || undefined,
      category,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Formulaire incomplet');
      return;
    }

    if (!onlineManager.isOnline()) {
      createClient.mutate(parsed.data);
      router.back();
      return;
    }

    try {
      await createClient.mutateAsync(parsed.data);
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
          Nouveau client
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
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField label="Prénom" value={firstName} onChangeText={setFirstName} />
          </View>
          <View className="flex-1">
            <TextField label="Nom" value={lastName} onChangeText={setLastName} />
          </View>
        </View>

        <TextField
          label="Téléphone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextField
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          hint="Sert à envoyer factures et confirmations."
        />
        <TextField label="Société" value={company} onChangeText={setCompany} />
        <TextField label="Notes" value={notes} onChangeText={setNotes} multiline />

        <Text className="mb-2 mt-6 font-extra text-[12px] uppercase tracking-widest text-ink-faint">
          Catégorie
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {CLIENT_CATEGORIES.map((item) => {
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
                  {CLIENT_CATEGORY_LABEL[item]}
                </Text>
              </Pressable>
            );
          })}
        </View>

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
          label="Enregistrer le client"
          disabled={!canSubmit}
          loading={createClient.isPending}
          onPress={submit}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
