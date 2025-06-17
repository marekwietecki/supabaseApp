import { useState, useEffect } from 'react';
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
  const [selectedQuote, setSelectedQuote] = useState('');

  const screenWidth = Dimensions.get('window').width;
  const dynamicPaddingTop = screenWidth > 600 ? 0 : '20%';

  const quotes = [
    "Wyznaczaj sobie wysokie cele i nie przestawaj, dopóki ich nie osiągniesz. – Bo Jackson",
    "Największym niebezpieczeństwem nie jest to, że mierzymy za wysoko i nie osiągamy celu, ale to, że mierzymy za nisko i cel osiągamy. – Michał Anioł",
    "Droga do celu to nie połowa przyjemności, to cała przyjemność. – Jan Paweł II",
    "Nie możesz oczekiwać, że osiągniesz nowe cele, jeśli nie podejmiesz działania. – Les Brown",
    "Każde zadanie, które wykonujesz, przybliża Cię do miejsca, w którym chcesz być. – Nieznany autor",
    "Nasza największa chwała nie polega na tym, że nigdy nie upadamy, ale na tym, że podnosimy się za każdym razem, gdy upadamy. – Konfucjusz",
    "Nigdy się nie poddawaj nigdy, przenigdy! W niczym, czy to dużym, czy to małym – nigdy się nie poddawaj. – Winston Churchill ",
    "To zawsze wydaje się niemożliwe, dopóki się tego nie dokonasz. – Nelson Mandela",
    "Jeśli przechodzisz przez piekło, kontynuuj. – Winston Churchill",
    "Porażka jest tylko okazją, by zacząć od nowa, tym razem mądrzej. – Henry Ford",
    "Nasza największa chwała nie polega na tym, że nigdy nie upadamy, ale na tym, że podnosimy się za każdym razem, gdy upadamy – Konfucjusz",
    "Podróż tysiąca mil zaczyna się od jednego kroku. – Lao Tzu",
    "Nie ważne jak wolno idziesz, dopóki nie przestajesz. – Konfucjusz",
    "Sukces to suma małych wysiłków, powtarzanych dzień po dniu. – Robert Collier",
    "Wielkie rzeczy nie są robione impulsem, ale serią małych kroków połączonych razem. – Vincent van Gogh",
    "Małe kroki prowadzą do wielkich zmian.",
  ];

  useEffect(() => {
    if (!selectedQuote) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setSelectedQuote(randomQuote);
    }
  }, []);

  async function handleAddTask() {
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
      date: taskDate.toISOString(),
      place: taskPlace,
      creator_id: session.user.id,
    };

    const { error } = await supabase.from('tasks').insert([newTask]);

    if (error) {
      Alert.alert('Błąd', error.message);
    } else {
      setTaskName('');
      setTaskDate(null);
      setTaskPlace('');
      setError('');

      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setSelectedQuote(randomQuote);

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
          {showDatePicker && (
            <DateTimePicker
              value={taskDate || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
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
            onPress={handleAddTask}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Dodawanie...' : 'Dodaj Zadanie'}
            </Text>
          </TouchableOpacity>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {selectedQuote ? (
            <Text style={styles.quoteText}>{selectedQuote}</Text>
          ) : null}
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
    paddingHorizontal: '3%',
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
  quoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '300',
    textAlign: 'center',
    marginTop: '40%',
    color: '#555',
    paddingHorizontal: 20,
  },
});
