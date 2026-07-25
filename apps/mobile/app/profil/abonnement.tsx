import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Alert, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react-native';
import {
  BILLING_INTERVAL_LABEL,
  PLAN_LABEL,
  SUBSCRIPTION_STATUS_LABEL,
  formatEuros,
  formatLongDate,
  light,
  type BillingPlanOption,
  type SubscriptionState,
} from '@cadance/shared';

import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { LoadingState, ErrorState } from '@/components/QueryState';
import {
  useSubscription,
  useBillingPlans,
  startCheckout,
  openBillingPortal,
} from '@/lib/queries/billing';
import { queryKeys } from '@/lib/queries/keys';

/**
 * Abonnement.
 *
 * Le paiement n'a pas d'ecran a nous : le chauffeur part sur une page Stripe et
 * revient. Rien de bancaire ne passe par l'app, donc rien de bancaire n'est a
 * securiser ici (PAYMENT_AND_BILLING.md).
 *
 * Consequence directe : au retour, cet ecran ne peut pas savoir ce qui s'est
 * passe — le tier ne change qu'apres le webhook cote serveur. Il relit donc
 * l'abonnement a chaque prise de focus au lieu d'afficher un etat optimiste.
 */
export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const subscription = useSubscription();
  const plans = useBillingPlans();
  const [busy, setBusy] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.subscription() });
    }, [queryClient]),
  );

  /**
   * Ouvre une page hebergee par Stripe.
   *
   * Le lien part dans le navigateur du systeme, pas dans une WebView : sur une
   * page de paiement, la barre d'adresse et le cadenas du navigateur sont ce
   * qui permet au chauffeur de verifier ou il saisit sa carte.
   */
  const openHosted = async (key: string, request: () => Promise<{ url: string }>) => {
    setBusy(key);
    try {
      const { url } = await request();
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        'Paiement indisponible',
        error instanceof Error ? error.message : 'Réessayez dans un instant.',
      );
    } finally {
      setBusy(null);
    }
  };

  const state = subscription.data;
  const available = state
    ? (plans.data ?? []).filter(
        (plan) => plan.available && !isCurrent(plan, state),
      )
    : [];

  const header = (
    <View
      className="flex-row items-center gap-3 px-6 pb-4"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Retour"
        hitSlop={12}
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: light.border }}
      >
        <ArrowLeft size={20} color={light.ink} />
      </Pressable>
      <Text className="font-extra text-[24px] tracking-tight text-ink">
        Abonnement
      </Text>
    </View>
  );

  if (subscription.isLoading) {
    return (
      <View className="flex-1 bg-canvas">
        {header}
        <LoadingState />
      </View>
    );
  }

  if (subscription.isError || !state) {
    return (
      <View className="flex-1 bg-canvas">
        {header}
        <ErrorState
          error={subscription.error}
          onRetry={() => void subscription.refetch()}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-canvas">
      {header}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <CurrentPlanCard state={state} />

        {state.status === 'PAST_DUE' ? (
          <Card className="mt-4 flex-row gap-3" style={{ backgroundColor: '#FFFBEB' }}>
            <AlertTriangle size={20} color={light.warning} />
            <View className="flex-1">
              <Text className="font-bold text-[15px] text-ink">Paiement en échec</Text>
              <Text className="mt-1 font-medium text-[13px] text-ink-muted">
                Mettez votre moyen de paiement à jour pour conserver votre accès.
              </Text>
            </View>
          </Card>
        ) : null}

        {available.length > 0 ? (
          <>
            <Text className="mb-3 mt-8 font-extra text-[20px] tracking-tight text-ink">
              Changer d’offre
            </Text>
            {available.map((plan) => (
              <View key={`${plan.tier}-${plan.interval}`} className="mb-3">
                <PlanCard
                  plan={plan}
                  loading={busy === `${plan.tier}-${plan.interval}`}
                  onPress={() =>
                    void openHosted(`${plan.tier}-${plan.interval}`, () =>
                      startCheckout({ tier: plan.tier, interval: plan.interval }),
                    )
                  }
                />
              </View>
            ))}
          </>
        ) : (
          // Aucune offre configurée côté serveur (tarifs Stripe absents) ou
          // Stripe injoignable. On le dit plutôt que d'afficher une page vide.
          <Text className="mt-8 font-medium text-[14px] text-ink-muted">
            {plans.isLoading
              ? 'Chargement des offres…'
              : 'Aucune autre offre disponible pour le moment.'}
          </Text>
        )}

        {state.hasPaymentMethod ? (
          <View className="mt-8">
            <Button
              label="Gérer le paiement et les factures"
              variant="secondary"
              icon={<ExternalLink size={18} color="#4F46E5" />}
              loading={busy === 'portal'}
              onPress={() => void openHosted('portal', openBillingPortal)}
            />
            <Text className="mt-3 text-center font-medium text-[13px] text-ink-muted">
              Moyen de paiement, factures et résiliation sont gérés par Stripe.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function CurrentPlanCard({ state }: { state: SubscriptionState }) {
  const periodEnd = state.currentPeriodEnd
    ? formatLongDate(new Date(state.currentPeriodEnd))
    : null;

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-3">
        <ShieldCheck size={22} color={light.indigo} />
        <View className="flex-1">
          <Text className="font-extra text-[18px] text-ink">
            Offre {PLAN_LABEL[state.tier]}
          </Text>
          <Text className="font-medium text-[14px] text-ink-muted">
            {SUBSCRIPTION_STATUS_LABEL[state.status]}
            {state.interval ? ` · ${BILLING_INTERVAL_LABEL[state.interval]}` : ''}
          </Text>
        </View>
      </View>

      {periodEnd ? (
        <Text className="font-medium text-[13px] text-ink-muted">
          {state.cancelAtPeriodEnd
            ? `Accès conservé jusqu’au ${periodEnd}, puis résiliation.`
            : `Prochaine échéance le ${periodEnd}.`}
        </Text>
      ) : null}
    </Card>
  );
}

function PlanCard({
  plan,
  loading,
  onPress,
}: {
  plan: BillingPlanOption;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <Card className="gap-3">
      <View>
        <Text className="font-extra text-[17px] text-ink">
          {PLAN_LABEL[plan.tier]} · {BILLING_INTERVAL_LABEL[plan.interval]}
        </Text>
        {plan.amountCents !== null ? (
          <Text className="mt-0.5 font-bold text-[15px] text-ink-muted">
            {formatEuros(plan.amountCents)}
            {plan.interval === 'MONTHLY' ? ' / mois' : ' / an'}
          </Text>
        ) : null}
      </View>
      <Button label="Souscrire" loading={loading} onPress={onPress} />
    </Card>
  );
}

/** L'offre deja souscrite ne se represente pas comme un changement possible. */
function isCurrent(plan: BillingPlanOption, state: SubscriptionState): boolean {
  return (
    plan.tier === state.tier &&
    (state.interval === null
      ? // Sans periodicite connue, l'abonnement n'a jamais ete paye : toutes
        // les offres du tier courant restent proposables.
        false
      : plan.interval === state.interval)
  );
}
