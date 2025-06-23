import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SectionList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Link, Stack } from 'expo-router';
import supabase from '../../../lib/supabase-client';
import { MaterialIcons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { colors } from '../../../utils/colors';
import { useTasks } from '../../../contexts/TasksContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function TaskDetailsScreen() {
  const { tasks, fetchTasks } = useTasks();
  const { user } = useAuth(); // ⬅️ tylko user z contextu
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
    if (user) {
      fetchTasks(user.id);

      const channel = supabase
        .channel('tasks_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks' },
          (payload) => {
            console.log('2 Zmiana w taskach wykryta:', payload);
            fetchTasks(user.id);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  });

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
                          color={colors.blue500}
                          style={{ marginBottom: 6 }}
                        />
                      </View>
                      <Text
                        style={[
                          styles.itemText,
                          { color: item.is_done ? colors.green500 : colors.red500 }
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
              <Text style={{ color: colors.gray800, fontWeight: '800', fontSize: 16 }}>
                🔌 Brak połączenia z internetem
              </Text>
              <Text style={{ color: colors.gray800, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
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
    backgroundColor: colors.gray000,
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
    backgroundColor: colors.gray000,
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
    backgroundColor: colors.gray000, 
    borderRadius: 24, 
    elevation: 5, 
    shadowColor: colors.gray800, 
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
    color: colors.gray200,
  },
});