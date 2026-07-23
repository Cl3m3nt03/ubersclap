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
import { light, loginSchema } from '@ubersclap/shared';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/lib/auth';
import { isOfflineError } from '@/lib/api';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const parsed = loginSchema.safeParse({ email, password });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Formulaire incomplet');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await login(parsed.data);
    } catch (cause) {
      setError(
        isOfflineError(cause)
          ? "Pas de connexion. La première connexion nécessite du réseau."
          : cause instanceof Error
            ? cause.message
            : 'Connexion impossible',
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
          Bon retour
        </Text>
        <Text className="mt-2 font-medium text-[15px] text-ink-muted">
          Vos courses, vos clients et vos factures vous attendent.
        </Text>

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
          autoComplete="current-password"
          textContentType="password"
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
          <Button label="Se connecter" onPress={submit} loading={submitting} />
        </View>

        <Pressable
          onPress={() => router.replace('/inscription')}
          accessibilityRole="button"
          hitSlop={12}
          className="mt-6 items-center"
        >
          <Text className="font-bold text-[14px] text-indigo">
            Créer un compte
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
