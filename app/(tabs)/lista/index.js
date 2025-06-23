import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SectionList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Link, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import supabase from '../../../lib/supabase-client';
import { MaterialIcons } from '@expo/vector-icons';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../../../utils/colors'
import { useTasks } from '../../../contexts/TasksContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function ListScreen() {
  const { tasks, fetchTasks, toggleDoneHandler, removeTaskHandler } = useTasks();
  const { session, user } = useAuth();

  const [placeFilter, setPlaceFilter] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [dateFilter, setDateFilter] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateFilterLabel, setDateFilterLabel] = useState('Wybierz datę');

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
    if (user) {
      fetchTasks(user.id);

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
          <View style={[styles.filterResult, { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
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
                    style={[styles.clearFilter, { marginLeft: 6 }]}
                  />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={filterVisible ? styles.activeFilterIcon : styles.filterIcon}
              onPress={() => setFilterVisible(!filterVisible)}
            >
              <MaterialIcons
                name="place"
                size={24}
                color={filterVisible ? colors.blue700 : colors.gray800}
              />
            </TouchableOpacity>

          </View>
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