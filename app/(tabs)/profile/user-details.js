import { useEffect, useState} from 'react';
import { Stack, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
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
  
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Profile > Details"}}/>
      <View style={styles.container}>
        <Text style={{fontSize: 8}}>{JSON.stringify(user, null, 2)}</Text>
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
