import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import supabase from '../../../lib/supabase-client';
import { MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { colors } from '../../../utils/colors'

export default function HomeScreen() {
  // Filtry i dane
  const [placeFilter, setPlaceFilter] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateFilterLabel, setDateFilterLabel] = useState('Wybierz datę');
  const [offlineQueue, setOfflineQueue] = useState([]);

  // Dynamiczna orientacja
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width,
  );
  const dynamicPaddingTop = screenWidth > 914 ? '0%' : 0;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
      } else {
        Alert.alert('Error accessing User data');
      }
    });
  }, []);

  // 1. Funkcja ładowania danych offline z AsyncStorage – wywołujemy, gdy nie ma sesji
  async function loadOfflineTasks() {
    try {
      const json = await AsyncStorage.getItem('local-tasks');
      if (json !== null) {
        const localData = JSON.parse(json);
        setTasks(localData);
        console.log('📦 Zadania załadowane lokalnie (offline)');
      }
    } catch (e) {
      console.log('❌ Błąd ładowania z AsyncStorage', e);
    }
  }

  // 2. Funkcja pobierania zadań z Supabase oraz zapisywania ich lokalnie
  async function fetchTasks(userId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('creator_id', userId);

    if (error) {
      console.log('Błąd Pobierania z BD', error.message);
    } else {
      setTasks([...data]);
      // Zapisz pobrane dane do AsyncStorage jako lokalny cache
      await AsyncStorage.setItem('local-tasks', JSON.stringify(data));
      console.log('📝 Zadania zapisane lokalnie');
    }
  }

  // Przy starcie, jeśli brak sesji – spróbuj załadować dane offline
  useEffect(() => {
    if (!session?.user) {
      loadOfflineTasks();
    }
  }, []);

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

      // Subskrypcja zmian w tabeli 'tasks'
      const channel = supabase
        .channel('tasks_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks' },
          (payload) => {
            console.log('1 Zmiana w produktach wykryta:', payload);
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

  async function toggleDoneHandler(id, isDone) {
    const netState = await NetInfo.fetch();

    if (!netState.isConnected) {
      setTasks((prev) => {
        const updatedTasks = prev.map((task) =>
          task.id === id ? { ...task, is_done: !isDone } : task,
        );
        AsyncStorage.setItem('local-tasks', JSON.stringify(updatedTasks));
        return updatedTasks;
      });

      const newUpdate = { id, newValue: !isDone };

      setOfflineQueue((prevQueue) => {
        const newQueue = [...prevQueue, newUpdate];
        AsyncStorage.setItem('offline-queue', JSON.stringify(newQueue));
        Alert.alert(
          'Offline',
          'Zmiana została zapisana lokalnie. Zostanie zsynchronizowana, gdy wróci internet.',
        );
        return newQueue;
      });
      return;
    }

    const { error } = await supabase
      .from('tasks')
      .update({ is_done: !isDone })
      .eq('id', id);

    if (error) {
      Alert.alert('Błąd aktualizacji', error.message);
    } else {
      setTasks((prev) => {
        const updatedTasks = prev.map((task) =>
          task.id === id ? { ...task, is_done: !isDone } : task,
        );
        AsyncStorage.setItem('local-tasks', JSON.stringify(updatedTasks));
        return updatedTasks;
      });
    }
  }

  async function syncOfflineQueue() {
    const storedQueue = await AsyncStorage.getItem('offline-queue');
    let updates = storedQueue ? JSON.parse(storedQueue) : offlineQueue;

    if (updates.length === 0) return;

    for (const update of updates) {
      const { id, newValue } = update;
      const { error } = await supabase
        .from('tasks')
        .update({ is_done: newValue })
        .eq('id', id);

      if (error) {
        console.log('Błąd synchronizacji dla tasku', id, ':', error.message);
      }
    }

    setOfflineQueue([]);
    await AsyncStorage.removeItem('offline-queue');

    if (session && session.user) {
      fetchTasks(session.user.id);
    }
  }

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        syncOfflineQueue();
      }
    });

    return () => unsubscribeNetInfo();
  }, [offlineQueue, session]);

  async function removeTaskHandler(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      Alert.alert('Błąd Usuwania', error.message);
    } else {
      setTasks((prev) => {
        const updatedTasks = prev.filter((task) => task.id !== id);
        AsyncStorage.setItem('local-tasks', JSON.stringify(updatedTasks));
        return updatedTasks;
      });
    }
  }

  const uniquePlaces = [...new Set(tasks.map((p) => p.place))];

  const filteredTasks = tasks.filter((task) => {
    const matchesPlace = placeFilter ? task.place === placeFilter : true;
    const matchesDate = dateFilter
      ? new Date(task.date).toDateString() === dateFilter.toDateString()
      : true;
    return matchesPlace && matchesDate;
  });

  filteredTasks.sort((a, b) => {
    if (a.is_done !== b.is_done) {
      return a.is_done - b.is_done;
    }
    return new Date(a.date) - new Date(b.date);
  });

  const isFiltered = !!dateFilter || !!placeFilter;
  const nothingToShow = isFiltered
    ? 'Brak wyników dla wybranych filtrów.'
    : 'Nie masz jeszcze żadnych zadań.';

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Lista Zadań' }} />
      <View style={[styles.container, { paddingTop: dynamicPaddingTop }]}>
        <View style={styles.wrapper}>
          <View style={styles.filterRow}>
            <View style={styles.filterResult}>
              <Text style={styles.h2}>
                {dateFilter ? dateFilterLabel : 'Wybierz datę'}
              </Text>
              {dateFilter && (
                <TouchableOpacity
                  onPress={() => {
                    setDateFilter(null);
                    setDateFilterLabel('Wybierz datę');
                  }}
                >
                  <FontAwesome
                    name="times-circle-o"
                    style={styles.clearFilter}
                  />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.filterIcon}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="date-range" size={24} color={colors.gray800} />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={dateFilter || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setDateFilter(selectedDate);
                  setDateFilterLabel(
                    selectedDate
                      .toLocaleDateString('pl-PL')
                      .replace(/\./g, '/'),
                  );
                }
              }}
            />
          )}

          <View style={styles.filterRow}>
            <View style={[styles.filterResult, {flex: 1, justifyContent: 'space-between'}]}>
              <Text
                style={styles.h2}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {placeFilter ? placeFilter : 'Wybierz miejsce'}
              </Text>
              {placeFilter && (
                <TouchableOpacity onPress={() => setPlaceFilter('')}>
                  <FontAwesome
                    name="times-circle-o"
                    style={styles.clearFilter}
                  />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={
                filterVisible ? styles.activeFilterIcon : styles.filterIcon
              }
              onPress={() => setFilterVisible(!filterVisible)}
            >
              <MaterialIcons
                name="place"
                size={24}
                color={filterVisible ? colors.blue700 : colors.gray800}
              />
            </TouchableOpacity>
          </View>
          {filterVisible && (
            <View style={styles.filterBox}>
              {uniquePlaces.map((place, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.filterButton}
                  onPress={() => setPlaceFilter(place)}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginLeft: 6,
                    }}
                  >
                    <MaterialIcons
                      name={
                        placeFilter === place
                          ? 'radio-button-checked'
                          : 'radio-button-unchecked'
                      }
                      size={20}
                      color={placeFilter === place ? colors.blue700 : colors.gray800}
                    />
                    <Text
                      style={[
                        styles.filterText,
                        placeFilter === place && styles.activeFilterText,
                      ]}
                    >
                      {place}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {filteredTasks.length === 0 ? (
            <View style={{ paddingTop: 20, alignItems: 'center' }}>
              <Text
                style={{
                  color: colors.gray800,
                  fontSize: 18,
                  textAlign: 'center',
                  fontWeight: '800',
                }}
              >
                {isFiltered
                  ? 'Nie masz żadnych zadań dla tych filtrów. Zmodyfikuj je, aby otrzymać listę zadań.'
                  : 'Nie masz jeszcze żadnych zadań. Dodaj zadania i wróc do listy.'}
              </Text>
            </View>
          ) : (
            <SectionList
              sections={[{ title: 'Lista Zadań', data: filteredTasks }]}
              keyExtractor={(item) => item.id.toString()}
              style={{
                backgroundColor: colors.blue100,
                flex: 1,
                borderRadius: 28,
                paddingHorizontal: 12,
                marginTop: 4,
                elevation: 2,
              }}
              contentContainerStyle={{ gap: 12, paddingVertical: 4 }}
              ListEmptyComponent={
                <View style={{ paddingVertical: 0, alignItems: 'flex-start' }}>
                  <Text
                    style={{ color: 'gray', fontSize: 16, textAlign: 'center' }}
                  >
                    📭 {nothingToShow}
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={item.is_done ? styles.itemDone : styles.item}>
                  <TouchableOpacity
                    onPress={() => toggleDoneHandler(item.id, item.is_done)}
                    style={styles.itemRow}
                  >
                    {item.is_done ? (
                      <FontAwesome
                        name="check-square"
                        size={24}
                        color={colors.green500}
                        style={styles.itemIcon}
                      />
                    ) : (
                      <FontAwesome
                        name="square-o"
                        size={24}
                        color={colors.gray600}
                        style={styles.itemIcon}
                      />
                    )}
                    <Text
                      style={[styles.itemText, item.is_done && styles.done]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 12,
                      alignItems: 'center',
                      minWidth: 40,
                      paddingLeft: 8,
                    }}
                  >
                    <Link href={`/(tabs)/szczegoly/${item.id}`} asChild>
                      <TouchableOpacity>
                        <MaterialIcons
                          name="info-outline"
                          size={22}
                          color={item.is_done ? colors.blue300 : colors.blue500}
                        />
                      </TouchableOpacity>
                    </Link>
                    <TouchableOpacity
                      onPress={() => removeTaskHandler(item.id)}
                    >
                      <MaterialIcons
                        name="delete"
                        size={24}
                        color={item.is_done ? colors.red300 : colors.red500}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              renderSectionHeader={() => null}
            />
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingHorizontal: '2%',
    backgroundColor: colors.gray000,
    width: '100%',
    maxWidth: 600,
    paddingVertical: '4%',
  },
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: '3%',
    color: '#666',
    alignSelf: 'center',
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: '3%',
    color: colors.gray800,
    flexShrink: 1, 
    justifyContent: 'flex-start'
  },
  container: {
    flex: 1,
    backgroundColor: colors.gray000,
    paddingHorizontal: '4%',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  filterIcon: {
    paddingRight: 8,
    marginRight: 6,
    paddingBottom: 8,
    padding: 10,
    borderRadius: 8,
  },
  activeFilterIcon: {
    paddingRight: 8,
    marginRight: 6,
    paddingBottom: 8,
    padding: 10,
    color: colors.blue700,
  },
  filterBox: {
    padding: 8,
    borderRadius: 16,
    marginVertical: 12,
    borderWidth: 3,
    borderColor: colors.blue700,
  },
  filterButton: {
    paddingVertical: 10,
  },
  filterText: {
    fontSize: 16,
    paddingLeft: 8,
    color: colors.gray600,
    fontWeight: '500',
  },
  activeFilterText: {
    color: colors.gray800,
    fontWeight: '800',
    fontSize: 18,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    backgroundColor: colors.gray000,
    paddingTop: 24,
    paddingLeft: '2%',
    paddingBottom: 8,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 12,
    alignItems: 'center',
    backgroundColor: colors.gray000,
    elevation: 2,
    shadowColor: colors.gray800,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    borderRadius: 24,
  },
  itemDone: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 12,
    alignItems: 'center',
    backgroundColor: colors.gray000,
    elevation: 1,
    shadowColor: colors.gray800,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    borderRadius: 24,
    opacity: 40,
  },
  itemText: {
    fontSize: 16,
    color: colors.gray600,
    paddingBottom: 2,
    flex: 1,
    flexShrink: 1,
    paddingRight: 0,
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  itemIcon: {
    marginRight: 8,
  },
  iconDone: {
    opacity: 40,
  },
  done: {
    textDecorationLine: 'line-through',
    color: colors.gray400,
  },
  clearFilter: {
    fontSize: 22,
    padding: 1,
    marginTop: 2,
    marginLeft: 4,
    color: colors.gray600,
  },
  filterResult: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});