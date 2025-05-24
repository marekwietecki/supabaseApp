import { Tabs } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="list" options={{ tabBarLabel: "List", title: "list", tabBarIcon: ({ color }) => (
        <FontAwesome
          size={24}
          style={{marginBottom: -3}}
          name="list"
          color={color}
        />
      ) }}  />
      <Tabs.Screen name="add" options={{ tabBarLabel: "Add", title: "Add" , tabBarIcon: ({ color }) => (
        <FontAwesome
          size={24}
          style={{marginBottom: -3}}
          name="plus"
          color={color}
        />
      ) }} />
      <Tabs.Screen name="profile" options={{ tabBarLabel: "Profile", title: "Profile" , tabBarIcon: ({ color }) => (
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