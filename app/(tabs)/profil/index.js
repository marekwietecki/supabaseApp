import { useEffect, useState } from 'react';
import { Stack, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, TouchableOpacity, View, SafeAreaView } from 'react-native';
import supabase from '../../../lib/supabase-client';
import FontAwesome from "@expo/vector-icons/FontAwesome";

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
      <Stack.Screen options={{ headerShown: true, title: "Profil"}}/>
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={{flexDirection: 'column', alignItems: 'center', gap: 16}}>  
          <FontAwesome
            size={80}
            style={{marginBottom: -3}}
            name="user"
            color='gray'
          />
          <Text style={{ fontSize: 20, fontWeight: 700 }}>{user?.email}</Text>
        </View>
        {/*<Text style={{fontSize: 8}}>{JSON.stringify(user, null, 2)}</Text> */}
        <Link href="/profil/user-details">
          <FontAwesome
            size={16}
            name="info-circle"
            color='gray'
          />
          <Text> User Details Page</Text>
        </Link>
        <TouchableOpacity onPress={doLogout} style={styles.buttonContainer}>
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
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
    gap: 8
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
