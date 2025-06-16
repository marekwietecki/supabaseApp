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

export default function HomeScreen() {
  const [placeFilter, setPlaceFilter] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [products, setProducts] = useState([]);
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

  async function fetchProducts(userId) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('creator_id', userId);

    if (error) {
      Alert.alert('Błąd Pobierania z BD', error.message);
    } else {
      setProducts([...data]);
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
          fetchProducts(session.user.id);
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
      fetchProducts(session.user.id);

      const channel = supabase
        .channel('products_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          (payload) => {
            console.log('1 Zmiana w produktach wykryta:', payload);
            fetchProducts(session.user.id);
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
        fetchProducts(session.user.id);
      }
      return () => {};
    }, [session]),
  );

  async function toggleBoughtHandler(id, isDone) {
    const { error } = await supabase
      .from('products')
      .update({ is_done: !isDone })
      .eq('id', id);

    if (error) {
      Alert.alert('Błąd Kupowania', error.message);
    } else {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id
            ? { ...product, is_done: !isDone }
            : product,
        ),
      );
    }
  }

  async function removeProductHandler(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      Alert.alert('Błąd Usuwania', error.message);
    } else {
      setProducts((prev) => prev.filter((product) => product.id !== id));
    }
  }

  const uniquePlaces = [...new Set(products.map((p) => p.place))];

  const filteredProducts = placeFilter
    ? products.filter((product) => product.place === placeFilter)
    : products;

  filteredProducts.sort((a, b) => a.is_done - b.is_done);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Lista Zadań' }} />
      <View style={[styles.container, { paddingTop: dynamicPaddingTop }]}>
        <View style={styles.wrapper}>
          <View style={styles.titleContainer}>
            <Text style={styles.h1}>Twoja lista zadań</Text>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.h2}>Filtruj</Text>
            <TouchableOpacity
              style={styles.filterIcon}
              onPress={() => setFilterVisible(!filterVisible)}
            >
              <MaterialIcons name="filter-list" size={24} color="#444444" />
            </TouchableOpacity>
          </View>
          {filterVisible && (
            <View style={styles.filterBox}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setPlaceFilter('')}
              >
                <Text
                  style={[
                    styles.filterText,
                    placeFilter === '' && styles.activeFilterText,
                  ]}
                >
                  Wszystkie Miejsca
                </Text>
              </TouchableOpacity>

              {uniquePlaces.map((place, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.filterButton}
                  onPress={() => setPlaceFilter(place)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      placeFilter === place && styles.activeFilterText,
                    ]}
                  >
                    {place}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <SectionList
            sections={[{ title: 'Lista Zakupów', data: filteredProducts }]}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <TouchableOpacity
                  onPress={() =>
                    toggleBoughtHandler(item.id, item.is_done)
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
                      item.is_done && styles.bought,
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
                    onPress={() => removeProductHandler(item.id)}
                  >
                    <MaterialIcons name="close" size={28} color="#dc2020" />
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
    paddingHorizontal: '4%',
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
    marginBottom: 10,
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
    marginTop: 20,
  },
  filterIcon: {
    paddingRight: 8,
    paddingBottom: 8,
  },
  filterBox: {
    backgroundColor: '#EAF5FD',
    padding: 8,
    borderRadius: 16,
    marginVertical: 12,
  },
  filterButton: {
    paddingVertical: 10,
  },
  filterText: {
    fontSize: 16,
    paddingLeft: 8,
    color: 'gray',
  },
  activeFilterText: {
    color: '#222',
    fontWeight: 'bold',
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
  bought: {
    textDecorationLine: 'line-through',
    color: '#BBBBBB',
  },
});
