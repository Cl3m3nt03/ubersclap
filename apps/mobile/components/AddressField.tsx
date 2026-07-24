import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { MapPin, Check } from 'lucide-react-native';
import { light, touch, type Address, type GeoSuggestion } from '@ubersclap/shared';

import { useDebounced } from '@/lib/use-debounced';
import { useAddressAutocomplete } from '@/lib/queries/geo';

type Props = {
  value: Address;
  onChange: (address: Address) => void;
  placeholder?: string;
};

/**
 * Champ d'adresse avec autocompletion.
 *
 * La saisie libre reste possible — un lieu-dit, « chez Paul », une adresse que
 * le geocodeur ignore — mais des qu'une suggestion est choisie, ses coordonnees
 * sont conservees. Ce sont elles qui permettent ensuite de calculer la distance
 * et la duree du trajet (phase itineraire) ; une adresse tapee sans etre
 * resolue reste valable, seulement sans calcul automatique.
 *
 * Reecrire le texte apres coup efface les coordonnees : elles ne correspondent
 * alors plus a ce qui est ecrit, et une distance calculee sur l'ancien point
 * serait un mensonge affiche au client.
 */
export function AddressField({ value, onChange, placeholder }: Props) {
  const [focused, setFocused] = useState(false);
  const resolved = value.latitude !== undefined && value.longitude !== undefined;

  const debounced = useDebounced(value.label, 300);
  // On n'interroge le serveur que quand le champ est actif et non encore
  // resolu : inutile de rechercher une adresse deja choisie.
  const searchTerm = focused && !resolved ? debounced : '';
  const { data: suggestions, isFetching } = useAddressAutocomplete(searchTerm);

  const showList =
    focused && !resolved && (suggestions?.length ?? 0) > 0;

  function pick(suggestion: GeoSuggestion) {
    onChange({
      label: suggestion.label,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
    setFocused(false);
  }

  return (
    <View>
      <View
        className="flex-row items-center gap-2 rounded-md bg-surface px-4"
        style={{
          height: touch.primary,
          borderWidth: 1,
          borderColor: focused ? light.indigo : light.border,
        }}
      >
        <MapPin
          size={18}
          color={resolved ? light.indigo : light.inkFaint}
        />
        <TextInput
          value={value.label}
          onChangeText={(text) => onChange({ label: text })}
          onFocus={() => setFocused(true)}
          // Laisse le temps au tap d'une suggestion de se declencher avant de
          // masquer la liste (blur precede le press).
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={placeholder}
          placeholderTextColor={light.inkFaint}
          autoCorrect={false}
          className="flex-1 font-medium text-[16px] text-ink"
          accessibilityLabel={placeholder}
        />
        {isFetching ? (
          <ActivityIndicator size="small" color={light.inkFaint} />
        ) : resolved ? (
          <Check size={18} color={light.indigo} />
        ) : null}
      </View>

      {showList ? (
        <View
          className="mt-1 overflow-hidden rounded-md bg-surface"
          style={{ borderWidth: 1, borderColor: light.border }}
        >
          {suggestions!.map((suggestion, index) => (
            <Pressable
              key={`${suggestion.latitude},${suggestion.longitude},${index}`}
              onPress={() => pick(suggestion)}
              accessibilityRole="button"
              accessibilityLabel={suggestion.label}
              className="flex-row items-center gap-2 px-4 py-3"
              style={
                index > 0
                  ? { borderTopWidth: 1, borderTopColor: light.border }
                  : undefined
              }
            >
              <MapPin size={16} color={light.inkFaint} />
              <Text
                className="flex-1 font-medium text-[14px] text-ink"
                numberOfLines={2}
              >
                {suggestion.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
