import { useMemo, useState } from 'react';
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
import { X, ArrowDown, Check, UserPlus, BookUser } from 'lucide-react-native';
import {
  COURSE_TYPES,
  COURSE_TYPE_LABEL,
  createCourseSchema,
  parseEuros,
  formatEuros,
  initials,
  light,
  touch,
  type CourseType,
} from '@ubersclap/shared';

import { Button } from '@/components/Button';
import { ContactPicker, type PickedContact } from '@/components/ContactPicker';
import { DateTimeField } from '@/components/DateTimeField';
import { useClients } from '@/lib/queries/clients';
import { useCreateCourse } from '@/lib/queries/courses';
import { deviceTimezone } from '@/lib/dates';
import { uuidv7 } from '@/lib/uuid';

/**
 * Creation d'une course.
 *
 * Objectif de USER_FLOW.md : moins de 30 secondes, une seule main. D'ou les
 * champs pleine largeur, les cibles a 56 px, et un seul bouton d'action fixe
 * en bas — dans la zone atteignable au pouce.
 *
 * Le passager peut etre saisi directement, sans creer de fiche client au
 * prealable : le serveur rapproche par telephone et cree le client si besoin.
 * C'est ce qui permet de noter une reservation prise au telephone sans
 * interrompre l'appel.
 */
export default function NewCourseScreen() {
  const insets = useSafeAreaInsets();
  const createCourse = useCreateCourse();
  const { data: clients } = useClients();

  const [clientId, setClientId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const [scheduledAt, setScheduledAt] = useState(nextRoundHour);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<CourseType>('ONE_WAY');
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Un contact choisi ne fait que pre-remplir les champs, qui restent
  // editables : le repertoire du telephone formate les numeros de mille facons,
  // et le chauffeur doit pouvoir corriger avant d'enregistrer.
  function fillFromContact(contact: PickedContact) {
    setClientId(null);
    setFirstName(contact.firstName);
    setLastName(contact.lastName);
    setPhone(contact.phone);
    setPickerOpen(false);
  }

  // Les habitues d'abord : au-dela d'une poignee de pastilles, la selection
  // devient plus lente que la saisie directe du passager.
  const recent = useMemo(() => (clients ?? []).slice(0, 6), [clients]);

  const priceCents = parseEuros(price);
  const hasPassenger =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    phone.trim().length >= 6;

  const canSubmit =
    (clientId !== null || hasPassenger) &&
    pickup.trim().length > 0 &&
    destination.trim().length > 0 &&
    priceCents !== null &&
    priceCents > 0;

  async function submit() {
    setError(null);

    const parsed = createCourseSchema.safeParse({
      // L'ID nait ici, pas au retour du serveur (ADR-011). Il sert aussi de
      // cle d'idempotence : un rejeu apres coupure ne cree pas de doublon.
      id: uuidv7(),
      clientId: clientId ?? undefined,
      passenger: clientId
        ? undefined
        : {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
          },
      type,
      pickup: { label: pickup.trim() },
      destination: { label: destination.trim() },
      scheduledAt: scheduledAt.toISOString(),
      timezone: deviceTimezone(),
      priceInclTaxCents: priceCents ?? 0,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Formulaire incomplet');
      return;
    }

    // Hors-ligne, la mutation est mise en pause (ADR-011) : `mutateAsync` ne se
    // resoudrait qu'a la reconnexion et figerait l'ecran dans un parking sans
    // reseau. On enfile la course et on ferme aussitot ; le bandeau signale
    // qu'elle attend d'etre envoyee. En ligne, on attend la reponse pour
    // afficher une eventuelle erreur de validation serveur sous le formulaire.
    if (!onlineManager.isOnline()) {
      createCourse.mutate(parsed.data);
      router.back();
      return;
    }

    try {
      await createCourse.mutateAsync(parsed.data);
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Création impossible');
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
        <FieldLabel>Passager</FieldLabel>
        <View className="flex-row flex-wrap gap-2">
          {recent.map((client) => {
            const active = clientId === client.id;
            return (
              <Pressable
                key={client.id}
                onPress={() => setClientId(active ? null : client.id)}
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
                  style={{
                    backgroundColor: active ? 'rgba(255,255,255,0.2)' : '#EEF2FF',
                  }}
                >
                  <Text
                    className="font-extra text-[11px]"
                    style={{ color: active ? '#FFFFFF' : light.indigo }}
                  >
                    {initials(client.firstName, client.lastName)}
                  </Text>
                </View>
                <Text
                  className="font-bold text-[14px]"
                  style={{ color: active ? '#FFFFFF' : light.ink }}
                >
                  {client.firstName} {client.lastName}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {clientId === null ? (
          <View className="mt-3 gap-3">
            <Pressable
              onPress={() => setPickerOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Choisir dans mes contacts"
              className="flex-row items-center justify-center gap-2 rounded-md"
              style={{
                height: touch.secondary,
                borderWidth: 1,
                borderColor: light.indigo,
                backgroundColor: '#EEF2FF',
              }}
            >
              <BookUser size={18} color={light.indigo} />
              <Text className="font-bold text-[15px] text-indigo">
                Choisir dans mes contacts
              </Text>
            </Pressable>

            <View className="flex-row items-center gap-2">
              <UserPlus size={16} color={light.inkFaint} />
              <Text className="font-medium text-[13px] text-ink-faint">
                Nouveau passager — il sera ajouté au répertoire
              </Text>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Prénom"
                  autoComplete="given-name"
                />
              </View>
              <View className="flex-1">
                <Input
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Nom"
                  autoComplete="family-name"
                />
              </View>
            </View>

            <Input
              value={phone}
              onChangeText={setPhone}
              placeholder="Téléphone"
              keyboardType="phone-pad"
              autoComplete="tel"
            />
          </View>
        ) : null}

        <FieldLabel>Date et heure</FieldLabel>
        <DateTimeField value={scheduledAt} onChange={setScheduledAt} />

        <FieldLabel>Départ</FieldLabel>
        <Input
          value={pickup}
          onChangeText={setPickup}
          placeholder="Adresse de départ"
        />

        <View className="items-center py-2">
          <ArrowDown size={20} color={light.inkFaint} />
        </View>

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

        {error ? (
          <View className="mt-5 rounded-md p-4" style={{ backgroundColor: '#FEF2F2' }}>
            <Text className="font-bold text-[14px]" style={{ color: light.danger }}>
              {error}
            </Text>
          </View>
        ) : null}
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
          loading={createCourse.isPending}
          onPress={submit}
        />
      </View>

      <ContactPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={fillFromContact}
      />
    </KeyboardAvoidingView>
  );
}

/** Prochaine heure ronde : la valeur par defaut la plus souvent juste. */
function nextRoundHour(): Date {
  const date = new Date();
  date.setMinutes(date.getMinutes() > 30 ? 60 : 30, 0, 0);
  return date;
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
