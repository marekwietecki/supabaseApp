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
import { useFocusEffect } from '@react-navigation/native';
import supabase from '../../../lib/supabase-client';
import { MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function HomeScreen() {
  const [placeFilter, setPlaceFilter] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [dateFilter, setDateFilter] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateFilterLabel, setDateFilterLabel] = useState('Wybierz datę');

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
    const { error } = await supabase
      .from('products')
      .update({ is_done: !isDone })
      .eq('id', id);

    if (error) {
      Alert.alert('Błąd Kupowania', error.message);
    } else {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id
            ? { ...task, is_done: !isDone }
            : task,
        ),
      );
    }
  }

  async function removeTaskHandler(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      Alert.alert('Błąd Usuwania', error.message);
    } else {
      setTasks((prev) => prev.filter((task) => task.id !== id));
    }
  }

  const uniquePlaces = [...new Set(tasks.map((p) => p.place))];

  const filteredTasks = tasks.filter((task) => {
    const matchesPlace = placeFilter ? task.place === placeFilter : true;
    const matchesDate = dateFilter ? new Date(task.date).toDateString() === dateFilter.toDateString() : true;
    return matchesPlace && matchesDate;
  });

  filteredTasks.sort((a, b) => {
    // Najpierw porównujemy status wykonania. Zakładamy, że false (0) oznacza niewykonane,
    // a true (1) – wykonane. Dzięki temu niewykonane zadania będą wyświetlone jako pierwsze.
    if (a.is_done !== b.is_done) {
      return a.is_done - b.is_done;
    }
    // Jeżeli oba zadania mają ten sam status, sortujemy je według daty.
    // Tworzymy obiekty Date na podstawie a.date i b.date,
    // a następnie odejmujemy je, co spowoduje sortowanie od najstarszych do najnowszych.
    return new Date(a.date) - new Date(b.date);
  });

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Lista Zadań' }} />
      <View style={[styles.container, { paddingTop: dynamicPaddingTop }]}>
        <View style={styles.wrapper}>
          <View style={styles.titleContainer}>
            <Text style={styles.h1}>Twoja lista zadań</Text>
          </View>

          <View style={styles.filterRow}>
            <View style={styles.filterResult}>  
              <Text style={styles.h2}>{dateFilter ? "Data: " + dateFilterLabel : "Wybierz datę"}</Text>
              {dateFilter && (
                <TouchableOpacity
                  onPress={() => {
                    setDateFilter(null);
                    setDateFilterLabel('Wybierz datę');
                  }}
                >
                  <FontAwesome name="times-circle-o" style={styles.clearFilter} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.filterIcon}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="date-range" size={24} color="#444444" />
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
                  setDateFilterLabel(selectedDate.toLocaleDateString('pl-PL').replace(/\./g, '/'));
                }
              }}
            />
          )}

          <View style={styles.filterRow}>
            <View style={styles.filterResult}>  
              <Text style={styles.h2}>{placeFilter ? "Miejsce: " + placeFilter : 'Wybierz miejsce'}</Text>
              {placeFilter && (
                <TouchableOpacity
                  onPress={() => setPlaceFilter('')}
                >
                  <FontAwesome name="times-circle-o" style={styles.clearFilter} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={filterVisible ? styles.activeFilterIcon : styles.filterIcon}
              onPress={() => setFilterVisible(!filterVisible)}
            >
              <MaterialIcons name="filter-list" size={24} color={filterVisible ? "#1C73B4" : "#444444"} />
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6, }}>
                        <MaterialIcons
                          name={placeFilter === place ? "radio-button-checked" : "radio-button-unchecked"}
                          size={20}
                          color={placeFilter === place ? "#1C73B4" : "#444444"}
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
          <SectionList
            sections={[{ title: 'Lista Zakupów', data: filteredTasks }]}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <TouchableOpacity
                  onPress={() =>
                    toggleDoneHandler(item.id, item.is_done)
                  }
                  style={styles.itemRow}
                >
                  {item.is_done ? (
                    <FontAwesome
                      name="check-square"
                      size={24}
                      color="green"
                      style={styles.itemIcon}
                    />
                  ) : (
                    <FontAwesome
                      name="square-o"
                      size={24}
                      color="gray"
                      style={styles.itemIcon}
                    />
                  )}
                  <Text
                    style={[
                      styles.itemText,
                      item.is_done && styles.done,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 16,
                    alignItems: 'center',
                    gap: 16,
                    minWidth: 40,
                    paddingLeft: 8,
                  }}
                >
                  <Link href={`/(tabs)/szczegoly/${item.id}`} asChild>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <MaterialIcons
                        name="info-outline"
                        size={24}
                        color="#2196F3"
                      />
                    </TouchableOpacity>
                  </Link>
                  <TouchableOpacity
                    onPress={() => removeTaskHandler(item.id)}
                  >
                    <MaterialIcons name="delete" size={28} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            renderSectionHeader={() => null}
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
    marginBottom: '6%',
  },
  wrapper: {
    flex: 1,
    paddingHorizontal: '3%',
    backgroundColor: 'white',
    width: '100%',
    maxWidth: 600,
  },
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: '2%',
    color: '#666',
    alignSelf: 'center',
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
    marginLeft: '2%',
    color: '#666',
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
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
    paddingBottom: 8,
    padding: 10,
    backgroundColor: '#C9E3F6',
    borderRadius: 8,
  },
  activeFilterIcon: {
    paddingRight: 8,
    paddingBottom: 8,
    padding: 10,
    color: '#1C73B4',
  },
  filterBox: {
    padding: 8,
    borderRadius: 16,
    marginVertical: 12,
    borderWidth: 3,
    borderColor: '#1C73B4',
  },
  filterButton: {
    paddingVertical: 10,
  },
  filterText: {
    fontSize: 16,
    paddingLeft: 8,
    color: 'gray',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#222',
    fontWeight: '800',
    fontSize: 18,
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
    padding: 20,
    paddingHorizontal: 7,
    borderBottomWidth: 1,
    borderColor: '#E6E6E9',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 20,
    color: '#555555',
    paddingBottom: 3,
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
  done: {
    textDecorationLine: 'line-through',
    color: '#BBBBBB',
  },
  clearFilter: {
    fontSize: 22,
    padding: 1,
    marginTop: 2,
    marginLeft:4,
    color: '#666'
  },
  filterResult: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
