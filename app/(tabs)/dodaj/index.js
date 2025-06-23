import { useState, useEffect } from 'react';
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
import { colors } from '../../../utils/colors';
import { useTasks } from '../../../contexts/TasksContext';
import { useAuth } from '../../../contexts/AuthContext';


export default function AddScreen() {
  const { addTask } = useTasks(); 
  const { user } = useAuth();

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

    if (!user) {
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
      creator_id: user.id,
    };

    if (geocoded) {
      newTask.latitude = geocoded.latitude;
      newTask.longitude = geocoded.longitude;
    }
    
    setLoading(true);
    const success = await addTask(newTask); 
    setLoading(false);
    
    if (!success) {
      Alert.alert('Błąd', 'Nie udało się dodać zadania.');
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
            placeholderTextColor={colors.gray400}
            value={taskName}
            onChangeText={setTaskName}
            style={[
              styles.input,
              { borderColor: isOneFocused ? colors.blue500 : colors.gray200 },
            ]}
            autoCapitalize="none"
            onFocus={() => setOneFocused(true)}
            onBlur={() => setOneFocused(false)}
          />
          <TouchableOpacity 
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.input,
              { borderColor: isTwoFocused ? colors.blue500 : colors.gray400 },
            ]}
            onPressIn={() => {
              setTwoFocused(true);
              setOneFocused(false);
              setThreeFocused(false);
            }}
            onPressOut={() => setTwoFocused(false)}
          >
            <Text style={{ color: taskDate ? colors.gray800 : colors.gray400, fontSize: 16 }}>
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
            placeholderTextColor= {colors.gray400}
            value={taskPlace}
            onChangeText={setTaskPlace}
            style={[
              styles.input,
              { borderColor: isThreeFocused ? colors.blue500 : colors.gray200 },
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
          <Text style={{ color: colors.gray800, fontWeight: '800', fontSize: 16 }}>
            🔌 Brak połączenia z internetem
          </Text>
          <Text style={{ color: colors.gray800, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
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
    backgroundColor: colors.gray000,
    paddingHorizontal: '4%',
    alignItems: 'center',
  },
  wrapper: {
    flex: 1,
    paddingHorizontal: '3%',
    paddingVertical: '6%',
    backgroundColor: colors.gray000,
    width: '100%',
    heigth: '100%',
    maxWidth: 600,
  },
  input: {
    borderWidth: 2,
    padding: 16,
    marginVertical: 6,
    borderRadius: 24,
    color: colors.gray800,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    borderRadius: 36,
    backgroundColor: colors.blue500,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 12,
    alignItems: 'center',
    maxWidth: '70%',
    alignSelf: 'center',
  },
  buttonText: {
    color: colors.gray000,
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: colors.red500,
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
    color: colors.gray400,
    paddingHorizontal: 20,
  },
});