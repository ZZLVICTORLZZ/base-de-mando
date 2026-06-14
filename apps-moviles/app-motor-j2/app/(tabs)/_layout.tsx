import { Tabs, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { supabase } from '../src/services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#f8fafc',
        tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#334155' },
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#64748b',
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
    </Tabs>
  );
}
