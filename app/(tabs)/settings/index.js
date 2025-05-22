import { Stack, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <>
    <Stack.Screen options={{ headerShown: true, title: "Settings"}}/>
    <View style={styles.container}>
      <Text style={{ fontSize: 24, marginBottom: 16 }}>Index of Settings Tab</Text>
      <StatusBar style="auto" />
      <Link href="/settings/ACCOUNT">
        <Text>Goto Account Settings</Text>
      </Link>
      <Link href="/settings/NETWORK">
        <Text>Goto Network Settings</Text>
      </Link>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
