import { createContext, useState, useContext, useEffect } from 'react';
import supabase from '../lib/supabase-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const signIn = async (email, password) => {
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSession(data?.session || null);
    setUser(data?.user || null);
    setAuthLoading(false);
  };

  const signUp = async (email, password) => {
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    setSession(data?.session || null);
    setUser(data?.user || null);
    setAuthLoading(false);
  };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setSession(null);
        setUser(null);
        await AsyncStorage.removeItem('cachedUser');
    };

  useEffect(() => {
    let isMounted = true;

    NetInfo.fetch().then((state) => {
        if (state.isConnected && state.isInternetReachable !== false) {
        supabase.auth.getSession().then(({ data }) => {
            if (!isMounted) return;
            setSession(data.session);
            setUser(data.session?.user || null);

            if (data.session?.user) {
            AsyncStorage.setItem('cachedUser', JSON.stringify(data.session.user));
            }
        });

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!isMounted) return;
            setSession(session);
            setUser(session?.user || null);
            if (session?.user) {
            AsyncStorage.setItem('cachedUser', JSON.stringify(session.user));
            } else {
            AsyncStorage.removeItem('cachedUser');
            }
        });

        return () => {
            authListener.subscription?.unsubscribe();
        };
        } else {
        AsyncStorage.getItem('cachedUser')
            .then((cached) => {
            if (cached && isMounted) {
                setUser(JSON.parse(cached));
            }
            })
            .catch((err) => console.error('Błąd odczytu cachedUser:', err));
        }
    });

    return () => {
        isMounted = false;
    };
}, []);

    const changePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
    };

  return (
    <AuthContext.Provider
      value={{
        session, user, authLoading, signIn, signUp, signOut, changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
