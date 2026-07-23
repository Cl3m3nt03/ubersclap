import { Stack } from 'expo-router';
import { light } from '@ubersclap/shared';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: light.bg },
      }}
    >
      <Stack.Screen name="connexion" />
      <Stack.Screen name="inscription" />
    </Stack>
  );
}
