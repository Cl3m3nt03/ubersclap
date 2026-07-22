import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { Search, UserPlus, Users } from 'lucide-react-native';
import { initials, light, touch } from '@ubersclap/shared';

import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { MoneyText, NumericText } from '@/components/MoneyText';
import { EmptyState } from '@/components/EmptyState';
import { clients } from '@/lib/mock';

export default function ClientsScreen() {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter((client) =>
      `${client.firstName} ${client.lastName} ${client.company}`
        .toLowerCase()
        .includes(needle),
    );
  }, [query]);

  return (
    <View className="flex-1 bg-canvas">
      <PageHeader title="Clients" greeting={`${clients.length} enregistrés`} />

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
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {results.length === 0 ? (
          <Card>
            <EmptyState
              icon={query ? Users : UserPlus}
              title={query ? 'Aucun client trouvé' : 'Aucun client'}
              hint={
                query
                  ? `Rien ne correspond à « ${query} ».`
                  : 'Ajoutez votre premier client pour créer une course en deux taps.'
              }
              actionLabel={query ? undefined : 'Ajouter un client'}
              onAction={query ? undefined : () => {}}
            />
          </Card>
        ) : (
          <View className="gap-3">
            {results.map((client) => (
              <Pressable
                key={client.id}
                onPress={() => {}}
                accessibilityRole="button"
                accessibilityLabel={`${client.firstName} ${client.lastName}, ${client.courses} courses`}
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
                    {client.company}
                  </Text>
                </View>

                <View className="items-end">
                  <MoneyText
                    cents={client.totalCents}
                    className="font-extra text-[15px] text-ink"
                  />
                  <NumericText className="font-medium text-[12px] text-ink-faint">
                    {client.courses} courses
                  </NumericText>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
