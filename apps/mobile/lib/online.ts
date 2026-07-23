import { onlineManager, focusManager } from '@tanstack/react-query';
import type { AppStateStatus } from 'react-native';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * Branche TanStack Query sur l'etat reseau et l'etat de l'app.
 *
 * Sans ca, `onlineManager` considere l'app toujours en ligne : les mutations ne
 * sont jamais mises en pause hors connexion et la file offline (ADR-011) ne se
 * declenche pas. NetInfo est la source de verite reseau ; a la reconnexion,
 * TanStack rejoue les mutations en pause tout seul.
 *
 * A appeler une seule fois, au demarrage.
 */
export function wireOnlineManager(): void {
  onlineManager.setEventListener((setOnline) => {
    const subscription = NetInfo.addEventListener((state) => {
      // `isInternetReachable` peut rester `null` le temps de la premiere sonde :
      // on retombe alors sur `isConnected` plutot que de bloquer les requetes.
      const reachable = state.isInternetReachable;
      setOnline(
        Boolean(state.isConnected) &&
          (reachable === null ? true : reachable),
      );
    });

    return subscription;
  });

  // Refetch au retour de veille : sur mobile il n'y a pas d'evenement `focus`
  // web, l'equivalent est le passage de l'app au premier plan.
  const onAppStateChange = (status: AppStateStatus) => {
    if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
  };

  AppState.addEventListener('change', onAppStateChange);
}
