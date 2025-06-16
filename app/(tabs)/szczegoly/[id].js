import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  useLocalSearchParams,
  Link,
  useNavigation,
  useRouter,
} from 'expo-router';
import supabase from '../../../lib/supabase-client';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const navigation = useNavigation();
  const router = useRouter();
  const [product, setProduct] = useState(null);

  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
      } else {
        Alert.alert('Error accessing User data');
      }
    });
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => null,
    });
  }, [navigation]);

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            router.push('/(tabs)/szczegoly');
          }}
          style={styles.headerButton}
        >
          <FontAwesome
            size={20}
            style={{ marginBottom: 0 }}
            name="chevron-left"
            color={'#2196F3'}
          />
          <Text
            style={{
              color: '#2196F3',
              fontSize: 20,
              fontWeight: '600',
              paddingBottom: 4,
            }}
          >
            Szczegóły
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, router]);

  useEffect(() => {
    console.log('Otrzymane id z URL:', id);
    console.log('Pobieram produkt o id:', id);

    async function fetchProductDetails() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Błąd pobierania produktu:', error);
        } else {
          console.log('Pobrane dane produktu:', data);
          setProduct(data);
        }
      } catch (err) {
        console.error('Wyjątek w fetchProductDetails:', err);
      }
    }

    if (id) fetchProductDetails();
  }, [id]);

  if (!product) {
    return <Text>Ładowanie danych...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{product.name}</Text>
      <Text style={styles.subtitle}>
        Termin zadania: {new Date(product.date).toLocaleDateString('pl-PL').replace(/\./g, '/')}
      </Text>
      <Text style={styles.subtitle}>Miejsce zadania: {product.place}</Text>
      <Text style={styles.subtitle}>Dodał: {user?.email}</Text>
      <Text style={styles.subtitle}>Data dodania: {new Date(product.created_at).toLocaleDateString('pl-PL').replace(/\./g, '/')}</Text>
      <Link href={`/(tabs)/lista`} asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Przejdź do Listy Zadań</Text>
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
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 700,
    color: '#2196F3',
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
    alignItems: 'center',
    gap: 4,
  },
  headerButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 500,
  },
});
