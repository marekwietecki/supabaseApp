import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  Alert, 
  StyleSheet 
} from 'react-native';
import { useNavigation } from '@react-navigation/native'; // dodajemy hook nawigacji
import supabase from '../../../lib/supabase-client';

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async () => {
    console.log('handleChangePassword pressed', newPassword, confirmPassword);

    if (newPassword !== confirmPassword) {
      Alert.alert('Błąd', 'Hasła nie są zgodne.');
      return;
    }
    try {
      // Używamy updateUser dla Supabase v2
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      console.log('Supabase updateUser response:', data, error);

      if (error) {
        Alert.alert('Błąd zmiany hasła', error.message);
      } else {
        Alert.alert('Sukces', 'Hasło zostało zmienione.', [
          { text: 'OK', onPress: () => navigation.goBack() }  // po potwierdzeniu wracamy do profilu
        ]);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (e) {
      console.error('Exception during updateUser:', e);
      Alert.alert('Wyjątek', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Nowe hasło"
        placeholderTextColor="gray"
        secureTextEntry={true}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Potwierdź nowe hasło"
        placeholderTextColor="gray"
        secureTextEntry={true}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <TouchableOpacity onPress={handleChangePassword} style={styles.button}>
        <Text style={styles.buttonText}>Zmień hasło</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 20 
  },
  input: {
    height: 50,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: { 
    color: 'white', 
    fontSize: 16 
  },
});

export default ChangePasswordScreen;
