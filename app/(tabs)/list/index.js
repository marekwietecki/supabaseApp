import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SectionList, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useRouter, Link, Stack } from 'expo-router';
import supabase from '../../../lib/supabase-client';
import { MaterialIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const [storeFilter, setStoreFilter] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [products, setProducts] = useState([]);
  const [session, setSession] = useState(null); // 🔥 Store session

  const screenWidth = Dimensions.get('window').width;
  const dynamicPaddingTop = screenWidth > 600 ? 0 : '20%';

  const router = useRouter();

  // 🔥 Global fetchProducts function
  async function fetchProducts(userId) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('creator_id', userId);

    if (error) {
      Alert.alert("Błąd Pobierania z BD", error.message);
    } else {
      setProducts(data);
    }
  }

  // 🔥 Monitor authentication state
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        Alert.alert("Błąd", "Nie jesteś zalogowany.");
      } else {
        console.log("Sesja aktywna:", session.user);
        setSession(session); // Save session
        fetchProducts(session.user.id); // Fetch user-specific products
      }
    });

    return () => {
      console.log("Cleaning up session listener");
    };
  }, []);

  // 🔄 Fetch products & enable realtime updates
  useEffect(() => {
    if (session?.user) {
      fetchProducts(session.user.id);

      // 🔥 Realtime updates
      const channel = supabase
        .channel('products_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
          console.log("Zmiana w produktach wykryta:", payload);
          fetchProducts(session.user.id);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel); // ✅ Proper cleanup
      };
    }
  }, [session]);

  // ✅ Kup produkt
  async function toggleBoughtHandler(id, isPurchased) {
    const { error } = await supabase
      .from('products')
      .update({ is_purchased: !isPurchased })
      .eq('id', id);

    if (error) {
      Alert.alert("Błąd Kupowania", error.message);
    } else {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id ? { ...product, is_purchased: !isPurchased } : product
        )
      );
    }
  }

  // ❌ Usuń produkt
  async function removeProductHandler(id) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      Alert.alert("Błąd Usuwania", error.message);
    } else {
      setProducts((prev) => prev.filter((product) => product.id !== id));
    }
  }

  const uniqueStores = [...new Set(products.map((p) => p.store))];

  const filteredProducts = storeFilter
    ? products.filter((product) => product.store === storeFilter)
    : products;


  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Lista Zakupów"}}/>
      <View style={[styles.container, { paddingTop: dynamicPaddingTop }]}>
        <View style={styles.wrapper}>
          <View style={styles.titleContainer}>
            <Text style={styles.h1}>Twoja lista zakupów</Text>
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
                onPress={() => setStoreFilter('')}
              >
                <Text
                  style={[
                    styles.filterText,
                    storeFilter === '' && styles.activeFilterText,
                  ]}
                >
                  Pokaż wszystkie
                </Text>
              </TouchableOpacity>

              {uniqueStores.map((store, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.filterButton}
                  onPress={() => setStoreFilter(store)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      storeFilter === store && styles.activeFilterText,
                    ]}
                  >
                    {store}
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
                <View style={{ flex: 1, paddingRight: 10, flexDirection: 'row', gap: 16 }}>
                  <TouchableOpacity onPress={() => toggleBoughtHandler(item.id, item.is_purchased)}>
                    <Text
                      style={[styles.itemText, item.is_purchased && styles.bought]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 16 }}>
                  <Link href={`/(tabs)/details?id=${item.id}`} asChild>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialIcons name="info-outline" size={22} color="#2196F3" />
                    </TouchableOpacity>
                  </Link>
                  <TouchableOpacity onPress={() => removeProductHandler(item.id)}>
                    <MaterialIcons name="close" size={24} color="#dc2020" />
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
    paddingRight: 8, paddingBottom: 8 
  },
  filterBox: {
    backgroundColor: 'blue',
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
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  itemText: { 
    fontSize: 16 
  },
  bought: { 
    textDecorationLine: 'line-through',
    color: 'gray' 
  },
});
