import { useEffect } from 'react';
import { router } from 'expo-router';
import supabase from '../lib/supabase-client';

export default function IndexPage() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(tabs)/lista/');
      } else {
        console.log('No user');
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          router.replace('/(tabs)/lista/');
        } else {
          console.log('No user');
          router.replace('/(auth)/login');
        }
      },
    );
  });
}
