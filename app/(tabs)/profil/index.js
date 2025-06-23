import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import supabase from '../../../lib/supabase-client';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { colors } from '../../../utils/colors'


export default function App() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true; // aby zapobiec aktualizacji stanu po odmontowaniu komponentu

    // Sprawdzamy stan sieci
    NetInfo.fetch().then((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        // Jeżeli urządzenie jest online, pobieramy dane ze Supabase
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            if (isMounted) {
              setUser(user);
            }
            // Zapisujemy dane w AsyncStorage do późniejszego wykorzystania, gdy offline.
            AsyncStorage.setItem('cachedUser', JSON.stringify(user));
          } else {
            Alert.alert('Error accessing User data');
          }
        });
      } else {
        // Jeżeli offline, próbujemy odczytać dane użytkownika z pamięci urządzenia (cache)
        AsyncStorage.getItem('cachedUser')
          .then((cachedUser) => {
            if (cachedUser && isMounted) {
              setUser(JSON.parse(cachedUser));
            } else {
              console.log('Brak zapisanych danych użytkownika lub brak połączenia.');
            }
          })
          .catch((err) => console.error('Błąd przy odczycie cachedUser:', err));
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const doLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error Signing Out User', error.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Profil',
          headerLeft: () => null,
          headerBackVisible: false,
        }}
      />
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={{ flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <FontAwesome
            size={80}
            style={{ marginBottom: -3 }}
            name="user"
            color={colors.gray400}
          />
          <Text style={{ fontSize: 20, fontWeight: '700' }}>
            {user?.email}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.buttonContainer, { borderColor: colors.gray800 }]}
          onPress={() => router.push('/profil/passwordChange')}
        >
          <FontAwesome size={16} name="lock" color={colors.gray800} />
          <Text style={styles.buttonText}> Zmień Hasło</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={doLogout} style={styles.buttonContainer}>
          <FontAwesome size={16} name="sign-out" color={colors.gray800} />
          <Text style={styles.buttonText}>Wyloguj się</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray000,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    alignSelf: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray800,
    paddingLeft: 4,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.red500,
    flexDirection: 'row', 
    alignItems: 'center',
  },
});