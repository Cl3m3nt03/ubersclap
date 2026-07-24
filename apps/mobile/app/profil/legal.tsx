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
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check } from 'lucide-react-native';
import {
  updateMeSchema,
  VAT_REGIMES,
  VAT_REGIME_LABEL,
  light,
  touch,
  type Me,
  type VatRegime,
} from '@ubersclap/shared';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { LoadingState, ErrorState } from '@/components/QueryState';
import { useMe, updateMe } from '@/lib/queries/me';
import { queryKeys } from '@/lib/queries/keys';

/**
 * Edition des informations legales.
 *
 * Ces champs alimentent chaque facture (ADR-012) : sans SIRET ni regime de TVA,
 * l'emission est bloquee cote serveur. Cet ecran est le seul endroit ou les
 * renseigner — le blocage n'a de sens que parce qu'il existe.
 */
export default function ProfileLegalScreen() {
  const { data: me, isLoading, isError, error, refetch } = useMe();

  if (isLoading) return <LoadingState />;
  if (isError || !me) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return <LegalForm initial={me} />;
}

function LegalForm({ initial }: { initial: Me }) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const profile = initial.profile;

  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [companyName, setCompanyName] = useState(profile.companyName ?? '');
  const [legalForm, setLegalForm] = useState(profile.legalForm ?? '');
  const [siret, setSiret] = useState(profile.siret ?? '');
  const [vtc, setVtc] = useState(profile.vtcRegistrationNumber ?? '');
  const [vatNumber, setVatNumber] = useState(profile.vatNumber ?? '');
  const [address, setAddress] = useState(profile.address ?? '');
  const [vatRegime, setVatRegime] = useState<VatRegime | null>(profile.vatRegime);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setError(null);

    // Chaine vide = champ efface -> null. Le SIRET est nettoye de ses espaces
    // avant validation : « 123 456 789 00012 » et « 12345678900012 » sont le
    // meme numero.
    const patch = {
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      phone: phone.trim() || null,
      companyName: companyName.trim() || null,
      legalForm: legalForm.trim() || null,
      siret: siret.replace(/\s/g, '') || null,
      vtcRegistrationNumber: vtc.trim() || null,
      vatNumber: vatNumber.trim() || null,
      address: address.trim() || null,
      vatRegime,
    };

    const parsed = updateMeSchema.safeParse(patch);
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
      await updateMe(parsed.data);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() });
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
          Informations légales
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
        <TextField label="Prénom" value={firstName} onChangeText={setFirstName} />
        <TextField label="Nom" value={lastName} onChangeText={setLastName} />
        <TextField
          label="Téléphone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TextField
          label="Raison sociale"
          value={companyName}
          onChangeText={setCompanyName}
          hint="Figure en tête de chaque facture."
        />
        <TextField
          label="Forme juridique"
          value={legalForm}
          onChangeText={setLegalForm}
          placeholder="Micro-entreprise, EURL…"
        />
        <TextField
          label="SIRET"
          value={siret}
          onChangeText={setSiret}
          keyboardType="number-pad"
          hint="14 chiffres. Obligatoire pour facturer."
        />
        <TextField
          label="N° registre VTC"
          value={vtc}
          onChangeText={setVtc}
          hint="Mention obligatoire sur les factures."
        />

        <Text className="mb-2 mt-6 font-extra text-[12px] uppercase tracking-widest text-ink-faint">
          Régime de TVA
        </Text>
        <View className="flex-row gap-3">
          {VAT_REGIMES.map((regime) => {
            const active = vatRegime === regime;
            return (
              <Pressable
                key={regime}
                onPress={() => setVatRegime(regime)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-md"
                style={{
                  height: touch.primary,
                  borderWidth: 1,
                  borderColor: active ? light.indigo : light.border,
                  backgroundColor: active ? '#EEF2FF' : light.surface,
                }}
              >
                {active ? <Check size={16} color={light.indigo} /> : null}
                <Text
                  className="font-bold text-[14px]"
                  style={{ color: active ? light.indigo : light.inkMuted }}
                >
                  {VAT_REGIME_LABEL[regime]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextField
          label="N° TVA intracommunautaire"
          value={vatNumber}
          onChangeText={setVatNumber}
          hint={vatRegime === 'FRANCHISE' ? 'Sans objet en franchise en base.' : undefined}
        />
        <TextField
          label="Adresse professionnelle"
          value={address}
          onChangeText={setAddress}
          multiline
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
        <Button label="Enregistrer" loading={saving} onPress={save} />
      </View>
    </KeyboardAvoidingView>
  );
}
