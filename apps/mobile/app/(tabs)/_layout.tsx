import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Settings,
} from 'lucide-react-native';
import { light, touch } from '@ubersclap/shared';

/**
 * Navigation principale — 5 onglets.
 *
 * Le prototype Superdesign en avait 4 (Tableau / Agenda / Bilan / Profil), or
 * Factures et Clients n'y avaient aucun onglet alors que ce sont deux usages
 * quotidiens, et Bilan n'avait pas de page.
 *
 * "Facturer" est l'action qui justifie l'abonnement (ADR-015 : le plafond du
 * plan gratuit porte sur les factures, pas sur les courses). L'enterrer a deux
 * taps est contre-productif. Le Bilan devient une section du Tableau.
 * Voir DESIGN_DIRECTION.md, point 6.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: light.indigo,
        tabBarInactiveTintColor: light.inkFaint,
        tabBarStyle: {
          backgroundColor: light.surface,
          borderTopColor: light.border,
          // La safe area du bas est geree par le composant Tabs lui-meme.
          height: Platform.OS === 'ios' ? 88 : touch.primary + 18,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          // 12 px minimum, graisse 700. Le prototype utilisait 10 px en
          // graisse 900 : illisible en voiture, et les majuscules tres grasses
          // perdent en lisibilite au lieu d'en gagner.
          fontFamily: 'PlusJakartaSans_700Bold',
          fontSize: 12,
          textTransform: 'uppercase',
        },
        tabBarItemStyle: { minHeight: touch.primary },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tableau',
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color }) => <Calendar size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clients',
          tabBarIcon: ({ color }) => <Users size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="factures"
        options={{
          title: 'Factures',
          tabBarIcon: ({ color }) => <FileText size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => <Settings size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
