import { useEffect, useState } from 'react';
import { useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import supabase from '../../../lib/supabase-client';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function App() {
  const [user, setUser] = useState(null);
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
      } else {
        Alert.alert('Error accessing User data');
      }
    });
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => null,
    });
  }, [navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            router.push('/(tabs)/profil');
          }}
          style={styles.headerButton}
        >
          <FontAwesome
            size={20}
            style={{ marginBottom: 0 }}
            name="chevron-left"
            color={'#2196F3'}
          />
          <Text
            style={{
              color: '#2196F3',
              fontSize: 20,
              fontWeight: '600',
              paddingBottom: 4,
            }}
          >
            Profil
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, router]);

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 8 }}>{JSON.stringify(user, null, 2)}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButton: {
    marginRight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
