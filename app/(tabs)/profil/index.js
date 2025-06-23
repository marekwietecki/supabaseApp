import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { colors } from '../../../utils/colors'
import { useAuth } from '../../../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const router = useRouter();
  
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Profil',
          headerLeft: () => null,
          headerBackVisible: false,
        }}
      />
      <View style={styles.container}>
        <StatusBar style="auto" />
        <View style={{ flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <FontAwesome
            size={80}
            style={{ marginBottom: -3 }}
            name="user"
            color={colors.gray400}
          />
          <Text style={{ fontSize: 20, fontWeight: '700' }}>
            {user?.email}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.buttonContainer, { borderColor: colors.gray800 }]}
          onPress={() => router.push('/profil/passwordChange')}
        >
          <FontAwesome size={16} name="lock" color={colors.gray800} />
          <Text style={styles.buttonText}> Zmień Hasło</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={signOut} style={styles.buttonContainer}>
          <FontAwesome size={16} name="sign-out" color={colors.gray800} />
          <Text style={styles.buttonText}>Wyloguj się</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray000,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    alignSelf: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray800,
    paddingLeft: 4,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 8,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: colors.red500,
    flexDirection: 'row', 
    alignItems: 'center',
  },
});