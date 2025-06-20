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
import NetInfo from '@react-native-community/netinfo'
import * as Location from 'expo-location';

export default function App() {
  const [taskName, setTaskName] = useState('');
  const [taskDate, setTaskDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [taskPlace, setTaskPlace] = useState('');//address
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOneFocused, setOneFocused] = useState(false);
  const [isTwoFocused, setTwoFocused] = useState(false);
  const [isThreeFocused, setThreeFocused] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState('');
  const [isOnline, setIsOnline] = useState(true);

  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const dynamicPaddingTop = screenWidth > 500 ? '2%' : 0;
  const dynamicJustify = screenWidth > 500 ? 'none' : 'center';

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
    
    let geocoded = null;
      try {
        const results = await Location.geocodeAsync(taskPlace);
        if (results && results.length > 0) {
          geocoded = results[0];
        }
      } catch (error) {
        console.log("Geocode error:", error);
    }
    
    const newTask = {
      name: taskName,
      date: taskDate.toISOString(),
      place: taskPlace,
      creator_id: session.user.id,
    };

    if (geocoded) {
      newTask.latitude = geocoded.latitude;
      newTask.longitude = geocoded.longitude;
    }
    
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
      {isOnline ? (
      <View style={styles.container}>
        <View style={[styles.wrapper, { paddingTop: dynamicPaddingTop }, {justifyContent: dynamicJustify}]}>
          <TextInput
            placeholder="🎯  Nazwa zadania"
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
              { borderColor: isTwoFocused ? '#2196F3' : '#D8E0E2' },
            ]}
            onPressIn={() => {
              setTwoFocused(true);
              setOneFocused(false);
              setThreeFocused(false);
            }}
            onPressOut={() => setTwoFocused(false)}
          >
            <Text style={{ color: taskDate ? 'black' : 'gray', fontSize: 16 }}>
              {taskDate 
                ? taskDate.toLocaleDateString('pl-PL').replace(/\./g, '/')
                : '📆  Wybierz datę'}
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
            placeholder="📌  Adres Zadania"
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
      ) : (
        <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Text style={{ color: 'black', fontWeight: '800', fontSize: 16 }}>
            🔌 Brak połączenia z internetem
          </Text>
          <Text style={{ color: 'black', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
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
    backgroundColor: 'white',
    paddingHorizontal: '4%',
    alignItems: 'center',
  },
  wrapper: {
    flex: 1,
    paddingHorizontal: '3%',
    paddingVertical: '6%',
    backgroundColor: 'white',
    width: '100%',
    heigth: '100%',
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    borderRadius: 36,
    backgroundColor: '#2196F3',
    paddingHorizontal: 38,
    paddingVertical: 14,
    marginTop: 12,
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
