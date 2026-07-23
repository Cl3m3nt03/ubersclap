import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onlineManager, useMutationState } from '@tanstack/react-query';
import { CloudOff, RefreshCw } from 'lucide-react-native';
import { light } from '@ubersclap/shared';

/**
 * Bandeau d'etat reseau (ADR-011, regle 4).
 *
 * L'offline ne doit jamais echouer en silence : le chauffeur doit savoir que ce
 * qu'il voit date de sa derniere connexion, et surtout que ce qu'il vient de
 * saisir est en file d'attente, pas perdu. Deux etats distincts :
 *
 *  - hors-ligne sans rien a envoyer → simple rappel « données en cache » ;
 *  - des mutations en pause → decompte de ce qui reste a synchroniser, visible
 *    meme une fois le reseau revenu tant que le rejeu n'est pas termine.
 */
export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const online = useOnlineStatus();

  // Les mutations creees hors-ligne sont mises en pause : on les compte pour
  // montrer qu'elles attendent une synchronisation, pas qu'elles ont echoue.
  const pending = useMutationState({
    filters: { predicate: (mutation) => mutation.state.isPaused },
  }).length;

  if (online && pending === 0) return null;

  const syncing = online && pending > 0;

  return (
    <View
      style={{
        paddingTop: insets.top + 6,
        paddingBottom: 8,
        backgroundColor: syncing ? light.indigo : light.warning,
      }}
      className="flex-row items-center justify-center gap-2 px-4"
      accessibilityRole="alert"
    >
      {syncing ? (
        <RefreshCw size={15} color="#FFFFFF" />
      ) : (
        <CloudOff size={15} color="#FFFFFF" />
      )}
      <Text className="font-semibold text-[13px] text-white">{label(online, pending)}</Text>
    </View>
  );
}

function label(online: boolean, pending: number): string {
  if (pending > 0) {
    const plural = pending > 1 ? 's' : '';
    return online
      ? `Synchronisation de ${pending} modification${plural}…`
      : `${pending} modification${plural} en attente d'envoi`;
  }

  return 'Hors ligne — données du dernier chargement';
}

/** Etat reseau vu par TanStack Query (source : NetInfo via `onlineManager`). */
function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(onlineManager.isOnline());

  useEffect(() => onlineManager.subscribe(setOnline), []);

  return online;
}
