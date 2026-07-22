import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { FileText, Download } from 'lucide-react-native';
import {
  formatShortDate,
  INVOICE_STATUS_LABEL,
  light,
  touch,
  sumCents,
  type InvoiceStatus,
} from '@ubersclap/shared';

import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { MoneyText, NumericText } from '@/components/MoneyText';
import { EmptyState } from '@/components/EmptyState';
import { invoices } from '@/lib/mock';

const FILTERS = [
  { key: 'ALL', label: 'Toutes' },
  { key: 'SENT', label: 'En attente' },
  { key: 'PAID', label: 'Payées' },
  { key: 'OVERDUE', label: 'En retard' },
] as const;

type FilterKey = (typeof FILTERS)[number]['key'];

const STATUS_COLOR: Record<InvoiceStatus, string> = {
  DRAFT: light.inkMuted,
  SENT: light.warning,
  PAID: light.success,
  OVERDUE: light.danger,
  CANCELLED: light.inkFaint,
};

export default function InvoicesScreen() {
  const [filter, setFilter] = useState<FilterKey>('ALL');

  const results = useMemo(
    () => (filter === 'ALL' ? invoices : invoices.filter((i) => i.status === filter)),
    [filter],
  );

  const outstanding = sumCents(
    invoices
      .filter((i) => i.status === 'SENT' || i.status === 'OVERDUE')
      .map((i) => i.totalInclTaxCents),
  );

  return (
    <View className="flex-1 bg-canvas">
      <PageHeader title="Factures" greeting="Suivi des paiements" />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Card className="mb-4">
          <Text className="font-extra text-[12px] uppercase tracking-widest text-ink-faint">
            Encours à recouvrer
          </Text>
          <MoneyText
            cents={outstanding}
            className="mt-1 font-extra text-[28px] text-ink"
          />
        </Card>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
        >
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className="justify-center rounded-sm px-4"
                style={{
                  height: touch.secondary,
                  backgroundColor: active ? light.indigo : light.surface,
                  borderWidth: 1,
                  borderColor: active ? light.indigo : light.border,
                }}
              >
                <Text
                  className="font-bold text-[14px]"
                  style={{ color: active ? '#FFFFFF' : light.inkMuted }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="mt-4 gap-3">
          {results.length === 0 ? (
            <Card>
              <EmptyState
                icon={FileText}
                title="Aucune facture ici"
                hint="Terminez une course pour pouvoir la facturer."
              />
            </Card>
          ) : (
            results.map((invoice) => (
              <Pressable
                key={invoice.id}
                onPress={() => {}}
                accessibilityRole="button"
                accessibilityLabel={`Facture ${invoice.invoiceNumber}, ${invoice.clientName}`}
                className="rounded-lg bg-surface p-4"
                style={{ minHeight: touch.primary }}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    {/* Le numero est en chiffres tabulaires : c'est une
                        reference qu'on recopie ou qu'on dicte au telephone. */}
                    <NumericText className="font-extra text-[15px] text-ink">
                      {invoice.invoiceNumber}
                    </NumericText>
                    <Text
                      className="mt-0.5 font-medium text-[14px] text-ink-muted"
                      numberOfLines={1}
                    >
                      {invoice.clientName}
                    </Text>
                  </View>

                  <View className="items-end">
                    <MoneyText
                      cents={invoice.totalInclTaxCents}
                      className="font-extra text-[17px] text-ink"
                    />
                    <Text
                      className="mt-0.5 font-bold text-[13px]"
                      style={{ color: STATUS_COLOR[invoice.status] }}
                    >
                      {INVOICE_STATUS_LABEL[invoice.status]}
                    </Text>
                  </View>
                </View>

                <View
                  className="mt-3 flex-row items-center justify-between border-t pt-3"
                  style={{ borderTopColor: light.border }}
                >
                  <Text className="font-medium text-[13px] text-ink-faint">
                    {invoice.courseCount} courses · {formatShortDate(invoice.issuedAt)}
                  </Text>
                  <View className="flex-row items-center gap-1.5">
                    <Download size={14} color={light.indigo} />
                    <Text className="font-bold text-[13px] text-indigo">PDF</Text>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
