import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, Link, useNavigation, useRouter } from 'expo-router';
import supabase  from '../../../lib/supabase-client'; // 🔥 Import Supabase
import { useEffect, useState } from 'react';
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams(); // 🔥 Pobranie ID z URL
  const navigation = useNavigation();
  const router = useRouter();
  const [product, setProduct] = useState(null);

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

    // Ustawiamy headerRight tylko na ekranie pojedynczego produktu
  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            // Nawigujemy do ekranu ze wszystkimi szczegółami produktów
            router.push('/(tabs)/listaa');
          }}
          style={styles.headerButton}
        >
          <FontAwesome
            size={20}
            style={{marginBottom: 0}}
            name="chevron-left"
            color={'#2196F3'}
          />
          {/*<Text style={styles.headerButtonText}>Szczegóły</Text>*/}
        </TouchableOpacity>
      ),
    });
  }, [navigation, router]);

useEffect(() => {
  console.log("Otrzymane id z URL:", id);
  console.log("Pobieram produkt o id:", id);

  async function fetchProductDetails() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error("Błąd pobierania produktu:", error);
      } else {
        console.log("Pobrane dane produktu:", data);
        setProduct(data);
      }
    } catch (err) {
      console.error("Wyjątek w fetchProductDetails:", err);
    }
  }

  if (id) fetchProductDetails();
}, [id]);

  useEffect(() => {
  if (product) {
    navigation.setOptions({
      title: `${product.name}`, 
      headerTitleAlign: 'center',  // ✅ Najprostszy sposób na iOS + może działać na Androidzie
      headerTitleContainerStyle: {
        flex: 1,                   // ✅ Powoduje automatyczne wyśrodkowanie na Androidzie
        alignItems: 'center',       // ✅ Zapewnia, że cały kontener jest wyśrodkowany
        
      },
      headerTitleStyle: {
        textAlign: 'center',        // ✅ Wymusza wyśrodkowanie tekstu
        fontWeight: 'bold',         // 🔹 Opcjonalnie: pogrubienie dla lepszej czytelności
      },
    });
  }
}, [product, navigation]);

  if (!product) {
    return <Text>Ładowanie danych...</Text>;
  }

  return (
      <View style={styles.container}>
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.subtitle}>Cena: {product.price.toFixed(2).replace('.', ',')} zł</Text>
        <Text style={styles.subtitle}>Sklep: {product.store}</Text>
        <Text style={styles.subtitle}>Dodał: {user?.email}</Text>
        <Link href={`/(tabs)/lista`} asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Przejdź do Listy Zakupów</Text>
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
    gap: 10
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold',
    marginBottom: 4 
  },
  subtitle: { 
    fontSize: 16
  },
  buttonText: { 
    fontSize: 20,
    fontWeight: 700,
    color: '#2196F3'
  },
  button: {
    flexDirection: 'row', 
    paddingVertical: 14, 
    paddingHorizontal: 38, 
    borderRadius: 36, 
    gap: 8,
    marginTop: 20,
    alignSelf: 'center',
    alignItems: 'center',
    marginRight: '6%',
  },
  headerButton: {
    marginRight: 120,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  headerButtonText: {
    color: '#2196F3', 
    fontSize: 16,
    fontWeight: 500,
  },
});
