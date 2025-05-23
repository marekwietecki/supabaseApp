import { Stack, Link, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  
  const {settingType} = useLocalSearchParams();

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Settings > Details"}}/>
      <View style={styles.container}>
        <Text style={{ fontSize: 24 }}>Detail Page of Settings Tab</Text>
        <Text style={{ fontSize: 24, marginTop: 16 }}>{settingType}</Text>
        <StatusBar style="auto" />
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
