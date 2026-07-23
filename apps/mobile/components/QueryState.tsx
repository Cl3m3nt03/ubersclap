import { View, Text, ActivityIndicator } from 'react-native';
import { CloudOff, TriangleAlert } from 'lucide-react-native';
import { light } from '@ubersclap/shared';

import { Button } from './Button';
import { isOfflineError } from '@/lib/api';

export function LoadingState({ label = 'Chargement…' }: { label?: string }) {
  return (
    <View className="items-center py-16" accessibilityRole="progressbar">
      <ActivityIndicator color={light.indigo} />
      <Text className="mt-3 font-medium text-[14px] text-ink-faint">{label}</Text>
    </View>
  );
}

/**
 * Echec de chargement.
 *
 * On distingue « pas de réseau » de « erreur serveur » parce que ce n'est pas
 * la même conduite à tenir : dans le premier cas les données affichées restent
 * valides et il suffit d'attendre, dans le second quelque chose est cassé.
 * Un message unique « Une erreur est survenue » laisse le chauffeur sans
 * savoir s'il doit ressortir du parking ou appeler le support.
 */
export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const offline = isOfflineError(error);

  return (
    <View className="items-center px-8 py-12">
      <View
        className="mb-4 h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: offline ? '#FFFBEB' : '#FEF2F2' }}
      >
        {offline ? (
          <CloudOff size={28} color={light.warning} />
        ) : (
          <TriangleAlert size={28} color={light.danger} />
        )}
      </View>

      <Text className="text-center font-bold text-[17px] text-ink">
        {offline ? 'Pas de connexion' : 'Chargement impossible'}
      </Text>

      <Text className="mt-1.5 text-center font-medium text-[14px] text-ink-muted">
        {offline
          ? 'Les données affichées datent de votre dernière connexion.'
          : error instanceof Error
            ? error.message
            : 'Réessayez dans un instant.'}
      </Text>

      {onRetry ? (
        <View className="mt-6 w-full">
          <Button label="Réessayer" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}
