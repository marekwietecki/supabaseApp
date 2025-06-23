import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Text, 
  Alert, 
  StyleSheet 
} from 'react-native';
import {
  useNavigation,
  useRouter,
} from 'expo-router';
import supabase from '../../../lib/supabase-client';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors } from '../../../utils/colors'
import { useAuth } from '../../../contexts/AuthContext';

const ChangePasswordScreen = () => {
  const { changePassword } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isOneFocused, setOneIsFocused] = useState(false);
  const [isTwoFocused, setTwoIsFocused] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Błąd', 'Hasła nie są zgodne.');
      return;
    }

    try {
      await changePassword(newPassword);
      Alert.alert('Sukces', 'Hasło zostało zmienione.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Błąd zmiany hasła', error.message || 'Nieznany błąd');
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            router.push('/(tabs)/profil');
          }}
          style={styles.headerButton}
        >
          <FontAwesome
            size={18}
            style={{ marginBottom: 0 }}
            name="chevron-left"
            color={colors.blue500}
          />
          <Text
            style={{
              color: colors.blue500,
              fontSize: 18,
              fontWeight: '600',
              paddingBottom: 2,
            }}
          >
            Profil
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, router]);

  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.textInput,
          { borderColor: isOneFocused ? colors.blue500 : colors.gray200 },
        ]}
        placeholder="Nowe hasło"
        placeholderTextColor="gray"
        secureTextEntry={true}
        value={newPassword}
        onChangeText={setNewPassword}
        onFocus={() => setOneIsFocused(true)}
        onBlur={() => setOneIsFocused(false)}
      />
      <TextInput
        style={[
          styles.textInput,
          { borderColor: isTwoFocused ? colors.blue500 : colors.gray200 },
        ]}
        placeholder="Potwierdź nowe hasło"
        placeholderTextColor="gray"
        secureTextEntry={true}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        onFocus={() => setTwoIsFocused(true)}
        onBlur={() => setTwoIsFocused(false)}
      />
      <TouchableOpacity onPress={handleChangePassword} style={[styles.buttonContainer, styles.buttonContainerPrimary]}>
      <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Zmień hasło</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: 'center',
    justifyContent: 'center', 
    paddingHorizontal: '7%',
    gap: 8,
    alignSelf: 'stretch', 
    backgroundColor: colors.gray000,
  },
  buttonText: { 
    color: colors.gray000, 
    fontSize: 16 
  },
  headerButton: {
    marginRight: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  textInput: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 2,
    borderRadius: 32,
    borderColor: colors.gray200,
    maxWidth: 600,
    alignItems: 'center',
    alignSelf: 'stretch'
  },
  buttonText: {
    alignSelf: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 16,
  },
  buttonTextPrimary: {
    color: colors.gray000,
  },
  buttonContainerPrimary: {
    backgroundColor: colors.green500,
    borderRadius: 36,
    alignSelf: 'center',
  },
});

export default ChangePasswordScreen;