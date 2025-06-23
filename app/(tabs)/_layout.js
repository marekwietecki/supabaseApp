import { Tabs } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors } from '../../utils/colors'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 2, 
        },
        tabBarActiveTintColor: colors.blue500, 
        tabBarInactiveTintColor: colors.gray400,
      }}
    >
      <Tabs.Screen
        name="lista"
        options={{
          tabBarLabel: 'Lista',
          title: 'lista',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome
              size={focused ? 24 : 20}
              style={{ marginBottom: -3 }}
              name="list-ul"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="lokalizacja"
        options={{
          tabBarLabel: 'Lokalizacja',
          title: 'lokalizacja',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome
              size={focused ? 24 : 20} 
              style={{ marginBottom: -3 }}
              name="map-pin"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dodaj"
        options={{
          tabBarLabel: 'Dodaj',
          title: 'Dodaj',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome
              size={focused ? 24 : 20} 
              style={{ marginBottom: -3 }}
              name="plus"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="szczegoly"
        options={{
          tabBarLabel: 'Szczegóły',
          title: 'Szczegóły',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome
              size={focused ? 24 : 20} 
              style={{ marginBottom: -3 }}
              name="eye"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          tabBarLabel: 'Profil',
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome
              size={focused ? 24 : 20} 
              style={{ marginBottom: -3 }}
              name="user"
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}