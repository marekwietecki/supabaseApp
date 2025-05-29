import { Tabs } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="lista" options={{ tabBarLabel: "Lista", title: "lista", tabBarIcon: ({ color }) => (
        <FontAwesome
          size={24}
          style={{marginBottom: -3}}
          name="list"
          color={color}
        />
      ) }}  />
      <Tabs.Screen name="dodaj" options={{ tabBarLabel: "Dodaj", title: "Dodaj" , tabBarIcon: ({ color }) => (
        <FontAwesome
          size={24}
          style={{marginBottom: -3}}
          name="plus"
          color={color}
        />
      ) }} />
      <Tabs.Screen name="szczegoly" options={{ tabBarLabel: "Szczegóły", title: "Szczegóły" , tabBarIcon: ({ color }) => (
        <FontAwesome
          size={24}
          style={{marginBottom: -3}}
          name="info-circle"
          color={color}
        />
      ) }} />
      <Tabs.Screen name="profil" options={{ tabBarLabel: "Profil", title: "Profil" , tabBarIcon: ({ color }) => (
        <FontAwesome
          size={24}
          style={{marginBottom: -3}}
          name="male"
          color={color}
        />
      ) }} />
    </Tabs>
  );
}