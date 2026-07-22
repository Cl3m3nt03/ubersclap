import { View, Text, ScrollView } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { initials, light } from '@ubersclap/shared';

import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { driver } from '@/lib/mock';

/**
 * Profil chauffeur.
 *
 * Les champs legaux ne sont pas decoratifs : ils alimentent chaque facture
 * emise. Un chauffeur en franchise en base dont le regime de TVA est mal
 * renseigne emet des factures fausses. Voir ADR-012 (00_CANON.md).
 */
export default function ProfileScreen() {
  const legalFields = [
    { label: 'Raison sociale', value: 'JLM Transport', required: true },
    { label: 'SIRET', value: '123 456 789 00012', required: true },
    { label: 'N° registre VTC', value: null, required: true },
    { label: 'Régime de TVA', value: null, required: true },
    { label: 'Adresse professionnelle', value: '12 rue de Rivoli, 75001 Paris', required: true },
    { label: 'N° TVA intracommunautaire', value: null, required: false },
  ];

  const missing = legalFields.filter((f) => f.required && !f.value);

  return (
    <View className="flex-1 bg-canvas">
      <PageHeader title="Profil" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Card className="flex-row items-center gap-4">
          <View
            className="h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: '#EEF2FF' }}
          >
            <Text className="font-extra text-[20px] text-indigo">
              {initials(driver.firstName, driver.lastName)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-extra text-[18px] text-ink">
              {driver.firstName} {driver.lastName}
            </Text>
            <Text className="font-medium text-[14px] text-ink-muted">
              Chauffeur VTC indépendant
            </Text>
          </View>
        </Card>

        {missing.length > 0 ? (
          <Card
            className="mt-4 flex-row gap-3"
            style={{ backgroundColor: '#FFFBEB' }}
          >
            <AlertTriangle size={20} color={light.warning} />
            <View className="flex-1">
              <Text className="font-bold text-[15px] text-ink">
                {missing.length} information{missing.length > 1 ? 's' : ''} manquante
                {missing.length > 1 ? 's' : ''}
              </Text>
              <Text className="mt-1 font-medium text-[13px] text-ink-muted">
                Vos factures ne seront pas conformes tant que ces champs ne sont
                pas renseignés : {missing.map((f) => f.label).join(', ')}.
              </Text>
            </View>
          </Card>
        ) : null}

        <Text className="mb-3 mt-8 font-extra text-[20px] tracking-tight text-ink">
          Informations légales
        </Text>

        <Card className="gap-0 p-0">
          {legalFields.map((field, index) => (
            <View
              key={field.label}
              className="px-5 py-4"
              style={{
                borderTopWidth: index === 0 ? 0 : 1,
                borderTopColor: light.border,
              }}
            >
              <Text className="font-extra text-[12px] uppercase tracking-widest text-ink-faint">
                {field.label}
              </Text>
              <Text
                className="mt-1 font-bold text-[15px]"
                style={{ color: field.value ? light.ink : light.warning }}
              >
                {field.value ?? 'À renseigner'}
              </Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}
