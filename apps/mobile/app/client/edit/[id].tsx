import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import {
  CLIENT_CATEGORIES,
  CLIENT_CATEGORY_LABEL,
  createClientSchema,
  light,
  touch,
  type ClientCategory,
  type ClientDetail,
} from '@ubersclap/shared';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { LoadingState, ErrorState } from '@/components/QueryState';
import { useClient, updateClient } from '@/lib/queries/clients';
import { queryKeys } from '@/lib/queries/keys';

/** Le schema de creation sans l'id : la validation d'un patch est la meme. */
const clientPatchSchema = createClientSchema.omit({ id: true });

/**
 * Edition d'une fiche client.
 *
 * Un numero change, un email se corrige : la fiche doit rester modifiable
 * apres coup, sans recreer un doublon.
 */
export default function EditClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: client, isPending, error, refetch } = useClient(id);

  if (isPending) return <LoadingState />;
  if (error || !client) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return <EditForm client={client} />;
}

function EditForm({ client }: { client: ClientDetail }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState(client.firstName);
  const [lastName, setLastName] = useState(client.lastName);
  const [phone, setPhone] = useState(client.phone);
  const [email, setEmail] = useState(client.email ?? '');
  const [company, setCompany] = useState(client.company ?? '');
  const [notes, setNotes] = useState(client.notes ?? '');
  const [category, setCategory] = useState<ClientCategory>(client.category);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setError(null);

    const parsed = clientPatchSchema.safeParse({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      company: company.trim() || undefined,
      notes: notes.trim() || undefined,
      category,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Formulaire invalide');
      return;
    }

    if (!onlineManager.isOnline()) {
      setError('Modification impossible hors ligne — reconnectez-vous.');
      return;
    }

    setSaving(true);
    try {
      await updateClient(client.id, parsed.data);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.client(client.id) }),
        queryClient.invalidateQueries({ queryKey: ['clients'] }),
      ]);
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Enregistrement impossible');
    } finally {
      setSaving(false);
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
          Modifier le client
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
        <Button label="Enregistrer" loading={saving} onPress={submit} />
      </View>
    </KeyboardAvoidingView>
  );
}
