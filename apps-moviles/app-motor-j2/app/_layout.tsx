import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../src/services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { View, Text, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: 'white', marginTop: 10 }}>Cargando Satélite...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {session ? (
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="login" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}
