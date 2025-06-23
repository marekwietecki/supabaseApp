import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import {
  useLocalSearchParams,
  Link,
  useNavigation,
  useRouter,
} from 'expo-router';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import NetInfo from '@react-native-community/netinfo';
import { Platform, Linking } from 'react-native';
import { colors } from '../../../utils/colors';
import { useTasks } from '../../../contexts/TasksContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function DetailsIDScreen() {
  const { getTaskById, fetchTaskById, loadOfflineTasks } = useTasks();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);
  const [task, setTask] = useState(getTaskById(id));

  useEffect(() => {
    const loadTask = async () => {
      let localTask = getTaskById(id);

      if (localTask) {
        setTask(localTask);
      } else {
        await loadOfflineTasks(); 

        localTask = getTaskById(id); 
        if (localTask) {
          setTask(localTask);
        } else {
          const fetched = await fetchTaskById(id); 
          if (fetched) setTask(fetched);
        }
      }
    };

    if (id) loadTask();
  }, [id]);

  const screenWidth = Dimensions.get('window').width;
  const dynamicPaddingTop = screenWidth > 600 ? 0 : '8%';

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => null,
    });
  }, [navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            router.push('/(tabs)/szczegoly');
          }}
          style={styles.headerButton}
        >
          <FontAwesome
            size={18}
            style={{ marginBottom: 0 }}
            name="chevron-left"
            color={colors.blue500}
          />
          <Text
            style={{
              color: colors.blue500,
              fontSize: 18,
              fontWeight: '600',
              paddingBottom: 2,
            }}
          >
            Szczegóły
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, router]);

  if (!task) {
    return (
      <View style={[styles.container, { paddingTop: dynamicPaddingTop }]}>
        <View style={styles.wrapper}>
          {isOnline ? (
            <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', flex: 1, paddingLeft: '-6%', paddingTop: '-8%', }}>
              <Text style={{ color: colors.gray800, fontWeight: '800', fontSize: 16 }}>
                Ładowanie danych...            
              </Text>
            </View> 
          ) : (
            <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', flex: 1, paddingLeft: '-6%', paddingTop: '-8%', }}>
              <Text style={{ color: colors.gray800, fontWeight: '800', fontSize: 16 }}>
                🔌 Brak połączenia z internetem
              </Text>
              <Text style={{ color: colors.gray800, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
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
      <Text style={[styles.subtitle,{ color: task.is_done ? colors.green500 : colors.red500 }]} numberOfLines={1} ellipsizeMode="tail">{task.is_done ? 'Wykonane' : 'Nie wykonane'}</Text>
      <Text style={styles.subtitle}>
        Termin zadania: {new Date(task.date).toLocaleDateString('pl-PL').replace(/\./g, '/')}
      </Text>
      <Text style={styles.subtitle}>Adres zadania: {task.place}</Text>
      {task.latitude && task.longitude && (
        <TouchableOpacity
          style={[styles.button, { marginBottom: 16 }]}
          onPress={() => {
            const lat = task.latitude;
            const lon = task.longitude;
            const label = encodeURIComponent(task.place);
            const url = Platform.select({
              ios: `http://maps.apple.com/?ll=${lat},${lon}&q=${label}`,
              android: `geo:${lat},${lon}?q=${lat},${lon}(${label})`,
            });
            Linking.openURL(url);
          }}
        >
          <Text style={styles.buttonText}> Otwórz w mapach</Text>
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
          <Text style={styles.buttonText}> Przejdź do Listy Zadań</Text>
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
    color: colors.gray400,
    paddingTop: 8,
  },
  secondariesBox: {
    marginTop: 8,
  },  
  buttonText: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.blue500,
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
    color: colors.blue500,
    fontSize: 16,
    fontWeight: 500,
  },
  mapButton: {
    backgroundColor: colors.blue500,
    padding: 10,
    marginTop: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  mapButtonText: {
    color: colors.gray000,
    fontSize: 16,
    fontWeight: '500',
  },
});