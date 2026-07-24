import { forwardRef } from 'react';
import { View, Text, TextInput } from 'react-native';
import { light, touch } from '@ubersclap/shared';

type Props = React.ComponentProps<typeof TextInput> & {
  label: string;
  /** Message d'erreur affiche sous le champ. */
  error?: string;
  hint?: string;
};

/**
 * Champ de saisie.
 *
 * Hauteur 56 px comme les boutons : la saisie se fait en conduite ou debout a
 * cote de la voiture, pas assis a un bureau (DESIGN_DIRECTION.md).
 *
 * L'erreur est rendue sous le champ et non dans une alerte : une alerte cache
 * le champ fautif au moment ou l'utilisateur doit le corriger.
 */
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, hint, style, ...rest },
  ref,
) {
  return (
    <View className="mt-5">
      <Text className="mb-2 font-extra text-[12px] uppercase tracking-widest text-ink-faint">
        {label}
      </Text>

      <TextInput
        ref={ref}
        accessibilityLabel={label}
        placeholderTextColor={light.inkFaint}
        className="rounded-md bg-surface px-4 font-medium text-[16px] text-ink"
        style={[
          {
            height: touch.primary,
            borderWidth: 1,
            borderColor: error ? light.danger : light.border,
          },
          style,
        ]}
        {...rest}
      />

      {error ? (
        <Text className="mt-1.5 font-bold text-[13px]" style={{ color: light.danger }}>
          {error}
        </Text>
      ) : hint ? (
        <Text className="mt-1.5 font-medium text-[13px] text-ink-faint">{hint}</Text>
      ) : null}
    </View>
  );
});
