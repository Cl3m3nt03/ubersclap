import '../global.css';

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import {
  useFonts,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { light } from '@ubersclap/shared';

import { AuthProvider, useAuth } from '@/lib/auth';
import { queryClient } from '@/lib/query-client';
import { sqlitePersister } from '@/lib/persister';
import { OfflineBanner } from '@/components/OfflineBanner';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: sqlitePersister,
        // Le cache serveur au-dela de 24 h est rafraichi de toute facon ; la
        // borne evite de restaurer des donnees perimees au demarrage. Les
        // mutations en pause, elles, ne portent pas de date de peremption et
        // sont conservees jusqu'a leur rejeu.
        maxAge: 24 * 60 * 60 * 1000,
      }}
      // Cache restaure : on relance les mutations mises en pause avant la
      // fermeture de l'app (course creee hors-ligne, ADR-011).
      onSuccess={() => {
        void queryClient.resumePausedMutations();
      }}
    >
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <OfflineBanner />
          <RootNavigator />
        </SafeAreaProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}

/**
 * Aiguillage session.
 *
 * Le splash reste affiche tant que la session est en cours de lecture : sans
 * ca, l'ecran de connexion apparait une demi-seconde a chaque ouverture avant
 * d'etre remplace par le tableau de bord, alors que la session est valide
 * 30 jours.
 */
function RootNavigator() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync();
  }, [status]);

  useEffect(() => {
    if (status === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';

    if (status === 'anonymous' && !inAuthGroup) router.replace('/connexion');
    else if (status === 'authenticated' && inAuthGroup) router.replace('/');
  }, [status, segments, router]);

  if (status === 'loading') return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: light.bg },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="course/nouvelle" options={{ presentation: 'modal' }} />
      <Stack.Screen name="course/[id]" />
      <Stack.Screen name="client/[id]" />
    </Stack>
  );
}
