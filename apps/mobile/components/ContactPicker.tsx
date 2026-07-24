import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';
import { Search, X, User } from 'lucide-react-native';
import { initials, light, touch } from '@ubersclap/shared';

import { useDebounced } from '@/lib/use-debounced';

export type PickedContact = {
  firstName: string;
  lastName: string;
  phone: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (contact: PickedContact) => void;
};

/**
 * Recherche d'un passager dans le repertoire du telephone.
 *
 * Le chauffeur note une reservation prise au telephone : le passager est
 * presque toujours deja un contact. Retaper son nom et son numero est du temps
 * perdu et une source d'erreur sur le numero — celui-la meme qui sert de cle de
 * rapprochement cote serveur (`resolvePassenger`). On lit donc le contact et on
 * pre-remplit les champs, qui restent editables.
 *
 * La recherche est deleguee au systeme (`getContactsAsync({ name })`) plutot que
 * de charger tout le repertoire en memoire : un carnet de plusieurs milliers de
 * contacts tiendrait mal sur un telephone d'entree de gamme.
 */
export function ContactPicker({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const [permission, setPermission] = useState<Contacts.PermissionStatus | null>(
    null,
  );
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Contacts.ExistingContact[]>([]);
  const debouncedQuery = useDebounced(query.trim(), 250);

  // La permission n'est demandee qu'a l'ouverture, jamais au montage de
  // l'ecran : un prompt systeme surgi sans action de l'utilisateur se fait
  // refuser par reflexe.
  useEffect(() => {
    if (!visible) return;
    let cancelled = false;

    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (!cancelled) setPermission(status);
    })();

    return () => {
      cancelled = true;
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || permission !== Contacts.PermissionStatus.GRANTED) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
          Contacts.Fields.PhoneNumbers,
        ],
        // Sans numero, un contact ne sert a rien ici.
        name: debouncedQuery || undefined,
        sort: Contacts.SortTypes.LastName,
        pageSize: 60,
      });

      if (cancelled) return;
      setResults(data.filter((c) => (c.phoneNumbers?.length ?? 0) > 0));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, permission, debouncedQuery]);

  // Ferme et repart d'un etat propre : rouvrir ne doit pas reafficher l'ancienne
  // recherche.
  function close() {
    setQuery('');
    setResults([]);
    onClose();
  }

  function select(contact: Contacts.Contact) {
    const picked = toPicked(contact);
    if (!picked) return;
    setQuery('');
    setResults([]);
    onSelect(picked);
  }

  const denied =
    permission !== null && permission !== Contacts.PermissionStatus.GRANTED;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={close}
    >
      <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-row items-center justify-between px-6 pb-4">
          <Text className="font-extra text-[22px] tracking-tight text-ink">
            Mes contacts
          </Text>
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
            hitSlop={12}
            className="h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: light.border }}
          >
            <X size={20} color={light.ink} />
          </Pressable>
        </View>

        {denied ? (
          <PermissionDenied />
        ) : (
          <>
            <View className="px-6">
              <View
                className="flex-row items-center gap-2 rounded-md bg-surface px-4"
                style={{
                  height: touch.primary,
                  borderWidth: 1,
                  borderColor: light.border,
                }}
              >
                <Search size={18} color={light.inkFaint} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Rechercher un contact"
                  placeholderTextColor={light.inkFaint}
                  autoFocus
                  autoCorrect={false}
                  className="flex-1 font-medium text-[16px] text-ink"
                  accessibilityLabel="Rechercher un contact"
                />
              </View>
            </View>

            <FlatList
              data={results}
              keyExtractor={(item) => item.id ?? item.name}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{
                paddingHorizontal: 24,
                paddingTop: 12,
                paddingBottom: insets.bottom + 24,
              }}
              ItemSeparatorComponent={() => <View className="h-2" />}
              ListEmptyComponent={
                loading ? (
                  <View className="items-center py-16">
                    <ActivityIndicator color={light.indigo} />
                  </View>
                ) : (
                  <Text className="py-16 text-center font-medium text-[15px] text-ink-faint">
                    {debouncedQuery
                      ? 'Aucun contact ne correspond'
                      : 'Aucun contact avec un numéro'}
                  </Text>
                )
              }
              renderItem={({ item }) => (
                <ContactRow contact={item} onPress={() => select(item)} />
              )}
            />
          </>
        )}
      </View>
    </Modal>
  );
}

function ContactRow({
  contact,
  onPress,
}: {
  contact: Contacts.Contact;
  onPress: () => void;
}) {
  const { firstName, lastName } = splitName(contact);
  const phone = primaryPhone(contact);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${firstName} ${lastName}, ${phone}`}
      className="flex-row items-center gap-3 rounded-lg bg-surface p-3"
      style={{ minHeight: touch.primary }}
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: '#EEF2FF' }}
      >
        {firstName || lastName ? (
          <Text
            className="font-extra text-[14px]"
            style={{ color: light.indigo }}
          >
            {initials(firstName || ' ', lastName || ' ')}
          </Text>
        ) : (
          <User size={18} color={light.indigo} />
        )}
      </View>
      <View className="flex-1">
        <Text className="font-bold text-[15px] text-ink" numberOfLines={1}>
          {[firstName, lastName].filter(Boolean).join(' ') || 'Sans nom'}
        </Text>
        <Text className="mt-0.5 font-medium text-[13px] text-ink-faint" numberOfLines={1}>
          {phone}
        </Text>
      </View>
    </Pressable>
  );
}

function PermissionDenied() {
  return (
    <View className="flex-1 items-center justify-center px-10">
      <Text className="text-center font-extra text-[18px] text-ink">
        Accès aux contacts refusé
      </Text>
      <Text className="mt-2 text-center font-medium text-[15px] text-ink-faint">
        Autorisez l'accès dans les réglages pour ajouter un passager depuis votre
        répertoire.
      </Text>
      <Pressable
        onPress={() => Linking.openSettings()}
        accessibilityRole="button"
        className="mt-6 items-center justify-center rounded-md px-6"
        style={{ height: touch.secondary, backgroundColor: light.indigo }}
      >
        <Text className="font-bold text-[15px] text-white">Ouvrir les réglages</Text>
      </Pressable>
    </View>
  );
}

// --------------------------------------------------------------- helpers

/**
 * Numero principal d'un contact.
 *
 * On privilegie un mobile : un passager qu'on doit joindre le jour de la course
 * est joignable sur son portable, pas sur un fixe. A defaut, le premier numero.
 */
function primaryPhone(contact: Contacts.Contact): string {
  const numbers = contact.phoneNumbers ?? [];
  const mobile = numbers.find((n) =>
    /mobile|portable|cell/i.test(n.label ?? ''),
  );
  return (mobile ?? numbers[0])?.number?.trim() ?? '';
}

/**
 * Prenom / nom d'un contact.
 *
 * Android ne renseigne pas toujours firstName/lastName separement : on retombe
 * alors sur le nom complet, dont on coupe le premier mot comme prenom.
 */
function splitName(contact: Contacts.Contact): {
  firstName: string;
  lastName: string;
} {
  const first = contact.firstName?.trim() ?? '';
  const last = contact.lastName?.trim() ?? '';
  if (first || last) return { firstName: first, lastName: last };

  const parts = (contact.name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function toPicked(contact: Contacts.Contact): PickedContact | null {
  const phone = primaryPhone(contact);
  if (!phone) return null;
  const { firstName, lastName } = splitName(contact);
  return { firstName, lastName, phone };
}
