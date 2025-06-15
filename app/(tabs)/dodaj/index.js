import { useState } from 'react';
import supabase from '../../../lib/supabase-client';
import { Stack } from 'expo-router';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Alert,
} from 'react-native';

export default function App() {
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productPlace, setProductPlace] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOneFocused, setOneFocused] = useState(false);
  const [isTwoFocused, setTwoFocused] = useState(false);
  const [isThreeFocused, setThreeFocused] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const dynamicPaddingTop = screenWidth > 600 ? 0 : '20%';

  async function handleAddProduct() {
    if (!productName || !productPrice || !productPlace) {
      setError('Uzupełnij wszystkie pola przed dodaniem produktu!');
      return;
    }

    Keyboard.dismiss();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      Alert.alert('Błąd', 'Nie można pobrać użytkownika.');
      return;
    }

    const formattedPrice = parseFloat(productPrice.replace(',', '.')).toFixed(
      2,
    );
    const newProduct = {
      name: productName,
      price: Number(formattedPrice),
      place: productPlace,
      creator_id: session.user.id,
    };

    const { error } = await supabase.from('products').insert([newProduct]);

    if (error) {
      Alert.alert('Błąd', error.message);
    } else {
      setProductName('');
      setProductPrice('');
      setProductPlace('');
      setError('');
      Alert.alert('Sukces', 'Produkt dodany do listy!');
    }
  }

  return (
    <>
      <Stack.Screen
        options={{ headerShown: true, title: 'Dodawanie Zadań' }}
      />
      <View style={[styles.container, { paddingTop: dynamicPaddingTop }]}>
        <Text type="title" style={styles.h2}>
          Dodaj nowe zadanie
        </Text>
        <View style={styles.wrapper}>
          <TextInput
            placeholder="Nazwa produktu"
            placeholderTextColor="gray"
            value={productName}
            onChangeText={setProductName}
            style={[
              styles.input,
              { borderColor: isOneFocused ? '#2196F3' : '#D8E0E2' },
            ]}
            autoCapitalize="none"
            onFocus={() => setOneFocused(true)}
            onBlur={() => setOneFocused(false)}
          />
          <TextInput
            placeholder="Cena"
            placeholderTextColor="gray"
            value={productPrice}
            onChangeText={setProductPrice}
            style={[
              styles.input,
              { borderColor: isTwoFocused ? '#2196F3' : '#D8E0E2' },
            ]}
            keyboardType="numeric"
            onFocus={() => setTwoFocused(true)}
            onBlur={() => setTwoFocused(false)}
          />
          <TextInput
            placeholder="Miejsce Zadania"
            placeholderTextColor="gray"
            value={productPlace}
            onChangeText={setProductPlace}
            style={[
              styles.input,
              { borderColor: isThreeFocused ? '#2196F3' : '#D8E0E2' },
            ]}
            autoCapitalize="none"
            onFocus={() => setThreeFocused(true)}
            onBlur={() => setThreeFocused(false)}
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleAddProduct}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Dodawanie...' : 'Dodaj Produkt'}
            </Text>
          </TouchableOpacity>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: '4%',
    paddingTop: 100,
    alignItems: 'center',
    marginTop: -40,
  },
  wrapper: {
    flex: 1,
    paddingHorizontal: '4%',
    paddingVertical: '4%',
    backgroundColor: 'white',
    width: '100%',
    maxWidth: 600,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: '2%',
    color: '#666',
    alignSelf: 'left',
    paddingLeft: 12,
  },
  input: {
    borderWidth: 2,
    padding: 16,
    marginVertical: 4,
    borderRadius: 24,
    color: 'black',
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    borderRadius: 36,
    backgroundColor: '#2196F3',
    paddingHorizontal: 38,
    paddingVertical: 14,
    marginTop: 8,
    alignItems: 'center',
    maxWidth: '70%',
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 700,
  },
  error: {
    color: 'red',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
});
