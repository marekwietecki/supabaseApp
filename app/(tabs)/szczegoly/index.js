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

export default function HomeScreen() {
  const [tasks, setTasks] = useState([]);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);

  const screenWidth = Dimensions.get('window').width;
  const dynamicPaddingTop = screenWidth > 600 ? 0 : '20%';

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
      } else {
        Alert.alert('Error accessing User data');
      }
    });
  }, []);

  async function fetchTasks(userId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('creator_id', userId);

    if (error) {
      Alert.alert('Błąd Pobierania z BD', error.message);
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
      <View style={[styles.container, { paddingTop: dynamicPaddingTop }]}>
        <View style={styles.wrapper}>
          <View style={styles.titleContainer}>
            <Text style={styles.h1}>Twoje Zadania</Text>
          </View>

          <SectionList
            style={{paddingTop: 12}}
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
                      {/*
                      <Text
                        style={styles.itemTextSecondary}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        Dodał: {user?.email}
                      </Text>
                      <Text
                        style={styles.itemTextSecondary}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        Data dodania: {new Date(item.created_at).toLocaleDateString('pl-PL').replace(/\./g, '/')}
                      </Text>
                      */}
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
    </>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginTop: '-12%',
    marginHorizontal: '7%',
  },
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: '2%',
    color: '#666',
    alignSelf: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    flex: 1,
    //backgroundColor: 'green',
    width: '100%',
    maxWidth: 600,
    justifyContent: 'center',
    marginTop: '6%',
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
