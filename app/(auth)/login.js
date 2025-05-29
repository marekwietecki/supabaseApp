import { useState } from 'react'
import { Stack } from 'expo-router'
import { Alert, StyleSheet, View, TextInput, Text, TouchableOpacity } from 'react-native'
import supabase from '../../lib/supabase-client'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isOneFocused, setOneIsFocused] = useState(false);
  const [isTwoFocused, setTwoIsFocused] = useState(false);

  async function signInWithEmail() {
    setLoading(true)

    if (!supabase?.auth) {
        console.error("Supabase auth is undefined!");
        Alert.alert("Error", "Supabase authentication module is not initialized.");
        setLoading(false);
        return;
    }

    console.log("Signing in...");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      Alert.alert("Sign In Error", error.message);
    } else if (data?.user) {
      console.log("User signed in successfully!", data.user);
    } else {
      console.log("No error, but no user data returned.");
    }
    setLoading(false)
  }

  async function signUpWithEmail() {
    setLoading(true);
    
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert("Sign Up Error", error.message);
    } else if (data?.user) {
      console.log("User signed up successfully!", data.user);
    } else {
      console.log("No error, but no user data returned.");
    }
  
    if (!data?.session) {
      Alert.alert('Please check your inbox for email verification!');
    }
    
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, title: "Zaloguj/Zarejestruj się"}}/>
        <View style={[styles.verticallySpaced, styles.mt20]}>
          <TextInput
            style={[styles.textInput, {borderColor: isOneFocused ? '#2196F3' : '#D8E0E2'}]}
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
            style={[styles.textInput, {borderColor: isTwoFocused ? '#2196F3' : '#D8E0E2'}]}
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
          <TouchableOpacity disabled={loading} onPress={() => signInWithEmail()} style={[styles.buttonContainer, styles.buttonContainerPrimary]}>
              <Text style={[styles.buttonText, styles.buttonTextPrimary]}>Zaloguj się</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.verticallySpaced}>
          <TouchableOpacity disabled={loading} onPress={() => signUpWithEmail()} style={styles.buttonContainer}>
              <Text style={styles.buttonText}>Zarejestruj się</Text>
          </TouchableOpacity>
        </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 40,
    padding: 12,
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
    color: 'white',
  },
  buttonContainerPrimary: {
    backgroundColor: '#44B04B',
    borderRadius: 36,
    alignSelf: 'center',
  },
  textInput: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 2,
    borderRadius: 24,
    borderColor: 'gray'
  }
})