import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { light, registerSchema } from '@ubersclap/shared';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/lib/auth';
import { isOfflineError } from '@/lib/api';

/**
 * Inscription.
 *
 * Quatre champs, pas un de plus. Ni SIRET, ni régime de TVA, ni véhicule :
 * ces informations ne servent qu'à la facturation et les demander avant
 * d'avoir montré la moindre valeur fait abandonner l'inscription. L'écran
 * Profil les réclame ensuite, et elles ne bloquent que les factures.
 */
export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const parsed = registerSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Formulaire incomplet');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await register(parsed.data);
    } catch (cause) {
      setError(
        isOfflineError(cause)
          ? "Pas de connexion. La création de compte nécessite du réseau."
          : cause instanceof Error
            ? cause.message
            : 'Inscription impossible',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-canvas"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: insets.top + 48,
          paddingBottom: 32,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="font-extra text-[32px] leading-[38px] tracking-tight text-ink">
          Créer un compte
        </Text>
        <Text className="mt-2 font-medium text-[15px] text-ink-muted">
          Deux minutes, et votre première course est enregistrée.
        </Text>

        <View className="flex-row gap-4">
          <View className="flex-1">
            <TextField
              label="Prénom"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Jean-Luc"
              autoComplete="given-name"
              textContentType="givenName"
            />
          </View>
          <View className="flex-1">
            <TextField
              label="Nom"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Moreau"
              autoComplete="family-name"
              textContentType="familyName"
            />
          </View>
        </View>

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="vous@exemple.fr"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          textContentType="emailAddress"
        />

        <TextField
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••••"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          hint="Au moins 10 caractères. Une phrase est plus sûre qu'un mot compliqué."
          onSubmitEditing={submit}
          returnKeyType="go"
        />

        {error ? (
          <View
            className="mt-5 rounded-md p-4"
            style={{ backgroundColor: '#FEF2F2' }}
          >
            <Text className="font-bold text-[14px]" style={{ color: light.danger }}>
              {error}
            </Text>
          </View>
        ) : null}

        <View className="mt-8">
          <Button label="Créer mon compte" onPress={submit} loading={submitting} />
        </View>

        <Pressable
          onPress={() => router.replace('/connexion')}
          accessibilityRole="button"
          hitSlop={12}
          className="mt-6 items-center"
        >
          <Text className="font-bold text-[14px] text-indigo">
            J'ai déjà un compte
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
