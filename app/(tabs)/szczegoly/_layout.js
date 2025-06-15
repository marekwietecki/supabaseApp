import { Stack } from 'expo-router';

export default function ListLayout() {
  return (
    <Stack
      screenOptions={({ route }) => ({
        headerBackVisible: false,
        headerLeft: route.name === 'index' ? () => null : undefined,
      })}
    />
  );
}
