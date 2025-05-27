import { useState } from 'react';
import supabase from '../../../lib/supabase-client';
import { Stack } from 'expo-router';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, TextInput, Keyboard, Alert } from 'react-native';

export default function App() {
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStore, setProductStore] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const screenWidth = Dimensions.get('window').width;
  const dynamicPaddingTop = screenWidth > 600 ? 0 : '20%';

  async function handleAddProduct() {
  if (!productName || !productPrice || !productStore) {
    setError('Uzupełnij wszystkie pola przed dodaniem produktu!');
    return;
  }

  Keyboard.dismiss();

  // Pobierz aktualną sesję użytkownika
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user) {
    Alert.alert("Błąd", "Nie można pobrać użytkownika.");
    return;
  }

  const formattedPrice = parseFloat(productPrice.replace(',', '.')).toFixed(2); // 🔥 Zamienia przecinek na kropkę + wymusza precyzję
  const newProduct = {
    name: productName,
    price: Number(formattedPrice), // 🔥 Teraz zapisuje się poprawnie
    store: productStore,
    creator_id: session.user.id,
  };

  const { error } = await supabase.from('products').insert([newProduct]);

  if (error) {
    Alert.alert("Błąd", error.message);
  } else {
    setProductName('');
    setProductPrice('');
    setProductStore('');
    setError('');
    Alert.alert("Sukces", "Produkt dodany do listy!");
  }
}
  
  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: "Dodawanie Produktów"}}/>
      <View style={[styles.container, { paddingTop: dynamicPaddingTop }]}>
        <Text type="title" style={styles.h2}>Dodaj produkt do listy</Text>
        <View style={styles.wrapper}>
          <TextInput
            placeholder="Nazwa produktu"
            placeholderTextColor="gray"
            value={productName}
            onChangeText={setProductName}
            style={styles.input}
          />
          <TextInput
            placeholder="Cena"
            placeholderTextColor="gray"
            value={productPrice}
            onChangeText={setProductPrice}
            style={styles.input}
            keyboardType="numeric"
          />
          <TextInput
            placeholder="Sklep"
            placeholderTextColor="gray"
            value={productStore}
            onChangeText={setProductStore}
            style={styles.input}
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
    borderWidth: 1,
    padding: 16,
    marginVertical: 4,
    borderRadius: 20,
    color: 'black',
  },
  button: {
    borderRadius: 24,
    backgroundColor: '#2497D5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 8,
    alignItems: 'center',
    maxWidth: '50%',
    alignSelf: 'center',
  },
  buttonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  error: {
    color: 'red',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
});
