import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { AlertTriangle, Pencil } from 'lucide-react-native';
import { initials, light, PLAN_LABEL, VAT_REGIME_LABEL } from '@ubersclap/shared';

import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingState, ErrorState } from '@/components/QueryState';
import { useMe } from '@/lib/queries/me';

/**
 * Profil chauffeur.
 *
 * Les champs legaux ne sont pas decoratifs : ils alimentent chaque facture
 * emise. Un chauffeur en franchise en base dont le regime de TVA est mal
 * renseigne emet des factures fausses. Voir ADR-012 (00_CANON.md) — d'ou
 * l'alerte tant qu'un champ obligatoire manque, et le bouton pour le corriger.
 */
export default function ProfileScreen() {
  const { data: me, isLoading, isError, error, refetch } = useMe();

  return (
    <View className="flex-1 bg-canvas">
      <PageHeader title="Profil" />

      {isLoading ? (
        <LoadingState />
      ) : isError || !me ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
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
                {initials(me.firstName, me.lastName)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-extra text-[18px] text-ink">
                {me.firstName} {me.lastName}
              </Text>
              <Text className="font-medium text-[14px] text-ink-muted">
                {me.email}
              </Text>
              {me.plan ? (
                <View
                  className="mt-1.5 self-start rounded-sm px-2 py-0.5"
                  style={{ backgroundColor: '#EEF2FF' }}
                >
                  <Text className="font-extra text-[11px] uppercase tracking-widest text-indigo">
                    Abonnement {PLAN_LABEL[me.plan.tier]}
                  </Text>
                </View>
              ) : null}
            </View>
          </Card>

          <LegalSection profile={me.profile} />
        </ScrollView>
      )}
    </View>
  );
}

function LegalSection({ profile }: { profile: NonNullable<ReturnType<typeof useMe>['data']>['profile'] }) {
  const fields = [
    { label: 'Raison sociale', value: profile.companyName, required: true },
    { label: 'Forme juridique', value: profile.legalForm, required: false },
    { label: 'SIRET', value: profile.siret, required: true },
    { label: 'N° registre VTC', value: profile.vtcRegistrationNumber, required: true },
    {
      label: 'Régime de TVA',
      value: profile.vatRegime ? VAT_REGIME_LABEL[profile.vatRegime] : null,
      required: true,
    },
    { label: 'Adresse professionnelle', value: profile.address, required: false },
    { label: 'N° TVA intracommunautaire', value: profile.vatNumber, required: false },
  ];

  const missing = fields.filter((f) => f.required && !f.value);

  return (
    <>
      {missing.length > 0 ? (
        <Card className="mt-4 flex-row gap-3" style={{ backgroundColor: '#FFFBEB' }}>
          <AlertTriangle size={20} color={light.warning} />
          <View className="flex-1">
            <Text className="font-bold text-[15px] text-ink">
              {missing.length} information{missing.length > 1 ? 's' : ''} manquante
              {missing.length > 1 ? 's' : ''}
            </Text>
            <Text className="mt-1 font-medium text-[13px] text-ink-muted">
              Vos factures ne seront pas conformes tant que ces champs ne sont pas
              renseignés : {missing.map((f) => f.label).join(', ')}.
            </Text>
          </View>
        </Card>
      ) : null}

      <Text className="mb-3 mt-8 font-extra text-[20px] tracking-tight text-ink">
        Informations légales
      </Text>

      <Card className="gap-0 p-0">
        {fields.map((field, index) => (
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

      <View className="mt-4">
        <Button
          label="Modifier les informations"
          icon={<Pencil size={18} color="#FFFFFF" />}
          onPress={() => router.push('/profil/legal')}
        />
      </View>
    </>
  );
}
