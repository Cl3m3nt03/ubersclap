import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  X,
  ArrowDown,
  Check,
  UserPlus,
  BookUser,
  Route as RouteIcon,
} from 'lucide-react-native';
import {
  COURSE_TYPES,
  COURSE_TYPE_LABEL,
  createCourseSchema,
  parseEuros,
  formatEuros,
  formatDistance,
  formatDuration,
  suggestFareCents,
  initials,
  light,
  touch,
  type Address,
  type CourseType,
  type RouteResult,
} from '@ubersclap/shared';

import { Button } from '@/components/Button';
import { ContactPicker, type PickedContact } from '@/components/ContactPicker';
import { AddressField } from '@/components/AddressField';
import { DateTimeField } from '@/components/DateTimeField';
import { useClients } from '@/lib/queries/clients';
import { useCreateCourse } from '@/lib/queries/courses';
import { fetchRoute } from '@/lib/queries/geo';
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
  const [pickup, setPickup] = useState<Address>({ label: '' });
  const [destination, setDestination] = useState<Address>({ label: '' });
  const [price, setPrice] = useState('');
  const [type, setType] = useState<CourseType>('ONE_WAY');
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  // Le prix suggere ne s'ecrit qu'une fois : des que le chauffeur touche au
  // champ, sa saisie fait foi et un nouveau calcul d'itineraire ne l'ecrase
  // plus. C'est lui qui negocie le prix, pas le bareme.
  const priceTouched = useRef(false);

  const pickupLat = pickup.latitude;
  const pickupLng = pickup.longitude;
  const destLat = destination.latitude;
  const destLng = destination.longitude;

  // Itineraire calcule cote serveur des que les deux adresses sont geocodees.
  // Hors-ligne on s'abstient : pas de reseau, pas de calcul — le prix reste
  // saisi a la main, ce que le formulaire permet de toute facon.
  useEffect(() => {
    if (
      pickupLat === undefined ||
      pickupLng === undefined ||
      destLat === undefined ||
      destLng === undefined
    ) {
      setRoute(null);
      return;
    }
    if (!onlineManager.isOnline()) return;

    const controller = new AbortController();
    setRouteLoading(true);

    fetchRoute(
      { latitude: pickupLat, longitude: pickupLng },
      { latitude: destLat, longitude: destLng },
      controller.signal,
    )
      .then((result) => {
        setRoute(result);
        if (!priceTouched.current) {
          setPrice(
            formatEuros(
              suggestFareCents(result.distanceMeters, result.durationMinutes),
              { symbol: false },
            ),
          );
        }
      })
      .catch(() => setRoute(null))
      .finally(() => setRouteLoading(false));

    return () => controller.abort();
  }, [pickupLat, pickupLng, destLat, destLng]);

  function changePrice(text: string) {
    priceTouched.current = true;
    setPrice(text);
  }

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
    pickup.label.trim().length > 0 &&
    destination.label.trim().length > 0 &&
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
      pickup: { ...pickup, label: pickup.label.trim() },
      destination: { ...destination, label: destination.label.trim() },
      scheduledAt: scheduledAt.toISOString(),
      timezone: deviceTimezone(),
      priceInclTaxCents: priceCents ?? 0,
      distanceMeters: route?.distanceMeters,
      durationMinutes: route?.durationMinutes,
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
        <AddressField
          value={pickup}
          onChange={setPickup}
          placeholder="Adresse de départ"
        />

        <View className="items-center py-2">
          <ArrowDown size={20} color={light.inkFaint} />
        </View>

        <AddressField
          value={destination}
          onChange={setDestination}
          placeholder="Adresse d'arrivée"
        />

        {routeLoading || route ? (
          <View
            className="mt-3 flex-row items-center gap-2 rounded-md px-4"
            style={{
              height: touch.secondary,
              backgroundColor: '#EEF2FF',
            }}
          >
            <RouteIcon size={16} color={light.indigo} />
            <Text className="font-bold text-[14px] text-indigo">
              {route
                ? `${formatDistance(route.distanceMeters)} · ${formatDuration(route.durationMinutes)}`
                : 'Calcul de l’itinéraire…'}
            </Text>
          </View>
        ) : null}

        <FieldLabel>Prix TTC</FieldLabel>
        <Input
          value={price}
          onChangeText={changePrice}
          placeholder="0,00 €"
          keyboardType="decimal-pad"
        />
        {priceCents !== null && priceCents > 0 ? (
          <Text className="mt-1.5 font-medium text-[13px] text-ink-faint">
            {route && !priceTouched.current
              ? `Suggéré d’après ${formatDistance(route.distanceMeters)} — modifiable`
              : `Soit ${formatEuros(priceCents)} TTC`}
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
