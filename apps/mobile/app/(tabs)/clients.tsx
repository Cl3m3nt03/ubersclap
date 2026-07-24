import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Search, UserPlus, Users, Plus } from 'lucide-react-native';
import { initials, light, touch } from '@ubersclap/shared';

import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState, LoadingState } from '@/components/QueryState';
import { useClients } from '@/lib/queries/clients';
import { useDebounced } from '@/lib/use-debounced';

export default function ClientsScreen() {
  const [query, setQuery] = useState('');

  /**
   * La recherche part cote serveur, pas dans un filtre local.
   *
   * Le repertoire d'un chauffeur atteint vite plusieurs centaines de fiches :
   * les charger toutes pour filtrer en memoire gaspille du reseau et casse la
   * recherche des que la liste depasse la pagination.
   */
  const search = useDebounced(query.trim(), 300);
  const { data, isPending, isRefetching, error, refetch } = useClients(search);

  const clients = data ?? [];

  return (
    <View className="flex-1 bg-canvas">
      <PageHeader
        title="Clients"
        greeting={
          clients.length > 0
            ? `${clients.length} enregistré${clients.length > 1 ? 's' : ''}`
            : undefined
        }
        right={
          <Pressable
            onPress={() => router.push('/client/nouveau')}
            accessibilityRole="button"
            accessibilityLabel="Nouveau client"
            className="items-center justify-center rounded-full"
            style={{
              width: touch.secondary,
              height: touch.secondary,
              backgroundColor: light.indigo,
            }}
          >
            <Plus size={22} color="#FFFFFF" />
          </Pressable>
        }
      />

      <View className="px-6">
        <View
          className="flex-row items-center gap-2 rounded-md bg-surface px-4"
          style={{ height: touch.primary, borderWidth: 1, borderColor: light.border }}
        >
          <Search size={18} color={light.inkFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un client"
            placeholderTextColor={light.inkFaint}
            className="flex-1 font-medium text-[16px] text-ink"
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor={light.indigo}
          />
        }
      >
        {isPending ? (
          <LoadingState label="Chargement du répertoire…" />
        ) : error ? (
          <Card>
            <ErrorState error={error} onRetry={() => void refetch()} />
          </Card>
        ) : clients.length === 0 ? (
          <Card>
            <EmptyState
              icon={search ? Users : UserPlus}
              title={search ? 'Aucun client trouvé' : 'Aucun client'}
              hint={
                search
                  ? `Rien ne correspond à « ${search} ».`
                  : 'Ajoutez un client, ou créez une course : le passager y est ajouté automatiquement.'
              }
              actionLabel={search ? undefined : 'Ajouter un client'}
              onAction={search ? undefined : () => router.push('/client/nouveau')}
            />
          </Card>
        ) : (
          <View className="gap-3">
            {clients.map((client) => (
              <Pressable
                key={client.id}
                onPress={() => router.push(`/client/${client.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`${client.firstName} ${client.lastName}`}
                className="flex-row items-center gap-3 rounded-lg bg-surface p-4"
                style={{ minHeight: touch.primary }}
              >
                <View
                  className="h-12 w-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: '#EEF2FF' }}
                >
                  <Text className="font-extra text-[15px] text-indigo">
                    {initials(client.firstName, client.lastName)}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="font-bold text-[15px] text-ink" numberOfLines={1}>
                    {client.firstName} {client.lastName}
                  </Text>
                  <Text
                    className="font-medium text-[13px] text-ink-muted"
                    numberOfLines={1}
                  >
                    {client.company ?? client.phone}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
