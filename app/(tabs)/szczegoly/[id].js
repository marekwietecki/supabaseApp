import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import {
  useLocalSearchParams,
  Link,
  useNavigation,
  useRouter,
} from 'expo-router';
import supabase from '../../../lib/supabase-client';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import NetInfo from '@react-native-community/netinfo';
import { Platform, Linking } from 'react-native';


export default function TaskDetailsScreen() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const [task, setTask] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  const screenWidth = Dimensions.get('window').width;
  const dynamicPaddingTop = screenWidth > 600 ? 0 : '8%';


  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    });
    return () => unsubscribe();
  }, []);
  const [user, setUser] = useState(null);
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
            router.push('/(tabs)/szczegoly');
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
            Szczegóły
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, router]);

  useEffect(() => {
    console.log('Otrzymane id z URL:', id);
    console.log('Pobieram zadanie o id:', id);

    async function fetchTaskDetails() {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Błąd pobierania zadania:', error);
        } else {
          console.log('Pobrane dane zadania:', data);
          setTask(data);
        }
      } catch (err) {
        console.error('Wyjątek w fetchTaskDetails:', err);
      }
    }

    if (id) fetchTaskDetails();
  }, [id]);

  // Jeśli task jeszcze nie został pobrany:
  if (!task) {
    return (
      <View style={[styles.container, { paddingTop: dynamicPaddingTop }]}>
        <View style={styles.wrapper}>
          {isOnline ? (
            <Text style={styles.loadingText}>Ładowanie danych...</Text>
          ) : (
            <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', flex: 1, paddingLeft: '-6%', paddingTop: '-8%', }}>
              <Text style={{ color: 'black', fontWeight: '800', fontSize: 16 }}>
                🔌 Brak połączenia z internetem
              </Text>
              <Text style={{ color: 'black', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                Nie możesz dodać zadania offline. Spróbuj ponownie po odzyskaniu połączenia.
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }
 
  return (
    <View style={[styles.container, { paddingTop: dynamicPaddingTop }]}>
      <Text style={styles.title}>{task.name}</Text>
      <Text style={[styles.subtitle,{ color: task.is_done ? 'green' : 'red' }]} numberOfLines={1} ellipsizeMode="tail">{task.is_done ? 'Wykonane' : 'Nie wykonane'}</Text>
      <Text style={styles.subtitle}>
        Termin zadania: {new Date(task.date).toLocaleDateString('pl-PL').replace(/\./g, '/')}
      </Text>
      <Text style={styles.subtitle}>Adres zadania: {task.place}</Text>
      {task.latitude && task.longitude && (
        <TouchableOpacity
          style={[styles.mapButton, { marginBottom: 16 }]}
          onPress={() => {
            const lat = task.latitude;
            const lon = task.longitude;
            const label = encodeURIComponent(task.place || 'Zadanie');
            const url = Platform.select({
              ios: `http://maps.apple.com/?ll=${lat},${lon}&q=${label}`,
              android: `geo:${lat},${lon}?q=${lat},${lon}(${label})`,
            });
            Linking.openURL(url);
          }}
        >
          <Text style={styles.mapButtonText}>📍 Otwórz w mapach</Text>
        </TouchableOpacity>
      )}
      <View style={styles.secondariesBox}>  
        <Text style={styles.subtitleSecondary}>Dodał: {user?.email}</Text>
        <Text style={styles.subtitleSecondary}>
          Data dodania: {new Date(task.created_at).toLocaleDateString('pl-PL').replace(/\./g, '/')}
        </Text>
        <Text style={styles.subtitleSecondary}>
          Godzina dodania: {new Date(task.created_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Link href={`/(tabs)/lista`} asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Przejdź do Listy Zadań</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingLeft: '6%',
    paddingTop: '8%',
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  subtitleSecondary: {
    fontSize: 16,
    color: 'gray',
    paddingTop: 8,
  },
  secondariesBox: {
    marginTop: 8,
  },  
  buttonText: {
    fontSize: 20,
    fontWeight: 700,
    color: '#2196F3',
  },
  button: {
    flexDirection: 'row',
    paddingHorizontal: 38,
    borderRadius: 36,
    marginTop: 20,
    alignSelf: 'center',
    alignItems: 'center',
    marginRight: '6%',
  },
  headerButton: {
    marginRight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 500,
  },
  mapButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    marginTop: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  mapButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});
