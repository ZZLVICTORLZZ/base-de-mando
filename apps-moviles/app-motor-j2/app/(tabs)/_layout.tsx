import { Tabs, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { supabase } from '../../src/services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { TouchableOpacity } from 'react-native';

export default function TabLayout() {
  const { theme, cycleTheme, themeName } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerRight: () => (
          <TouchableOpacity onPress={cycleTheme} style={{ marginRight: 15 }}>
            <Text style={{ fontSize: 20, color: theme.primary, fontWeight: 'bold' }}>@</Text>
          </TouchableOpacity>
        ),
        headerTintColor: theme.text,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="rd"
        options={{
          title: 'Roles',
          tabBarIcon: ({ color }) => <Feather name="calendar" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="otp"
        options={{
          title: 'Proyección',
          tabBarIcon: ({ color }) => <Feather name="list" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ctr"
        options={{
          title: 'T. Real',
          tabBarIcon: ({ color }) => <Feather name="activity" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="incidencias"
        options={{
          title: 'Incidencias',
          tabBarIcon: ({ color }) => <Feather name="alert-triangle" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="operadores"
        options={{
          title: 'Operadores',
          tabBarIcon: ({ color }) => <Feather name="users" size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
