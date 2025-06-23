import { useState } from 'react';
import { Stack } from 'expo-router';
import {
  Alert,
  StyleSheet,
  View,
  TextInput,
  Text,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../utils/colors';
import { useAuth } from '../../contexts/AuthContext';

export default function Auth() {
  const { signIn, signUp, authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isOneFocused, setOneIsFocused] = useState(false);
  const [isTwoFocused, setTwoIsFocused] = useState(false);
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{ headerShown: true, title: 'Zaloguj/Zarejestruj się' }}
      />
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <TextInput
          style={[
            styles.textInput,
            { borderColor: isOneFocused ? colors.blue500 : colors.gray200},
          ]}
          label="Email"
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize={'none'}
          onFocus={() => setOneIsFocused(true)}
          onBlur={() => setOneIsFocused(false)}
          textContentType="username"
        />
      </View>
      <View style={styles.verticallySpaced}>
        <TextInput
          style={[
            styles.textInput,
            { borderColor: isTwoFocused ? colors.blue500 : colors.gray200},
          ]}
          label="Password"
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry={true}
          placeholder="Password"
          autoCapitalize={'none'}
          onFocus={() => setTwoIsFocused(true)}
          onBlur={() => setTwoIsFocused(false)}
          textContentType="password"
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <TouchableOpacity
          disabled={authLoading}
          onPress={async () => {
            try {
              await signIn(email, password);
            } catch (error) {
              Alert.alert('Błąd logowania', error.message || 'Nieznany błąd');
            }
          }}
          style={[styles.buttonContainer, styles.buttonContainerPrimary]}
        >
          <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
            Zaloguj się
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.verticallySpaced}>
        <TouchableOpacity
          disabled={authLoading}
          onPress={async () => {
            try {
              await signUp(email, password);
            } catch (error) {
              Alert.alert('Błąd rejestracji', error.message || 'Nieznany błąd');
            }
          }}
          style={styles.buttonContainer}
        >
          <Text style={styles.buttonText}>Zarejestruj się</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
    paddingHorizontal: '7%',
  },
  verticallySpaced: {
    paddingTop: 8,
    paddingBottom: 8,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  buttonText: {
    alignSelf: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  buttonContainer: {
    paddingHorizontal: 38,
    paddingVertical: 14,
  },
  buttonTextPrimary: {
    color: colors.gray000,
  },
  buttonContainerPrimary: {
    backgroundColor: colors.green500,
    borderRadius: 36,
    alignSelf: 'center',
  },
  textInput: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 2,
    borderRadius: 24,
    borderColor: colors.gray400,
    maxWidth: 600,
    alignItems: 'center',
  },
});