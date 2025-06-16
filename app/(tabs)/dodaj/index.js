import { useState } from 'react';
import supabase from '../../../lib/supabase-client';
import { Stack } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [taskName, setTaskName] = useState('');
  const [taskDate, setTaskDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [taskPlace, setTaskPlace] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOneFocused, setOneFocused] = useState(false);
  const [isTwoFocused, setTwoFocused] = useState(false);
  const [isThreeFocused, setThreeFocused] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const dynamicPaddingTop = screenWidth > 600 ? 0 : '20%';

  async function handleAddProduct() {
    if (!taskName || !taskDate || !taskPlace) {
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
    
    const newTask = {
      name: taskName,
      date: taskDate.toLocaleDateString('pl-PL').replace(/\./g, '/'),
      place: taskPlace,
      creator_id: session.user.id,
    };

    const { error } = await supabase.from('products').insert([newTask]);

    if (error) {
      Alert.alert('Błąd', error.message);
    } else {
      setTaskName('');
      setTaskDate(null);
      setTaskPlace('');
      setError('');
      Alert.alert('Sukces', 'Zadanie dodane do listy!');
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
            placeholder="Nazwa zadania"
            placeholderTextColor="gray"
            value={taskName}
            onChangeText={setTaskName}
            style={[
              styles.input,
              { borderColor: isOneFocused ? '#2196F3' : '#D8E0E2' },
            ]}
            autoCapitalize="none"
            onFocus={() => setOneFocused(true)}
            onBlur={() => setOneFocused(false)}
          />
          {/* Zamiast pola na cenę umieszczamy przycisk otwierający DateTimePicker */}
          <TouchableOpacity 
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.input,
              {  borderColor: isTwoFocused ? '#2196F3' : '#D8E0E2' }
            ]}
            onFocus={() => setTwoFocused(true)}
            onBlur={() => setTwoFocused(false)}
          >
            <Text style={{ color: taskDate ? 'black' : 'gray', fontSize: 16 }}>
              {taskDate ? taskDate.toLocaleDateString('pl-PL').replace(/\./g, '/') : 'Wybierz datę'}
            </Text>
          </TouchableOpacity>

          {/* Wyświetlamy DateTimePicker, gdy użytkownik chce wybrać datę */}
          {showDatePicker && (
            <DateTimePicker
              value={taskDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false); // zamykamy picker
                if (selectedDate) {
                  setTaskDate(selectedDate);
                }
              }}
            />
          )}
          <TextInput
            placeholder="Miejsce Zadania"
            placeholderTextColor="gray"
            value={taskPlace}
            onChangeText={setTaskPlace}
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
              {loading ? 'Dodawanie...' : 'Dodaj Zadanie'}
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
    marginVertical: 6,
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
    marginTop: 16,
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
    marginTop: 12,
  },
});
