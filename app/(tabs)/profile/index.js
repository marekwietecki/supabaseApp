import { useEffect, useState } from 'react';
import { Stack, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View, SafeAreaView } from 'react-native';
import supabase from '../../../lib/supabase-client';

export default function App() {
  const [ user, setUser ] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser (user)
      } else {
        Alert.alert("Error accessing User data");
      }
    });
  }, []);  

  const doLogout = async () => {
    const {error} = await supabase.auth.signOut();
    if (error) {
        Alert.alert("Error Signing Out User", error.message);
      }
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <Stack.Screen options={{ headerShown: true, title: "Profile"}}/>
      <View style={styles.container}>
        <StatusBar style="auto" />
        <Text style={{ fontSize: 16 }}>You are currently Logged In as:</Text>
        <Text style={{ fontSize: 20, fontWeight: 600 }}>{user?.email}</Text>
        {/*<Text style={{fontSize: 8}}>{JSON.stringify(user, null, 2)}</Text> */}
        <TouchableOpacity onPress={doLogout} style={styles.buttonContainer}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
        <Link href="/settings/ACCOUNT">
          <Text>Goto Account Settings</Text>
        </Link>
        <Link href="/settings/NETWORK">
          <Text>Goto Network Settings</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
   buttonText: {
    alignSelf: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  buttonContainer: {
    paddingHorizontal: 40,
    paddingVertical: 12,
    backgroundColor: '#2497D5',
    borderRadius: 24,
    marginVertical: 16,
  },
});

 