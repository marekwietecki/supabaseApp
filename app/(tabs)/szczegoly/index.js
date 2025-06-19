import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SectionList,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Link, Stack } from 'expo-router';
import supabase from '../../../lib/supabase-client';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';

export default function HomeScreen() {
  const [tasks, setTasks] = useState([]);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(true);

  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const dynamicPaddingTop = screenWidth > 914 ? '2%' : 0;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
        setScreenWidth(window.width);
      });
    
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOnline) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUser(user);
        } else {
          console.log('Error accessing User data');
        }
      });
    } else {
      // Jeśli offline, możesz pozostawić user z poprzedniego stanu lub wyświetlić komunikat,
      // że dane użytkownika mogą być niedostępne, ale przynajmniej nie próbujesz ich pobierać.
      console.log('Offline – nie pobieram danych użytkownika');
    }
  }, [isOnline]);

  async function fetchTasks(userId) {
    if (!isOnline) {
      // Jeśli offline, po prostu kończymy funkcję, nie wyświetlając błędu,
      // bo użytkownik jest już informowany o braku sieci.
      console.log("Offline - pomijam pobieranie zadań");
      return;
    }
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('creator_id', userId);

    if (error) {
      // Możesz rozważyć inne sprawdzanie błędów,
      // ale jeśli error wynika z braku sieci, być może warto go pominąć
      console.log('Błąd pobierania z BD:', error.message);
    } else {
      setTasks([...data]);
    }
  }

  useEffect(() => {
    let lastAlertTime = 0;

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          console.log('🔴 Wylogowany, próbuję pokazać alert...');

          const now = Date.now();
          if (now - lastAlertTime > 600000) {
            Alert.alert('Uwaga', 'Nie jesteś zalogowany.');
            lastAlertTime = now;
          }
        } else {
          console.log('✅ Sesja aktywna:', session.user);
          setSession(session);
          fetchTasks(session.user.id);
        }
      },
    );

    return () => {
      console.log('🧹 Czyszczę listener sesji...');
      if (subscription?.subscription) {
        subscription.subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchTasks(session.user.id);

      const channel = supabase
        .channel('tasks_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks' },
          (payload) => {
            console.log('2 Zmiana w taskach wykryta:', payload);
            fetchTasks(session.user.id);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      if (session?.user) {
        fetchTasks(session.user.id);
      }
      return () => {};
    }, [session]),
  );

  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: 'Szczegóły Zadań' }}
      />
      {isOnline ? (
      <View style={[styles.container, { paddingTop: dynamicPaddingTop }]}>
        <View style={styles.wrapper}>
          <SectionList
            contentContainerStyle={{ paddingVertical: '4%' }}
            sections={[{ title: 'Lista Zadań', data: sortedTasks }]}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View
                  style={{
                    flex: 1,
                    paddingRight: 10,
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <Link href={`/(tabs)/szczegoly/${item.id}`} asChild>
                    <TouchableOpacity>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text
                           style={[styles.itemName, { flex: 1, minWidth: 0, marginRight: 8 }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.name}
                        </Text>
                        <MaterialIcons
                          name="info-outline"
                          size={24}
                          color="#2196F3"
                          style={{ marginBottom: 6 }}
                        />
                      </View>
                      <Text
                        style={[
                          styles.itemText,
                          { color: item.is_done ? 'green' : 'red' }
                        ]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.is_done ? 'Wykonane' : 'Nie wykonane'}
                      </Text>
                      <Text
                        style={styles.itemText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        Termin zadania: {new Date(item.date).toLocaleDateString('pl-PL').replace(/\./g, '/')}
                      </Text>
                      <Text
                        style={styles.itemText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        Miejsce zadania: {item.place}
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            )}
            renderSectionHeader={() => null}
            ItemSeparatorComponent={() => null}
          />
        </View>
      </View>
      ) : (
            <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <Text style={{ color: 'black', fontWeight: '800', fontSize: 16 }}>
                🔌 Brak połączenia z internetem
              </Text>
              <Text style={{ color: 'black', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
                Nie możesz dodać zadania offline. Spróbuj ponownie po odzyskaniu połączenia.
              </Text>
            </View>
      )} 
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    justifyContent: 'center',
    gap: 8,  
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    backgroundColor: 'white',
    paddingTop: 24,
    paddingLeft: '2%',
    paddingBottom: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginVertical: 8,
    paddingHorizontal: 8,
    marginHorizontal: '6%',
    alignItems: 'center',
    borderBottomWidth: 0,
    overflow: 'visible',
    backgroundColor: 'white', 
    borderRadius: 24, 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 0 }, 
    shadowOpacity: 0.07,
    shadowRadius: 16, 
  },
  itemName: {
    fontSize: 20,
    fontWeight: 600,
    paddingBottom: 8,
    paddingLeft: 8,
  },
  itemText: {
    fontSize: 14,
    paddingVertical: 2,
    paddingLeft: 8,
  },
  itemTextSecondary: {
    fontSize: 14,
    paddingVertical: 2,
    color: 'gray',
  },
});