import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, SectionList, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useRouter, Link, Stack } from 'expo-router';
import supabase from '../../../lib/supabase-client';
import { MaterialIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [session, setSession] = useState(null); // 🔥 Store session

  const screenWidth = Dimensions.get('window').width;
  const dynamicPaddingTop = screenWidth > 600 ? 0 : '20%';

  const router = useRouter();

  const [ user, setUser ] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser (user)
      } else {
        Alert.alert("Error accessing User data");
      }
    });
  }, []);  

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

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Szczegóły Produktów"}}/>
      <View style={[styles.container, { paddingTop: dynamicPaddingTop }]}>
        <View style={styles.wrapper}>
          <View style={styles.titleContainer}>
            <Text style={styles.h1}>Twoje produkty</Text>
          </View>
          
          <SectionList
            sections={[{ title: 'Lista Zakupów', data: products }]}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View style={{ flex: 1, paddingRight: 10, flexDirection: 'column', gap: 16 }}>
                  <Link href={`/(tabs)/listaa/${item.id}`} asChild>
                    <TouchableOpacity>
                      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}> 
                        <Text
                          style={styles.itemName}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.name}
                        </Text>
                        <MaterialIcons name="info-outline" size={24} color="#2196F3" style={{marginBottom: 6}}/>
                      </View> 
                      <Text
                        style={styles.itemText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        Cena:  {item.price.toFixed(2).replace('.', ',')} zł
                      </Text>
                      <Text
                        style={styles.itemText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        Sklep:  {item.store}
                      </Text>
                      <Text
                        style={styles.itemText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        Dodał:  {user?.email}
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
    paddingVertical: 20,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 0,
  },
  itemName: { 
    fontSize: 20,
    fontWeight: 600, 
    paddingBottom: 8,
  },
  itemText: { 
    fontSize: 14,
    paddingVertical: 2, 
  },
});
